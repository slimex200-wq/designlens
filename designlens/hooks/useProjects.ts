"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, ReferenceImage } from "@/lib/types";
import { getProjects, saveProjectsSafe } from "@/lib/storage";
import { SAMPLE_PROJECT } from "@/lib/sample-project";

const DEFAULT_PROJECT: Project = {
  id: "default",
  name: "My Project",
  color: "#93C5FD",
  references: [],
  createdAt: new Date().toISOString(),
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("sample");

  useEffect(() => {
    const stored = getProjects();
    if (stored.length === 0) {
      const initial = [SAMPLE_PROJECT, DEFAULT_PROJECT];
      saveProjectsSafe(initial);
      setProjects(initial);
      setActiveProjectId("sample");
    } else {
      setProjects(stored);
      setActiveProjectId(stored[0].id);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  const persist = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjectsSafe(updated);
  }, []);

  const addReference = useCallback(
    (projectId: string, ref: ReferenceImage) => {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId ? { ...p, references: [...p.references, ref] } : p
        );
        saveProjectsSafe(updated);
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
        saveProjectsSafe(updated);
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
    persist,
  };
}
