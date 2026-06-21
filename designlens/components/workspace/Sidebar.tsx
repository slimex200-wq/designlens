"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/types";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useStoredBoolean } from "@/hooks/useStoredBoolean";
import { SettingsModal } from "@/components/workspace/SettingsModal";
import { HelpModal } from "@/components/workspace/HelpModal";
import { ProjectsSection } from "@/components/workspace/ProjectsSection";


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
  onAddProject?: (name: string) => void;
  onRenameProject?: (id: string, name: string) => void;
  onDeleteProject?: (id: string) => void;
  onExportProject?: () => void;
  onImportProject?: (file: File) => void;
  refCount: number;
}

export function Sidebar({
  activeTool,
  onToolChange,
  projects,
  activeProjectId,
  onProjectChange,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  refCount,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const bp = useBreakpoint();
  const [collapsed, setCollapsed] = useStoredBoolean("sidebar-collapsed", false);
  const [modal, setModal] = useState<null | "settings" | "help">(null);

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
            <span className="text-sm emoji-text">{TOOL_ICONS[id]}</span>
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
    <>
    <aside
      role="navigation"
      aria-label={t("tools")}
      className={`${isCollapsed ? "w-[52px]" : "w-60"} h-screen bg-bg-surface border-r border-border flex flex-col flex-shrink-0 transition-[width] duration-200`}
    >
      {/* Header */}
      <div className={`${isCollapsed ? "px-1" : "px-3"} pt-4 pb-3 flex items-center justify-between border-b border-border`}>
        {!isCollapsed && (
          <span className="text-[15px] font-bold tracking-tight text-text-primary">
            DesignLens
          </span>
        )}
        {bp === "desktop" && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`rounded-md flex items-center justify-center text-[10px] text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary transition-all ${isCollapsed ? "mx-auto w-10 h-10" : "ml-auto min-w-[44px] min-h-[44px]"}`}
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
              className={`w-[18px] text-center text-xs flex-shrink-0 emoji-text ${
                activeTool === id ? "opacity-100" : "opacity-60"
              }`}
            >
              {TOOL_ICONS[id]}
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
      <ProjectsSection
        projects={projects}
        activeProjectId={activeProjectId}
        isCollapsed={isCollapsed}
        onSelect={onProjectChange}
        onAdd={onAddProject}
        onRename={onRenameProject}
        onDelete={onDeleteProject}
      />

      {/* Footer */}
      <div className="mt-auto px-2 py-3 border-t border-border flex flex-col gap-0.5">
        <a
          href="/app/trends"
          title={isCollapsed ? t("trends") : undefined}
          className={`flex items-center ${isCollapsed ? "justify-center" : ""} gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]`}
        >
          <span className="text-xs flex-shrink-0 emoji-text">{"\u2197"}</span>
          {!isCollapsed && ` ${t("trends")}`}
        </a>
        {!isCollapsed && (
          <>
            <button
              onClick={() => setModal("settings")}
              className="w-full flex items-center gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]"
            >
              <span className="text-xs flex-shrink-0 emoji-text">{"\u2699"}</span>
              {` ${t("settings")}`}
            </button>
            <button
              onClick={() => setModal("help")}
              className="w-full flex items-center gap-2 px-2 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]"
            >
              <span className="text-xs flex-shrink-0 emoji-text">?</span>
              {` ${t("helpDocs")}`}
            </button>
          </>
        )}
        <LocaleToggle collapsed={isCollapsed} />
      </div>
    </aside>
    {modal === "settings" && (
      <SettingsModal
        onClose={() => setModal(null)}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
      />
    )}
    {modal === "help" && <HelpModal onClose={() => setModal(null)} />}
    </>
  );
}
