import { useRef, useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useData, type LogEntry } from "../../contexts/DataContext";
import { format, parseISO } from "date-fns";

// Tag color mapping
function getTagColor(tag: string | null): string {
  if (!tag) return "text-slate-400";
  const t = tag.toLowerCase();
  if (t.includes("agent")) return "text-purple-400";
  if (t.includes("ws") || t.includes("websocket")) return "text-green-400";
  if (t.includes("browser") || t.includes("chrome")) return "text-orange-400";
  if (t.includes("error") || t.includes("err")) return "text-red-400";
  if (t.includes("warn")) return "text-yellow-400";
  if (t.includes("cron") || t.includes("sched")) return "text-pink-400";
  if (t.includes("system")) return "text-blue-400";
  return "text-slate-400";
}

function formatLogTime(timestamp: string | null): string {
  if (!timestamp) return "--:--:--";
  try {
    return format(parseISO(timestamp), "HH:mm:ss");
  } catch {
    // Already short format like 17:04:58
    return timestamp.length > 8 ? timestamp.slice(11, 19) : timestamp;
  }
}

export function LogViewer() {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { logs } = useData();

  const [autoScroll, setAutoScroll] = useState(true);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);

  // Sync logs from context
  useEffect(() => {
    setDisplayedLogs(logs);
  }, [logs]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedLogs, autoScroll]);

  const clearLogs = () => setDisplayedLogs([]);

  return (
    <div className={cn(
      "rounded-xl border font-mono text-xs p-4 h-full overflow-hidden flex flex-col",
      theme === "dark"
        ? "bg-black/40 border-slate-800/60"
        : "bg-slate-100/80 border-slate-200"
    )}>
      {/* Controls */}
      <div className={cn(
        "flex items-center justify-between mb-2 pb-2 border-b shrink-0",
        theme === "dark" ? "border-slate-800/60" : "border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-sans font-medium",
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          )}>
            {t("logs.title")}
          </span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
            theme === "dark" ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400"
          )}>
            {displayedLogs.length}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-red-500"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
            />
            <span className={theme === "dark" ? "text-slate-500" : "text-slate-400"}>
              {t("logs.autoScroll")}
            </span>
          </label>
          <button
            onClick={clearLogs}
            className={cn(
              "transition-colors px-2 py-0.5 rounded",
              theme === "dark"
                ? "text-slate-500 hover:text-white hover:bg-slate-800"
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-200"
            )}
          >
            {t("logs.clear")}
          </button>
        </div>
      </div>

      {/* Log Lines */}
      <div ref={scrollRef} className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-0.5">
        {displayedLogs.length === 0 ? (
          <div className={cn(
            "flex items-center justify-center h-full text-sm",
            theme === "dark" ? "text-slate-700" : "text-slate-400"
          )}>
            Waiting for logs...
          </div>
        ) : (
          displayedLogs.map((log, i) => {
            const tagColor = getTagColor(log.tag);
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-2 p-0.5 rounded transition-colors",
                  theme === "dark" ? "hover:bg-slate-800/30" : "hover:bg-slate-200"
                )}
              >
                <span className={cn(
                  "shrink-0 select-none tabular-nums w-16",
                  theme === "dark" ? "text-slate-600" : "text-slate-400"
                )}>
                  {formatLogTime(log.timestamp)}
                </span>

                {log.tag && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded shrink-0 font-bold text-[10px]",
                    tagColor,
                    tagColor.replace("text-", "bg-") + "/10"
                  )}>
                    {log.tag}
                  </span>
                )}

                <span className={cn(
                  "break-all leading-relaxed",
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                )}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
