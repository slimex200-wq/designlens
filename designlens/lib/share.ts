import type { Project } from "./types";

/** True when the project has at least one analyzed reference worth sharing. */
export function hasShareableData(project: Project | null | undefined): boolean {
  if (!project) return false;
  return project.references.some((r) => r.status === "analyzed" && r.analysis);
}

/**
 * Build a portable Markdown summary of a project's extracted design system.
 * Used by the workspace "Share" action to copy a paste-ready snapshot
 * (colors, typography, layout patterns) to the clipboard.
 */
export function buildShareSummary(project: Project): string {
  const analyzed = project.references.filter(
    (r) => r.status === "analyzed" && r.analysis
  );

  const lines: string[] = [];
  lines.push(`# ${project.name} — Design System`);
  lines.push("");
  lines.push(`${analyzed.length} reference${analyzed.length === 1 ? "" : "s"} analyzed`);

  // Colors — unique by hex, keep first role seen
  const colors = new Map<string, string>();
  for (const ref of analyzed) {
    for (const c of ref.analysis!.colors) {
      const hex = c.hex.toUpperCase();
      if (!colors.has(hex)) colors.set(hex, c.role);
    }
  }
  if (colors.size > 0) {
    lines.push("");
    lines.push("## Colors");
    for (const [hex, role] of colors) lines.push(`- ${hex} — ${role}`);
  }

  // Typography — unique by role/size/weight
  const typography = new Map<string, string>();
  for (const ref of analyzed) {
    for (const t of ref.analysis!.typography) {
      const key = `${t.role}|${t.size}|${t.weight}`;
      if (!typography.has(key)) {
        typography.set(key, `${t.role} — ${t.size} / weight ${t.weight}`);
      }
    }
  }
  if (typography.size > 0) {
    lines.push("");
    lines.push("## Typography");
    for (const v of typography.values()) lines.push(`- ${v}`);
  }

  // Layout patterns — counted by type
  const layouts = new Map<string, number>();
  for (const ref of analyzed) {
    const type = ref.analysis!.layout?.type;
    if (type) layouts.set(type, (layouts.get(type) ?? 0) + 1);
  }
  if (layouts.size > 0) {
    lines.push("");
    lines.push("## Layout Patterns");
    for (const [type, count] of layouts) lines.push(`- ${type} (${count})`);
  }

  lines.push("");
  lines.push("— Generated with DesignLens");
  return lines.join("\n");
}
