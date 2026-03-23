import { useMemo } from "react";
import type { AppLocale } from "@shared/types";
import { useSettingsStore } from "@renderer/state/settingsStore";

const ja: Record<string, string> = {
  "common.loading": "読み込み中…",
  "app.name": "Daily Visual Planner",
  "privacy.anonymousEventTitle": "（外部カレンダー）",
  "settings.title": "設定",
  "settings.back": "戻る",
  "settings.save": "保存",
  "settings.saving": "保存中…",
  "settings.language": "言語",
  "settings.langJa": "日本語",
  "settings.langEn": "English",
  "settings.privacySection": "プライバシー",
  "settings.anonymizeGcalExports":
    "画像保存・Slack共有時に Google カレンダー由来の予定を匿名化する（タイトル・メモを隠す）",
  "settings.colors": "色",
  "settings.templates": "テンプレート",
  "settings.add": "追加",
  "settings.remove": "削除",
  "settings.hex": "HEX",
  "settings.label": "ラベル",
  "settings.templateTitle": "タイトル",
  "settings.subtasksPlaceholder": "サブタスク（改行で最大3件）",
  "settings.durationMin": "分",
  "settings.note": "メモ",
  "settings.googleSection": "Google 連携",
  "settings.slackSection": "Slack 連携",
  "settings.enableGoogle": "Google 連携を有効にする",
  "settings.enableSlack": "Slack 連携を有効にする",
  "settings.oauthClientId": "OAuth Client ID",
  "settings.oauthClientSecret": "OAuth Client Secret",
  "settings.connect": "接続",
  "settings.disconnect": "切断",
  "settings.connecting": "接続中…",
  "settings.connected": "接続しました",
  "settings.disconnected": "切断しました",
  "settings.googleConnectHint":
    "接続を押すと設定が保存され、ブラウザで認証が始まります。",
  "settings.slackConnectHint":
    "接続を押すと設定が保存され、Bot トークンが検証されます。",
  "settings.fillOAuth": "Client ID と Client Secret を入力してください",
  "settings.botTokenPlaceholder": "Bot Token (xoxb-...)",
  "settings.channelIdPlaceholder": "デフォルトチャンネル ID（例 C01ABCDEF23）",
  "settings.initialCommentPlaceholder": "投稿時のコメント",
  "settings.importCal": "カレンダーイベントを取り込む",
  "settings.importTasks": "Google タスクを取り込む",
  "settings.exportOnFinalize": "確定時にカレンダーへ書き出す",
  "settings.errorPrefix": "エラー:",
  "settings.enterBotToken": "先に Bot トークンを入力してください",
  "daily.saved": "保存 {{time}}",
  "daily.save": "保存",
  "daily.saving": "保存中…",
  "daily.png": "PNG",
  "daily.finalize": "確定",
  "daily.edit": "編集",
  "daily.settings": "設定",
  "daily.gcal": "GCal",
  "daily.gtasks": "GTasks",
  "daily.toGcal": "→ GCal",
  "daily.slack": "Slack",
  "daily.exporting": "…",
  "timeline.schedule": "スケジュール",
  "timeline.time": "時刻",
  "timeline.preview": "プレビュー",
  "candidate.tasks": "タスク",
  "candidate.new": "+ 新規",
  "candidate.template": "+ テンプレ",
  "candidate.empty": "タスクをタイムラインへドラッグ",
  "candidate.taskName": "タスク名",
  "candidate.untitled": "無題",
  "candidate.subtaskN": "サブタスク {{n}}",
  "candidate.duplicateTitle": "複製",
  "modal.finalizeTitle": "今日のプランを確定しますか？",
  "modal.finalizeBody":
    "タイムライン中心の表示に切り替わります。あとから編集モードに戻せます。",
  "modal.cancel": "キャンセル",
  "modal.finalize": "確定",
  "template.title": "テンプレートから追加",
  "template.empty": "テンプレートがまだありません。",
  "template.add": "追加",
  "status.importingCal": "Google カレンダーを取り込み中…",
  "status.syncedCal": "{{n}} 件の予定を同期しました",
  "status.calImportFail": "カレンダー取り込み失敗:",
  "status.importingTasks": "Google タスクを取り込み中…",
  "status.importedTasks": "{{n}} 件のタスクを取り込みました",
  "status.tasksImportFail": "タスク取り込み失敗:",
  "status.exportingCal": "Google カレンダーに書き出し中…",
  "status.calExportOk": "カレンダー: {{created}} 件作成 / {{deleted}} 件削除",
  "status.calExportFail": "カレンダー書き出し失敗:",
  "status.sharingSlack": "Slack に共有中…",
  "status.slackOk": "Slack に投稿しました",
  "status.slackErr": "Slack エラー:",
  "status.slackFail": "Slack 共有失敗:"
};

