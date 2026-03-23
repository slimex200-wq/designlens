import type { Project, AnalysisResult } from "./types";

const PROJECTS_KEY = "designlens_projects";
const CACHE_KEY = "designlens_analysis_cache";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getCachedAnalysis(hash: string): AnalysisResult | null {
  const data = localStorage.getItem(CACHE_KEY);
  if (!data) return null;
  const cache: Record<string, AnalysisResult> = JSON.parse(data);
  return cache[hash] ?? null;
}

export function setCachedAnalysis(hash: string, result: AnalysisResult): boolean {
  const data = localStorage.getItem(CACHE_KEY);
  const cache: Record<string, AnalysisResult> = data ? JSON.parse(data) : {};
  cache[hash] = result;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage full");
      return false;
    }
    throw e;
  }
}

export function saveProjectsSafe(projects: Project[]): boolean {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage full");
      return false;
    }
    throw e;
  }
}
