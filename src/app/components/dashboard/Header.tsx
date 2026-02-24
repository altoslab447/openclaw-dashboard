import { Zap, RotateCw, Languages, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { useLanguage, type Language } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useData } from "../../contexts/DataContext";

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh-CN", name: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
];

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { connected, refetch, loading } = useData();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLanguage = LANGUAGES.find(lang => lang.code === language);

  return (
    <header className={cn(
      "flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 border-b backdrop-blur-xl sticky top-0 z-50 gap-4 md:gap-0",
      theme === "dark"
        ? "border-slate-800/60 bg-slate-950/50"
        : "border-slate-200 bg-white/90"
    )}>
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
          <Zap className="size-5 text-red-400 fill-red-400" />
          {t("header.title")}
        </h1>
        <span className={cn(
          "text-xs tracking-wider mt-0.5 hidden sm:block",
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        )}>
          {t("header.subtitle")}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Connection Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full border",
          connected
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-red-500/10 border-red-500/20"
        )}>
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              connected ? "bg-emerald-500" : "bg-red-500"
            )} />
          </span>
          <span className={cn(
            "text-xs font-medium",
            connected ? "text-emerald-400" : "text-red-400"
          )}>
            {connected ? t("header.online") : t("header.offline")}
          </span>
        </div>

        <div className={cn(
          "text-sm font-mono hidden sm:block",
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        )}>
          {format(currentTime, "yyyy/MM/dd HH:mm:ss")}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2 rounded-full transition-colors",
            theme === "dark"
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          )}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-full transition-colors",
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            )}
          >
            <Languages size={18} />
            <span className="text-xs hidden lg:inline">{currentLanguage?.flag}</span>
          </button>

          {showLanguageMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
              <div className={cn(
                "absolute right-0 mt-2 w-48 border rounded-lg shadow-xl overflow-hidden z-50",
                theme === "dark"
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-slate-300/50"
              )}>
                <div className="py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                        language === lang.code
                          ? "bg-red-500/20 text-red-400 border-l-2 border-red-500"
                          : theme === "dark"
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={refetch}
          disabled={loading}
          className={cn(
            "p-2 rounded-full transition-colors",
            theme === "dark"
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900",
            loading && "animate-spin"
          )}
          title="Refresh data"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </header>
  );
}
