import { useEffect } from "react";
import { DailyPlanPage } from "@renderer/pages/DailyPlanPage";
import { SettingsPage } from "@renderer/pages/SettingsPage";
import { useT } from "@renderer/lib/i18n";
import { useDailyPlanStore } from "@renderer/state/dailyPlanStore";
import { useSettingsStore } from "@renderer/state/settingsStore";
import { useUIStore } from "@renderer/state/uiStore";

export default function App() {
  const initializeTodayPlan = useDailyPlanStore(
    (state) => state.initializeTodayPlan
  );
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const currentPage = useUIStore((state) => state.currentPage);
  const setMode = useUIStore((state) => state.setMode);
  const t = useT();

  useEffect(() => {
    void (async () => {
      await loadSettings();
      const plan = await initializeTodayPlan();
      const finalized = plan?.isFinalized ?? false;
      setMode(finalized ? "finalized" : "planning");
      await window.appApi.setWindowMode(finalized ? "compact" : "expanded");
    })();
  }, [initializeTodayPlan, loadSettings, setMode]);

  useEffect(() => {
    document.title = t("app.name");
  }, [t]);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      {currentPage === "daily" ? <DailyPlanPage /> : <SettingsPage />}
    </main>
  );
}
