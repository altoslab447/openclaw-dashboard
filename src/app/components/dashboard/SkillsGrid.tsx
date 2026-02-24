import {
  FileText,
  Github,
  Database,
  Save,
  Share2,
  Minimize2,
  Wrench,
  Package,
  Link,
  Code2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData, type Skill } from "../../contexts/DataContext";

// Map skill names to icons
const SKILL_ICON_MAP: Record<string, React.ElementType> = {
  "apple-notes": FileText,
  "github": Github,
  "notion": Database,
  "openclaw-backup": Save,
  "social-media-agent": Share2,
  "summarize": Minimize2,
};

const SKILL_COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
  "apple-notes":        { color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
  "github":             { color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
  "notion":             { color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
  "openclaw-backup":    { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  "social-media-agent": { color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20" },
  "summarize":          { color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
};

const PALETTE = [
  { color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
  { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  { color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20" },
  { color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20" },
  { color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
];

function getSkillStyle(name: string, index: number) {
  return SKILL_COLOR_MAP[name] || PALETTE[index % PALETTE.length];
}

function getSkillIcon(name: string, type: string): React.ElementType {
  if (SKILL_ICON_MAP[name]) return SKILL_ICON_MAP[name];
  if (type === "symlink") return Link;
  return Package;
}

export function SkillsGrid() {
  const { skills } = useData();

  if (skills.length === 0) {
    return <SkillsEmpty />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill, i) => (
        <SkillCard key={skill.name} skill={skill} index={i} />
      ))}
    </div>
  );
}

function SkillsEmpty() {
  const { theme } = useTheme();
  return (
    <div className={cn(
      "rounded-xl border border-dashed p-8 flex items-center justify-center text-sm",
      theme === "dark"
        ? "border-slate-800 text-slate-600"
        : "border-slate-300 text-slate-400"
    )}>
      <Package size={20} className="mr-2 opacity-40" />
      No skills installed
    </div>
  );
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const style = getSkillStyle(skill.name, index);
  const Icon = getSkillIcon(skill.name, skill.type);

  const description = skill.description
    || skill.meta?.description
    || (skill.target ? `→ ${skill.target}` : "");

  const version = skill.version || skill.meta?.version;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border p-5 transition-all",
      theme === "dark"
        ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    )}>
      {/* Background icon */}
      <div className={cn(
        "absolute top-0 right-0 p-3 transition-opacity",
        style.color,
        theme === "dark"
          ? "opacity-20 group-hover:opacity-30"
          : "opacity-15 group-hover:opacity-25"
      )}>
        <Icon size={80} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2 rounded-lg", style.bg, style.color)}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              theme === "dark" ? "text-slate-200" : "text-slate-700"
            )}>{skill.name}</h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] uppercase tracking-wider",
                theme === "dark" ? "text-slate-500" : "text-slate-400"
              )}>{t("skills.category")}</span>
              {version && (
                <span className={cn(
                  "text-[10px] font-mono",
                  theme === "dark" ? "text-slate-600" : "text-slate-400"
                )}>v{version}</span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className={cn(
            "text-xs leading-relaxed line-clamp-4",
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          )}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
