import { Brain, ChevronRight, Target } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useData } from "../../contexts/DataContext";

export function MemoryPlan() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { memory } = useData();

  const hasPlan = memory?.plan && (memory.plan.goal || memory.plan.sections.length > 0);
  const hasMemory = memory?.entries && memory.entries.length > 0;

  if (!hasPlan && !hasMemory) {
    return (
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex-1 min-h-[200px] rounded-xl border border-dashed flex flex-col items-center justify-center text-sm gap-2",
          theme === "dark"
            ? "border-slate-800 bg-slate-900/20 text-slate-600"
            : "border-slate-300 bg-slate-50 text-slate-400"
        )}>
          <Brain size={20} className="opacity-40" />
          <span>{t("memory.empty")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
      {/* Evolution Plan */}
      {hasPlan && memory?.plan && (
        <div className="flex flex-col gap-3">
          {memory.plan.goal && (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-lg border",
              theme === "dark"
                ? "bg-pink-950/20 border-pink-900/30"
                : "bg-pink-50 border-pink-200"
            )}>
              <Target size={14} className="text-pink-400 mt-0.5 shrink-0" />
              <p className={cn(
                "text-xs leading-relaxed",
                theme === "dark" ? "text-pink-300" : "text-pink-700"
              )}>
                {memory.plan.goal}
              </p>
            </div>
          )}

          {memory.plan.sections.slice(0, 3).map((section, i) => (
            <div key={i} className="space-y-1">
              <h4 className={cn(
                "text-xs font-semibold uppercase tracking-wider flex items-center gap-1",
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              )}>
                <ChevronRight size={12} />
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.slice(0, 4).map((item, j) => (
                  <li key={j} className={cn(
                    "text-xs flex items-start gap-1.5 leading-relaxed",
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  )}>
                    <span className="text-pink-400 mt-0.5">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Memory Entries */}
      {hasMemory && memory?.entries && (
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1",
          !hasPlan && "min-h-[200px]"
        )}>
          {memory.entries.slice(0, 5).map((section, i) => (
            <div key={i} className="space-y-1">
              <h4 className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                theme === "dark" ? "text-slate-500" : "text-slate-400"
              )}>
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.slice(0, 5).map((item, j) => (
                  <li key={j} className={cn(
                    "text-xs flex items-start gap-1.5 leading-relaxed",
                    theme === "dark" ? "text-slate-500" : "text-slate-500"
                  )}>
                    <span className={cn(
                      "mt-0.5",
                      theme === "dark" ? "text-slate-600" : "text-slate-400"
                    )}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
