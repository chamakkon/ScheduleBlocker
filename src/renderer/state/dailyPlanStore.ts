import { create } from "zustand";
import type {
  DailyPlan,
  FixedCandidateTemplate,
  ScheduleBlock,
  TaskCandidate
} from "@shared/types";
import {
  buildBlockFromCandidate,
  moveBlockWithAutoShift,
  resizeBlockEndWithAutoShift,
  resizeBlockStartWithAutoShift,
  sortBlocks
} from "@renderer/lib/timeline";

type DailyPlanState = {
  plan: DailyPlan | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  error?: string;
  initializeTodayPlan: () => Promise<DailyPlan | null>;
  savePlan: () => Promise<void>;
  setMemo: (memo: string) => void;
  finalizePlan: () => void;
  unfinalizePlan: () => void;
  addCandidate: (candidate: Omit<TaskCandidate, "id">) => string | null;
  addCandidatesFromTemplates: (
    templates: FixedCandidateTemplate[]
  ) => void;
  updateCandidate: (candidate: TaskCandidate) => void;
  removeCandidate: (candidateId: string) => void;
  createBlockFromCandidate: (
    candidateId: string,
    startUnit: number
  ) => void;
  duplicateCandidate: (candidateId: string) => void;
  addBlock: (block: ScheduleBlock) => void;
  updateBlock: (block: ScheduleBlock) => void;
  moveBlock: (blockId: string, targetStartUnit: number) => void;
  resizeBlockStart: (blockId: string, nextStartUnit: number) => void;
  resizeBlockEnd: (blockId: string, nextEndUnit: number) => void;
  removeBlock: (blockId: string) => void;
  replaceExternalCalendarBlocks: (blocks: ScheduleBlock[]) => void;
  setExportedImagePath: (path: string) => void;
};

function updatePlan(
  plan: DailyPlan | null,
  updater: (current: DailyPlan) => DailyPlan
): DailyPlan | null {
  return plan ? updater(plan) : plan;
}

