import { create } from "zustand";

export type AppPage = "daily" | "settings";
export type UIMode = "planning" | "finalized";

type UIState = {
  currentPage: AppPage;
  mode: UIMode;
  selectedCandidateId?: string;
  selectedBlockId?: string;
  isTaskEditorOpen: boolean;
  editingCandidateId?: string;
  isTemplatePickerOpen: boolean;
  isFinalizeConfirmOpen: boolean;
  isExporting: boolean;
  setCurrentPage: (page: AppPage) => void;
  setMode: (mode: UIMode) => void;
  setSelectedCandidateId: (candidateId?: string) => void;
  setSelectedBlockId: (blockId?: string) => void;
  openTaskEditor: (candidateId?: string) => void;
  closeTaskEditor: () => void;
  setTemplatePickerOpen: (open: boolean) => void;
  setFinalizeConfirmOpen: (open: boolean) => void;
  setIsExporting: (value: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  currentPage: "daily",
  mode: "planning",
  selectedCandidateId: undefined,
  selectedBlockId: undefined,
  isTaskEditorOpen: false,
  editingCandidateId: undefined,
  isTemplatePickerOpen: false,
  isFinalizeConfirmOpen: false,
  isExporting: false,
  setCurrentPage: (currentPage) => set({ currentPage }),
  setMode: (mode) => set({ mode }),
  setSelectedCandidateId: (selectedCandidateId) =>
    set({ selectedCandidateId }),
  setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),
  openTaskEditor: (editingCandidateId) =>
    set({
      isTaskEditorOpen: true,
      editingCandidateId
    }),
  closeTaskEditor: () =>
    set({
      isTaskEditorOpen: false,
      editingCandidateId: undefined
    }),
  setTemplatePickerOpen: (isTemplatePickerOpen) =>
    set({ isTemplatePickerOpen }),
  setFinalizeConfirmOpen: (isFinalizeConfirmOpen) =>
    set({ isFinalizeConfirmOpen }),
  setIsExporting: (isExporting) => set({ isExporting })
}));
