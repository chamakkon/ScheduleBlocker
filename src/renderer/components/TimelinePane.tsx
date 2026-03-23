import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  RefObject
} from "react";
import {
  PIXELS_PER_UNIT,
  START_HOUR,
  TOTAL_UNITS,
  UNIT_MINUTES,
  unitToTimeLabel
} from "@shared/constants/time";
import type {
  ColorSetting,
  ScheduleBlock
} from "@shared/types";
import { useT } from "@renderer/lib/i18n";
import { ScheduleBlockView } from "./ScheduleBlockView";

type TimelinePaneProps = {
  blocks: ScheduleBlock[];
  colors: ColorSetting[];
  canEdit: boolean;
  fillHeight?: boolean;
  activeBlockId?: string;
  previewBlock?: ScheduleBlock | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  exportRef: RefObject<HTMLDivElement | null>;
  onBlockPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    block: ScheduleBlock
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    block: ScheduleBlock
  ) => void;
  onResizeEnd: (
    event: ReactPointerEvent<HTMLButtonElement>,
    block: ScheduleBlock
  ) => void;
  onDeleteBlock: (blockId: string) => void;
  title: string;
};

const HOUR_UNIT_STEP = 4;
const HEADER_HEIGHT = 24;

function getCurrentTimeUnit(): number | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = START_HOUR * 60;
  const elapsed = currentMinutes - startMinutes;
  if (elapsed < 0 || elapsed > TOTAL_UNITS * UNIT_MINUTES) {
    return null;
  }
  return elapsed / UNIT_MINUTES;
}

export function TimelinePane({
  blocks,
  colors,
  canEdit,
  fillHeight = false,
  activeBlockId,
  previewBlock,
  scrollRef,
  exportRef,
  onBlockPointerDown,
  onResizeStart,
  onResizeEnd,
  onDeleteBlock,
  title
}: TimelinePaneProps) {
  const t = useT();
  const colorMap = new Map(colors.map((color) => [color.id, color]));
  const [currentTimeUnit, setCurrentTimeUnit] = useState<number | null>(
    getCurrentTimeUnit
  );
  const [containerHeight, setContainerHeight] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setCurrentTimeUnit(getCurrentTimeUnit());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleResize = useCallback(() => {
    if (measureRef.current) {
      setContainerHeight(measureRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    if (!fillHeight || !measureRef.current) return undefined;
    const observer = new ResizeObserver(handleResize);
    observer.observe(measureRef.current);
    handleResize();
    return () => observer.disconnect();
  }, [fillHeight, handleResize]);

  const pxPerUnit = fillHeight && containerHeight > 0
    ? (containerHeight - HEADER_HEIGHT) / TOTAL_UNITS
    : PIXELS_PER_UNIT;

  const totalHeight = TOTAL_UNITS * pxPerUnit;

  const currentTimeTop =
    currentTimeUnit !== null ? currentTimeUnit * pxPerUnit : null;

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e1e]">
      <div className="flex items-center border-b border-[#333333] bg-[#252526] px-3 py-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
          {t("timeline.schedule")}
        </span>
        <span className="ml-2 text-[11px] text-[#555555]">
          {title} · 07–24
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" ref={(el) => {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (measureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}>
        <div
          className="grid h-full grid-cols-[48px_1fr]"
          ref={exportRef}
        >
          {/* Time gutter */}
          <div className="border-r border-[#333333] bg-[#1e1e1e]">
            <div className="border-b border-[#333333] px-1 py-1 text-[10px] text-[#555555]" style={{ height: HEADER_HEIGHT }}>
              {t("timeline.time")}
            </div>
            <div className="relative" style={{ height: totalHeight }}>
              {Array.from({ length: TOTAL_UNITS + 1 }).map((_, index) => (
                <div
                  className={`absolute left-0 right-0 px-1 text-right text-[10px] leading-none text-[#555555] ${
                    index % HOUR_UNIT_STEP === 0
                      ? "border-t border-[#333333]"
                      : ""
                  }`}
                  key={index}
                  style={{ top: index * pxPerUnit }}
                >
                  {index < TOTAL_UNITS && index % HOUR_UNIT_STEP === 0
                    ? unitToTimeLabel(index)
                    : ""}
                </div>
              ))}

              {currentTimeTop !== null && (
                <div
                  className="absolute left-0 right-0 z-30 border-t border-[#ee0000]"
                  style={{ top: currentTimeTop }}
                />
              )}
            </div>
          </div>

          {/* Block area */}
          <div className="relative">
            <div className="border-b border-[#333333] px-3 py-1 text-[10px] text-[#555555]" style={{ height: HEADER_HEIGHT }}>
              {t("timeline.preview")}
            </div>

            <div
              className="relative bg-[#1e1e1e]"
              style={{ height: totalHeight }}
            >
              {Array.from({ length: TOTAL_UNITS + 1 }).map((_, index) => (
                <div
                  className={`absolute left-0 right-0 ${
                    index % HOUR_UNIT_STEP === 0
                      ? "border-t border-[#2a2a2a]"
                      : ""
                  }`}
                  key={index}
                  style={{ top: index * pxPerUnit }}
                />
              ))}

              {blocks.map((block) => (
                <ScheduleBlockView
                  block={block}
                  canEdit={canEdit}
                  color={colorMap.get(block.colorId)}
                  height={block.durationUnit * pxPerUnit}
                  isDimmed={activeBlockId === block.id}
                  key={block.id}
                  onPointerDown={onBlockPointerDown}
                  onDelete={onDeleteBlock}
                  onResizeEnd={onResizeEnd}
                  onResizeStart={onResizeStart}
                  top={block.startUnit * pxPerUnit}
                />
              ))}

              {previewBlock && (
                <div className="pointer-events-none">
                  <ScheduleBlockView
                    block={previewBlock}
                    canEdit={false}
                    color={colorMap.get(previewBlock.colorId)}
                    height={previewBlock.durationUnit * pxPerUnit}
                    onPointerDown={() => undefined}
                    onResizeEnd={() => undefined}
                    onResizeStart={() => undefined}
                    top={previewBlock.startUnit * pxPerUnit}
                  />
                </div>
              )}

              {currentTimeTop !== null && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-30"
                  style={{ top: currentTimeTop }}
                >
                  <div className="relative h-0 w-full border-t border-[#ee0000]">
                    <div className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full bg-[#ee0000]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
