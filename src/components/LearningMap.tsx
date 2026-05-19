import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { Course, JourneyEntry, Resource } from "../types";
import { RESOURCE_TYPE_COLOR, ResourceIcon } from "./ResourceIcon";

interface Props {
  course: Course;
  journey: JourneyEntry[];
  selectedId: string | null;
  highlightedIds: Set<string>; // dimmed-out non-matches when set is non-empty
  onSelectResource: (id: string) => void;
  onCloseResource: () => void;
  onTransformChange?: (t: { x: number; y: number; k: number }) => void;
  onViewportChange?: (v: { w: number; h: number }) => void;
  onRegisterControls?: (controls: MapControls) => void;
}

export interface MapControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusResource: (id: string) => void;
  focusTopic: (id: string) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.2;

/* Level-of-detail breakpoints */
const LOD = {
  showResourceDots: 0.45,
  showResourceColor: 0.7,
  showResourcePins: 1.1,
  showResourceLabels: 1.55,
  showTAs: 0.65,
  showCrossLinks: 0.55,
  showInnerContour: 0.85,
  showLandPattern: 0.6,
} as const;

export function LearningMap({
  course,
  journey,
  selectedId,
  highlightedIds,
  onSelectResource,
  onCloseResource,
  onTransformChange,
  onViewportChange,
  onRegisterControls,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ w: 800, h: 600 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const resourceById = useMemo(() => {
    const m = new Map<string, Resource>();
    course.resources.forEach((r) => m.set(r.id, r));
    return m;
  }, [course.resources]);

  const journeyArr = journey; // sorted by visit time (chronological)
  const lastVisit = journeyArr.length > 0 ? journeyArr[journeyArr.length - 1] : null;
  const youAreHere = lastVisit ? resourceById.get(lastVisit.resourceId) : null;

  const journeySet = useMemo(
    () => new Set(journey.map((j) => j.resourceId)),
    [journey]
  );
  const journeyRecency = useMemo(() => {
    const map = new Map<string, number>();
    if (journey.length === 0) return map;
    const sorted = [...journey].sort((a, b) => b.visitedAt - a.visitedAt);
    sorted.forEach((j, i) => {
      map.set(j.resourceId, 1 - i / Math.max(1, sorted.length));
    });
    return map;
  }, [journey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const next = { w: r.width, h: r.height };
      setViewport(next);
      onViewportChange?.(next);
    });
    obs.observe(el);
    const r = el.getBoundingClientRect();
    const initial = { w: r.width, h: r.height };
    setViewport(initial);
    onViewportChange?.(initial);
    return () => obs.disconnect();
  }, [onViewportChange]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .filter((event) => {
        if (event.type === "dblclick") return false;
        return !event.button;
      })
      .on("zoom", (event) => {
        const t = event.transform;
        const next = { x: t.x, y: t.y, k: t.k };
        setTransform(next);
        onTransformChange?.(next);
      });
    svg.call(zoom);
    svg.on("dblclick.zoom", null);
    zoomBehaviorRef.current = zoom;
    return () => {
      svg.on(".zoom", null);
    };
  }, [onTransformChange]);

  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (viewport.w === 0 || !svgRef.current || !zoomBehaviorRef.current) return;
    const fitScale = Math.min(
      viewport.w / (course.width * 0.55),
      viewport.h / (course.height * 0.55)
    );
    const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitScale));
    const x = viewport.w / 2 - course.center.x * k;
    const y = viewport.h / 2 - course.center.y * k;
    const t = d3.zoomIdentity.translate(x, y).scale(k);
    d3.select(svgRef.current)
      .transition()
      .duration(600)
      .call(zoomBehaviorRef.current.transform, t);
    didInitialFit.current = true;
  }, [viewport, course]);

  const focusPoint = useCallback(
    (x: number, y: number, targetK?: number) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const k = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, targetK ?? Math.max(transform.k, 1.6))
      );
      const tx = viewport.w / 2 - x * k;
      const ty = viewport.h / 2 - y * k;
      d3.select(svgRef.current)
        .transition()
        .duration(700)
        .ease(d3.easeCubicInOut)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(tx, ty).scale(k)
        );
    },
    [viewport, transform.k]
  );

  useEffect(() => {
    if (!onRegisterControls) return;
    onRegisterControls({
      zoomIn: () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current)
          .transition()
          .duration(220)
          .call(zoomBehaviorRef.current.scaleBy, 1.5);
      },
      zoomOut: () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current)
          .transition()
          .duration(220)
          .call(zoomBehaviorRef.current.scaleBy, 1 / 1.5);
      },
      reset: () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const fitScale = Math.min(
          viewport.w / (course.width * 0.55),
          viewport.h / (course.height * 0.55)
        );
        const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitScale));
        const x = viewport.w / 2 - course.center.x * k;
        const y = viewport.h / 2 - course.center.y * k;
        d3.select(svgRef.current)
          .transition()
          .duration(500)
          .call(
            zoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(x, y).scale(k)
          );
      },
      focusResource: (id) => {
        const r = resourceById.get(id);
        if (!r) return;
        focusPoint(r.x, r.y, 2.0);
      },
      focusTopic: (id) => {
        const t = course.topics.find((tp) => tp.id === id);
        if (!t) return;
        focusPoint(t.x, t.y, 1.1);
      },
    });
  }, [onRegisterControls, viewport, course, resourceById, focusPoint]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseResource();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCloseResource]);

  const journeyPath = useMemo(() => {
    if (journey.length < 2) return null;
    const points = journey
      .map((j) => resourceById.get(j.resourceId))
      .filter((r): r is Resource => !!r);
    if (points.length < 2) return null;
    const line = d3
      .line<Resource>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCatmullRom.alpha(0.6));
    return line(points) ?? null;
  }, [journey, resourceById]);

  const k = transform.k;
  const dimmed = highlightedIds.size > 0;

  /* Inverse-scaled stroke widths for crisp rendering at any zoom. */
  const sw = (w: number) => w / k;

  return (
    <div
      ref={containerRef}
      className="map-surface relative h-full w-full select-none overflow-hidden"
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="block cursor-grab active:cursor-grabbing"
        role="application"
        aria-label="Interactive learning map. Use mouse wheel to zoom, drag to pan."
      >
        <defs>
          {/* Subtle vignette over edges of the paper */}
          <radialGradient id="paper-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="60%" stopColor="black" stopOpacity={0} />
            <stop offset="100%" stopColor="#5a4626" stopOpacity={0.15} />
          </radialGradient>
          {/* Soft drop shadow for pins */}
          <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
            <feOffset dy="1.2" result="off" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.45" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Subtle land texture (tiny dots) — applied lightly at high zoom */}
          <pattern
            id="land-grain"
            x="0"
            y="0"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.6" fill="#8a6b3a" fillOpacity="0.18" />
            <circle cx="7" cy="6" r="0.5" fill="#8a6b3a" fillOpacity="0.14" />
          </pattern>
        </defs>

        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {/* Topic landmasses (islands) */}
          <g>
            {course.topics.map((t) => (
              <g key={t.id}>
                {/* shoreline halo: a slightly larger blurred ring under the island */}
                <path
                  d={t.islandPath}
                  fill="#e7d8b3"
                  stroke="#c79b6b"
                  strokeWidth={sw(7)}
                  strokeOpacity={0.18}
                  strokeLinejoin="round"
                  transform={`translate(${t.x}, ${t.y}) scale(1.04) translate(${-t.x}, ${-t.y})`}
                />
                {/* main land */}
                <path
                  d={t.islandPath}
                  fill={t.landFill}
                  stroke={t.coast}
                  strokeWidth={sw(2.4)}
                  strokeLinejoin="round"
                />
                {/* subtle textured layer at higher zoom */}
                {k >= LOD.showLandPattern && (
                  <path
                    d={t.islandPath}
                    fill="url(#land-grain)"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {/* inner contour ring (elevation suggestion) */}
                {k >= LOD.showInnerContour && (
                  <path
                    d={t.innerPath}
                    fill="none"
                    stroke={t.coast}
                    strokeOpacity={0.45}
                    strokeWidth={sw(1)}
                    strokeDasharray={`${sw(3)} ${sw(3)}`}
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </g>
            ))}
          </g>

          {/* Roads (sequence links) and highways (cross-topic prereqs) */}
          <g>
            {/* Render road outlines first, then road fills on top — gives clean intersections */}
            {course.links.map((link, i) => {
              const s = resourceById.get(link.source);
              const t = resourceById.get(link.target);
              if (!s || !t) return null;
              const isCross = link.kind === "prereq";
              if (isCross && k < LOD.showCrossLinks) return null;
              return (
                <line
                  key={`edge-${i}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={isCross ? "#a35630" : "#c79b6b"}
                  strokeWidth={sw(isCross ? 8 : 7)}
                  strokeLinecap="round"
                  strokeOpacity={1}
                />
              );
            })}
            {course.links.map((link, i) => {
              const s = resourceById.get(link.source);
              const t = resourceById.get(link.target);
              if (!s || !t) return null;
              const isCross = link.kind === "prereq";
              if (isCross && k < LOD.showCrossLinks) return null;
              return (
                <line
                  key={`road-${i}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={isCross ? "#e89a5a" : "#f4e1bb"}
                  strokeWidth={sw(isCross ? 5 : 4.5)}
                  strokeLinecap="round"
                  strokeDasharray={isCross ? `${sw(7)} ${sw(5)}` : undefined}
                />
              );
            })}
          </g>

          {/* Journey trail — drawn as a dashed travel route */}
          {journeyPath && (
            <g>
              <path
                d={journeyPath}
                fill="none"
                stroke="#93c5fd"
                strokeOpacity={0.35}
                strokeWidth={sw(10)}
                strokeLinecap="round"
              />
              <path
                d={journeyPath}
                fill="none"
                stroke="#2563eb"
                strokeOpacity={0.95}
                strokeWidth={sw(2.4)}
                strokeDasharray={`${sw(9)} ${sw(6)}`}
                strokeLinecap="round"
                className="trail-anim"
                style={{ strokeDashoffset: 0 }}
              />
            </g>
          )}

          {/* Resource pins */}
          <g>
            {course.resources.map((r) => {
              const visited = journeySet.has(r.id);
              const recency = journeyRecency.get(r.id) ?? 0;
              const isSelected = selectedId === r.id;
              const isHovered = hoveredId === r.id;
              const dimThis = dimmed && !highlightedIds.has(r.id);
              const opacity = dimThis ? 0.16 : 1;
              const pinColor = RESOURCE_TYPE_COLOR[r.type];

              return (
                <g
                  key={r.id}
                  transform={`translate(${r.x},${r.y})`}
                  opacity={opacity}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectResource(r.id);
                  }}
                  onMouseEnter={() => setHoveredId(r.id)}
                  onMouseLeave={() =>
                    setHoveredId((cur) => (cur === r.id ? null : cur))
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`${r.type}: ${r.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectResource(r.id);
                    }
                  }}
                >
                  {k < LOD.showResourcePins ? (
                    <SimpleDot
                      color={
                        k < LOD.showResourceColor
                          ? course.topics.find((t) => t.id === r.topicId)!.coast
                          : pinColor
                      }
                      r={k < LOD.showResourceDots ? sw(4) : sw(6)}
                      sw={sw}
                      visited={visited}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      recency={recency}
                    />
                  ) : (
                    <Pin
                      color={pinColor}
                      type={r.type}
                      sw={sw}
                      visited={visited}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      recency={recency}
                    />
                  )}

                  {k >= LOD.showResourceLabels && (
                    <g transform={`translate(0, ${sw(6)})`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="hanging"
                        fontSize={11}
                        fontWeight={500}
                        fill="#2b2620"
                        className="cartouche"
                        stroke="#f3ead2"
                        strokeWidth={3.5}
                        strokeOpacity={0.95}
                        style={{ pointerEvents: "none" }}
                      >
                        {r.title}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* "You are here" marker — over the most recent journey resource */}
          {youAreHere && (
            <g
              transform={`translate(${youAreHere.x},${youAreHere.y})`}
              style={{ pointerEvents: "none" }}
            >
              <circle r={sw(22)} fill="#2563eb" fillOpacity={0.18} className="pulse-ring" />
              <circle r={sw(22)} fill="none" stroke="#2563eb" strokeOpacity={0.6} strokeWidth={sw(1.5)} />
              <g transform={`translate(${sw(20)}, ${sw(-32)})`}>
                <rect
                  x={0}
                  y={0}
                  width={84}
                  height={22}
                  rx={4}
                  fill="#2563eb"
                  filter="url(#pin-shadow)"
                />
                <text
                  x={42}
                  y={15}
                  fontSize={11}
                  fontWeight={600}
                  fill="#fff"
                  textAnchor="middle"
                  letterSpacing={0.4}
                >
                  YOU ARE HERE
                </text>
              </g>
            </g>
          )}

          {/* TA markers */}
          {k >= LOD.showTAs && (
            <g>
              {course.tas.map((ta) => {
                const dimThis = dimmed;
                return (
                  <g
                    key={ta.id}
                    transform={`translate(${ta.x},${ta.y})`}
                    opacity={dimThis ? 0.3 : 1}
                  >
                    <title>
                      {ta.name} — {ta.expertise}
                      {ta.available ? "" : " (away)"}
                    </title>
                    <circle
                      r={sw(14)}
                      fill="#fbf7ec"
                      stroke={ta.available ? "#15803d" : "#978c75"}
                      strokeWidth={sw(1.8)}
                      filter="url(#pin-shadow)"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      fontWeight={700}
                      fill={ta.available ? "#15803d" : "#6b6353"}
                      style={{ pointerEvents: "none" }}
                    >
                      TA
                    </text>
                    {ta.available && (
                      <circle
                        cx={sw(10)}
                        cy={sw(-10)}
                        r={sw(3.5)}
                        fill="#15803d"
                        stroke="#fbf7ec"
                        strokeWidth={sw(1.2)}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Topic labels — cartouche style: serif title sitting on a translucent plate */}
          <g>
            {course.topics.map((t) => {
              const labelY = t.y - t.clusterRadius - 22 / k;
              const fontSize = Math.max(14, Math.min(26, 18 / Math.max(0.6, k)));
              const subSize = Math.max(9, Math.min(12, 10 / Math.max(0.65, k)));
              const showSubtitle = k >= 0.65;
              const subY = fontSize + 2;
              const title = t.title.toUpperCase();
              const letterSpace = 1.4 / Math.max(0.6, k);
              return (
                <g
                  key={t.id}
                  transform={`translate(${t.x}, ${labelY})`}
                  style={{ pointerEvents: "none" }}
                >
                  <text
                    textAnchor="middle"
                    fontFamily="var(--font-display)"
                    fontSize={fontSize}
                    fontWeight={400}
                    fill={t.coast}
                    letterSpacing={letterSpace}
                    className="cartouche"
                    stroke="#f3ead2"
                    strokeWidth={5}
                    strokeOpacity={0.92}
                  >
                    {title}
                  </text>
                  {showSubtitle && (
                    <text
                      y={subY}
                      textAnchor="middle"
                      fontSize={subSize}
                      fill="#6b6353"
                      letterSpacing={letterSpace * 1.5}
                      className="cartouche"
                      stroke="#f3ead2"
                      strokeWidth={3.5}
                      strokeOpacity={0.92}
                    >
                      {course.resources.filter((r) => r.topicId === t.id).length}{" "}
                      RESOURCES
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>

        {/* Paper vignette overlay — outside zoom group, fills viewport */}
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="url(#paper-vignette)"
          style={{ pointerEvents: "none" }}
        />
      </svg>

      {/* Hover tooltip (HTML overlay for nicer typography) */}
      {hoveredId && (
        <HoverTip
          resource={resourceById.get(hoveredId)!}
          transform={transform}
          viewport={viewport}
        />
      )}
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

interface PinProps {
  color: string;
  type: Resource["type"];
  sw: (w: number) => number;
  visited: boolean;
  isSelected: boolean;
  isHovered: boolean;
  recency: number;
}

/** Map pin (teardrop) anchored with tip at (0,0). Head centered ~(-0,-22). */
function Pin({
  color,
  type,
  sw,
  visited,
  isSelected,
  isHovered,
  recency,
}: PinProps) {
  // Tip at (0,0); head circle radius 11 centered at (0,-22).
  // Using a single path with arc for smooth pin shape.
  const PIN_PATH =
    "M0 0 L-7.5 -14 A11 11 0 1 1 7.5 -14 Z";
  return (
    <g>
      {/* Selection pulse ring around the head */}
      {isSelected && (
        <circle
          cx={0}
          cy={-22}
          r={16}
          fill="none"
          stroke="#2563eb"
          strokeOpacity={0.9}
          strokeWidth={sw(2)}
          className="pulse-ring"
        />
      )}
      {/* Hover halo */}
      {isHovered && !isSelected && (
        <circle
          cx={0}
          cy={-22}
          r={16}
          fill="none"
          stroke="#2b2620"
          strokeOpacity={0.25}
          strokeWidth={sw(1.6)}
        />
      )}
      {/* Visited recency ring */}
      {visited && (
        <circle
          cx={0}
          cy={-22}
          r={15}
          fill="none"
          stroke="#2563eb"
          strokeOpacity={0.25 + recency * 0.55}
          strokeWidth={sw(1.6)}
          strokeDasharray={`${sw(2)} ${sw(2)}`}
        />
      )}

      {/* Pin body */}
      <path
        d={PIN_PATH}
        fill={color}
        stroke="#2b2620"
        strokeOpacity={0.45}
        strokeWidth={sw(1.2)}
        filter="url(#pin-shadow)"
      />
      {/* Pin head inset (so the icon reads cleanly) */}
      <circle cx={0} cy={-22} r={7} fill="#fbf7ec" />
      <g transform="translate(-6, -28)" style={{ color }}>
        <ResourceIcon type={type} size={12} />
      </g>
    </g>
  );
}

interface DotProps {
  color: string;
  r: number;
  sw: (w: number) => number;
  visited: boolean;
  isSelected: boolean;
  isHovered: boolean;
  recency: number;
}

/** Compact circular marker for low zoom levels. */
function SimpleDot({
  color,
  r,
  sw,
  visited,
  isSelected,
  isHovered,
  recency,
}: DotProps) {
  return (
    <g>
      {isSelected && (
        <circle
          r={r + sw(4)}
          fill="none"
          stroke="#2563eb"
          strokeOpacity={0.9}
          strokeWidth={sw(2)}
          className="pulse-ring"
        />
      )}
      {visited && (
        <circle
          r={r + sw(3)}
          fill="none"
          stroke="#2563eb"
          strokeOpacity={0.25 + recency * 0.55}
          strokeWidth={sw(1.6)}
        />
      )}
      {isHovered && !isSelected && (
        <circle
          r={r + sw(4)}
          fill="none"
          stroke="#2b2620"
          strokeOpacity={0.3}
          strokeWidth={sw(1.5)}
        />
      )}
      <circle
        r={r}
        fill={color}
        stroke="#2b2620"
        strokeOpacity={0.5}
        strokeWidth={sw(1)}
      />
    </g>
  );
}

function HoverTip({
  resource,
  transform,
  viewport,
}: {
  resource: Resource;
  transform: Transform;
  viewport: { w: number; h: number };
}) {
  const sx = resource.x * transform.k + transform.x;
  const sy = resource.y * transform.k + transform.y;
  const above = sy > 100;
  const top = above ? sy - 40 : sy + 24;
  const left = Math.max(8, Math.min(viewport.w - 240, sx + 14));
  return (
    <div
      className="paper-card pointer-events-none absolute z-10 max-w-[240px] rounded-md px-2.5 py-1.5 text-xs text-ink"
      style={{ top, left }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-dim">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: RESOURCE_TYPE_COLOR[resource.type] }}
        />
        {resource.type} • {resource.durationMin} min
      </div>
      <div className="mt-0.5 text-sm font-medium leading-snug">
        {resource.title}
      </div>
    </div>
  );
}
