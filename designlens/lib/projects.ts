import type { Project } from "./types";

/** The built-in demo project id; locked against rename/delete. */
export const SAMPLE_ID = "sample";

/** Palette for new project color dots (Cool Steel accent + complements). */
export const PROJECT_COLORS = [
  "#93C5FD",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
  "#C9A96E",
  "#A78BFA",
  "#34D399",
];

export function nextProjectColor(count: number): string {
  return PROJECT_COLORS[count % PROJECT_COLORS.length];
}

export function genProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function genReferenceId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Return a copy of the project with every reference re-keyed to a fresh id so an
 *  imported copy never shares IndexedDB image keys with the source project. */
export function withFreshReferenceIds(project: Project): Project {
  return {
    ...project,
    references: project.references.map((r) => ({ ...r, id: genReferenceId() })),
  };
}

export function makeProject(
  name: string,
  color: string,
  id: string,
  createdAt: string
): Project {
  return {
    id,
    name: name.trim() || "New Project",
    color,
    references: [],
    createdAt,
  };
}

/** Rename a project; the sample project is locked and empty names are ignored. */
export function renameInProjects(projects: Project[], id: string, name: string): Project[] {
  if (id === SAMPLE_ID) return projects;
  const trimmed = name.trim();
  if (!trimmed) return projects;
  return projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
}

/** Remove a project; the sample project is locked. */
export function removeFromProjects(projects: Project[], id: string): Project[] {
  if (id === SAMPLE_ID) return projects;
  return projects.filter((p) => p.id !== id);
}

/** Pick the active project id after a delete: keep current unless it was deleted. */
export function resolveActiveAfterDelete(
  remaining: Project[],
  deletedId: string,
  currentActive: string
): string {
  if (currentActive !== deletedId) return currentActive;
  return remaining[0]?.id ?? SAMPLE_ID;
}
