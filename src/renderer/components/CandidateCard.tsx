import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useT } from "@renderer/lib/i18n";
import type {
  ColorSetting,
  TaskCandidate
} from "@shared/types";

type CandidateCardProps = {
  candidate: TaskCandidate;
  color?: ColorSetting;
  draggable: boolean;
  onPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    candidate: TaskCandidate
  ) => void;
  autoFocusTitle?: boolean;
  colors: ColorSetting[];
  onUpdate: (candidate: TaskCandidate) => void;
  onDelete: (candidateId: string) => void;
  onDuplicate?: (candidateId: string) => void;
};

export function CandidateCard({
  candidate,
  color,
  draggable,
  autoFocusTitle = false,
  colors,
  onPointerDown,
  onUpdate,
  onDelete,
  onDuplicate
}: CandidateCardProps) {
  const t = useT();
  const [isTitleEditing, setIsTitleEditing] = useState(autoFocusTitle);
  const [isDetailsOpen, setIsDetailsOpen] = useState(
    autoFocusTitle ||
      candidate.subTasks.length > 0 ||
      Boolean(candidate.estimatedDurationMin) ||
      Boolean(candidate.note)
  );
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusTitle) {
      setIsTitleEditing(true);
      setIsDetailsOpen(true);
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [autoFocusTitle]);

  return (
    <div
      className={`border-b border-[#333333] px-3 py-2 ${
        draggable ? "cursor-grab hover:bg-[#2a2d2e]" : ""
      }`}
      onPointerDown={(event) => {
        if (draggable) {
          onPointerDown(event, candidate);
        }
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {candidate.source === "google_tasks" && (
              <span className="shrink-0 text-[9px] text-[#666666]" title="Google Tasks">
                GT
              </span>
            )}
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: color?.hex ?? "#94a3b8" }}
            />
            {isTitleEditing ? (
              <input
                className="min-w-0 flex-1 bg-[#3c3c3c] px-1 py-0.5 text-[13px] text-[#cccccc] outline-none ring-1 ring-[#007fd4]"
                onBlur={() => setIsTitleEditing(false)}
                onChange={(event) =>
                  onUpdate({
                    ...candidate,
                    title: event.target.value
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    titleInputRef.current?.blur();
                  }
                }}
                placeholder={t("candidate.taskName")}
                ref={titleInputRef}
                value={candidate.title}
              />
            ) : (
              <button
                className="min-w-0 truncate text-left text-[13px] text-[#cccccc] hover:text-white"
                onClick={() => setIsTitleEditing(true)}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                {candidate.title || t("candidate.untitled")}
              </button>
            )}
          </div>

          <div
            className="mt-1 flex flex-wrap items-center gap-1.5"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="text-[11px] text-[#858585] hover:text-[#cccccc]"
              onClick={() => setIsDetailsOpen((current) => !current)}
              type="button"
            >
              {isDetailsOpen ? "[-]" : "[+]"}
            </button>
            <select
              className="border-none bg-transparent text-[11px] text-[#858585] outline-none"
              onChange={(event) =>
                onUpdate({
                  ...candidate,
                  colorId: event.target.value
                })
              }
              value={candidate.colorId}
            >
              {colors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label ?? item.id}
                </option>
              ))}
            </select>
            <input
              className="w-16 border-none bg-transparent text-[11px] text-[#858585] outline-none"
              inputMode="numeric"
              min={15}
              onChange={(event) =>
                onUpdate({
                  ...candidate,
                  estimatedDurationMin: event.target.value
                    ? Number(event.target.value)
                    : undefined
                })
              }
              placeholder="min"
              step={15}
              value={candidate.estimatedDurationMin ?? ""}
            />
          </div>

          {isDetailsOpen && (
            <div
              className="mt-1.5 grid gap-1"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {([0, 1, 2] as const).map((index) => (
                <input
                  className="bg-[#3c3c3c] px-1.5 py-0.5 text-[12px] text-[#cccccc] outline-none placeholder:text-[#555555] focus:ring-1 focus:ring-[#007fd4]"
                  key={index}
                  onChange={(event) => {
                    const nextSubTasks = [...candidate.subTasks];
                    nextSubTasks[index] = event.target.value;
                    onUpdate({
                      ...candidate,
                      subTasks: nextSubTasks
                        .map((item) => item?.trim())
                        .filter(Boolean) as string[]
                    });
                  }}
                  placeholder={t("candidate.subtaskN", { n: index + 1 })}
                  value={candidate.subTasks[index] ?? ""}
                />
              ))}
              <textarea
                className="min-h-12 bg-[#3c3c3c] px-1.5 py-0.5 text-[12px] text-[#cccccc] outline-none placeholder:text-[#555555] focus:ring-1 focus:ring-[#007fd4]"
                onChange={(event) =>
                  onUpdate({
                    ...candidate,
                    note: event.target.value || undefined
                  })
                }
                placeholder={t("settings.note")}
                value={candidate.note ?? ""}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onDuplicate && (
            <button
              className="px-1 text-[11px] text-[#555555] hover:text-[#cccccc]"
              onClick={() => onDuplicate(candidate.id)}
              onPointerDown={(event) => event.stopPropagation()}
              title={t("candidate.duplicateTitle")}
              type="button"
            >
              ⊕
            </button>
          )}
          <button
            className="px-1 text-[12px] text-[#555555] hover:text-[#f48771]"
            onClick={() => onDelete(candidate.id)}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
