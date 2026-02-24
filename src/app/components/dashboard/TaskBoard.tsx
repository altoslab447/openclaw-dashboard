import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData, type Task } from "../../contexts/DataContext";

export function TaskBoard() {
  const { t } = useLanguage();
  const { kanban } = useData();

  const active = kanban?.active || [];
  const backlog = kanban?.backlog || [];
  const completed = kanban?.completed || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <Column title={t("taskboard.inProgress")} tasks={active} color="red" />
      <Column title={t("taskboard.planned")} tasks={backlog} color="yellow" />
      <Column title={t("taskboard.completed")} tasks={completed} color="green" />
    </div>
  );
}

function Column({
  title, tasks, color
}: {
  title: string;
  tasks: Task[];
  color: "red" | "yellow" | "green";
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const dotColors = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-emerald-500",
  };

  const taskColors = {
    red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    green: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  };

  return (
    <div className={cn(
      "flex flex-col rounded-xl border overflow-hidden",
      theme === "dark"
        ? "bg-slate-900/40 border-slate-800/60"
        : "bg-white border-slate-200"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        theme === "dark"
          ? "border-slate-800/60 bg-slate-900/60"
          : "border-slate-200 bg-slate-50/80"
      )}>
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full animate-pulse", dotColors[color])} />
          <h3 className={cn(
            "font-medium",
            theme === "dark" ? "text-slate-200" : "text-slate-700"
          )}>{title}</h3>
        </div>
        <span className={cn(
          "text-xs font-mono px-2 py-0.5 rounded-full",
          theme === "dark" ? "text-slate-500 bg-slate-800" : "text-slate-500 bg-slate-200"
        )}>
          {tasks.length}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col min-h-[200px]">
        {tasks.length === 0 ? (
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center",
            theme === "dark" ? "text-slate-600" : "text-slate-400"
          )}>
            <div className={cn(
              "p-4 rounded-full mb-3",
              theme === "dark" ? "bg-slate-800/30" : "bg-slate-100"
            )}>
              <Inbox size={24} className="opacity-50" />
            </div>
            <span className="text-sm">{t("taskboard.empty")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border text-sm leading-relaxed transition-colors",
                  theme === "dark"
                    ? "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300",
                  task.done && "opacity-60 line-through"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "mt-0.5 size-2 rounded-full shrink-0",
                    dotColors[color]
                  )} />
                  <span>{task.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
