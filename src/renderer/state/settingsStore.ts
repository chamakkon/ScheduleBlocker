import { create } from "zustand";
import type {
  AppLocale,
  ColorSetting,
  FixedCandidateTemplate,
  GoogleIntegrationSettings,
  SlackIntegrationSettings
} from "@shared/types";

type SettingsState = {
  locale: AppLocale;
  anonymizeGoogleCalendarInExports: boolean;
  colors: ColorSetting[];
  fixedTemplates: FixedCandidateTemplate[];
  google: GoogleIntegrationSettings;
  slack: SlackIntegrationSettings;
  isLoading: boolean;
  isSaving: boolean;
  error?: string;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  addColor: (color: Omit<ColorSetting, "id">) => void;
  updateColor: (color: ColorSetting) => void;
  removeColor: (id: string) => void;
  addTemplate: (
    template: Omit<FixedCandidateTemplate, "id">
  ) => void;
  updateTemplate: (template: FixedCandidateTemplate) => void;
  removeTemplate: (id: string) => void;
  updateGoogle: (update: Partial<GoogleIntegrationSettings>) => void;
  updateSlack: (update: Partial<SlackIntegrationSettings>) => void;
  setLocale: (locale: AppLocale) => void;
  setAnonymizeGoogleCalendarInExports: (value: boolean) => void;
};

const defaultGoogle: GoogleIntegrationSettings = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  importCalendarEvents: true,
  importGoogleTasks: true,
  exportToCalendarOnFinalize: false
};

const defaultSlack: SlackIntegrationSettings = {
  enabled: false,
  botToken: "",
  defaultChannelId: "",
  defaultInitialComment: "今日のスケジュールです"
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  locale: "ja",
  anonymizeGoogleCalendarInExports: false,
  colors: [],
  fixedTemplates: [],
  google: defaultGoogle,
  slack: defaultSlack,
  isLoading: false,
  isSaving: false,
  error: undefined,
  loadSettings: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const payload = await window.appApi.loadSettings();
      set({
        locale: payload.locale ?? "ja",
        anonymizeGoogleCalendarInExports:
          payload.anonymizeGoogleCalendarInExports ?? false,
        colors: payload.colors,
        fixedTemplates: payload.fixedTemplates,
        google: payload.google ?? defaultGoogle,
        slack: payload.slack ?? defaultSlack,
        isLoading: false
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load settings"
      });
    }
  },
  saveSettings: async () => {
    set({ isSaving: true, error: undefined });
    try {
      const state = get();
      await window.appApi.saveSettings({
        locale: state.locale,
        anonymizeGoogleCalendarInExports: state.anonymizeGoogleCalendarInExports,
        colors: state.colors,
        fixedTemplates: state.fixedTemplates,
        google: state.google,
        slack: state.slack
      });
      set({ isSaving: false });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : "Failed to save settings"
      });
    }
  },
  addColor: (color) =>
    set((state) => ({
      colors: [
        ...state.colors,
        { id: crypto.randomUUID(), ...color }
      ]
    })),
  updateColor: (color) =>
    set((state) => ({
      colors: state.colors.map((item) =>
        item.id === color.id ? color : item
      )
    })),
  removeColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((item) => item.id !== id)
    })),
  addTemplate: (template) =>
    set((state) => ({
      fixedTemplates: [
        ...state.fixedTemplates,
        { id: crypto.randomUUID(), ...template }
      ]
    })),
  updateTemplate: (template) =>
    set((state) => ({
      fixedTemplates: state.fixedTemplates.map((item) =>
        item.id === template.id ? template : item
      )
    })),
  removeTemplate: (id) =>
    set((state) => ({
      fixedTemplates: state.fixedTemplates.filter(
        (item) => item.id !== id
      )
    })),
  updateGoogle: (update) =>
    set((state) => ({
      google: { ...state.google, ...update }
    })),
  updateSlack: (update) =>
    set((state) => ({
      slack: { ...state.slack, ...update }
    })),
  setLocale: (locale) => set({ locale }),
  setAnonymizeGoogleCalendarInExports: (value) =>
    set({ anonymizeGoogleCalendarInExports: value })
}));