const en: Record<string, string> = {
  "common.loading": "Loading...",
  "app.name": "Daily Visual Planner",
  "privacy.anonymousEventTitle": "(External calendar)",
  "settings.title": "Settings",
  "settings.back": "Back",
  "settings.save": "Save",
  "settings.saving": "Saving...",
  "settings.language": "Language",
  "settings.langJa": "日本語",
  "settings.langEn": "English",
  "settings.privacySection": "Privacy",
  "settings.anonymizeGcalExports":
    "Anonymize Google Calendar events in PNG export and Slack share (hide title & notes)",
  "settings.colors": "Colors",
  "settings.templates": "Templates",
  "settings.add": "Add",
  "settings.remove": "Remove",
  "settings.hex": "HEX",
  "settings.label": "Label",
  "settings.templateTitle": "Title",
  "settings.subtasksPlaceholder": "Subtasks (newline, up to 3)",
  "settings.durationMin": "min",
  "settings.note": "Note",
  "settings.googleSection": "Google integration",
  "settings.slackSection": "Slack integration",
  "settings.enableGoogle": "Enable Google integration",
  "settings.enableSlack": "Enable Slack integration",
  "settings.oauthClientId": "OAuth Client ID",
  "settings.oauthClientSecret": "OAuth Client Secret",
  "settings.connect": "Connect",
  "settings.disconnect": "Disconnect",
  "settings.connecting": "Connecting...",
  "settings.connected": "Connected",
  "settings.disconnected": "Disconnected",
  "settings.googleConnectHint":
    "Connect saves your settings and opens the browser for authorization.",
  "settings.slackConnectHint":
    "Connect saves your settings and verifies the bot token.",
  "settings.fillOAuth": "Enter Client ID and Client Secret",
  "settings.botTokenPlaceholder": "Bot Token (xoxb-...)",
  "settings.channelIdPlaceholder": "Default Channel ID (e.g. C01ABCDEF23)",
  "settings.initialCommentPlaceholder": "Initial comment when posting",
  "settings.importCal": "Import Calendar events",
  "settings.importTasks": "Import Google Tasks",
  "settings.exportOnFinalize": "Export to Calendar on Finalize",
  "settings.errorPrefix": "Error:",
  "settings.enterBotToken": "Enter a bot token first",
  "daily.saved": "saved {{time}}",
  "daily.save": "Save",
  "daily.saving": "Saving...",
  "daily.png": "PNG",
  "daily.finalize": "Finalize",
  "daily.edit": "Edit",
  "daily.settings": "Settings",
  "daily.gcal": "GCal",
  "daily.gtasks": "GTasks",
  "daily.toGcal": "→ GCal",
  "daily.slack": "Slack",
  "daily.exporting": "...",
  "timeline.schedule": "Schedule",
  "timeline.time": "time",
  "timeline.preview": "preview",
  "candidate.tasks": "Tasks",
  "candidate.new": "+ New",
  "candidate.template": "+ Template",
  "candidate.empty": "Drag tasks to the timeline",
  "candidate.taskName": "Task name",
  "candidate.untitled": "Untitled",
  "candidate.subtaskN": "subtask {{n}}",
  "candidate.duplicateTitle": "Duplicate",
  "modal.finalizeTitle": "Finalize today's plan?",
  "modal.finalizeBody":
    "The view switches to timeline-only. You can return to edit mode later.",
  "modal.cancel": "Cancel",
  "modal.finalize": "Finalize",
  "template.title": "Add from templates",
  "template.empty": "No templates configured yet.",
  "template.add": "Add",
  "status.importingCal": "Importing Google Calendar...",
  "status.syncedCal": "Synced {{n}} events from Google Calendar",
  "status.calImportFail": "Calendar import failed:",
  "status.importingTasks": "Importing Google Tasks...",
  "status.importedTasks": "Imported {{n}} tasks",
  "status.tasksImportFail": "Tasks import failed:",
  "status.exportingCal": "Exporting to Google Calendar...",
  "status.calExportOk": "Calendar: {{created}} created, {{deleted}} deleted",
  "status.calExportFail": "Calendar export failed:",
  "status.sharingSlack": "Sharing to Slack...",
  "status.slackOk": "Shared to Slack!",
  "status.slackErr": "Slack error:",
  "status.slackFail": "Slack share failed:"
};

