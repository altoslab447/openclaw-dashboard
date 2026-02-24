import { Cpu, Globe, Radio } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useData } from "../../contexts/DataContext";

export function SystemSettings() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { config } = useData();

  const gateway = config?.gateway;
  const channels = config?.channels || {};
  const plugins = config?.plugins || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Gateway */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
          <Globe size={16} /> {t("settings.gateway")}
        </h3>
        <div className="space-y-2 text-sm">
          <SettingRow label="連接埠" value={gateway?.port != null ? String(gateway.port) : "-"} />
          <SettingRow label="模式" value={gateway?.mode || "-"} />
          <SettingRow label="綁定" value={gateway?.bind || "-"} />
          <SettingRow label="Tailscale" value={gateway?.tailscale || "off"} />
          {config?.version && <SettingRow label="版本" value={config.version} />}
        </div>
      </div>

      {/* Model Config */}
      <div className="space-y-4 lg:col-span-2">
        <h3 className="text-sm font-medium text-pink-400 flex items-center gap-2">
          <Cpu size={16} /> {t("settings.models")}
        </h3>
        <ModelConfig />
      </div>

      {/* Channels & Plugins */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-amber-200 flex items-center gap-2">
          <Radio size={16} /> {t("settings.channels")}
        </h3>
        <div className="space-y-2 text-sm">
          {Object.entries(channels).map(([name, ch]) => (
            <PluginRow key={name} label={name} active={ch.enabled} />
          ))}
          {Object.entries(plugins).map(([name, pl]) => (
            <PluginRow key={`plugin:${name}`} label={`插件: ${name}`} active={pl.enabled} />
          ))}
          {Object.keys(channels).length === 0 && Object.keys(plugins).length === 0 && (
            <span className={cn(
              "text-xs",
              theme === "dark" ? "text-slate-600" : "text-slate-400"
            )}>-</span>
          )}
        </div>
      </div>

    </div>
  );
}

function ModelConfig() {
  const { theme } = useTheme();
  const { config } = useData();

  const primaryModel = config?.primaryModel;
  const activeModels = config?.activeModels || [];
  const maxConcurrent = config?.maxConcurrent;
  const subagentModel = config?.subagentModel;
  const subagentMax = config?.subagentMaxConcurrent;

  if (!primaryModel && activeModels.length === 0) {
    return (
      <span className={cn(
        "text-sm",
        theme === "dark" ? "text-slate-600" : "text-slate-400"
      )}>-</span>
    );
  }

  return (
    <div className="space-y-2">
      {primaryModel && (
        <div className={cn(
          "flex justify-between items-center text-sm p-2 rounded border",
          theme === "dark"
            ? "bg-slate-800/40 border-slate-700/50"
            : "bg-slate-50 border-slate-200"
        )}>
          <span className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>主模型</span>
          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded truncate max-w-[180px]" title={primaryModel}>
            {primaryModel}
          </span>
        </div>
      )}

      {activeModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeModels.slice(0, 3).map(m => (
            <span key={m} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded truncate max-w-[160px]" title={m}>
              {m}
            </span>
          ))}
        </div>
      )}

      {(maxConcurrent != null || subagentModel) && (
        <div className={cn(
          "flex justify-between items-center text-sm pt-2",
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        )}>
          <span>並發數</span>
          <span>
            主: {maxConcurrent ?? "?"} · 子代理: {subagentMax ?? "?"}{subagentMax === -1 ? " (∞)" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <div className={cn(
      "flex justify-between items-center py-1 border-b last:border-0",
      theme === "dark" ? "border-slate-800/40" : "border-slate-200"
    )}>
      <span className={theme === "dark" ? "text-slate-500" : "text-slate-400"}>{label}</span>
      <span className={cn(
        "font-mono",
        theme === "dark" ? "text-slate-200" : "text-slate-700"
      )}>{value}</span>
    </div>
  );
}

function PluginRow({ label, active }: { label: string; active: boolean }) {
  const { theme } = useTheme();
  return (
    <div className={cn(
      "flex justify-between items-center py-1.5 px-2 rounded transition-colors",
      theme === "dark" ? "hover:bg-slate-800/30" : "hover:bg-slate-100"
    )}>
      <span className={cn(
        "truncate mr-2 text-xs",
        theme === "dark" ? "text-slate-400" : "text-slate-500"
      )} title={label}>{label}</span>
      <div className={cn(
        "size-3 rounded border flex items-center justify-center shrink-0",
        active
          ? "bg-green-500 border-green-400"
          : theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-slate-200 border-slate-300"
      )}>
        {active && <span className="text-[8px] text-black font-bold">✓</span>}
      </div>
    </div>
  );
}
