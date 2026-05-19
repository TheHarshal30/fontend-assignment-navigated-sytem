import { useMemo } from "react";
import type { Course } from "../types";

interface Props {
  course: Course;
  transform: { x: number; y: number; k: number };
  viewport: { w: number; h: number };
  width?: number;
  height?: number;
}

/** Overview minimap: islands at low fidelity, viewport rectangle on top. */
export function Minimap({
  course,
  transform,
  viewport,
  width = 180,
  height = 130,
}: Props) {
  const scale = Math.min(width / course.width, height / course.height);
  const offsetX = (width - course.width * scale) / 2;
  const offsetY = (height - course.height * scale) / 2;

  const view = useMemo(() => {
    const x1 = -transform.x / transform.k;
    const y1 = -transform.y / transform.k;
    const x2 = x1 + viewport.w / transform.k;
    const y2 = y1 + viewport.h / transform.k;
    return {
      x: x1 * scale + offsetX,
      y: y1 * scale + offsetY,
      w: (x2 - x1) * scale,
      h: (y2 - y1) * scale,
    };
  }, [transform, viewport, scale, offsetX, offsetY]);

  return (
    <div className="paper-card rounded-lg p-1.5">
      <svg
        width={width}
        height={height}
        className="block rounded-md"
        style={{ background: "#ede4cd" }}
        aria-hidden
      >
        {course.topics.map((t) => (
          <g
            key={t.id}
            transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}
          >
            <path
              d={t.islandPath}
              fill={t.landFill}
              stroke={t.coast}
              strokeWidth={2 / scale}
              strokeLinejoin="round"
            />
          </g>
        ))}
        {course.resources.map((r) => (
          <circle
            key={r.id}
            cx={r.x * scale + offsetX}
            cy={r.y * scale + offsetY}
            r={1.4}
            fill="#2b2620"
            fillOpacity={0.55}
          />
        ))}
        <rect
          x={Math.max(0, view.x)}
          y={Math.max(0, view.y)}
          width={Math.min(width, view.w)}
          height={Math.min(height, view.h)}
          fill="#2563eb"
          fillOpacity={0.08}
          stroke="#2563eb"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
}
