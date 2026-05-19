import { useEffect, useMemo, useRef, useState } from "react";
import type { Course, ResourceType } from "../types";
import { RESOURCE_TYPE_COLOR, ResourceIcon } from "./ResourceIcon";

interface Props {
  course: Course;
  query: string;
  onQueryChange: (q: string) => void;
  activeTypes: Set<ResourceType>;
  onToggleType: (t: ResourceType) => void;
  onPick: (resourceId: string) => void;
  onPickTopic: (topicId: string) => void;
}

const ALL_TYPES: ResourceType[] = ["video", "doc", "quiz", "practice"];

export function SearchBar({
  course,
  query,
  onQueryChange,
  activeTypes,
  onToggleType,
  onPick,
  onPickTopic,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !isEditable) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { topics: [], resources: [] };
    const topics = course.topics
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const resources = course.resources
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.type.includes(q)
      )
      .slice(0, 8);
    return { topics, resources };
  }, [query, course]);

  return (
    <div ref={wrapRef} className="relative w-[360px] max-w-[60vw]">
      <div className="paper-card flex items-center gap-2 rounded-lg px-3 py-2 focus-within:border-accent-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-ink-dim"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M21 21l-4.3-4.3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search this map…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
          aria-label="Search learning map"
        />
        <kbd className="rounded border border-rule bg-card-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-mute">
          /
        </kbd>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {ALL_TYPES.map((t) => {
          const active = activeTypes.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggleType(t)}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] capitalize transition ${
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-rule bg-card/80 text-ink-dim hover:text-ink"
              }`}
              style={
                active
                  ? {
                      background: RESOURCE_TYPE_COLOR[t],
                    }
                  : undefined
              }
              aria-pressed={active}
            >
              <ResourceIcon type={t} size={10} />
              {t}
            </button>
          );
        })}
        {activeTypes.size > 0 && (
          <button
            type="button"
            onClick={() =>
              ALL_TYPES.forEach((t) => activeTypes.has(t) && onToggleType(t))
            }
            className="rounded-full border border-rule bg-card/80 px-2 py-0.5 text-[11px] text-ink-dim hover:text-ink"
          >
            Clear filters
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="paper-card absolute left-0 right-0 top-[calc(100%+44px)] z-30 max-h-[360px] overflow-y-auto rounded-lg">
          {matches.topics.length === 0 && matches.resources.length === 0 ? (
            <div className="p-3 text-sm text-ink-dim">No matches.</div>
          ) : (
            <>
              {matches.topics.length > 0 && (
                <Section title="Regions">
                  {matches.topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onPickTopic(t.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-card-2"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-ink/10"
                        style={{ background: t.coast }}
                      />
                      <span className="text-sm text-ink">{t.title}</span>
                    </button>
                  ))}
                </Section>
              )}
              {matches.resources.length > 0 && (
                <Section title="Places">
                  {matches.resources.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onPick(r.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-card-2"
                    >
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded ring-1 ring-ink/5"
                        style={{
                          color: RESOURCE_TYPE_COLOR[r.type],
                          background: `${RESOURCE_TYPE_COLOR[r.type]}1a`,
                        }}
                      >
                        <ResourceIcon type={r.type} size={11} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {r.title}
                      </span>
                      <span className="text-xs text-ink-mute">
                        {r.durationMin}m
                      </span>
                    </button>
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        {title}
      </div>
      {children}
    </div>
  );
}
