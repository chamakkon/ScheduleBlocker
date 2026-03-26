import { toPng } from "html-to-image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Button } from "@renderer/components/Button";
import { CandidatePane } from "@renderer/components/CandidatePane";
import { ConfirmFinalizeModal } from "@renderer/components/ConfirmFinalizeModal";
import { TemplatePickerModal } from "@renderer/components/TemplatePickerModal";
import { TimelinePane } from "@renderer/components/TimelinePane";
import { formatDisplayDate } from "@renderer/lib/date";
import { useT } from "@renderer/lib/i18n";
import { anonymizeGoogleCalendarBlocks } from "@renderer/lib/privacy";
import { getDurationUnits } from "@renderer/lib/timeline";
import { useDailyPlanStore } from "@renderer/state/dailyPlanStore";
import { useSettingsStore } from "@renderer/state/settingsStore";
import { useUIStore } from "@renderer/state/uiStore";
import {
  clampStartUnit,
  clampUnit,
  PIXELS_PER_UNIT,
  TOTAL_UNITS
} from "@shared/constants/time";
import type {
  ScheduleBlock,
  TaskCandidate
} from "@shared/types";

function runAfterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

type Interaction =
  | {
      type: "candidate";
      candidateId: string;
      offsetY: number;
      previewX: number;
      previewY: number;
      width: number;
      height: number;
    }
  | {
      type: "move-block";
      blockId: string;
      offsetY: number;
      previewStartUnit: number;
    }
  | {
      type: "resize-start";
      blockId: string;
      previewStartUnit: number;
    }
  | {
      type: "resize-end";
      blockId: string;
      previewEndUnit: number;
    };

