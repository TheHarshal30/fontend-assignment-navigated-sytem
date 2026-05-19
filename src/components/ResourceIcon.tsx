import type { ResourceType } from "../types";

interface Props {
  type: ResourceType;
  size?: number;
  className?: string;
}

/** Minimal flat icons rendered as SVG paths. Inherit currentColor. */
export function ResourceIcon({ type, size = 14, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (type) {
    case "video":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
          <path d="M14 3v5h5" />
          <path d="M8 13h8M8 17h6" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </svg>
      );
    case "practice":
      return (
        <svg {...common}>
          <path d="M14 4l6 6-9 9H5v-6l9-9z" />
          <path d="M13 5l6 6" />
        </svg>
      );
  }
}

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  video: "Video",
  doc: "Reading",
  quiz: "Quiz",
  practice: "Practice",
};

/* Map-pin palette: saturated enough to pop against cream paper. */
export const RESOURCE_TYPE_COLOR: Record<ResourceType, string> = {
  video: "#dc2626", // red
  doc: "#1d4ed8", // blue
  quiz: "#d97706", // amber
  practice: "#15803d", // green
};
