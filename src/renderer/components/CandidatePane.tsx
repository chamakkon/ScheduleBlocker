import type { PointerEvent } from "react";
import { useT } from "@renderer/lib/i18n";
import type {
  ColorSetting,
  TaskCandidate
} from "@shared/types";
import { CandidateCard } from "./CandidateCard";

type CandidatePaneProps = {
  candidates: TaskCandidate[];
  colors: ColorSetting[];
  canEdit: boolean;
  autoFocusCandidateId?: string;
  onNewTask: () => void;
  onFromTemplate: () => void;
  onCandidatePointerDown: (
    event: PointerEvent<HTMLDivElement>,
    candidate: TaskCandidate
  ) => void;
  onUpdateCandidate: (candidate: TaskCandidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onDuplicateCandidate?: (candidateId: string) => void;
};

export function CandidatePane({
  candidates,
  colors,
  canEdit,
  autoFocusCandidateId,
  onNewTask,
  onFromTemplate,
  onCandidatePointerDown,
  onUpdateCandidate,
  onDeleteCandidate,
  onDuplicateCandidate
}: CandidatePaneProps) {
  const t = useT();
  const colorMap = new Map(colors.map((color) => [color.id, color]));

  return (
    <aside className="flex h-full flex-col border-r border-[#333333] bg-[#252526]">
      <div className="flex items-center justify-between border-b border-[#333333] px-3 py-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
          {t("candidate.tasks")}
        </span>
        <div className="flex gap-0.5">
          <button
            className="px-1.5 py-0.5 text-[11px] text-[#858585] hover:text-[#cccccc]"
            disabled={!canEdit}
            onClick={onNewTask}
            type="button"
          >
            {t("candidate.new")}
          </button>
          <button
            className="px-1.5 py-0.5 text-[11px] text-[#858585] hover:text-[#cccccc]"
            disabled={!canEdit}
            onClick={onFromTemplate}
            type="button"
          >
            {t("candidate.template")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {candidates.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-[#555555]">
            {t("candidate.empty")}
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              autoFocusTitle={candidate.id === autoFocusCandidateId}
              candidate={candidate}
              color={colorMap.get(candidate.colorId)}
              colors={colors}
              draggable={canEdit}
              key={candidate.id}
              onDelete={onDeleteCandidate}
              onDuplicate={canEdit ? onDuplicateCandidate : undefined}
              onPointerDown={onCandidatePointerDown}
              onUpdate={onUpdateCandidate}
            />
          ))
        )}
      </div>
    </aside>
  );
}
