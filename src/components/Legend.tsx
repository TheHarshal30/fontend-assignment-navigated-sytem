import { RESOURCE_TYPE_COLOR } from "./ResourceIcon";
import type { ResourceType } from "../types";

const TYPES: ResourceType[] = ["video", "doc", "quiz", "practice"];

export function Legend() {
  return (
    <div className="paper-card rounded-lg px-3 py-2 text-xs">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        Map Key
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center">
              <PinSwatch color={RESOURCE_TYPE_COLOR[t]} />
            </span>
            <span className="capitalize text-ink-dim">{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 space-y-1 border-t border-rule pt-2 text-ink-dim">
        <div className="flex items-center gap-1.5">
          <svg width="28" height="6" viewBox="0 0 28 6">
            <rect x="0" y="0" width="28" height="6" rx="3" fill="#c79b6b" />
            <rect x="1" y="1.5" width="26" height="3" rx="1.5" fill="#f4e1bb" />
          </svg>
          <span>Local road</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="28" height="6" viewBox="0 0 28 6">
            <rect x="0" y="0" width="28" height="6" rx="3" fill="#a35630" />
            <rect x="1" y="1.5" width="26" height="3" rx="1.5" fill="#e89a5a" />
          </svg>
          <span>Prerequisite (highway)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="28" height="6" viewBox="0 0 28 6">
            <line
              x1="0"
              y1="3"
              x2="28"
              y2="3"
              stroke="#2563eb"
              strokeWidth="2.4"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          </svg>
          <span>Your route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#15803d] bg-card text-[8px] font-bold text-[#15803d]">
            TA
          </span>
          <span>Teaching Assistant</span>
        </div>
      </div>
    </div>
  );
}

/** Tiny pin swatch using the same teardrop shape as the map pins. */
function PinSwatch({ color }: { color: string }) {
  return (
    <svg width="14" height="16" viewBox="-9 -22 18 24">
      <path
        d="M0 0 L-7.5 -14 A11 11 0 1 1 7.5 -14 Z"
        fill={color}
        stroke="#2b2620"
        strokeOpacity={0.45}
        strokeWidth={0.8}
      />
      <circle cx={0} cy={-13} r={3.5} fill="#fbf7ec" />
    </svg>
  );
}
