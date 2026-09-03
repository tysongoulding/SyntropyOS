import { useState, useEffect } from "react";
import { useWeather } from "../../hooks/useWeather";
import { useUserStore } from "../../store/userStore";
import { PromptInput } from "../editor/PromptInput";
import { MorningReportWidget } from "./MorningReportWidget";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  MapPin,
  Droplets,
  Sparkles,
  Layers,
  Presentation,
  Shield,
} from "lucide-react";

interface HomeHeroViewProps {
  fullname?: string;
  onSelectPrompt?: (prompt: string) => void;
}

export function HomeHeroView({ fullname, onSelectPrompt }: HomeHeroViewProps) {
  const { getActiveUser } = useUserStore();
  const activeUser = getActiveUser();
  const displayName = fullname || activeUser.name || "Developer";

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("rho-lota-clock-24h") === "true";
    } catch {
      return false;
    }
  });

  const weather = useWeather();

  const toggleTimeFormat = () => {
    setUse24Hour((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rho-lota-clock-24h", String(next));
      } catch {}
      return next;
    });
  };

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Standardized greeting boundaries:
  // 05:00 - 11:59 => Good Morning
  // 12:00 - 16:59 => Good Afternoon
  // 17:00 - 04:59 => Good Evening
  const hour = currentTime.getHours();
  let greeting = "Good Evening";
  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  const timeString = currentTime.toLocaleTimeString([], {
    hour: use24Hour ? "2-digit" : "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !use24Hour,
  });

  const dateString = currentTime.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const renderWeatherIcon = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes("sun") || cond.includes("clear")) {
      return <Sun className="w-5 h-5 text-amber-400 animate-[spin_12s_linear_infinite]" />;
    }
    if (cond.includes("partly")) {
      return <CloudSun className="w-5 h-5 text-yellow-300" />;
    }
    if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
      return <CloudRain className="w-5 h-5 text-blue-400" />;
    }
    if (cond.includes("snow") || cond.includes("ice")) {
      return <CloudSnow className="w-5 h-5 text-cyan-300" />;
    }
    if (cond.includes("thunder") || cond.includes("storm")) {
      return <CloudLightning className="w-5 h-5 text-purple-400" />;
    }
    if (cond.includes("fog") || cond.includes("mist")) {
      return <CloudFog className="w-5 h-5 text-slate-400" />;
    }
    if (cond.includes("wind")) {
      return <Wind className="w-5 h-5 text-teal-400" />;
    }
    return <Cloud className="w-5 h-5 text-gray-400" />;
  };

  const starterSuggestions = [
    {
      title: "Rust Engine Pipeline",
      desc: "Tokio FSM channel event bus & zero-copy SSE streams",
      icon: Sparkles,
      color: "text-blue-400",
      prompt: "Explain the Rust asynchronous Tokio event bus and streaming FSM state transitions.",
    },
    {
      title: "Red-Green TDD Audit",
      desc: "Verify strict red-to-green test cycles and Clippy lints",
      icon: Shield,
      color: "text-purple-400",
      prompt: "Audit recent codebase diffs against strict red-first TDD invariants and zero-tolerance Clippy lint rules.",
    },
    {
      title: "Mermaid & Vector Diagrams",
      desc: "Generate interactive architecture topologies",
      icon: Layers,
      color: "text-cyan-400",
      prompt: "Create an interactive Mermaid state diagram visualizing autonomous subagent delegation and MCP tool dispatch.",
    },
    {
      title: "Slide Deck Presentation",
      desc: "Scaffold a 5-slide product & technical roadmap deck",
      icon: Presentation,
      color: "text-pink-400",
      prompt: "Generate a 5-slide presentation deck covering Rho Lota Studio 2.0 architecture, benchmarks, and roadmap.",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-between p-6 md:p-10 select-none animate-in fade-in duration-200">
      {/* Top Header Card: Clock, Date, Weather & Greeting */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-4 pt-4 md:pt-8">
        {/* Weather & Location Chip */}
        <div className="flex items-center space-x-3 bg-[#161b22] border border-[#30363d] px-4 py-1.5 rounded-full shadow-sm text-xs text-[#c9d1d9]">
          <div className="flex items-center space-x-1.5">
            {renderWeatherIcon(weather.condition)}
            <span className="font-semibold text-white">{weather.tempF}°F</span>
            <span className="text-[#8b949e]">({weather.tempC}°C)</span>
            <span className="text-gray-400">•</span>
            <span>{weather.condition}</span>
          </div>

          <span className="text-gray-600">|</span>

          <div className="flex items-center space-x-1 text-[#8b949e]">
            <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">{weather.city}, {weather.region}</span>
          </div>

          <span className="text-gray-600 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center space-x-1 text-[#8b949e]">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>{weather.humidity}% Humidity</span>
          </div>
        </div>

        {/* Digital Time Display (Click to toggle 12h / 24h format) */}
        <div className="space-y-1">
          <div
            role="button"
            tabIndex={0}
            onClick={toggleTimeFormat}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTimeFormat();
              }
            }}
            className="cursor-pointer select-none text-4xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center justify-center hover:text-[#58a6ff] active:scale-[0.98] transition-all font-mono"
            title={`Click to switch to ${use24Hour ? "12-hour (AM/PM)" : "24-hour (Military)"} time format`}
          >
            <span>{timeString}</span>
          </div>
          <p className="text-xs sm:text-sm text-[#8b949e] font-medium">{dateString}</p>
        </div>

        {/* Main Personalized Greeting */}
        <div className="space-y-1 pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] via-purple-400 to-pink-400">{displayName}</span>
          </h1>
        </div>
      </div>

      {/* Morning Briefing Calendar + Email Widget */}
      <div className="w-full max-w-4xl px-3 sm:px-4 pt-4">
        <MorningReportWidget />
      </div>

      {/* Centered Chat Prompt Input in the Main View */}
      <div className="w-full max-w-4xl px-3 sm:px-4 my-6 space-y-4">
        <PromptInput placeholder="What would you like to build, verify, or automate today?" />

        {/* Quick Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {starterSuggestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  const textarea = document.querySelector("textarea");
                  if (textarea) {
                    textarea.value = item.prompt;
                    textarea.dispatchEvent(new Event("input", { bubbles: true }));
                    textarea.focus();
                  }
                }}
                className="p-3.5 rounded-xl bg-[#161b22]/70 border border-[#30363d] hover:border-[#58a6ff]/70 hover:bg-[#161b22] text-left transition space-y-1 group"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] group-hover:border-[#58a6ff]/40 transition">
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <span className="font-semibold text-white text-xs group-hover:text-[#58a6ff] transition">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e] line-clamp-1 pl-8">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-[10px] text-[#484f58] flex items-center space-x-2 pb-2">
        <span>SyntropyOS V6</span>
        <span>•</span>
        <span>Tauri 2.0 + Rig.rs Native Core</span>
        <span>•</span>
        <span>Versioned Blackboard • FTA ROI Valuation</span>
      </div>
    </div>
  );
}
