import type { ScheduleBlock } from "@shared/types";

export function anonymizeGoogleCalendarBlocks(
  blocks: ScheduleBlock[],
  anonymousTitle: string
): ScheduleBlock[] {
  return blocks.map((block) => {
    if (block.source !== "google_calendar") {
      return block;
    }
    return {
      ...block,
      title: anonymousTitle,
      subTasks: [],
      note: undefined
    };
  });
}
