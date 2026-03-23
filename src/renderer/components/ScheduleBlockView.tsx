import type { PointerEvent } from "react";
import { formatDuration } from "@renderer/lib/timeline";
import type {
  ColorSetting,
  ScheduleBlock
} from "@shared/types";

type ScheduleBlockViewProps = {
  block: ScheduleBlock;
  color?: ColorSetting;
  top: number;
  height: number;
  isDimmed?: boolean;
  canEdit: boolean;
  onPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    block: ScheduleBlock
  ) => void;
  onResizeStart: (
    event: PointerEvent<HTMLButtonElement>,
    block: ScheduleBlock
  ) => void;
  onResizeEnd: (
    event: PointerEvent<HTMLButtonElement>,
    block: ScheduleBlock
  ) => void;
  onDelete?: (blockId: string) => void;
};

export function ScheduleBlockView({
  block,
  color,
  top,
  height,
  isDimmed = false,
  canEdit,
  onPointerDown,
  onResizeStart,
  onResizeEnd,
  onDelete
}: ScheduleBlockViewProps) {
  const showSubTasks = height >= 56;
  const isExternal = block.source === "google_calendar";
  const isLocked = block.locked ?? isExternal;
  const interactable = canEdit && !isLocked;

  return (
    <div
      className={`absolute left-1 right-1 border-l-2 px-2 py-0.5 text-left transition-opacity ${
        isDimmed ? "opacity-30" : "opacity-100"
      } ${interactable ? "cursor-grab" : ""} ${isExternal ? "opacity-70" : ""}`}
      onPointerDown={(event) => interactable && onPointerDown(event, block)}
      style={{
        top,
        height,
        backgroundColor: isExternal
          ? "rgba(100,100,100,0.15)"
          : `${color?.hex ?? "#94a3b8"}18`,
        borderLeftColor: isExternal
          ? "#666666"
          : (color?.hex ?? "#94a3b8"),
        borderLeftStyle: isExternal ? "dashed" : "solid"
      }}
    >
      {interactable && (
        <button
          className="absolute left-2 right-6 top-0 h-1 cursor-ns-resize bg-transparent hover:bg-white/10"
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizeStart(event, block);
          }}
          type="button"
        />
      )}

      {interactable && onDelete && (
        <button
          className="absolute right-1 top-0 flex h-4 w-4 items-center justify-center text-[10px] text-[#555555] hover:text-[#f48771]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(block.id)}
          type="button"
        >
          ×
        </button>
      )}

      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-1 pr-4">
          {isExternal && (
            <span className="shrink-0 text-[9px] text-[#666666]" title="Google Calendar">
              GCal
            </span>
          )}
          <p className={`truncate text-[12px] ${isExternal ? "text-[#999999]" : "text-[#cccccc]"}`}>
            {block.title}
          </p>
        </div>
        <p className="text-[10px] text-[#858585]">
          {formatDuration(block.durationUnit)}
        </p>
        {showSubTasks && block.subTasks.length > 0 && (
          <div className="mt-0.5 space-y-px overflow-hidden text-[10px] text-[#858585]">
            {block.subTasks.map((subTask) => (
              <p className="truncate" key={subTask}>
                · {subTask}
              </p>
            ))}
          </div>
        )}
      </div>

      {interactable && (
        <button
          className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize bg-transparent hover:bg-white/10"
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizeEnd(event, block);
          }}
          type="button"
        />
      )}
    </div>
  );
}
