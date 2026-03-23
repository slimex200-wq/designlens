"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/types";
import { LocaleToggle } from "@/components/ui/LocaleToggle";

type Tool = "analyze" | "moodboard" | "review" | "tokens";

const TOOL_IDS: Tool[] = ["analyze", "moodboard", "review", "tokens"];
const TOOL_ICONS: Record<Tool, string> = {
  analyze: "\u2699",
  moodboard: "\u25A3",
  review: "\u2713",
  tokens: "{ }",
};

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const toolLabels: Record<Tool, string> = {
    analyze: t("analyze"),
    moodboard: t("moodboard"),
    review: t("uiReview"),
    tokens: t("tokens"),
  };

  return (
    <aside
      aria-label={t("tools")}
      className={`${collapsed ? "w-[52px]" : "w-60"} h-screen bg-bg-surface border-r border-border flex flex-col flex-shrink-0 transition-[width] duration-200`}
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight text-text-primary">
            DesignLens
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`w-6 h-6 rounded-md bg-bg-elevated border border-border flex items-center justify-center text-[10px] text-text-secondary cursor-pointer hover:border-border-hover hover:text-text-primary transition-all ${collapsed ? "mx-auto" : "ml-auto"}`}
          title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {collapsed ? "\u276F" : "\u276E"}
        </button>
      </div>

      {/* Tools */}
      <div className="py-3 px-1.5">
        {!collapsed && (
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary px-2 mb-1.5 font-semibold">
            {t("tools")}
          </div>
        )}
        {TOOL_IDS.map((id) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            title={collapsed ? toolLabels[id] : undefined}
            className={`w-full flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-[13px] tracking-tight transition-all cursor-pointer ${
              activeTool === id
                ? "bg-accent-dim text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <span
              className={`w-[18px] text-center text-xs flex-shrink-0 ${
                activeTool === id ? "opacity-100" : "opacity-60"
              }`}
            >
              {TOOL_ICONS[id]}
            </span>
            {!collapsed && (
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
        {!collapsed && (
          <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary px-2 mb-1.5 font-semibold">
            {t("projects")}
          </div>
        )}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectChange(project.id)}
            title={collapsed ? project.name : undefined}
            className={`w-full flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all cursor-pointer ${
              activeProjectId === project.id
                ? "text-text-primary bg-bg-hover"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <div
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: activeProjectId === project.id ? project.color : "#5A5F6B" }}
            />
            {!collapsed && (
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
          title={collapsed ? t("trends") : undefined}
          className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all`}
        >
          <span className="text-xs flex-shrink-0">{"\u2197"}</span>
          {!collapsed && ` ${t("trends")}`}
        </a>
        <div
          title={collapsed ? t("settings") : undefined}
          className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all`}
        >
          <span className="text-xs flex-shrink-0">{"\u2699"}</span>
          {!collapsed && ` ${t("settings")}`}
        </div>
        <div
          title={collapsed ? t("helpDocs") : undefined}
          className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all`}
        >
          <span className="text-xs flex-shrink-0">?</span>
          {!collapsed && ` ${t("helpDocs")}`}
        </div>
        <LocaleToggle collapsed={collapsed} />
      </div>
    </aside>
  );
}
