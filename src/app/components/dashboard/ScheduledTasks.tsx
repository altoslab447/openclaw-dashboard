import { CalendarClock, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData, type CronJob } from "../../contexts/DataContext";
import { format, parseISO } from "date-fns";

export function ScheduledTasks() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { cron } = useData();

  if (cron.length === 0) {
    return (
      <div className={cn(
        "rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-sm gap-2",
        theme === "dark"
          ? "border-slate-800 text-slate-600"
          : "border-slate-300 text-slate-400"
      )}>
        <CalendarClock size={20} className="opacity-40" />
        <span>{t("scheduled.empty")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cron.map((job) => (
        <TaskItem key={job.id} job={job} />
      ))}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MM/dd HH:mm");
  } catch {
    return iso;
  }
}

function TaskItem({ job }: { job: CronJob }) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const status = job.state.lastStatus;
  const isError = status === "error" || status === "failed" || (job.state.consecutiveErrors > 0);
  const isSuccess = status === "success" || status === "completed";
  const isPending = !isError && !isSuccess;

  const StatusIcon = isError ? XCircle : isSuccess ? CheckCircle2 : Clock;
  const statusColor = isError ? "text-red-500" : isSuccess ? "text-emerald-500" : "text-yellow-500";
  const statusBg = isError ? "bg-red-500/10" : isSuccess ? "bg-emerald-500/10" : "bg-yellow-500/10";
  const statusLabel = isError ? "錯誤" : isSuccess ? "正常" : "待執行";
  const statusLabelColor = isError ? "text-red-400 border-red-900/50 bg-red-950/30" : isSuccess
    ? "text-emerald-400 border-emerald-900/50 bg-emerald-950/30"
    : theme === "dark" ? "text-slate-400 border-slate-700 bg-slate-800" : "text-slate-500 border-slate-300 bg-slate-100";

  return (
    <div className={cn(
      "group flex items-center justify-between p-4 rounded-xl border transition-colors",
      theme === "dark"
        ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800/40"
        : "border-slate-200 bg-white hover:bg-slate-50"
    )}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn(
          "size-10 rounded-lg flex items-center justify-center shrink-0",
          statusBg, statusColor
        )}>
          <StatusIcon size={18} />
        </div>
        <div className="min-w-0">
          <h3 className={cn(
            "font-medium truncate",
            theme === "dark" ? "text-slate-200" : "text-slate-700"
          )}>{job.name}</h3>
          <p className={cn(
            "text-xs font-mono mt-0.5 truncate",
            theme === "dark" ? "text-slate-500" : "text-slate-400"
          )}>
            {job.schedule}
            {job.sessionTarget && ` · ${job.sessionTarget}`}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <span className={cn(
          "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
          statusLabelColor
        )}>
          {statusLabel}
        </span>
        <div className={cn(
          "text-[10px] mt-1 space-y-0.5",
          theme === "dark" ? "text-slate-500" : "text-slate-400"
        )}>
          <div>{t("scheduled.lastRun")}: {formatDate(job.state.lastRunAt)}</div>
          <div>{t("scheduled.nextRun")}: {formatDate(job.state.nextRunAt)}</div>
        </div>
        {isError && job.state.lastError && (
          <div className="text-[10px] text-red-400 mt-1 max-w-[120px] truncate" title={job.state.lastError}>
            {job.state.lastError}
          </div>
        )}
      </div>
    </div>
  );
}
