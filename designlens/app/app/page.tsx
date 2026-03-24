"use client";

import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from "react";
import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/workspace/Sidebar";
import { RefGrid } from "@/components/workspace/RefGrid";
import { AnalysisPanel } from "@/components/workspace/AnalysisPanel";
import { FeedbackBar } from "@/components/workspace/FeedbackBar";
import { ReviewView } from "@/components/workspace/ReviewView";
import { MoodboardGrid } from "@/components/workspace/MoodboardGrid";
import { TokensView } from "@/components/workspace/TokensView";
import { useProjects } from "@/hooks/useProjects";
import { useUpload } from "@/hooks/useUpload";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useToast } from "@/components/ui/Toast";
import type { ReviewResult, EnhanceResult } from "@/lib/types";

type Tool = "analyze" | "moodboard" | "review" | "tokens";

type ReviewState = {
  image: string | null;
  result: ReviewResult | null;
  loading: boolean;
  error: string | null;
  enhance: EnhanceResult | null;
  enhanceLoading: boolean;
  showEnhance: boolean;
  generatedImage: string | null;
  imageGenerating: boolean;
};

type ReviewAction =
  | { type: "START"; image: string }
  | { type: "SUCCESS"; result: ReviewResult }
  | { type: "ERROR"; error: string }
  | { type: "DISMISS" }
  | { type: "ENHANCE_START" }
  | { type: "ENHANCE_SUCCESS"; enhance: EnhanceResult }
  | { type: "ENHANCE_ERROR"; error: string }
  | { type: "TOGGLE_ENHANCE" }
  | { type: "IMAGE_GEN_START" }
  | { type: "IMAGE_GEN_SUCCESS"; image: string }
  | { type: "IMAGE_GEN_ERROR"; error: string };

function reviewReducer(_state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "START":
      return { image: action.image, result: null, loading: true, error: null, enhance: null, enhanceLoading: false, showEnhance: false, generatedImage: null, imageGenerating: false };
    case "SUCCESS":
      return { ..._state, result: action.result, loading: false };
    case "ERROR":
      return { ..._state, error: action.error, loading: false };
    case "DISMISS":
      return { image: null, result: null, loading: false, error: null, enhance: null, enhanceLoading: false, showEnhance: false, generatedImage: null, imageGenerating: false };
    case "ENHANCE_START":
      return { ..._state, enhanceLoading: true, error: null };
    case "ENHANCE_SUCCESS":
      return { ..._state, enhance: action.enhance, enhanceLoading: false, showEnhance: true };
    case "ENHANCE_ERROR":
      return { ..._state, error: action.error, enhanceLoading: false };
    case "TOGGLE_ENHANCE":
      return { ..._state, showEnhance: !_state.showEnhance };
    case "IMAGE_GEN_START":
      return { ..._state, imageGenerating: true };
    case "IMAGE_GEN_SUCCESS":
      return { ..._state, generatedImage: action.image, imageGenerating: false };
    case "IMAGE_GEN_ERROR":
      return { ..._state, imageGenerating: false, error: action.error };
  }
}

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
  const bp = useBreakpoint();
  const t = useTranslations("workspace");
  const tc = useTranslations("common");

  const [reviewState, reviewDispatch] = useReducer(reviewReducer, {
    image: null, result: null, loading: false, error: null, enhance: null, enhanceLoading: false, showEnhance: false, generatedImage: null, imageGenerating: false,
  });

  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    addReference,
    updateReference,
    removeReference,
  } = useProjects();

  const { handleFiles, handleUrlAnalysis, urlLoading } = useUpload({
    projectId: activeProjectId,
    addReference,
    updateReference,
    showToast,
  });

  // Wrap handleFiles to track rate limit
  const handleFilesWithLimit = async (files: File[]) => {
    if (remaining <= 0) {
      showToast("error", t("rateLimitReached"));
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

  // Escape key closes analysis panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedRefId) {
        setSelectedRefId(null);
      }
    },
    [selectedRefId]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toolLabels: Record<Tool, string> = {
    analyze: t("analyze"),
    moodboard: t("moodboard"),
    review: t("uiReview"),
    tokens: t("tokens"),
  };

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
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="min-h-[48px] flex items-center px-3 md:px-5 border-b border-border gap-2 md:gap-3 flex-shrink-0">
          {/* Mobile: project selector dropdown */}
          {bp === "mobile" && projects.length > 1 ? (
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="text-[13px] text-text-primary bg-bg-elevated border border-border rounded-md px-2 min-h-[44px] cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-[13px] text-text-secondary flex items-center gap-1.5">
              {activeProject?.name ?? t("project")}
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">
                {toolLabels[activeTool]}
              </span>
            </div>
          )}

          {/* Rate limit counter — hide on mobile */}
          <div
            className={[
              "text-[11px] px-2 py-0.5 rounded-full font-medium border hidden md:block",
              remaining > 5
                ? "text-text-tertiary border-border bg-bg-elevated"
                : remaining > 0
                ? "text-warning border-warning-dim bg-warning-dim"
                : "text-error border-error-dim bg-error-dim",
            ].join(" ")}
            title={t("rateLimitTitle")}
          >
            {tc("analyses", { remaining, limit: RATE_LIMIT })}
          </div>

          <div className="ml-auto flex gap-2 items-center">
            <button className="hidden md:flex px-3 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[44px] items-center">
              {tc("share")}
            </button>
            <label className="px-3 rounded-md text-xs bg-text-primary text-bg-deep cursor-pointer font-medium hover:opacity-85 transition-opacity min-h-[44px] flex items-center">
              {tc("upload")}
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
                onUrl={handleUrlAnalysis}
                urlLoading={urlLoading}
                onDeleteRef={(refId) => {
                  if (selectedRefId === refId) setSelectedRefId(null);
                  removeReference(activeProjectId, refId);
                }}
              />
              {selectedRef && (
                <AnalysisPanel
                  analysis={selectedAnalysis}
                  fileName={selectedRef.fileName}
                  onClose={() => setSelectedRefId(null)}
                  extractedStyles={selectedRef.extractedStyles}
                  pageMetadata={selectedRef.pageMetadata}
                />
              )}
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
              reviewState={reviewState}
              reviewDispatch={reviewDispatch}
            />
          )}

          {activeTool === "tokens" && (
            <TokensView
              references={references}
              onToolChange={setActiveTool}
            />
          )}
        </div>

        {/* AI Feedback bar — only when analysis available */}
        {selectedAnalysis && <FeedbackBar analysis={selectedAnalysis} />}
      </main>
    </>
  );
}
