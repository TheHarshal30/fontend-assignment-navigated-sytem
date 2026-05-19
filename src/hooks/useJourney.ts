import { useCallback, useEffect, useState } from "react";
import type { JourneyEntry } from "../types";

const STORAGE_KEY = "gooru-navigator-journey-v1";

export function useJourney() {
  const [journey, setJourney] = useState<JourneyEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as JourneyEntry[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
    } catch {
      /* ignore quota errors */
    }
  }, [journey]);

  const visit = useCallback((resourceId: string) => {
    setJourney((prev) => {
      const last = prev[prev.length - 1];
      // Avoid back-to-back duplicate within 1.5s (e.g. double click)
      if (last && last.resourceId === resourceId && Date.now() - last.visitedAt < 1500) {
        return prev;
      }
      return [...prev, { resourceId, visitedAt: Date.now() }];
    });
  }, []);

  const clear = useCallback(() => setJourney([]), []);

  return { journey, visit, clear };
}