const tables: Record<AppLocale, Record<string, string>> = { ja, en };

function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const table = tables[locale] ?? ja;
  let s = table[key] ?? ja[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return s;
}

export function useT(): (
  key: string,
  params?: Record<string, string | number>
) => string {
  const locale = useSettingsStore((s) => s.locale);
  return useMemo(
    () => (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );
}

export type IntegrationHelpBlock = {
  title: string;
  steps: string[];
  extraTitle?: string;
  extraSteps?: string[];
};

export function getGoogleIntegrationHelp(locale: AppLocale): IntegrationHelpBlock {
  if (locale === "en") {
    return {
      title: "How to get Client ID & Secret:",
      steps: [
        "Open console.cloud.google.com → create or select a project",
        'Enable Google Calendar API and Google Tasks API under "APIs & Services"',
        'Go to "Credentials" → Create Credentials → OAuth client ID',
        "Application type: Desktop app",
        "Copy the Client ID and Client Secret into the fields below",
        'On "OAuth consent screen", add your Google account as a test user (required while in Testing)'
      ]
    };
  }
  return {
    title: "Client ID / Secret の取得方法:",
    steps: [
      "console.cloud.google.com でプロジェクトを作成または選択",
      "「API とサービス」で Google Calendar API と Google Tasks API を有効化",
      "「認証情報」→「認証情報を作成」→「OAuth クライアント ID」",
      "アプリケーションの種類: デスクトップアプリ",
      "表示された Client ID と Client Secret を下に貼り付け",
      "OAuth 同意画面で、テストユーザーに自分の Google アカウントを追加（テスト中は必須）"
    ]
  };
}

export function getSlackIntegrationHelp(locale: AppLocale): IntegrationHelpBlock {
  if (locale === "en") {
    return {
      title: "How to get a Slack Bot Token:",
      steps: [
        "Open api.slack.com/apps → Create New App → From scratch",
        'Under "OAuth & Permissions", add Bot Token Scope: files:write',
        "Install to Workspace and authorize",
        "Copy the Bot User OAuth Token (starts with xoxb-)"
      ],
      extraTitle: "How to find Channel ID:",
      extraSteps: [
        "In Slack, right-click the channel → View channel details",
        "Channel ID is at the bottom (e.g. C01ABCDEF23)",
        "Invite the bot: /invite @YourBotName"
      ]
    };
  }
  return {
    title: "Slack Bot トークンの取得:",
    steps: [
      "api.slack.com/apps →「アプリを新規作成」→「最初から作成」",
      "「OAuth と権限」で Bot トークンスコープに files:write を追加",
      "「ワークスペースにインストール」で承認",
      "表示された Bot User OAuth Token（xoxb- で始まる）をコピー"
    ],
    extraTitle: "チャンネル ID の確認:",
    extraSteps: [
      "Slack でチャンネルを右クリック →「チャンネルの詳細を表示」",
      "詳細パネル下部にチャンネル ID（例 C01ABCDEF23）",
      "ボットを招待: /invite @ボット名"
    ]
  };
}
