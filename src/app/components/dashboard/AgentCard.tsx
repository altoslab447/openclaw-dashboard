import { Wallet, Cpu, Server, BrainCircuit } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";

export function AgentCard() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { agent, skills, config } = useData();

  const identity = agent?.identity;
  const session = agent?.session;

  const name = identity?.name || session?.agentIdentity || t("agent.name");
  const vibe = identity?.vibe || t("agent.description");
  const emoji = identity?.emoji || "🦞";
  const acpStatus = session?.acpStatus || "-";
  const wallet = session?.walletAddress
    ? session.walletAddress.slice(0, 6) + "…" + session.walletAddress.slice(-4)
    : "-";
  const serviceItem = session?.serviceItem || "-";
  const coreSkillsCount = skills.length > 0 ? String(skills.length) : "-";

  const isOnline = !!session?.runtime;

  // Build trait tags from coreTruths or fallback
  const traits: Array<{ label: string; accent?: boolean }> = identity?.coreTruths?.slice(0, 4).map((t, i) => ({
    label: `${t.key}: ${t.value.slice(0, 50)}${t.value.length > 50 ? "…" : ""}`,
    accent: i % 2 === 1,
  })) || [];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm",
      theme === "dark"
        ? "border-slate-800 bg-slate-900/60"
        : "border-slate-200 bg-white/90"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000" />
              <div className={cn(
                "relative size-16 rounded-full overflow-hidden border-2 flex items-center justify-center text-3xl",
                theme === "dark" ? "border-slate-900 bg-slate-800" : "border-white bg-slate-50"
              )}>
                {emoji}
              </div>
            </div>

            <div>
              <h2 className={cn(
                "text-xl font-bold flex flex-wrap items-center gap-2",
                theme === "dark" ? "text-white" : "text-slate-800"
              )}>
                {name}
                <span className={cn(
                  "px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wide shrink-0 border",
                  isOnline
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : theme === "dark"
                    ? "bg-red-950/50 text-red-400 border-red-900/50"
                    : "bg-red-50 text-red-600 border-red-200"
                )}>
                  {isOnline ? t("header.online") : t("agent.status.offline")}
                </span>
              </h2>
              <p className={cn(
                "text-sm mt-1 flex flex-wrap items-center gap-1.5 leading-relaxed",
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              )}>
                {vibe}
              </p>
              {session?.role && (
                <p className={cn(
                  "text-xs mt-1 font-mono",
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                )}>
                  {session.role}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatBox icon={Wallet} label={t("agent.wallet")} value={wallet} />
          <StatBox icon={Cpu} label={t("agent.acp")} value={acpStatus} />
          <StatBox icon={Server} label={t("agent.services")} value={serviceItem} />
          <StatBox icon={BrainCircuit} label={t("agent.skills")} value={coreSkillsCount} />
        </div>

        {traits.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-2 pt-2 border-t",
            theme === "dark" ? "border-slate-800/50" : "border-slate-200"
          )}>
            {traits.map((trait, i) => (
              <Tag
                key={i}
                label={trait.label}
                color={trait.accent
                  ? theme === "dark" ? "text-red-400" : "text-red-600"
                  : theme === "dark" ? "text-slate-400" : "text-slate-500"}
                bg={trait.accent
                  ? theme === "dark" ? "bg-red-950/30" : "bg-red-50"
                  : theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}
                border={trait.accent
                  ? theme === "dark" ? "border-red-900/30" : "border-red-200"
                  : theme === "dark" ? "border-transparent" : "border-slate-200"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  const { theme } = useTheme();

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-colors group",
      theme === "dark"
        ? "bg-slate-950/50 border-slate-800/50 hover:border-slate-700"
        : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
    )}>
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        theme === "dark"
          ? "bg-slate-900 text-slate-400 group-hover:text-red-400 group-hover:bg-red-950/20"
          : "bg-white text-slate-500 group-hover:text-red-500 group-hover:bg-red-50"
      )}>
        <Icon size={16} />
      </div>
      <div>
        <div className={cn(
          "text-xs font-medium uppercase tracking-wider",
          theme === "dark" ? "text-slate-500" : "text-slate-400"
        )}>{label}</div>
        <div className={cn(
          "text-sm font-mono truncate max-w-[100px]",
          theme === "dark" ? "text-slate-300" : "text-slate-600"
        )} title={value}>{value}</div>
      </div>
    </div>
  );
}

function Tag({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs border transition-all max-w-xs truncate",
      color, bg, border || "border-transparent"
    )} title={label}>
      {label}
    </span>
  );
}
