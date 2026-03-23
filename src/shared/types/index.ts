// --- Source discriminants ---

export type CandidateSource = "local" | "google_tasks";
export type BlockSource = "local" | "google_calendar";

// --- Core domain models ---

export type TaskCandidate = {
  id: string;
  title: string;
  subTasks: string[];
  colorId: string;
  estimatedDurationMin?: number;
  note?: string;
  source?: CandidateSource;
  externalRef?: {
    provider: "google_tasks";
    taskListId: string;
    taskId: string;
  };
};

export type ScheduleBlock = {
  id: string;
  taskCandidateId?: string;
  title: string;
  subTasks: string[];
  colorId: string;
  startUnit: number;
  durationUnit: number;
  note?: string;
  source?: BlockSource;
  externalRef?: {
    provider: "google_calendar";
    calendarId: string;
    eventId: string;
  };
  locked?: boolean;
};

export type DailyPlan = {
  id: string;
  date: string;
  candidates: TaskCandidate[];
  blocks: ScheduleBlock[];
  memo?: string;
  isFinalized: boolean;
  exportedImagePath?: string;
};

// --- Color & Template ---

export type ColorSetting = {
  id: string;
  hex: string;
  label?: string;
};

export type FixedCandidateTemplate = {
  id: string;
  title: string;
  subTasks: string[];
  colorId: string;
  estimatedDurationMin?: number;
  note?: string;
};

// --- Integration settings ---

export type GoogleIntegrationSettings = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  importCalendarEvents: boolean;
  importGoogleTasks: boolean;
  exportToCalendarOnFinalize: boolean;
};

export type SlackIntegrationSettings = {
  enabled: boolean;
  botToken: string;
  defaultChannelId: string;
  defaultInitialComment: string;
};

// --- App locale & general preferences ---

export type AppLocale = "ja" | "en";

// --- Settings payload (persisted) ---

export type SettingsPayload = {
  locale?: AppLocale;
  /** When true, PNG export & Slack image hide GCal block titles/notes */
  anonymizeGoogleCalendarInExports?: boolean;
  colors: ColorSetting[];
  fixedTemplates: FixedCandidateTemplate[];
  google?: GoogleIntegrationSettings;
  slack?: SlackIntegrationSettings;
};

// --- DTOs for IPC ---

export type ExternalCalendarBlockDTO = {
  eventId: string;
  calendarId: string;
  title: string;
  startUnit: number;
  durationUnit: number;
  note?: string;
  gcalColorHex?: string;
};

export type ExternalTaskCandidateDTO = {
  taskId: string;
  taskListId: string;
  title: string;
  note?: string;
};

export type ExportTimelinePayload = {
  dataUrl: string;
  date: string;
};

export type WindowMode = "compact" | "expanded";

export type GoogleConnectionStatus = {
  connected: boolean;
  scopes: string[];
};

export type CalendarExportResult = {
  created: number;
  deleted: number;
};

export type SlackShareResult = {
  ok: boolean;
  error?: string;
};

// --- AppApi (exposed via preload) ---

export type AppApi = {
  loadTodayPlan: () => Promise<DailyPlan | null>;
  createTodayPlanIfMissing: () => Promise<DailyPlan>;
  saveTodayPlan: (plan: DailyPlan) => Promise<void>;
  loadSettings: () => Promise<SettingsPayload>;
  saveSettings: (payload: SettingsPayload) => Promise<void>;
  exportTimelinePng: (
    payload: ExportTimelinePayload
  ) => Promise<{ savedPath: string }>;
  setWindowMode: (mode: WindowMode) => Promise<void>;

  integrations: {
    google: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      getStatus: () => Promise<GoogleConnectionStatus>;
      importCalendarForDate: (date: string) => Promise<ExternalCalendarBlockDTO[]>;
      importTasks: () => Promise<ExternalTaskCandidateDTO[]>;
      exportPlanToCalendar: (payload: {
        date: string;
        blocks: ScheduleBlock[];
        colorMap?: Record<string, string>;
      }) => Promise<CalendarExportResult>;
    };
    slack: {
      connect: (botToken: string) => Promise<void>;
      disconnect: () => Promise<void>;
      shareTimelineImage: (payload: {
        dataUrl: string;
        date: string;
        channelId?: string;
        initialComment?: string;
      }) => Promise<SlackShareResult>;
    };
  };
};
