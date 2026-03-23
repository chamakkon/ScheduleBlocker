import { google } from "googleapis";
import type {
  ExternalCalendarBlockDTO,
  ScheduleBlock,
  CalendarExportResult
} from "@shared/types";
import {
  START_HOUR,
  UNIT_MINUTES,
  TOTAL_UNITS
} from "@shared/constants/time";
import { getAuthenticatedClient } from "./google-auth";

const APP_TAG = "daily-visual-planner";
const TZ = "Asia/Tokyo";

// Google Calendar event colorId → hex
const GCAL_COLORS: Record<string, string> = {
  "1": "#7986cb",  // Lavender
  "2": "#33b679",  // Sage
  "3": "#8e24aa",  // Grape
  "4": "#e67c73",  // Flamingo
  "5": "#f6bf26",  // Banana
  "6": "#f4511e",  // Tangerine
  "7": "#039be5",  // Peacock
  "8": "#616161",  // Graphite
  "9": "#3f51b5",  // Blueberry
  "10": "#0b8043", // Basil
  "11": "#d50000"  // Tomato
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function gcalColorIdToHex(colorId: string | null | undefined): string | undefined {
  if (!colorId) return undefined;
  return GCAL_COLORS[colorId];
}

function hexToGcalColorId(hex: string): string {
  const rgb = hexToRgb(hex);
  let bestId = "7";
  let bestDist = Infinity;
  for (const [id, gcalHex] of Object.entries(GCAL_COLORS)) {
    const dist = colorDistance(rgb, hexToRgb(gcalHex));
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }
  return bestId;
}

function dateToStartOfDay(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+09:00`);
}

function dateToEndOfDay(dateString: string): Date {
  return new Date(`${dateString}T23:59:59+09:00`);
}

function timeToUnit(dateTime: Date, dateString: string): number {
  const dayStart = new Date(`${dateString}T00:00:00+09:00`);
  const totalMinutes = Math.round(
    (dateTime.getTime() - dayStart.getTime()) / 60_000
  );
  const offsetMinutes = totalMinutes - START_HOUR * 60;
  return Math.max(0, Math.min(TOTAL_UNITS, Math.round(offsetMinutes / UNIT_MINUTES)));
}

function unitToDateTime(unit: number, dateString: string): string {
  const totalMinutes = START_HOUR * 60 + unit * UNIT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return `${dateString}T${hh}:${mm}:00`;
}

export async function importCalendarForDate(
  date: string
): Promise<ExternalCalendarBlockDTO[]> {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Google not connected");

  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: dateToStartOfDay(date).toISOString(),
    timeMax: dateToEndOfDay(date).toISOString(),
    singleEvents: true,
    orderBy: "startTime"
  });

  const events = response.data.items ?? [];
  const blocks: ExternalCalendarBlockDTO[] = [];

  for (const event of events) {
    if (!event.start?.dateTime || !event.end?.dateTime) continue;
    if (event.extendedProperties?.private?.["createdBy"] === APP_TAG) continue;
    if (event.status === "cancelled") continue;

    const selfAttendee = event.attendees?.find((a) => a.self);
    if (selfAttendee && selfAttendee.responseStatus === "declined") continue;
    if (selfAttendee && selfAttendee.responseStatus === "needsAction") continue;

    const startDt = new Date(event.start.dateTime);
    const endDt = new Date(event.end.dateTime);

    let startUnit = timeToUnit(startDt, date);
    let endUnit = timeToUnit(endDt, date);

    if (startUnit >= TOTAL_UNITS || endUnit <= 0) continue;
    startUnit = Math.max(0, startUnit);
    endUnit = Math.min(TOTAL_UNITS, endUnit);
    const durationUnit = endUnit - startUnit;
    if (durationUnit <= 0) continue;

    blocks.push({
      eventId: event.id ?? "",
      calendarId: "primary",
      title: event.summary ?? "(No title)",
      startUnit,
      durationUnit,
      note: event.description ?? undefined,
      gcalColorHex: gcalColorIdToHex(event.colorId)
    });
  }

  return blocks;
}

export async function exportPlanToCalendar(
  date: string,
  localBlocks: ScheduleBlock[],
  colorMap?: Record<string, string>
): Promise<CalendarExportResult> {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Google not connected");

  const calendar = google.calendar({ version: "v3", auth });

  const existing = await calendar.events.list({
    calendarId: "primary",
    timeMin: dateToStartOfDay(date).toISOString(),
    timeMax: dateToEndOfDay(date).toISOString(),
    singleEvents: true,
    privateExtendedProperty: [`createdBy=${APP_TAG}`]
  });

  let deleted = 0;
  for (const event of existing.data.items ?? []) {
    if (event.id) {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: event.id
      });
      deleted++;
    }
  }

  let created = 0;
  for (const block of localBlocks) {
    if (block.source === "google_calendar") continue;

    const description = [
      ...block.subTasks.map((s) => `- ${s}`),
      block.note ? `\n${block.note}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const blockHex = colorMap?.[block.colorId];
    const gcalColorId = blockHex ? hexToGcalColorId(blockHex) : undefined;

    await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: block.title,
        description: description || undefined,
        colorId: gcalColorId,
        start: {
          dateTime: unitToDateTime(block.startUnit, date),
          timeZone: TZ
        },
        end: {
          dateTime: unitToDateTime(
            block.startUnit + block.durationUnit,
            date
          ),
          timeZone: TZ
        },
        extendedProperties: {
          private: {
            createdBy: APP_TAG,
            dailyPlanDate: date,
            localBlockId: block.id
          }
        }
      }
    });
    created++;
  }

  return { created, deleted };
}
