"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, ReferenceImage } from "@/lib/types";
import { getProjects, saveProjectsSafe } from "@/lib/storage";
import { getImages, deleteImage, saveImage } from "@/lib/image-store";
import { SAMPLE_PROJECT } from "@/lib/sample-project";
import {
  SAMPLE_ID,
  genProjectId,
  withFreshReferenceIds,
  makeProject,
  nextProjectColor,
  renameInProjects,
  removeFromProjects,
  resolveActiveAfterDelete,
} from "@/lib/projects";

const ACTIVE_PROJECT_KEY = "designlens_active_project";

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
    const storedActive = localStorage.getItem(ACTIVE_PROJECT_KEY);
    const pickActive = (list: Project[], fallback: string) =>
      storedActive && list.some((p) => p.id === storedActive) ? storedActive : fallback;

    // Always refresh the sample project with latest data so new images/analyses show up
    const withFreshSample = stored.length === 0
      ? [SAMPLE_PROJECT, DEFAULT_PROJECT]
      : stored.map((p) => (p.id === "sample" ? SAMPLE_PROJECT : p));

    // Persist if sample was refreshed or first visit
    if (stored.length === 0 || stored.some((p) => p.id === "sample")) {
      saveProjectsSafe(withFreshSample);
    }

    const initial = withFreshSample;

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
        setActiveProjectId(pickActive(restored, stored.length === 0 ? "sample" : restored[0].id));
      });
    } else {
      // Seeding state from localStorage/IndexedDB after mount is intentional and
      // cannot run during render/SSR (browser-only stores).
      /* eslint-disable react-hooks/set-state-in-effect */
      setProjects(initial);
      setActiveProjectId(pickActive(initial, stored.length === 0 ? "sample" : initial[0].id));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  // Persist the active project so a reload restores the user's last selection.
  useEffect(() => {
    if (activeProjectId) localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  }, [activeProjectId]);

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

  const addProject = useCallback((name: string, color?: string): string => {
    const id = genProjectId();
    setProjects((prev) => {
      const project = makeProject(name, color ?? nextProjectColor(prev.length), id, new Date().toISOString());
      const updated = [...prev, project];
      persistToStorage(updated);
      return updated;
    });
    setActiveProjectId(id);
    return id;
  }, []);

  const importProject = useCallback((incoming: Project): string => {
    const id = genProjectId();
    setProjects((prev) => {
      const project: Project = { ...withFreshReferenceIds(incoming), id };
      const updated = [...prev, project];
      persistToStorage(updated);
      return updated;
    });
    setActiveProjectId(id);
    return id;
  }, []);

  const renameProject = useCallback((projectId: string, name: string) => {
    setProjects((prev) => {
      const updated = renameInProjects(prev, projectId, name);
      if (updated !== prev) persistToStorage(updated);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    if (projectId === SAMPLE_ID) return; // demo project cannot be deleted
    setProjects((prev) => {
      const target = prev.find((p) => p.id === projectId);
      if (target) {
        for (const ref of target.references) deleteImage(ref.id).catch(() => {});
      }
      const removed = removeFromProjects(prev, projectId);
      const safe = removed.length > 0 ? removed : [SAMPLE_PROJECT];
      persistToStorage(safe);
      setActiveProjectId((currentActive) => resolveActiveAfterDelete(safe, projectId, currentActive));
      return safe;
    });
  }, []);

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    addReference,
    updateReference,
    removeReference,
    addProject,
    renameProject,
    deleteProject,
    importProject,
    persist,
  };
}
