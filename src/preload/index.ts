import * as electron from "electron";
import type {
  AppApi,
  DailyPlan,
  ExportTimelinePayload,
  ScheduleBlock,
  SettingsPayload,
  WindowMode
} from "@shared/types";

const { contextBridge, ipcRenderer } = electron;

const appApi: AppApi = {
  loadTodayPlan: () => ipcRenderer.invoke("daily-plan:load-today"),
  createTodayPlanIfMissing: () =>
    ipcRenderer.invoke("daily-plan:create-today-if-missing"),
  saveTodayPlan: (plan: DailyPlan) =>
    ipcRenderer.invoke("daily-plan:save", plan),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (payload: SettingsPayload) =>
    ipcRenderer.invoke("settings:save", payload),
  exportTimelinePng: (payload: ExportTimelinePayload) =>
    ipcRenderer.invoke("export:timeline-png", payload),
  setWindowMode: (mode: WindowMode) =>
    ipcRenderer.invoke("window:set-mode", mode),

  integrations: {
    google: {
      connect: () => ipcRenderer.invoke("google:connect"),
      disconnect: () => ipcRenderer.invoke("google:disconnect"),
      getStatus: () => ipcRenderer.invoke("google:get-status"),
      importCalendarForDate: (date: string) =>
        ipcRenderer.invoke("google:import-calendar", date),
      importTasks: () => ipcRenderer.invoke("google:import-tasks"),
      exportPlanToCalendar: (payload: {
        date: string;
        blocks: ScheduleBlock[];
        colorMap?: Record<string, string>;
      }) => ipcRenderer.invoke("google:export-plan", payload)
    },
    slack: {
      connect: (botToken: string) =>
        ipcRenderer.invoke("slack:connect", botToken),
      disconnect: () => ipcRenderer.invoke("slack:disconnect"),
      shareTimelineImage: (payload: {
        dataUrl: string;
        date: string;
        channelId?: string;
        initialComment?: string;
      }) => ipcRenderer.invoke("slack:share-image", payload)
    }
  }
};

contextBridge.exposeInMainWorld("appApi", appApi);
