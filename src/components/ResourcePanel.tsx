import { AnimatePresence, motion } from "framer-motion";
import type { Course, Resource } from "../types";
import {
  RESOURCE_TYPE_COLOR,
  RESOURCE_TYPE_LABEL,
  ResourceIcon,
} from "./ResourceIcon";

interface Props {
  course: Course;
  resource: Resource | null;
  visited: boolean;
  onClose: () => void;
  onSelectResource: (id: string) => void;
}

export function ResourcePanel({
  course,
  resource,
  visited,
  onClose,
  onSelectResource,
}: Props) {
  return (
    <AnimatePresence>
      {resource && (
        <motion.aside
          key={resource.id}
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="paper-card pointer-events-auto absolute right-3 top-3 bottom-3 z-20 flex w-[340px] flex-col rounded-xl"
          role="dialog"
          aria-label={`Place card: ${resource.title}`}
        >
          <Body
            resource={resource}
            course={course}
            visited={visited}
            onClose={onClose}
            onSelectResource={onSelectResource}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Body({
  resource,
  course,
  visited,
  onClose,
  onSelectResource,
}: {
  resource: Resource;
  course: Course;
  visited: boolean;
  onClose: () => void;
  onSelectResource: (id: string) => void;
}) {
  const topic = course.topics.find((t) => t.id === resource.topicId)!;
  const color = RESOURCE_TYPE_COLOR[resource.type];
  const neighbors = new Set<string>();
  course.links.forEach((l) => {
    if (l.source === resource.id) neighbors.add(l.target);
    if (l.target === resource.id) neighbors.add(l.source);
  });
  const related = course.resources.filter(
    (r) =>
      r.id !== resource.id &&
      (r.topicId === resource.topicId || neighbors.has(r.id))
  );

  return (
    <>
      <header
        className="flex items-start justify-between gap-2 rounded-t-xl border-b border-rule px-4 py-3"
        style={{
          background: `linear-gradient(180deg, ${topic.landFill}55, transparent)`,
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-dim">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-ink/10"
              style={{ background: topic.coast }}
            />
            <span className="truncate">{topic.title}</span>
          </div>
          <h3
            className="mt-1 truncate text-base font-semibold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {resource.title}
          </h3>
        </div>
        <button
          type="button"
          aria-label="Close preview"
          onClick={onClose}
          className="rounded-md p-1 text-ink-dim hover:bg-card-2 hover:text-ink"
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
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-ink/10"
            style={{ background: `${color}1f`, color }}
          >
            <ResourceIcon type={resource.type} size={16} />
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
            <span
              className="rounded-md px-2 py-0.5 font-medium"
              style={{ background: `${color}22`, color }}
            >
              {RESOURCE_TYPE_LABEL[resource.type]}
            </span>
            <span className="rounded-md bg-card-2 px-2 py-0.5">
              {resource.durationMin} min
            </span>
            <span className="rounded-md bg-card-2 px-2 py-0.5">
              {["Intro", "Core", "Advanced"][resource.difficulty - 1]}
            </span>
            {visited && (
              <span className="rounded-md bg-accent-2/15 px-2 py-0.5 font-medium text-accent-2">
                Visited
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-ink-dim">{resource.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-md bg-accent-2 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-2/90"
            onClick={() => onSelectResource(resource.id)}
          >
            {visited ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            className="rounded-md border border-rule bg-card-2 px-3 py-2 text-sm font-medium text-ink-dim hover:text-ink"
            onClick={onClose}
          >
            Keep exploring
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Nearby
          </div>
          <ul className="space-y-1">
            {related.slice(0, 6).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-card-2"
                  onClick={() => onSelectResource(r.id)}
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
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {r.title}
                  </span>
                  <span className="text-xs text-ink-mute">
                    {r.durationMin}m
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
