import {
  clampStartUnit,
  clampUnit,
  DEFAULT_DURATION_MIN,
  MIN_BLOCK_UNITS,
  minutesToUnits,
  TOTAL_UNITS,
  unitsToMinutes
} from "@shared/constants/time";
import type {
  ScheduleBlock,
  TaskCandidate
} from "@shared/types";

export function getDurationUnits(
  estimatedDurationMin?: number
): number {
  return minutesToUnits(estimatedDurationMin ?? DEFAULT_DURATION_MIN);
}

export function sortBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.startUnit === b.startUnit) {
      return a.durationUnit - b.durationUnit;
    }
    return a.startUnit - b.startUnit;
  });
}

export function overlaps(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function canPlaceBlock(
  draft: ScheduleBlock,
  otherBlocks: ScheduleBlock[]
): boolean {
  if (draft.startUnit < 0) {
    return false;
  }
  if (draft.startUnit + draft.durationUnit > TOTAL_UNITS) {
    return false;
  }

  return !otherBlocks.some((block) =>
    overlaps(
      draft.startUnit,
      draft.startUnit + draft.durationUnit,
      block.startUnit,
      block.startUnit + block.durationUnit
    )
  );
}

export function findNearestAvailableSlot(
  draft: ScheduleBlock,
  otherBlocks: ScheduleBlock[]
): number | null {
  const preferredStart = clampStartUnit(
    draft.startUnit,
    draft.durationUnit
  );

  if (
    canPlaceBlock(
      { ...draft, startUnit: preferredStart },
      otherBlocks
    )
  ) {
    return preferredStart;
  }

  const maxStart = TOTAL_UNITS - draft.durationUnit;

  for (let startUnit = preferredStart + 1; startUnit <= maxStart; startUnit += 1) {
    if (canPlaceBlock({ ...draft, startUnit }, otherBlocks)) {
      return startUnit;
    }
  }

  for (let startUnit = preferredStart - 1; startUnit >= 0; startUnit -= 1) {
    if (canPlaceBlock({ ...draft, startUnit }, otherBlocks)) {
      return startUnit;
    }
  }

  return null;
}

export function buildBlockFromCandidate(
  candidate: TaskCandidate,
  startUnit: number
): ScheduleBlock {
  return {
    id: crypto.randomUUID(),
    taskCandidateId: candidate.id,
    title: candidate.title,
    subTasks: candidate.subTasks,
    colorId: candidate.colorId,
    startUnit,
    durationUnit: getDurationUnits(candidate.estimatedDurationMin),
    note: candidate.note,
    source: "local"
  };
}

export function moveBlockWithAutoShift(
  block: ScheduleBlock,
  otherBlocks: ScheduleBlock[],
  targetStartUnit: number
): ScheduleBlock | null {
  const draft = {
    ...block,
    startUnit: clampStartUnit(targetStartUnit, block.durationUnit)
  };
  const nextStartUnit = findNearestAvailableSlot(draft, otherBlocks);
  return nextStartUnit === null
    ? null
    : { ...draft, startUnit: nextStartUnit };
}

export function resizeBlockStartWithAutoShift(
  block: ScheduleBlock,
  otherBlocks: ScheduleBlock[],
  nextStartUnit: number
): ScheduleBlock | null {
  const endUnit = block.startUnit + block.durationUnit;
  const clampedStart = clampUnit(
    nextStartUnit,
    0,
    endUnit - MIN_BLOCK_UNITS
  );
  const draft = {
    ...block,
    startUnit: clampedStart,
    durationUnit: endUnit - clampedStart
  };
  const nextSlot = findNearestAvailableSlot(draft, otherBlocks);
  return nextSlot === null
    ? null
    : {
        ...draft,
        startUnit: nextSlot
      };
}

export function resizeBlockEndWithAutoShift(
  block: ScheduleBlock,
  otherBlocks: ScheduleBlock[],
  nextEndUnit: number
): ScheduleBlock | null {
  const clampedEndUnit = clampUnit(
    nextEndUnit,
    block.startUnit + MIN_BLOCK_UNITS,
    TOTAL_UNITS
  );
  const draft = {
    ...block,
    durationUnit: clampedEndUnit - block.startUnit
  };
  const nextSlot = findNearestAvailableSlot(draft, otherBlocks);
  return nextSlot === null
    ? null
    : {
        ...draft,
        startUnit: nextSlot
      };
}

export function formatDuration(durationUnit: number): string {
  return `${unitsToMinutes(durationUnit)}分`;
}
