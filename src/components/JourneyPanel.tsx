import { AnimatePresence, motion } from "framer-motion";
import type { Course, JourneyEntry } from "../types";
import { RESOURCE_TYPE_COLOR, ResourceIcon } from "./ResourceIcon";

interface Props {
  open: boolean;
  course: Course;
  journey: JourneyEntry[];
  onSelectResource: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function JourneyPanel({
  open,
  course,
  journey,
  onSelectResource,
  onClear,
  onClose,
}: Props) {
  const resourceById = new Map(course.resources.map((r) => [r.id, r]));
  const topicById = new Map(course.topics.map((t) => [t.id, t]));
  const sorted = [...journey].sort((a, b) => b.visitedAt - a.visitedAt);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -340, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="paper-card absolute left-3 top-3 bottom-3 z-20 flex w-[300px] flex-col rounded-xl"
          role="complementary"
          aria-label="Travel log"
        >
          <header className="flex items-center justify-between rounded-t-xl border-b border-rule bg-card-2/60 px-4 py-3">
            <div>
              <h3
                className="text-sm font-semibold tracking-wide text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Travel Log
              </h3>
              <p className="text-xs text-ink-dim">
                {journey.length === 0
                  ? "No stops yet — start exploring"
                  : `${journey.length} ${journey.length === 1 ? "stop" : "stops"} so far`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {journey.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-md px-2 py-1 text-xs text-ink-dim hover:bg-card hover:text-ink"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close travel log"
                className="rounded-md p-1 text-ink-dim hover:bg-card hover:text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          <div className="relative flex-1 overflow-y-auto px-3 py-3">
            {sorted.length === 0 ? (
              <EmptyState />
            ) : (
              <ol className="relative space-y-1.5 pl-5">
                <span
                  className="absolute left-[10px] top-2 bottom-2 w-px border-l border-dashed border-rule-strong"
                  aria-hidden
                />
                {sorted.map((entry, i) => {
                  const r = resourceById.get(entry.resourceId);
                  if (!r) return null;
                  const t = topicById.get(r.topicId)!;
                  return (
                    <li
                      key={`${entry.resourceId}-${entry.visitedAt}`}
                      className="relative"
                    >
                      <span
                        className="absolute -left-[18px] top-2.5 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-card"
                        style={{ background: t.coast }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => onSelectResource(r.id)}
                        className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-card-2"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-mute">
                          <span
                            style={{ color: RESOURCE_TYPE_COLOR[r.type] }}
                            className="inline-flex"
                          >
                            <ResourceIcon type={r.type} size={11} />
                          </span>
                          <span>{r.type}</span>
                          <span>•</span>
                          <span>{relativeTime(entry.visitedAt)}</span>
                          {i === 0 && (
                            <span className="ml-1 rounded bg-accent-2/15 px-1 py-px font-semibold text-accent-2">
                              latest
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-ink">
                          {r.title}
                        </div>
                        <div className="text-xs text-ink-dim">{t.title}</div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center px-4 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-card-2 text-ink-dim">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a10 10 0 100 20 10 10 0 000-20z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M16 8l-3.5 5L9 11l-1 5 5-1 6-7-3 0z"
              fill="currentColor"
              fillOpacity={0.6}
            />
          </svg>
        </div>
        <p className="text-sm text-ink-dim">
          Drop a pin by visiting any resource. Stops will appear here as you
          travel.
        </p>
      </div>
    </div>
  );
}
