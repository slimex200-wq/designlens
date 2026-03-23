"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, ReferenceImage } from "@/lib/types";
import { getProjects, saveProjectsSafe } from "@/lib/storage";
import { getImages, deleteImage, saveImage } from "@/lib/image-store";
import { SAMPLE_PROJECT } from "@/lib/sample-project";

const DEFAULT_PROJECT: Project = {
  id: "default",
  name: "My Project",
  color: "#93C5FD",
  references: [],
  createdAt: new Date().toISOString(),
};

/** Strip filePath from references before saving to localStorage to avoid quota issues. */
function stripImages(projects: Project[]): Project[] {
  return projects.map((p) => ({
    ...p,
    references: p.references.map((r) => ({
      ...r,
      filePath: r.filePath.startsWith("data:") ? "" : r.filePath,
    })),
  }));
}

function persistToStorage(projects: Project[]): void {
  saveProjectsSafe(stripImages(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("sample");

  useEffect(() => {
    const stored = getProjects();
    const initial =
      stored.length === 0 ? [SAMPLE_PROJECT, DEFAULT_PROJECT] : stored;

    if (stored.length === 0) {
      saveProjectsSafe(initial);
    }

    // Restore images from IndexedDB for references with empty or invalid filePath
    const allRefs = initial.flatMap((p) => p.references);
    const needsRestore = (fp: string) =>
      !fp || fp.startsWith("blob:") || fp.startsWith("data:");
    const emptyIds = allRefs.filter((r) => needsRestore(r.filePath)).map((r) => r.id);

    if (emptyIds.length > 0) {
      // Migrate existing data URLs to IndexedDB before restoring
      const migrateRefs = allRefs.filter(
        (r) => r.filePath.startsWith("data:") && emptyIds.includes(r.id)
      );
      for (const ref of migrateRefs) {
        saveImage(ref.id, ref.filePath).catch(() => {});
      }

      getImages(emptyIds).then((imageMap) => {
        const restored = initial.map((p) => ({
          ...p,
          references: p.references.map((r) =>
            needsRestore(r.filePath) && imageMap[r.id]
              ? { ...r, filePath: imageMap[r.id] }
              : r
          ),
        }));
        // Strip migrated data URLs from localStorage
        persistToStorage(restored);
        setProjects(restored);
        setActiveProjectId(stored.length === 0 ? "sample" : restored[0].id);
      });
    } else {
      setProjects(initial);
      setActiveProjectId(stored.length === 0 ? "sample" : initial[0].id);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  const persist = useCallback((updated: Project[]) => {
    setProjects(updated);
    persistToStorage(updated);
  }, []);

  const addReference = useCallback(
    (projectId: string, ref: ReferenceImage) => {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId ? { ...p, references: [...p.references, ref] } : p
        );
        persistToStorage(updated);
        return updated;
      });
    },
    []
  );

  const updateReference = useCallback(
    (projectId: string, refId: string, updater: (ref: ReferenceImage) => ReferenceImage) => {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                references: p.references.map((r) => (r.id === refId ? updater(r) : r)),
              }
            : p
        );
        persistToStorage(updated);
        return updated;
      });
    },
    []
  );

  const removeReference = useCallback(
    (projectId: string, refId: string) => {
      deleteImage(refId).catch(() => {});
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId
            ? { ...p, references: p.references.filter((r) => r.id !== refId) }
            : p
        );
        persistToStorage(updated);
        return updated;
      });
    },
    []
  );

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    addReference,
    updateReference,
    removeReference,
    persist,
  };
}
