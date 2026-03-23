import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  screen
} from "electron/main";
import type {
  DailyPlan,
  ExportTimelinePayload,
  ScheduleBlock,
  SettingsPayload,
  WindowMode
} from "@shared/types";
import {
  createTodayPlanIfMissing,
  getLocalDateString,
  loadSettings,
  loadTodayPlan,
  saveSettings,
  saveTodayPlan,
  writePngFile
} from "./storage";
import {
  connectGoogle,
  disconnectGoogle,
  getGoogleStatus
} from "./google-auth";
import {
  importCalendarForDate,
  exportPlanToCalendar
} from "./google-calendar";
import { importTasks } from "./google-tasks";
import {
  connectSlack,
  disconnectSlack,
  shareTimelineImage
} from "./slack";
import { updateElectronApp } from "update-electron-app";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function initAutoUpdater(): void {
  if (!app.isPackaged) {
    return;
  }
  if (process.env.DISABLE_AUTO_UPDATE === "1") {
    return;
  }
  try {
    updateElectronApp({
      logger: {
        log: (m: string) => console.log("[update]", m),
        info: (m: string) => console.info("[update]", m),
        error: (m: string) => console.error("[update]", m),
        warn: (m: string) => console.warn("[update]", m)
      }
    });
  } catch (err) {
    console.error("[update] init failed:", err);
  }
}

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.max(920, Math.round((workArea.width * 2) / 3)),
    height: workArea.height,
    minWidth: 860,
    minHeight: 760,
    title: "Daily Visual Planner",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function registerIpc(): void {
  // --- Existing plan & settings handlers ---

  ipcMain.handle("daily-plan:load-today", async () => {
    return loadTodayPlan();
  });

  ipcMain.handle("daily-plan:create-today-if-missing", async () => {
    return createTodayPlanIfMissing();
  });

  ipcMain.handle(
    "daily-plan:save",
    async (_event, plan: DailyPlan) => {
      await saveTodayPlan(plan);
    }
  );

  ipcMain.handle("settings:load", async () => {
    return loadSettings();
  });

  ipcMain.handle(
    "settings:save",
    async (_event, payload: SettingsPayload) => {
      await saveSettings(payload);
    }
  );

  ipcMain.handle(
    "export:timeline-png",
    async (_event, payload: ExportTimelinePayload) => {
      const fileName = `${payload.date || getLocalDateString()}-timeline.png`;
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: path.join(app.getPath("documents"), fileName),
        filters: [{ name: "PNG Image", extensions: ["png"] }]
      });

      if (canceled || !filePath) {
        return { savedPath: "" };
      }

      await writePngFile(filePath, payload.dataUrl);
      return { savedPath: filePath };
    }
  );

  ipcMain.handle(
    "window:set-mode",
    (_event, mode: WindowMode) => {
      if (!mainWindow) return;
      const workArea = screen.getPrimaryDisplay().workAreaSize;
      const bounds = mainWindow.getBounds();

      if (mode === "compact") {
        const compactWidth = Math.min(300, workArea.width);
        mainWindow.setMinimumSize(240, 760);
        mainWindow.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: compactWidth,
          height: bounds.height
        }, true);
      } else {
        const expandedWidth = Math.max(920, Math.round((workArea.width * 2) / 3));
        mainWindow.setMinimumSize(860, 760);
        mainWindow.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: expandedWidth,
          height: bounds.height
        }, true);
      }
    }
  );

  // --- Google integration ---

  ipcMain.handle("google:connect", async () => {
    await connectGoogle();
  });

  ipcMain.handle("google:disconnect", async () => {
    await disconnectGoogle();
  });

  ipcMain.handle("google:get-status", async () => {
    return getGoogleStatus();
  });

  ipcMain.handle(
    "google:import-calendar",
    async (_event, date: string) => {
      return importCalendarForDate(date);
    }
  );

  ipcMain.handle("google:import-tasks", async () => {
    return importTasks();
  });

  ipcMain.handle(
    "google:export-plan",
    async (_event, payload: { date: string; blocks: ScheduleBlock[]; colorMap?: Record<string, string> }) => {
      return exportPlanToCalendar(payload.date, payload.blocks, payload.colorMap);
    }
  );

  // --- Slack integration ---

  ipcMain.handle(
    "slack:connect",
    async (_event, botToken: string) => {
      await connectSlack(botToken);
    }
  );

  ipcMain.handle("slack:disconnect", async () => {
    await disconnectSlack();
  });

  ipcMain.handle(
    "slack:share-image",
    async (_event, payload: {
      dataUrl: string;
      date: string;
      channelId?: string;
      initialComment?: string;
    }) => {
      return shareTimelineImage(payload);
    }
  );
}

app.whenReady().then(() => {
  initAutoUpdater();
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
