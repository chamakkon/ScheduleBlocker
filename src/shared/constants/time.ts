export const START_HOUR = 7;
export const END_HOUR = 24;
export const UNIT_MINUTES = 15;
export const TOTAL_UNITS = ((END_HOUR - START_HOUR) * 60) / UNIT_MINUTES;
export const MIN_BLOCK_UNITS = 1;
export const DEFAULT_DURATION_MIN = 60;
export const DEFAULT_DURATION_UNITS =
  DEFAULT_DURATION_MIN / UNIT_MINUTES;
export const PIXELS_PER_UNIT = 8;

export function minutesToUnits(minutes: number): number {
  return Math.max(
    MIN_BLOCK_UNITS,
    Math.ceil(minutes / UNIT_MINUTES)
  );
}

export function unitsToMinutes(units: number): number {
  return units * UNIT_MINUTES;
}

export function clampUnit(
  value: number,
  min = 0,
  max = TOTAL_UNITS
): number {
  return Math.min(max, Math.max(min, value));
}

export function clampStartUnit(
  startUnit: number,
  durationUnit: number
): number {
  return clampUnit(startUnit, 0, TOTAL_UNITS - durationUnit);
}

export function unitToTimeLabel(unit: number): string {
  const totalMinutes = START_HOUR * 60 + unit * UNIT_MINUTES;
  const hour = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}
