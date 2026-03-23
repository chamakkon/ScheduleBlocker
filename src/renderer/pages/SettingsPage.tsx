import { useMemo, useState } from "react";
import { Button } from "@renderer/components/Button";
import {
  getGoogleIntegrationHelp,
  getSlackIntegrationHelp,
  useT
} from "@renderer/lib/i18n";
import { useSettingsStore } from "@renderer/state/settingsStore";
import { useUIStore } from "@renderer/state/uiStore";
import type { AppLocale } from "@shared/types";

function parseSubTasks(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function SettingsPage() {
  const {
    colors,
    fixedTemplates,
    google,
    slack,
    isSaving,
    error,
    addColor,
    updateColor,
    removeColor,
    addTemplate,
    updateTemplate,
    removeTemplate,
    updateGoogle,
    updateSlack,
    saveSettings,
    locale,
    setLocale,
    anonymizeGoogleCalendarInExports,
    setAnonymizeGoogleCalendarInExports
  } = useSettingsStore();
  const { setCurrentPage } = useUIStore();
  const t = useT();
  const googleHelp = getGoogleIntegrationHelp(locale);
  const slackHelp = getSlackIntegrationHelp(locale);
  const [newColorHex, setNewColorHex] = useState("#3B82F6");
  const [newColorLabel, setNewColorLabel] = useState("");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateSubTasks, setNewTemplateSubTasks] = useState("");
  const [newTemplateColorId, setNewTemplateColorId] = useState("");
  const [newTemplateDuration, setNewTemplateDuration] = useState("");
  const [newTemplateNote, setNewTemplateNote] = useState("");
  const [googleStatus, setGoogleStatus] = useState<string>("");
  const [slackStatus, setSlackStatus] = useState<string>("");

  const fallbackColorId = useMemo(
    () => colors[0]?.id ?? "",
    [colors]
  );

  const inputClass =
    "bg-[#3c3c3c] px-2 py-1 text-[12px] text-[#cccccc] outline-none focus:ring-1 focus:ring-[#007fd4]";

  const handleGoogleConnect = async () => {
    if (!google.clientId.trim() || !google.clientSecret.trim()) {
      setGoogleStatus(t("settings.fillOAuth"));
      return;
    }
    try {
      setGoogleStatus(t("settings.connecting"));
      await saveSettings();
      await window.appApi.integrations.google.connect();
      setGoogleStatus(t("settings.connected"));
    } catch (err) {
      setGoogleStatus(
        `${t("settings.errorPrefix")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await window.appApi.integrations.google.disconnect();
      setGoogleStatus(t("settings.disconnected"));
    } catch (err) {
      setGoogleStatus(
        `${t("settings.errorPrefix")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleSlackConnect = async () => {
    if (!slack.botToken.trim()) {
      setSlackStatus(t("settings.enterBotToken"));
      return;
    }
    try {
      setSlackStatus(t("settings.connecting"));
      await saveSettings();
      await window.appApi.integrations.slack.connect(slack.botToken);
      setSlackStatus(t("settings.connected"));
    } catch (err) {
      setSlackStatus(
        `${t("settings.errorPrefix")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleSlackDisconnect = async () => {
    try {
      await window.appApi.integrations.slack.disconnect();
      setSlackStatus(t("settings.disconnected"));
    } catch (err) {
      setSlackStatus(
        `${t("settings.errorPrefix")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[#333333] bg-[#252526] px-3 py-1">
        <span className="text-[13px] text-[#cccccc]">{t("settings.title")}</span>
        <div className="flex gap-1">
          <Button
            onClick={() => setCurrentPage("daily")}
            type="button"
            variant="secondary"
          >
            {t("settings.back")}
          </Button>
          <Button onClick={() => void saveSettings()} type="button">
            {isSaving ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="xl:col-span-2">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.language")}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <select
                className={`${inputClass} min-w-[160px]`}
                onChange={(e) => {
                  setLocale(e.target.value as AppLocale);
                  void saveSettings();
                }}
                value={locale}
              >
                <option value="ja">{t("settings.langJa")}</option>
                <option value="en">{t("settings.langEn")}</option>
              </select>
            </div>
            <h2 className="mt-4 text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.privacySection")}
            </h2>
            <label className="mt-2 flex max-w-2xl items-start gap-2 text-[12px] text-[#cccccc]">
              <input
                checked={anonymizeGoogleCalendarInExports}
                className="mt-0.5"
                onChange={(e) => {
                  setAnonymizeGoogleCalendarInExports(e.target.checked);
                  void saveSettings();
                }}
                type="checkbox"
              />
              <span>{t("settings.anonymizeGcalExports")}</span>
            </label>
          </section>

          {/* Colors */}
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.colors")}
            </h2>
            <div className="mt-2 grid gap-1">
              {colors.map((color) => (
                <div
                  className="flex items-center gap-2 border-b border-[#2a2a2a] py-1"
                  key={color.id}
                >
                  <input
                    className="h-6 w-8 cursor-pointer border-none bg-transparent"
                    onChange={(event) =>
                      updateColor({ ...color, hex: event.target.value })
                    }
                    type="color"
                    value={color.hex}
                  />
                  <input
                    className={`flex-1 ${inputClass}`}
                    onChange={(event) =>
                      updateColor({ ...color, label: event.target.value })
                    }
                    placeholder={t("settings.label")}
                    value={color.label ?? ""}
                  />
                  <button
                    className="text-[11px] text-[#555555] hover:text-[#f48771]"
                    onClick={() => removeColor(color.id)}
                    title={t("settings.remove")}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="h-6 w-8 cursor-pointer border-none bg-transparent"
                onChange={(event) => setNewColorHex(event.target.value)}
                type="color"
                value={newColorHex}
              />
              <input
                className={`flex-1 ${inputClass}`}
                onChange={(event) => setNewColorLabel(event.target.value)}
                placeholder={t("settings.label")}
                value={newColorLabel}
              />
              <Button
                onClick={() => {
                  addColor({ hex: newColorHex, label: newColorLabel.trim() || undefined });
                  setNewColorLabel("");
                  setNewColorHex("#3B82F6");
                }}
                type="button"
              >
                {t("settings.add")}
              </Button>
            </div>
          </section>

          {/* Templates */}
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.templates")}
            </h2>
            <div className="mt-2 grid gap-2">
              {fixedTemplates.map((template) => (
                <div className="border-b border-[#2a2a2a] pb-2" key={template.id}>
                  <div className="grid gap-1">
                    <input
                      className={inputClass}
                      onChange={(event) =>
                        updateTemplate({ ...template, title: event.target.value })
                      }
                      placeholder={t("settings.templateTitle")}
                      value={template.title}
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        className={inputClass}
                        onChange={(event) =>
                          updateTemplate({ ...template, colorId: event.target.value })
                        }
                        value={template.colorId}
                      >
                        {colors.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.label || color.id}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        inputMode="numeric"
                        onChange={(event) =>
                          updateTemplate({
                            ...template,
                            estimatedDurationMin: event.target.value
                              ? Number(event.target.value)
                              : undefined
                          })
                        }
                        placeholder={t("settings.durationMin")}
                        value={template.estimatedDurationMin ?? ""}
                      />
                    </div>
                    <textarea
                      className={`min-h-14 ${inputClass}`}
                      onChange={(event) =>
                        updateTemplate({
                          ...template,
                          subTasks: parseSubTasks(event.target.value)
                        })
                      }
                      placeholder={t("settings.subtasksPlaceholder")}
                      value={template.subTasks.join("\n")}
                    />
                    <div className="flex justify-end">
                      <button
                        className="text-[11px] text-[#555555] hover:text-[#f48771]"
                        onClick={() => removeTemplate(template.id)}
                        type="button"
                      >
                        {t("settings.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-1 border border-[#333333] p-2">
              <span className="text-[11px] text-[#555555]">
                {t("settings.templateTitle")}
              </span>
              <input
                className={inputClass}
                onChange={(event) => setNewTemplateTitle(event.target.value)}
                placeholder={t("settings.templateTitle")}
                value={newTemplateTitle}
              />
              <div className="grid grid-cols-2 gap-1">
                <select
                  className={inputClass}
                  onChange={(event) => setNewTemplateColorId(event.target.value)}
                  value={newTemplateColorId || fallbackColorId}
                >
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.label || color.id}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  onChange={(event) => setNewTemplateDuration(event.target.value)}
                  placeholder={t("settings.durationMin")}
                  value={newTemplateDuration}
                />
              </div>
              <textarea
                className={`min-h-14 ${inputClass}`}
                onChange={(event) => setNewTemplateSubTasks(event.target.value)}
                placeholder={t("settings.subtasksPlaceholder")}
                value={newTemplateSubTasks}
              />
              <textarea
                className={`min-h-10 ${inputClass}`}
                onChange={(event) => setNewTemplateNote(event.target.value)}
                placeholder={t("settings.note")}
                value={newTemplateNote}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!newTemplateTitle.trim()) return;
                    addTemplate({
                      title: newTemplateTitle.trim(),
                      subTasks: parseSubTasks(newTemplateSubTasks),
                      colorId: newTemplateColorId || fallbackColorId,
                      estimatedDurationMin: newTemplateDuration
                        ? Number(newTemplateDuration)
                        : undefined,
                      note: newTemplateNote.trim() || undefined
                    });
                    setNewTemplateTitle("");
                    setNewTemplateSubTasks("");
                    setNewTemplateColorId(fallbackColorId);
                    setNewTemplateDuration("");
                    setNewTemplateNote("");
                  }}
                  type="button"
                >
                  {t("settings.add")}
                </Button>
              </div>
            </div>
          </section>

          {/* Google Integration */}
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.googleSection")}
            </h2>
            <div className="mt-2 grid gap-2">
              <label className="flex items-center gap-2 text-[12px] text-[#cccccc]">
                <input
                  checked={google.enabled}
                  onChange={(e) => updateGoogle({ enabled: e.target.checked })}
                  type="checkbox"
                />
                {t("settings.enableGoogle")}
              </label>

              {google.enabled && (
                <>
                  <div className="rounded-sm bg-[#1e1e1e] px-3 py-2 text-[11px] leading-relaxed text-[#858585]">
                    <p className="mb-1.5 text-[#cccccc]">{googleHelp.title}</p>
                    <ol className="list-inside list-decimal space-y-0.5">
                      {googleHelp.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <input
                    className={inputClass}
                    onChange={(e) => updateGoogle({ clientId: e.target.value })}
                    placeholder={t("settings.oauthClientId")}
                    value={google.clientId}
                  />
                  <input
                    className={inputClass}
                    onChange={(e) => updateGoogle({ clientSecret: e.target.value })}
                    placeholder={t("settings.oauthClientSecret")}
                    type="password"
                    value={google.clientSecret}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => void handleGoogleConnect()} type="button">
                      {t("settings.connect")}
                    </Button>
                    <Button
                      onClick={() => void handleGoogleDisconnect()}
                      type="button"
                      variant="danger"
                    >
                      {t("settings.disconnect")}
                    </Button>
                    {googleStatus && (
                      <span className="text-[11px] text-[#858585]">{googleStatus}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#555555]">
                    {t("settings.googleConnectHint")}
                  </p>

                  <label className="flex items-center gap-2 text-[12px] text-[#cccccc]">
                    <input
                      checked={google.importCalendarEvents}
                      onChange={(e) =>
                        updateGoogle({ importCalendarEvents: e.target.checked })
                      }
                      type="checkbox"
                    />
                    {t("settings.importCal")}
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-[#cccccc]">
                    <input
                      checked={google.importGoogleTasks}
                      onChange={(e) =>
                        updateGoogle({ importGoogleTasks: e.target.checked })
                      }
                      type="checkbox"
                    />
                    {t("settings.importTasks")}
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-[#cccccc]">
                    <input
                      checked={google.exportToCalendarOnFinalize}
                      onChange={(e) =>
                        updateGoogle({ exportToCalendarOnFinalize: e.target.checked })
                      }
                      type="checkbox"
                    />
                    {t("settings.exportOnFinalize")}
                  </label>
                </>
              )}
            </div>
          </section>

          {/* Slack Integration */}
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-[#858585]">
              {t("settings.slackSection")}
            </h2>
            <div className="mt-2 grid gap-2">
              <label className="flex items-center gap-2 text-[12px] text-[#cccccc]">
                <input
                  checked={slack.enabled}
                  onChange={(e) => updateSlack({ enabled: e.target.checked })}
                  type="checkbox"
                />
                {t("settings.enableSlack")}
              </label>

              {slack.enabled && (
                <>
                  <div className="rounded-sm bg-[#1e1e1e] px-3 py-2 text-[11px] leading-relaxed text-[#858585]">
                    <p className="mb-1.5 text-[#cccccc]">{slackHelp.title}</p>
                    <ol className="list-inside list-decimal space-y-0.5">
                      {slackHelp.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    {slackHelp.extraTitle && slackHelp.extraSteps && (
                      <>
                        <p className="mt-1.5 text-[#cccccc]">{slackHelp.extraTitle}</p>
                        <ol className="list-inside list-decimal space-y-0.5">
                          {slackHelp.extraSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </>
                    )}
                  </div>

                  <input
                    className={inputClass}
                    onChange={(e) => updateSlack({ botToken: e.target.value })}
                    placeholder={t("settings.botTokenPlaceholder")}
                    type="password"
                    value={slack.botToken}
                  />
                  <input
                    className={inputClass}
                    onChange={(e) => updateSlack({ defaultChannelId: e.target.value })}
                    placeholder={t("settings.channelIdPlaceholder")}
                    value={slack.defaultChannelId}
                  />
                  <input
                    className={inputClass}
                    onChange={(e) =>
                      updateSlack({ defaultInitialComment: e.target.value })
                    }
                    placeholder={t("settings.initialCommentPlaceholder")}
                    value={slack.defaultInitialComment}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => void handleSlackConnect()} type="button">
                      {t("settings.connect")}
                    </Button>
                    <Button
                      onClick={() => void handleSlackDisconnect()}
                      type="button"
                      variant="danger"
                    >
                      {t("settings.disconnect")}
                    </Button>
                    {slackStatus && (
                      <span className="text-[11px] text-[#858585]">{slackStatus}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#555555]">
                    {t("settings.slackConnectHint")}
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-t border-[#333333] bg-[#cc3333] px-3 py-0.5 text-[11px] text-white">
          {error}
        </div>
      )}
    </div>
  );
}
