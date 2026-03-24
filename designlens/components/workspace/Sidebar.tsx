"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/types";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useBreakpoint } from "@/hooks/useBreakpoint";

type Tool = "analyze" | "moodboard" | "review" | "tokens";

const TOOL_IDS: Tool[] = ["analyze", "moodboard", "review", "tokens"];

function ToolIcon({ id, size = 14 }: { id: Tool; size?: number }) {
  const s = `${size}`;
  const props = { width: s, height: s, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "analyze":
      return (<svg {...props}><circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" /></svg>);
    case "moodboard":
      return (<svg {...props}><rect x="1.5" y="1.5" width="5" height="5" rx="1" /><rect x="9.5" y="1.5" width="5" height="5" rx="1" /><rect x="1.5" y="9.5" width="5" height="5" rx="1" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /></svg>);
    case "review":
      return (<svg {...props}><path d="M2 8.5l4 4 8-9" /></svg>);
    case "tokens":
      return (<svg {...props}><path d="M5 2v12M11 2v12" /><path d="M2 5.5h12M2 10.5h12" /></svg>);
  }
}

function SidebarIcon({ type, size = 14 }: { type: "trends" | "settings" | "help"; size?: number }) {
  const s = `${size}`;
  const props = { width: s, height: s, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "trends":
      return (<svg {...props}><polyline points="2 12 6 6 10 9 14 3" /><polyline points="10 3 14 3 14 7" /></svg>);
    case "settings":
      return (<svg {...props}><circle cx="8" cy="8" r="2.5" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" /></svg>);
    case "help":
      return (<svg {...props}><circle cx="8" cy="8" r="6.5" /><path d="M6 6.5a2 2 0 013.5 1.5c0 1.5-2 1.5-2 3" /><circle cx="8" cy="13" r="0.5" fill="currentColor" stroke="none" /></svg>);
  }
}

interface SidebarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  projects: Project[];
  activeProjectId: string;
  onProjectChange: (id: string) => void;
  refCount: number;
}

export function Sidebar({
  activeTool,
  onToolChange,
  projects,
  activeProjectId,
  onProjectChange,
  refCount,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const bp = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (bp === "desktop") {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    }
  }, [collapsed, bp]);

  const toolLabels: Record<Tool, string> = {
    analyze: t("analyze"),
    moodboard: t("moodboard"),
    review: t("uiReview"),
    tokens: t("tokens"),
  };

  // ─── Mobile: bottom tab bar ───
  if (bp === "mobile") {
    return (
      <nav
        role="tablist"
        aria-label={t("tools")}
        className="order-last flex-shrink-0 h-12 bg-bg-surface border-t border-border flex items-stretch"
      >
        {TOOL_IDS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTool === id}
            onClick={() => onToolChange(id)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] cursor-pointer transition-colors ${
              activeTool === id
                ? "text-text-primary"
                : "text-text-tertiary"
            }`}
          >
            <ToolIcon id={id} size={16} />
            <span className="text-[10px] font-medium">{toolLabels[id]}</span>
            {activeTool === id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </nav>
    );
  }

  // ─── Tablet/Desktop ───
  const isCollapsed = bp === "tablet" ? true : collapsed;

  return (
    <aside
      role="navigation"
      aria-label={t("tools")}
      className={`${isCollapsed ? "w-[52px]" : "w-60"} h-screen bg-bg-surface border-r border-border flex flex-col flex-shrink-0 transition-[width] duration-200`}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex items-center justify-between border-b border-border">
        {!isCollapsed && (
          <span className="text-[15px] font-bold tracking-tight text-text-primary">
            DesignLens
          </span>
        )}
        {bp === "desktop" && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center text-[10px] text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-all ${isCollapsed ? "mx-auto" : "ml-auto"}`}
            title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            <span className="w-6 h-6 rounded-md bg-bg-elevated border border-border flex items-center justify-center">
              {isCollapsed ? "\u276F" : "\u276E"}
            </span>
          </button>
        )}
        {bp === "tablet" && (
          <span className="mx-auto text-[13px] font-bold text-text-primary">D</span>
        )}
      </div>

      {/* Tools */}
      <div className="py-3 px-1.5">
        {!isCollapsed && (
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary px-2 mb-1.5 font-semibold">
            {t("tools")}
          </div>
        )}
        {TOOL_IDS.map((id) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            title={isCollapsed ? toolLabels[id] : undefined}
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : ""} gap-2 px-2 rounded-md text-[13px] tracking-tight transition-all cursor-pointer min-h-[44px] ${
              activeTool === id
                ? "bg-accent-dim text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <span
              className={`w-[18px] flex items-center justify-center flex-shrink-0 ${
                activeTool === id ? "opacity-100" : "opacity-60"
              }`}
            >
              <ToolIcon id={id} />
            </span>
            {!isCollapsed && (
              <>
                {toolLabels[id]}
                {id === "analyze" && refCount > 0 && (
                  <span className="ml-auto text-[10px] px-1.5 py-px rounded-full bg-accent-dim text-accent-text font-medium">
                    {refCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-2" />

      {/* Projects */}
      <div className="py-3 px-1.5">
        {!isCollapsed && (
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary px-2 mb-1.5 font-semibold">
            {t("projects")}
          </div>
        )}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectChange(project.id)}
            title={isCollapsed ? project.name : undefined}
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : ""} gap-2 px-2 rounded-md text-[13px] transition-all cursor-pointer min-h-[44px] ${
              activeProjectId === project.id
                ? "text-text-primary bg-bg-hover"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <div
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: activeProjectId === project.id ? project.color : "var(--text-tertiary)" }}
            />
            {!isCollapsed && (
              <>
                <span className="truncate">{project.name}</span>
                <span className="ml-auto text-[11px] text-text-tertiary">
                  {project.references.length}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto p-2 border-t border-border">
        <a
          href="/app/trends"
          title={isCollapsed ? t("trends") : undefined}
          className={`flex items-center ${isCollapsed ? "justify-center" : ""} gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]`}
        >
          <span className="flex-shrink-0"><SidebarIcon type="trends" /></span>
          {!isCollapsed && ` ${t("trends")}`}
        </a>
        {!isCollapsed && (
          <>
            <button
              className="w-full flex items-center gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]"
            >
              <span className="flex-shrink-0"><SidebarIcon type="settings" /></span>
              {` ${t("settings")}`}
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]"
            >
              <span className="flex-shrink-0"><SidebarIcon type="help" /></span>
              {` ${t("helpDocs")}`}
            </button>
          </>
        )}
        <LocaleToggle collapsed={isCollapsed} />
      </div>
    </aside>
  );
}