export const useDailyPlanStore = create<DailyPlanState>((set, get) => ({
  plan: null,
  isLoading: false,
  isSaving: false,
  lastSavedAt: undefined,
  error: undefined,
  initializeTodayPlan: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const plan = await window.appApi.createTodayPlanIfMissing();
      set({ plan, isLoading: false });
      return plan;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "当日のプラン読込に失敗しました。"
      });
      return null;
    }
  },
  savePlan: async () => {
    const { plan } = get();
    if (!plan) {
      return;
    }
    set({ isSaving: true, error: undefined });
    try {
      await window.appApi.saveTodayPlan(plan);
      set({
        isSaving: false,
        lastSavedAt: new Date().toISOString()
      });
    } catch (error) {
      set({
        isSaving: false,
        error:
          error instanceof Error
            ? error.message
            : "プラン保存に失敗しました。"
      });
    }
  },
  setMemo: (memo) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({ ...plan, memo }))
    })),
  finalizePlan: () =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        isFinalized: true
      }))
    })),
  unfinalizePlan: () =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        isFinalized: false
      }))
    })),
  addCandidate: (candidate) => {
    const candidateId = crypto.randomUUID();
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        candidates: [
          ...plan.candidates,
          { id: candidateId, ...candidate }
        ]
      }))
    }));
    return get().plan ? candidateId : null;
  },
  addCandidatesFromTemplates: (templates) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        candidates: [
          ...plan.candidates,
          ...templates.map((template) => ({
            id: crypto.randomUUID(),
            title: template.title,
            subTasks: template.subTasks,
            colorId: template.colorId,
            estimatedDurationMin: template.estimatedDurationMin,
            note: template.note
          }))
        ]
      }))
    })),
  updateCandidate: (candidate) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        candidates: plan.candidates.map((item) =>
          item.id === candidate.id ? candidate : item
        ),
        blocks: plan.blocks.map((block) =>
          block.taskCandidateId === candidate.id
            ? {
                ...block,
                title: candidate.title,
                subTasks: candidate.subTasks,
                colorId: candidate.colorId,
                note: candidate.note
              }
            : block
        )
      }))
    })),
  removeCandidate: (candidateId) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        candidates: plan.candidates.filter(
          (item) => item.id !== candidateId
        )
      }))
    })),
  createBlockFromCandidate: (candidateId, startUnit) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => {
        const candidate = plan.candidates.find(
          (item) => item.id === candidateId
        );
        if (!candidate) {
          return plan;
        }

        const nextBlock = buildBlockFromCandidate(candidate, startUnit);
        const placedBlock = moveBlockWithAutoShift(
          nextBlock,
          plan.blocks,
          startUnit
        );

        if (!placedBlock) {
          return plan;
        }

        return {
          ...plan,
          candidates: plan.candidates.filter((c) => c.id !== candidateId),
          blocks: sortBlocks([...plan.blocks, placedBlock])
        };
      })
    })),
  duplicateCandidate: (candidateId) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => {
        const candidate = plan.candidates.find((c) => c.id === candidateId);
        if (!candidate) return plan;
        const newCandidate: TaskCandidate = {
          id: crypto.randomUUID(),
          title: candidate.title,
          subTasks: [...candidate.subTasks],
          colorId: candidate.colorId,
          estimatedDurationMin: candidate.estimatedDurationMin,
          note: candidate.note,
          source: "local"
        };
        return {
          ...plan,
          candidates: [...plan.candidates, newCandidate]
        };
      })
    })),
  addBlock: (block) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        blocks: sortBlocks([...plan.blocks, block])
      }))
    })),
  updateBlock: (block) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        blocks: sortBlocks(
          plan.blocks.map((item) => (item.id === block.id ? block : item))
        )
      }))
    })),
  moveBlock: (blockId, targetStartUnit) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => {
        const block = plan.blocks.find((item) => item.id === blockId);
        if (!block) {
          return plan;
        }

        const otherBlocks = plan.blocks.filter(
          (item) => item.id !== blockId
        );
        const moved = moveBlockWithAutoShift(
          block,
          otherBlocks,
          targetStartUnit
        );
        if (!moved) {
          return plan;
        }

        return {
          ...plan,
          blocks: sortBlocks([...otherBlocks, moved])
        };
      })
    })),
  resizeBlockStart: (blockId, nextStartUnit) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => {
        const block = plan.blocks.find((item) => item.id === blockId);
        if (!block) {
          return plan;
        }

        const otherBlocks = plan.blocks.filter(
          (item) => item.id !== blockId
        );
        const resized = resizeBlockStartWithAutoShift(
          block,
          otherBlocks,
          nextStartUnit
        );
        if (!resized) {
          return plan;
        }

        return {
          ...plan,
          blocks: sortBlocks([...otherBlocks, resized])
        };
      })
    })),
  resizeBlockEnd: (blockId, nextEndUnit) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => {
        const block = plan.blocks.find((item) => item.id === blockId);
        if (!block) {
          return plan;
        }

        const otherBlocks = plan.blocks.filter(
          (item) => item.id !== blockId
        );
        const resized = resizeBlockEndWithAutoShift(
          block,
          otherBlocks,
          nextEndUnit
        );
        if (!resized) {
          return plan;
        }

        return {
          ...plan,
          blocks: sortBlocks([...otherBlocks, resized])
        };
      })
    })),
  removeBlock: (blockId) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        blocks: plan.blocks.filter((item) => item.id !== blockId)
      }))
    })),
  replaceExternalCalendarBlocks: (newBlocks) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        blocks: sortBlocks([
          ...plan.blocks.filter((b) => b.source !== "google_calendar"),
          ...newBlocks
        ])
      }))
    })),
  setExportedImagePath: (path) =>
    set((state) => ({
      plan: updatePlan(state.plan, (plan) => ({
        ...plan,
        exportedImagePath: path
      }))
    }))
}));