export function DailyPlanPage() {
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [autoFocusCandidateId, setAutoFocusCandidateId] = useState<
    string | undefined
  >(undefined);
  const [interaction, setInteraction] = useState<Interaction | null>(
    null
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [privacyCapture, setPrivacyCapture] = useState(false);

  const t = useT();
  const locale = useSettingsStore((s) => s.locale);
  const anonymizeGoogleCalendarInExports = useSettingsStore(
    (s) => s.anonymizeGoogleCalendarInExports
  );

  const {
    plan,
    isSaving,
    lastSavedAt,
    error,
    addCandidate,
    addCandidatesFromTemplates,
    updateCandidate,
    removeCandidate,
    duplicateCandidate,
    createBlockFromCandidate,
    moveBlock,
    resizeBlockStart,
    resizeBlockEnd,
    removeBlock,
    addBlock,
    replaceExternalCalendarBlocks,
    savePlan,
    finalizePlan,
    unfinalizePlan,
    setExportedImagePath
  } = useDailyPlanStore();
  const { colors, fixedTemplates, google: googleSettings, slack: slackSettings } =
    useSettingsStore();
  const {
    mode,
    isTemplatePickerOpen,
    isFinalizeConfirmOpen,
    isExporting,
    setMode,
    setTemplatePickerOpen,
    setFinalizeConfirmOpen,
    setIsExporting,
    setCurrentPage
  } = useUIStore();

  const canEdit = mode === "planning";

  const colorMap = useMemo(
    () => new Map(colors.map((color) => [color.id, color])),
    [colors]
  );

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const getTimelineMetrics = () => {
    const scrollElement = timelineScrollRef.current;
    if (!scrollElement) {
      return null;
    }

    return {
      rect: scrollElement.getBoundingClientRect(),
      scrollTop: scrollElement.scrollTop
    };
  };

  const getUnitFromClientY = (clientY: number): number => {
    const metrics = getTimelineMetrics();
    if (!metrics) {
      return 0;
    }

    const contentY =
      clientY - metrics.rect.top + metrics.scrollTop - 24;
    return clampUnit(Math.round(contentY / PIXELS_PER_UNIT), 0, TOTAL_UNITS);
  };

  const getStartUnitFromTopEdge = (topEdgeClientY: number): number => {
    const metrics = getTimelineMetrics();
    if (!metrics) {
      return 0;
    }
    const contentY =
      topEdgeClientY - metrics.rect.top + metrics.scrollTop - 24;
    return clampStartUnit(
      Math.round(contentY / PIXELS_PER_UNIT),
      1
    );
  };

  const isInsideTimeline = (clientX: number, clientY: number): boolean => {
    const metrics = getTimelineMetrics();
    if (!metrics) {
      return false;
    }

    return (
      clientX >= metrics.rect.left &&
      clientX <= metrics.rect.right &&
      clientY >= metrics.rect.top &&
      clientY <= metrics.rect.bottom
    );
  };

  useEffect(() => {
    if (interaction) {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    } else {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [interaction]);

  useEffect(() => {
    if (!interaction || !plan) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (interaction.type === "candidate") {
        setInteraction({
          ...interaction,
          previewX: event.clientX,
          previewY: event.clientY
        });
        return;
      }

      if (interaction.type === "move-block") {
        setInteraction({
          ...interaction,
          previewStartUnit: getStartUnitFromTopEdge(
            event.clientY - interaction.offsetY
          )
        });
        return;
      }

      if (interaction.type === "resize-start") {
        const block = plan.blocks.find(
          (item) => item.id === interaction.blockId
        );
        if (!block) {
          return;
        }
        setInteraction({
          ...interaction,
          previewStartUnit: clampUnit(
            getUnitFromClientY(event.clientY),
            0,
            block.startUnit + block.durationUnit - 1
          )
        });
        return;
      }

      const block = plan.blocks.find(
        (item) => item.id === interaction.blockId
      );
      if (!block) {
        return;
      }
      setInteraction({
        ...interaction,
        previewEndUnit: clampUnit(
          getUnitFromClientY(event.clientY),
          block.startUnit + 1,
          TOTAL_UNITS
        )
      });
    };

    const handlePointerUp = async (event: PointerEvent) => {
      if (interaction.type === "candidate") {
        if (isInsideTimeline(event.clientX, event.clientY)) {
          createBlockFromCandidate(
            interaction.candidateId,
            getStartUnitFromTopEdge(
              event.clientY - interaction.offsetY
            )
          );
        }
      } else if (interaction.type === "move-block") {
        moveBlock(interaction.blockId, interaction.previewStartUnit);
      } else if (interaction.type === "resize-start") {
        resizeBlockStart(
          interaction.blockId,
          interaction.previewStartUnit
        );
      } else {
        resizeBlockEnd(interaction.blockId, interaction.previewEndUnit);
      }

      setInteraction(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    createBlockFromCandidate,
    interaction,
    moveBlock,
    plan,
    resizeBlockEnd,
    resizeBlockStart
  ]);

  const previewBlock = useMemo(() => {
    if (!plan || !interaction) {
      return null;
    }

    if (interaction.type === "candidate") {
      const candidate = plan.candidates.find(
        (item) => item.id === interaction.candidateId
      );
      if (
        !candidate ||
        !isInsideTimeline(interaction.previewX, interaction.previewY)
      ) {
        return null;
      }

      return {
        id: "preview-candidate",
        taskCandidateId: candidate.id,
        title: candidate.title,
        subTasks: candidate.subTasks,
        colorId: candidate.colorId,
        startUnit: getStartUnitFromTopEdge(
          interaction.previewY - interaction.offsetY
        ),
        durationUnit: getDurationUnits(
          candidate.estimatedDurationMin
        ),
        note: candidate.note
      } satisfies ScheduleBlock;
    }

    const block = plan.blocks.find((item) => item.id === interaction.blockId);
    if (!block) {
      return null;
    }

    if (interaction.type === "move-block") {
      return {
        ...block,
        startUnit: interaction.previewStartUnit
      };
    }

    if (interaction.type === "resize-start") {
      const endUnit = block.startUnit + block.durationUnit;
      return {
        ...block,
        startUnit: interaction.previewStartUnit,
        durationUnit: endUnit - interaction.previewStartUnit
      };
    }

    return {
      ...block,
      durationUnit: interaction.previewEndUnit - block.startUnit
    };
  }, [interaction, plan]);

  const anonymousTitle = t("privacy.anonymousEventTitle");
  const blocksForTimeline = useMemo(() => {
    if (!plan) {
      return [];
    }
    if (!anonymizeGoogleCalendarInExports || !privacyCapture) {
      return plan.blocks;
    }
    return anonymizeGoogleCalendarBlocks(plan.blocks, anonymousTitle);
  }, [
    plan,
    anonymizeGoogleCalendarInExports,
    privacyCapture,
    anonymousTitle
  ]);

  if (!plan) {
    return (
      <div className="flex h-full items-center justify-center text-[#858585]">
        {t("common.loading")}
      </div>
    );
  }

  // --- Integration handlers ---

  const findClosestAppColor = (hex: string): string => {
    if (!colors.length) return "blue";
    const toRgb = (h: string): [number, number, number] => {
      const c = h.replace("#", "");
      return [
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16)
      ];
    };
    const target = toRgb(hex);
    let bestId = colors[0].id;
    let bestDist = Infinity;
    for (const c of colors) {
      const rgb = toRgb(c.hex);
      const dist =
        (target[0] - rgb[0]) ** 2 +
        (target[1] - rgb[1]) ** 2 +
        (target[2] - rgb[2]) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestId = c.id;
      }
    }
    return bestId;
  };

  const handleImportCalendar = async () => {
    try {
      showStatus(t("status.importingCal"));
      const dtos = await window.appApi.integrations.google.importCalendarForDate(plan.date);

      const newBlocks = dtos.map((dto) => ({
        id: crypto.randomUUID(),
        title: dto.title,
        subTasks: [] as string[],
        colorId: dto.gcalColorHex ? findClosestAppColor(dto.gcalColorHex) : (colors[0]?.id ?? "blue"),
        startUnit: dto.startUnit,
        durationUnit: dto.durationUnit,
        note: dto.note,
        source: "google_calendar" as const,
        externalRef: {
          provider: "google_calendar" as const,
          calendarId: dto.calendarId,
          eventId: dto.eventId
        },
        locked: true
      }));

      replaceExternalCalendarBlocks(newBlocks);
      showStatus(t("status.syncedCal", { n: dtos.length }));
    } catch (err) {
      showStatus(
        `${t("status.calImportFail")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleImportTasks = async () => {
    try {
      showStatus(t("status.importingTasks"));
      const dtos = await window.appApi.integrations.google.importTasks();
      const existingExtIds = new Set(
        plan.candidates
          .filter((c) => c.source === "google_tasks")
          .map((c) => c.externalRef?.taskId)
      );

      let added = 0;
      for (const dto of dtos) {
        if (existingExtIds.has(dto.taskId)) continue;
        addCandidate({
          title: dto.title,
          subTasks: [],
          colorId: colors[0]?.id ?? "blue",
          note: dto.note,
          source: "google_tasks",
          externalRef: {
            provider: "google_tasks",
            taskListId: dto.taskListId,
            taskId: dto.taskId
          }
        });
        added++;
      }
      showStatus(t("status.importedTasks", { n: added }));
    } catch (err) {
      showStatus(
        `${t("status.tasksImportFail")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleExportToCalendar = async () => {
    try {
      showStatus(t("status.exportingCal"));
      const localBlocks = plan.blocks.filter(
        (b) => !b.source || b.source === "local"
      );
      const colorMap: Record<string, string> = {};
      for (const c of colors) {
        colorMap[c.id] = c.hex;
      }
      const result = await window.appApi.integrations.google.exportPlanToCalendar({
        date: plan.date,
        blocks: localBlocks,
        colorMap
      });
      showStatus(
        t("status.calExportOk", {
          created: result.created,
          deleted: result.deleted
        })
      );
    } catch (err) {
      showStatus(
        `${t("status.calExportFail")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleSlackShare = async () => {
    if (!exportRef.current) return;
    try {
      showStatus(t("status.sharingSlack"));
      if (anonymizeGoogleCalendarInExports) {
        setPrivacyCapture(true);
        await runAfterPaint();
      }
      try {
        const dataUrl = await toPng(exportRef.current, {
          cacheBust: true,
          pixelRatio: 2
        });
        const result = await window.appApi.integrations.slack.shareTimelineImage({
          dataUrl,
          date: plan.date,
          channelId: slackSettings.defaultChannelId || undefined,
          initialComment: slackSettings.defaultInitialComment || undefined
        });
        showStatus(
          result.ok
            ? t("status.slackOk")
            : `${t("status.slackErr")} ${result.error ?? ""}`
        );
      } finally {
        if (anonymizeGoogleCalendarInExports) {
          setPrivacyCapture(false);
        }
      }
    } catch (err) {
      setPrivacyCapture(false);
      showStatus(
        `${t("status.slackFail")} ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  };

  const handleFinalize = async () => {
    finalizePlan();
    setMode("finalized");
    await window.appApi.setWindowMode("compact");

    await window.appApi.saveTodayPlan({
      ...plan,
      isFinalized: true
    });

    if (googleSettings.enabled && googleSettings.exportToCalendarOnFinalize) {
      await handleExportToCalendar();
    }
  };

  const handleEditMode = async () => {
    unfinalizePlan();
    setMode("planning");
    await window.appApi.saveTodayPlan({
      ...plan,
      isFinalized: false
    });
    await window.appApi.setWindowMode("expanded");
  };

  const handleExport = async () => {
    if (!exportRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      if (anonymizeGoogleCalendarInExports) {
        setPrivacyCapture(true);
        await runAfterPaint();
      }
      try {
        const dataUrl = await toPng(exportRef.current, {
          cacheBust: true,
          pixelRatio: 2
        });
        const { savedPath } = await window.appApi.exportTimelinePng({
          dataUrl,
          date: plan.date
        });

        if (savedPath) {
          setExportedImagePath(savedPath);
          await window.appApi.saveTodayPlan({
            ...plan,
            exportedImagePath: savedPath
          });
        }
      } finally {
        if (anonymizeGoogleCalendarInExports) {
          setPrivacyCapture(false);
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewTask = useCallback(() => {
    const candidateId = addCandidate({
      title: "",
      subTasks: [],
      colorId: colors[0]?.id ?? "blue",
      estimatedDurationMin: undefined,
      note: undefined
    });

    if (candidateId) {
      setAutoFocusCandidateId(candidateId);
    }
  }, [addCandidate, colors]);

  useEffect(() => {
    if (!canEdit) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "t") {
        return;
      }
      event.preventDefault();
      handleNewTask();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, handleNewTask]);

  const googleEnabled = googleSettings.enabled;
  const slackEnabled = slackSettings.enabled;

  return (
    <div className="flex h-full flex-col">
      {/* Title bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#333333] bg-[#252526] px-3 py-1">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#cccccc]">
            {formatDisplayDate(plan.date, locale)}
          </span>
          {lastSavedAt && (
            <span className="text-[11px] text-[#858585]">
              {t("daily.saved", {
                time: new Date(lastSavedAt).toLocaleTimeString(
                  locale === "en" ? "en-US" : "ja-JP"
                )
              })}
            </span>
          )}
          {statusMsg && (
            <span className="text-[11px] text-[#4ec9b0]">
              {statusMsg}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {googleEnabled && canEdit && (
            <>
              <Button
                onClick={() => void handleImportCalendar()}
                type="button"
                variant="ghost"
              >
                GCal
              </Button>
              <Button
                onClick={() => void handleImportTasks()}
                type="button"
                variant="ghost"
              >
                GTasks
              </Button>
            </>
          )}
          {googleEnabled && !canEdit && (
            <Button
              onClick={() => void handleExportToCalendar()}
              type="button"
              variant="ghost"
            >
              → GCal
            </Button>
          )}
          {slackEnabled && (
            <Button
              onClick={() => void handleSlackShare()}
              type="button"
              variant="ghost"
            >
              Slack
            </Button>
          )}
          <span className="mx-0.5 h-4 w-px bg-[#333333]" />
          <Button
            onClick={() => void savePlan()}
            type="button"
            variant="secondary"
          >
            {isSaving ? t("daily.saving") : t("daily.save")}
          </Button>
          <Button
            disabled={isExporting}
            onClick={() => void handleExport()}
            type="button"
            variant="secondary"
          >
            {isExporting ? t("daily.exporting") : t("daily.png")}
          </Button>
          {canEdit ? (
            <Button
              onClick={() => setFinalizeConfirmOpen(true)}
              type="button"
            >
              {t("daily.finalize")}
            </Button>
          ) : (
            <Button
              onClick={() => void handleEditMode()}
              type="button"
              variant="secondary"
            >
              {t("daily.edit")}
            </Button>
          )}
          <span className="mx-0.5 h-4 w-px bg-[#333333]" />
          <Button
            onClick={() => setCurrentPage("settings")}
            type="button"
            variant="ghost"
          >
            {t("daily.settings")}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
        {canEdit ? (
          <CandidatePane
            autoFocusCandidateId={autoFocusCandidateId}
            candidates={plan.candidates}
            canEdit={canEdit}
            colors={colors}
            onCandidatePointerDown={(event, candidate) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setInteraction({
                type: "candidate",
                candidateId: candidate.id,
                offsetY: event.clientY - rect.top,
                previewX: event.clientX,
                previewY: event.clientY,
                width: rect.width,
                height: rect.height
              });
            }}
            onDeleteCandidate={removeCandidate}
            onDuplicateCandidate={duplicateCandidate}
            onFromTemplate={() => setTemplatePickerOpen(true)}
            onNewTask={handleNewTask}
            onUpdateCandidate={(candidate) => {
              updateCandidate(candidate);
              if (candidate.id === autoFocusCandidateId && candidate.title) {
                setAutoFocusCandidateId(undefined);
              }
            }}
          />
        ) : (
          <div className="hidden" />
        )}

        <TimelinePane
          activeBlockId={
            interaction?.type === "candidate"
              ? undefined
              : interaction?.blockId
          }
          blocks={blocksForTimeline}
          canEdit={canEdit}
          fillHeight={!canEdit}
          colors={colors}
          exportRef={exportRef}
          onBlockPointerDown={(event, block) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setInteraction({
              type: "move-block",
              blockId: block.id,
              offsetY: event.clientY - rect.top,
              previewStartUnit: block.startUnit
            });
          }}
          onResizeEnd={(_event, block) => {
            setInteraction({
              type: "resize-end",
              blockId: block.id,
              previewEndUnit: block.startUnit + block.durationUnit
            });
          }}
          onResizeStart={(_event, block) => {
            setInteraction({
              type: "resize-start",
              blockId: block.id,
              previewStartUnit: block.startUnit
            });
          }}
          onDeleteBlock={removeBlock}
          previewBlock={previewBlock}
          scrollRef={timelineScrollRef}
          title={formatDisplayDate(plan.date, locale)}
        />
      </div>

      {/* Status bar */}
      {error && (
        <div className="shrink-0 border-t border-[#333333] bg-[#cc3333] px-3 py-0.5 text-[11px] text-white">
          {error}
        </div>
      )}

      {/* Drag ghost */}
      {interaction?.type === "candidate" && (
        <div
          className="pointer-events-none fixed z-40 border border-[#454545] bg-[#2d2d2d]/95 px-3 py-2"
          style={{
            left: interaction.previewX - 40,
            top: interaction.previewY - interaction.offsetY,
            width: interaction.width,
            minHeight: interaction.height
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  colorMap.get(
                    plan.candidates.find(
                      (candidate) =>
                        candidate.id === interaction.candidateId
                    )?.colorId ?? ""
                  )?.hex ?? "#94a3b8"
              }}
            />
            <p className="text-[12px] text-[#cccccc]">
              {plan.candidates.find(
                (candidate) => candidate.id === interaction.candidateId
              )?.title ?? ""}
            </p>
          </div>
        </div>
      )}

      <TemplatePickerModal
        colors={colors}
        onAdd={(templateIds) => {
          const templates = fixedTemplates.filter((template) =>
            templateIds.includes(template.id)
          );
          addCandidatesFromTemplates(templates);
        }}
        onClose={() => setTemplatePickerOpen(false)}
        open={isTemplatePickerOpen}
        templates={fixedTemplates}
      />

      <ConfirmFinalizeModal
        onClose={() => setFinalizeConfirmOpen(false)}
        onConfirm={() => void handleFinalize()}
        open={isFinalizeConfirmOpen}
      />
    </div>
  );
}
