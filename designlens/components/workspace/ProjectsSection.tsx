"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/types";

interface ProjectsSectionProps {
  projects: Project[];
  activeProjectId: string;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onAdd?: (name: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectsSection({
  projects,
  activeProjectId,
  isCollapsed,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: ProjectsSectionProps) {
  const t = useTranslations("sidebar");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");

  const startRename = (project: Project) => {
    setConfirmId(null);
    setEditingId(project.id);
    setDraftName(project.name);
  };

  const commitRename = () => {
    if (editingId && onRename) onRename(editingId, draftName);
    setEditingId(null);
    setDraftName("");
  };

  const commitAdd = () => {
    const name = addName.trim();
    if (name && onAdd) onAdd(name);
    setAdding(false);
    setAddName("");
  };

  // Collapsed rail: color dots only, no management UI.
  if (isCollapsed) {
    return (
      <div className="py-3 px-1.5">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            title={project.name}
            className="w-full flex items-center justify-center rounded-md min-h-[44px] cursor-pointer hover:bg-bg-hover transition-all"
          >
            <div
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: activeProjectId === project.id ? project.color : "var(--text-tertiary)" }}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="py-3 px-1.5">
      <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary px-2 mb-1.5 font-semibold">
        {t("projects")}
      </div>

      {projects.map((project) => {
        const isActive = activeProjectId === project.id;
        const isSample = project.id === "sample";

        if (editingId === project.id) {
          return (
            <div key={project.id} className="flex items-center gap-1 px-2 min-h-[44px]">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setEditingId(null);
                    setDraftName("");
                  }
                }}
                onBlur={commitRename}
                className="flex-1 min-w-0 bg-bg-elevated border border-accent-border rounded px-2 py-1 text-[13px] text-text-primary outline-none"
              />
            </div>
          );
        }

        return (
          <div
            key={project.id}
            className={`group w-full flex items-center gap-2 px-2 rounded-md text-[13px] transition-all min-h-[44px] ${
              isActive ? "text-text-primary bg-bg-hover" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <button
              onClick={() => onSelect(project.id)}
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-left"
            >
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: isActive ? project.color : "var(--text-tertiary)" }}
              />
              <span className="truncate">{project.name}</span>
              {isSample && (
                <span className="text-[9px] px-1.5 py-px rounded bg-accent-dim text-accent font-semibold uppercase tracking-wider flex-shrink-0">
                  demo
                </span>
              )}
            </button>

            {confirmId === project.id ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    onDelete?.(project.id);
                    setConfirmId(null);
                  }}
                  aria-label={t("deleteConfirm")}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] bg-error text-bg-deep cursor-pointer hover:opacity-85"
                >
                  {"\u2713"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  aria-label={t("cancel")}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] text-text-tertiary hover:text-text-primary cursor-pointer emoji-text"
                >
                  {"\u2715"}
                </button>
              </div>
            ) : (
              <>
                <span className="text-[11px] text-text-tertiary group-hover:hidden flex-shrink-0">
                  {project.references.length}
                </span>
                {!isSample && (onRename || onDelete) && (
                  <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                    {onRename && (
                    <button
                      onClick={() => startRename(project)}
                      aria-label={t("renameProject")}
                      className="w-6 h-6 flex items-center justify-center rounded text-[11px] text-text-tertiary hover:text-text-primary hover:bg-bg-elevated cursor-pointer emoji-text"
                    >
                      {"\u270E"}
                    </button>
                    )}
                    {onDelete && (
                    <button
                      onClick={() => setConfirmId(project.id)}
                      aria-label={t("deleteProject")}
                      className="w-6 h-6 flex items-center justify-center rounded text-[11px] text-text-tertiary hover:text-error hover:bg-bg-elevated cursor-pointer emoji-text"
                    >
                      {"\u2715"}
                    </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {onAdd && (adding ? (
        <div className="flex items-center gap-1 px-2 min-h-[44px]">
          <input
            autoFocus
            value={addName}
            placeholder={t("newProjectPlaceholder")}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setAddName("");
              }
            }}
            onBlur={commitAdd}
            className="flex-1 min-w-0 bg-bg-elevated border border-accent-border rounded px-2 py-1 text-[13px] text-text-primary outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 px-2 mt-0.5 rounded-md text-[12px] text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all min-h-[44px]"
        >
          <span className="w-2 flex-shrink-0 text-center">+</span>
          <span>{t("newProject")}</span>
        </button>
      ))}
    </div>
  );
}
