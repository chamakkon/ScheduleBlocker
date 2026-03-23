import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app } from "electron/main";
import type {
  DailyPlan,
  SettingsPayload
} from "@shared/types";

const DAILY_PLANS_FILE = "daily-plans.json";
const SETTINGS_FILE = "settings.json";

const defaultSettings: SettingsPayload = {
  locale: "ja",
  anonymizeGoogleCalendarInExports: false,
  colors: [
    { id: "red", hex: "#ef4444", label: "赤" },
    { id: "orange", hex: "#f97316", label: "オレンジ" },
    { id: "yellow", hex: "#eab308", label: "黄" },
    { id: "green", hex: "#22c55e", label: "緑" },
    { id: "cyan", hex: "#06b6d4", label: "水色" },
    { id: "blue", hex: "#3b82f6", label: "青" },
    { id: "purple", hex: "#8b5cf6", label: "紫" }
  ],
  fixedTemplates: [],
  google: {
    enabled: false,
    clientId: "",
    clientSecret: "",
    importCalendarEvents: true,
    importGoogleTasks: true,
    exportToCalendarOnFinalize: false
  },
  slack: {
    enabled: false,
    botToken: "",
    defaultChannelId: "",
    defaultInitialComment: "今日のスケジュールです"
  }
};

function getDataDirectory(): string {
  return app.isPackaged
    ? app.getPath("userData")
    : path.join(process.cwd(), "data");
}

async function ensureDataDirectory(): Promise<string> {
  const directory = getDataDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
}

async function readJsonFile<T>(
  filePath: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function createPlan(date: string): DailyPlan {
  return {
    id: `plan-${date}`,
    date,
    candidates: [],
    blocks: [],
    memo: "",
    isFinalized: false
  };
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function loadDailyPlans(): Promise<DailyPlan[]> {
  const directory = await ensureDataDirectory();
  return readJsonFile<DailyPlan[]>(
    path.join(directory, DAILY_PLANS_FILE),
    []
  );
}

export async function saveDailyPlans(plans: DailyPlan[]): Promise<void> {
  const directory = await ensureDataDirectory();
  await writeJsonFile(path.join(directory, DAILY_PLANS_FILE), plans);
}

export async function loadSettings(): Promise<SettingsPayload> {
  const directory = await ensureDataDirectory();
  return readJsonFile<SettingsPayload>(
    path.join(directory, SETTINGS_FILE),
    defaultSettings
  );
}

export async function saveSettings(
  payload: SettingsPayload
): Promise<void> {
  const directory = await ensureDataDirectory();
  await writeJsonFile(path.join(directory, SETTINGS_FILE), payload);
}

export async function loadTodayPlan(): Promise<DailyPlan | null> {
  const today = getLocalDateString();
  const plans = await loadDailyPlans();
  return plans.find((plan) => plan.date === today) ?? null;
}

export async function createTodayPlanIfMissing(): Promise<DailyPlan> {
  const today = getLocalDateString();
  const plans = await loadDailyPlans();
  const existing = plans.find((plan) => plan.date === today);
  if (existing) {
    return existing;
  }

  const nextPlan = createPlan(today);
  await saveDailyPlans([...plans, nextPlan]);
  return nextPlan;
}

export async function saveTodayPlan(plan: DailyPlan): Promise<void> {
  const plans = await loadDailyPlans();
  const nextPlans = [...plans];
  const index = nextPlans.findIndex((item) => item.date === plan.date);

  if (index >= 0) {
    nextPlans[index] = plan;
  } else {
    nextPlans.push(plan);
  }

  await saveDailyPlans(nextPlans);
}

export async function writePngFile(
  filePath: string,
  dataUrl: string
): Promise<void> {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await writeFile(filePath, Buffer.from(base64, "base64"));
}
