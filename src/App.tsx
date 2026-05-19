import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COURSE } from "./data/course";
import { LearningMap, type MapControls } from "./components/LearningMap";
import { ResourcePanel } from "./components/ResourcePanel";
import { JourneyPanel } from "./components/JourneyPanel";
import { Legend } from "./components/Legend";
import { Minimap } from "./components/Minimap";
import { SearchBar } from "./components/SearchBar";
import { useJourney } from "./hooks/useJourney";
import type { ResourceType } from "./types";

export default function App() {
  const course = COURSE;
  const { journey, visit, clear: clearJourney } = useJourney();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<ResourceType>>(new Set());
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem("gooru-onboarded-v2") !== "1";
    } catch {
      return true;
    }
  });

  const controlsRef = useRef<MapControls | null>(null);

  const selectedResource = useMemo(
    () => course.resources.find((r) => r.id === selectedId) ?? null,
    [course.resources, selectedId]
  );
  const journeySet = useMemo(
    () => new Set(journey.map((j) => j.resourceId)),
    [journey]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      visit(id);
      controlsRef.current?.focusResource(id);
    },
    [visit]
  );

  const highlightedIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtering = q.length > 0 || activeTypes.size > 0;
    if (!filtering) return new Set<string>();
    const set = new Set<string>();
    course.resources.forEach((r) => {
      const typeOk = activeTypes.size === 0 || activeTypes.has(r.type);
      const queryOk =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.type.includes(q);
      if (typeOk && queryOk) set.add(r.id);
    });
    return set;
  }, [query, activeTypes, course.resources]);

  const handleToggleType = useCallback((t: ResourceType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditable) return;
      if (e.key === "+" || e.key === "=") controlsRef.current?.zoomIn();
      else if (e.key === "-" || e.key === "_") controlsRef.current?.zoomOut();
      else if (e.key === "0") controlsRef.current?.reset();
      else if (e.key.toLowerCase() === "j") setJourneyOpen((o) => !o);
      else if (e.key === "?") setShowOnboarding(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("gooru-onboarded-v2", "1");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-3">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="paper-card flex items-center gap-2.5 rounded-lg px-3 py-2">
            <CompassMark />
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                Gooru · Atlas
              </div>
              <div
                className="truncate text-base font-semibold leading-tight text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {course.title}
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto">
          <SearchBar
            course={course}
            query={query}
            onQueryChange={setQuery}
            activeTypes={activeTypes}
            onToggleType={handleToggleType}
            onPick={(id) => handleSelect(id)}
            onPickTopic={(id) => controlsRef.current?.focusTopic(id)}
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setJourneyOpen((o) => !o)}
            aria-pressed={journeyOpen}
            className="paper-card flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink hover:text-accent-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-accent-2"
            >
              <path
                d="M4 18C6 12 9 14 12 10s5-6 8-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 3"
              />
              <circle cx="4" cy="18" r="2" fill="currentColor" />
              <circle cx="20" cy="8" r="2" fill="currentColor" />
            </svg>
            <span>Log</span>
            <span className="rounded bg-card-2 px-1.5 py-0.5 text-[10px] text-ink-dim">
              {journey.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            aria-label="Show help"
            className="paper-card flex items-center justify-center rounded-lg px-2.5 py-2 text-sm text-ink-dim hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path
                d="M9.5 9.5a2.5 2.5 0 015 0c0 1.6-2.5 2-2.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="absolute inset-0">
        <LearningMap
          course={course}
          journey={journey}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onSelectResource={handleSelect}
          onCloseResource={() => setSelectedId(null)}
          onTransformChange={setTransform}
          onViewportChange={setViewport}
          onRegisterControls={(c) => (controlsRef.current = c)}
        />
      </div>

      {/* Compass + zoom controls (bottom-right) */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
        <Minimap course={course} transform={transform} viewport={viewport} />
        <div className="paper-card flex overflow-hidden rounded-lg">
          <ZoomBtn
            label="Zoom in"
            onClick={() => controlsRef.current?.zoomIn()}
            symbol="+"
          />
          <ZoomBtn
            label="Reset view"
            onClick={() => controlsRef.current?.reset()}
            symbol="⤾"
          />
          <ZoomBtn
            label="Zoom out"
            onClick={() => controlsRef.current?.zoomOut()}
            symbol="−"
          />
        </div>
        <div className="paper-card rounded-md px-2 py-0.5 text-[10px] tabular-nums text-ink-dim">
          {Math.round(transform.k * 100)}%
        </div>
      </div>

      {/* Legend (bottom-left) */}
      <div className="pointer-events-auto absolute bottom-3 left-3 z-10">
        <Legend />
      </div>

      <JourneyPanel
        open={journeyOpen}
        course={course}
        journey={journey}
        onSelectResource={(id) => handleSelect(id)}
        onClear={clearJourney}
        onClose={() => setJourneyOpen(false)}
      />

      <ResourcePanel
        course={course}
        resource={selectedResource}
        visited={selectedResource ? journeySet.has(selectedResource.id) : false}
        onClose={() => setSelectedId(null)}
        onSelectResource={(id) => handleSelect(id)}
      />

      <Onboarding open={showOnboarding} onClose={dismissOnboarding} />
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  symbol,
}: {
  label: string;
  onClick: () => void;
  symbol: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center text-ink-dim hover:bg-card-2 hover:text-ink"
    >
      <span className="text-lg leading-none">{symbol}</span>
    </button>
  );
}

function CompassMark() {
  return (
    <svg width="32" height="32" viewBox="-16 -16 32 32" aria-hidden>
      <circle r="14" fill="#f4e1bb" stroke="#a35630" strokeWidth="1.2" />
      <circle r="11" fill="none" stroke="#c79b6b" strokeWidth="0.6" strokeDasharray="2 2" />
      {/* compass needle pointing up */}
      <path d="M0 -10 L3.5 0 L0 10 L-3.5 0 Z" fill="#a35630" />
      <path d="M0 -10 L3.5 0 L-3.5 0 Z" fill="#dc2626" />
      <circle r="1.2" fill="#2b2620" />
      <text
        y="-12.5"
        textAnchor="middle"
        fontSize="5"
        fontWeight="700"
        fill="#2b2620"
        style={{ fontFamily: "var(--font-display)" }}
      >
        N
      </text>
    </svg>
  );
}

function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-ink/35 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="Welcome"
      onClick={onClose}
    >
      <div
        className="paper-card max-w-md rounded-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <CompassMark />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              Welcome, traveller
            </div>
            <h2
              className="text-xl font-semibold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              An atlas of your course
            </h2>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-dim">
          Each landmass is a topic. Pins are resources — colored by type. Roads
          link a topic's resources in order; dashed amber highways mark
          prerequisites that cross between regions. Visit a pin and your route
          draws itself.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <Tip k="Scroll">Zoom — pins and detail emerge as you go in</Tip>
          <Tip k="Drag">Pan across the map</Tip>
          <Tip k="/">Search regions or places</Tip>
          <Tip k="J">Open your travel log</Tip>
          <Tip k="+ / − / 0">Zoom in, out, reset</Tip>
          <Tip k="Esc">Close a place card</Tip>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-md bg-accent-2 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-2/90"
        >
          Begin journey
        </button>
      </div>
    </div>
  );
}

function Tip({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-ink-dim">
      <kbd className="rounded border border-rule bg-card-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
        {k}
      </kbd>
      <span>{children}</span>
    </li>
  );
}
