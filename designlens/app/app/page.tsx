"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Sidebar } from "@/components/workspace/Sidebar";
import { RefGrid } from "@/components/workspace/RefGrid";
import { AnalysisPanel } from "@/components/workspace/AnalysisPanel";
import { FeedbackBar } from "@/components/workspace/FeedbackBar";
import { ReviewView } from "@/components/workspace/ReviewView";
import { MoodboardGrid } from "@/components/workspace/MoodboardGrid";
import { useProjects } from "@/hooks/useProjects";
import { useUpload } from "@/hooks/useUpload";
import { useToast } from "@/components/ui/Toast";

type Tool = "analyze" | "moodboard" | "review" | "tokens";

const RATE_LIMIT = 20; // analyses per hour
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function useRateLimit() {
  const [count, setCount] = useState(RATE_LIMIT);
  const resetAt = useRef<number>(Date.now() + RATE_WINDOW_MS);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() >= resetAt.current) {
        setCount(RATE_LIMIT);
        resetAt.current = Date.now() + RATE_WINDOW_MS;
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const decrement = () => setCount((c) => Math.max(0, c - 1));

  return { remaining: count, decrement };
}

export default function WorkspacePage() {
  const [activeTool, setActiveTool] = useState<Tool>("analyze");
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { remaining, decrement } = useRateLimit();

  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    addReference,
    updateReference,
  } = useProjects();

  const { handleFiles } = useUpload({
    projectId: activeProjectId,
    addReference,
    updateReference,
    showToast,
  });

  // Wrap handleFiles to track rate limit
  const handleFilesWithLimit = async (files: File[]) => {
    if (remaining <= 0) {
      showToast("error", "Rate limit reached — analyses reset hourly.");
      return;
    }
    decrement();
    handleFiles(files);
  };

  const references = activeProject?.references ?? [];

  const selectedRef = useMemo(
    () => references.find((r) => r.id === selectedRefId) ?? null,
    [references, selectedRefId]
  );

  const selectedAnalysis = selectedRef?.analysis ?? null;

  return (
    <>
      {/* Sidebar */}
      <Sidebar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectChange={setActiveProjectId}
        refCount={references.length}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-12 flex items-center px-5 border-b border-border gap-3 flex-shrink-0">
          <div className="text-[13px] text-text-secondary flex items-center gap-1.5">
            {activeProject?.name ?? "Project"}
            <span className="text-text-tertiary">/</span>
            <span className="text-text-primary font-medium capitalize">
              {activeTool === "review"
                ? "UI Review"
                : activeTool === "tokens"
                ? "Tokens"
                : activeTool === "moodboard"
                ? "Moodboard"
                : "Analyze"}
            </span>
          </div>

          {/* Rate limit counter */}
          <div
            className={[
              "text-[11px] px-2 py-0.5 rounded-full font-medium border",
              remaining > 5
                ? "text-text-tertiary border-border bg-bg-elevated"
                : remaining > 0
                ? "text-warning border-warning-dim bg-warning-dim"
                : "text-error border-error-dim bg-error-dim",
            ].join(" ")}
            title="Analyses remaining this hour"
          >
            {remaining}/{RATE_LIMIT} analyses
          </div>

          <div className="ml-auto flex gap-2 items-center">
            <button className="px-3 py-1.5 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all">
              Share
            </button>
            <label className="px-3 py-1.5 rounded-md text-xs bg-text-primary text-bg-deep cursor-pointer font-medium hover:opacity-85 transition-opacity">
              + Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) handleFilesWithLimit(files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {activeTool === "analyze" && (
            <>
              <RefGrid
                references={references}
                selectedRefId={selectedRefId}
                onSelectRef={setSelectedRefId}
                onFiles={handleFilesWithLimit}
              />
              <AnalysisPanel
                analysis={selectedAnalysis}
                fileName={selectedRef?.fileName ?? null}
              />
            </>
          )}

          {activeTool === "moodboard" && (
            <MoodboardGrid
              references={references}
              onSelectRef={setSelectedRefId}
            />
          )}

          {activeTool === "review" && (
            <ReviewView
              references={references}
              onToolChange={setActiveTool}
            />
          )}

          {activeTool === "tokens" && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-text-tertiary text-sm">Tokens view coming soon</p>
            </div>
          )}
        </div>

        {/* AI Feedback bar */}
        <FeedbackBar analysis={selectedAnalysis} />
      </div>
    </>
  );
}
