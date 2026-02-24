import { motion } from "motion/react";
import { Header } from "./Header";
import { AgentCard } from "./AgentCard";

import { SkillsGrid } from "./SkillsGrid";
import { ScheduledTasks } from "./ScheduledTasks";
import { LogViewer } from "./LogViewer";
import { SystemSettings } from "./SystemSettings";
import { MemoryPlan } from "./MemoryPlan";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";
import { cn } from "../../lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  const { theme } = useTheme();
  return (
    <h2 className={cn(
      "text-lg font-bold flex items-center gap-2",
      theme === "dark" ? "text-white" : "text-slate-800"
    )}>
      <span className={cn("w-1 h-5 rounded-full", color)} />
      {children}
    </h2>
  );
}

function CountBadge({ count }: { count: number }) {
  const { theme } = useTheme();
  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded-full ml-2",
      theme === "dark" ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500"
    )}>
      {count}
    </span>
  );
}

export function DashboardLayout() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { skills, cron, loading } = useData();

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center font-sans",
        theme === "dark" ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-500"
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <p className="text-sm">{t("status.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans",
      theme === "dark"
        ? "bg-slate-950 text-slate-200 selection:bg-red-500/30"
        : "bg-slate-50 text-slate-700 selection:bg-red-500/20"
    )}>
      <Header />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6"
      >
        {/* Row 1: Agent Identity */}
        <motion.section variants={itemVariants}>
          <AgentCard />
        </motion.section>



        {/* Row 3: Skills & Scheduled Tasks */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle color="bg-purple-500">
                {t("skills.title")}
                <CountBadge count={skills.length} />
              </SectionTitle>
            </div>
            <SkillsGrid />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle color="bg-pink-500">
                {t("scheduled.title")}
                <CountBadge count={cron.length} />
              </SectionTitle>
            </div>
            <ScheduledTasks />
          </div>
        </motion.section>

        {/* Row 4: Logs */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle color="bg-orange-500">
              {t("logs.title")}
            </SectionTitle>
          </div>
          <div className="h-64 md:h-80">
            <LogViewer />
          </div>
        </motion.section>

        {/* Row 5: System & Memory */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className={cn(
            "p-4 md:p-6 rounded-2xl border space-y-4",
            theme === "dark"
              ? "bg-slate-900/40 border-slate-800/60"
              : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-4 border-b pb-4",
              theme === "dark" ? "border-slate-800/60" : "border-slate-200"
            )}>
              <span className="w-1 h-5 bg-slate-500 rounded-full" />
              <h2 className={cn(
                "text-lg font-bold",
                theme === "dark" ? "text-white" : "text-slate-800"
              )}>{t("settings.title")}</h2>
            </div>
            <SystemSettings />
          </div>

          <div className={cn(
            "p-4 md:p-6 rounded-2xl border flex flex-col",
            theme === "dark"
              ? "bg-slate-900/40 border-slate-800/60"
              : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-4 border-b pb-4 shrink-0",
              theme === "dark" ? "border-slate-800/60" : "border-slate-200"
            )}>
              <span className="w-1 h-5 bg-pink-500 rounded-full" />
              <h2 className={cn(
                "text-lg font-bold",
                theme === "dark" ? "text-white" : "text-slate-800"
              )}>{t("memory.title")}</h2>
            </div>
            <MemoryPlan />
          </div>
        </motion.section>

        <footer className={cn(
          "text-center text-xs py-8 flex flex-col gap-2",
          theme === "dark" ? "text-slate-600" : "text-slate-400"
        )}>
          <p>{t("footer.version")}</p>
          <p className="opacity-50 font-mono tracking-widest text-[10px]">{t("footer.credits")}</p>
          <p className="font-mono text-[10px] opacity-40">
            {t("footer.buildTime") || "Built"}: {__BUILD_TIME__}
          </p>
        </footer>
      </motion.main>
    </div>
  );
}
