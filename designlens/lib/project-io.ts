import type { Project, ReferenceImage } from "./types";

export const PROJECT_FILE_VERSION = 1;
const FILE_KIND = "designlens-project";

export interface ProjectFile {
  kind: typeof FILE_KIND;
  version: number;
  exportedAt: string;
  project: Project;
}

export class ProjectParseError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ProjectParseError";
  }
}

/** Serialize a project to a portable JSON file string. Large inline data-URL
 *  images are stripped (analysis data is preserved); IndexedDB-backed images do
 *  not survive export and re-import shows analysis without the original screenshot. */
export function serializeProject(project: Project): string {
  const file: ProjectFile = {
    kind: FILE_KIND,
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    project: {
      ...project,
      references: project.references.map((r) => ({
        ...r,
        filePath: r.filePath && r.filePath.startsWith("data:") ? "" : r.filePath ?? "",
      })),
    },
  };
  return JSON.stringify(file, null, 2);
}

function normalizeReference(raw: unknown): ReferenceImage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.fileName !== "string") return null;
  const status =
    r.status === "uploading" || r.status === "processing" || r.status === "analyzed" || r.status === "error"
      ? r.status
      : "analyzed";
  return {
    id: r.id,
    fileName: r.fileName,
    filePath: typeof r.filePath === "string" ? r.filePath : "",
    status,
    analysis: (r.analysis as ReferenceImage["analysis"]) ?? undefined,
    error: typeof r.error === "string" ? r.error : undefined,
    uploadedAt: typeof r.uploadedAt === "string" ? r.uploadedAt : new Date().toISOString(),
    sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : undefined,
    extractedStyles: (r.extractedStyles as ReferenceImage["extractedStyles"]) ?? undefined,
    pageMetadata: (r.pageMetadata as ReferenceImage["pageMetadata"]) ?? undefined,
  };
}

function normalizeProject(raw: Record<string, unknown>): Project {
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    throw new ProjectParseError("missing-name");
  }
  if (!Array.isArray(raw.references)) {
    throw new ProjectParseError("invalid-references");
  }
  const references = raw.references
    .map(normalizeReference)
    .filter((r): r is ReferenceImage => r !== null);
  return {
    id: typeof raw.id === "string" ? raw.id : "imported",
    name: raw.name.trim(),
    color: typeof raw.color === "string" ? raw.color : "#93C5FD",
    references,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

/** Parse and validate an exported project file. Throws ProjectParseError on any
 *  malformed/unsupported input so callers can show a safe error toast. */
export function parseProjectFile(json: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new ProjectParseError("invalid-json");
  }
  if (!data || typeof data !== "object") {
    throw new ProjectParseError("not-object");
  }
  const file = data as Record<string, unknown>;
  if (file.kind !== FILE_KIND) {
    throw new ProjectParseError("wrong-kind");
  }
  if (typeof file.version !== "number" || file.version > PROJECT_FILE_VERSION) {
    throw new ProjectParseError("unsupported-version");
  }
  if (!file.project || typeof file.project !== "object") {
    throw new ProjectParseError("missing-project");
  }
  return normalizeProject(file.project as Record<string, unknown>);
}

/** Build a safe download filename from a project name. */
export function projectFileName(project: Project): string {
  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `designlens-${slug || "project"}.json`;
}
