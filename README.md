# Gooru Learning Navigator

An interactive learning map that treats a course as a navigable space — not a list of pages. Inspired by Google Maps: topics form regions, resources sit as points of interest within them, paths connect them, and the learner's history is drawn as a trail across the map.

Built with **React + TypeScript + D3.js + Tailwind + Framer Motion**. No backend; mock data lives in [src/data/course.ts](src/data/course.ts).

## Demo

![Gooru Learning Navigator demo](media/demo.gif)

A scripted walkthrough: welcome card → zoom in → hover a pin → open the place card → jump to a related place → search "tree" → open the travel log → reset view. Higher-quality MP4: [media/demo.mp4](media/demo.mp4). Re-record at any time with `pnpm record` (drives the live dev server with Playwright, re-encodes via the bundled ffmpeg).

---

## Run locally

Requires Node 18+ and `pnpm` (or `npm` — substitute commands).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # production build into dist/
pnpm preview      # serve the production build
```

---

## What's in the map

A single mock course — **Introduction to Computer Science** — with 6 topic regions arranged radially. Each region contains 5–6 resources (videos, readings, quizzes, practice activities) and a TA marker. Sequence links draw inside each topic; dashed prerequisite links cross between topics to show that the curriculum is a graph, not a list.

The visual language is a paper cartographic map — cream paper background, hand-drawn-looking islands, roads, and pins.

| Layer              | Visual encoding                                                                  |
| ------------------ | -------------------------------------------------------------------------------- |
| Topic region       | Irregular landmass with a colored coastline (Catmull-Rom-closed polygon over noisy radial points, seeded so shapes are stable across reloads). An inner contour appears at higher zoom. |
| Resource           | Map pin (teardrop) at high zoom, colored by type. Collapses to a topic-tinted dot then a type-tinted dot at lower zooms. |
| TA marker          | Cream circular badge labelled `TA` with a green "available" dot                  |
| Sequence link      | Beige road with a darker brown casing — like a paper-map local road              |
| Prerequisite link  | Dashed terracotta highway — visually distinct because prereqs cross regions      |
| Journey trail      | Dashed blue travel route with marching-ants animation                            |
| "You are here"     | Blue label flag + pulsing ring around the most recently visited pin              |
| Visited pin        | Indigo dashed recency ring; opacity scales with how recently it was visited      |
| Topic label        | Serif (DM Serif Display), all-caps, letter-spaced, with a paper-colored halo so it sits cleanly on land |

---

## Component structure

```
src/
├── App.tsx                      # Layout shell, global state, keyboard shortcuts
├── data/course.ts               # Mock course → topics, resources, TAs, links
├── types.ts                     # Domain types (Course, Topic, Resource, …)
├── hooks/useJourney.ts          # Journey history (localStorage persisted)
├── components/
│   ├── LearningMap.tsx          # SVG canvas, d3-zoom, LOD, journey trail
│   ├── ResourcePanel.tsx        # Right-side preview panel (Part 3)
│   ├── JourneyPanel.tsx         # Left-side history timeline (Part 4)
│   ├── SearchBar.tsx            # Search + type filter (Part 5)
│   ├── Minimap.tsx              # Overview minimap (Part 5)
│   ├── Legend.tsx               # Legend
│   └── ResourceIcon.tsx         # Resource-type icons + color tokens
```

State is local to `App.tsx`. No external store — the surface is small enough that lifting state to a single component keeps the data flow easy to follow.

---

## Design decisions

### Why a radial layout with a cartographic visual language?

Two decisions, separate but reinforcing.

**The radial *layout*** treats topics as peers around a conceptual center:

- **No implied ordering between topics** — they all sit at the same distance from the center, so the map doesn't read as a linear "left to right" sequence.
- **Each topic has its own neighborhood.** Sequence links inside a topic draw short, readable arcs.
- **Prerequisite links across topics** become long edges that visibly cross the map — they read as exceptions, not noise.
- **Spatial memory works.** After a few sessions, "data structures is at the top-right" sticks the same way neighborhoods stick on a city map.

A force-directed graph was the alternative. I rejected it because the layout is non-deterministic and undercuts spatial memory.

**The cartographic *visual language*** — landmasses, coastlines, roads, pins — is the part that makes the map *feel* like a map rather than a graph diagram on a dashboard. It's deliberate skeuomorphism for one purpose: the brief uses Google Maps as the mental model, and a real map's affordances (pan, zoom, locate, plan a route) are immediately legible because everyone already knows how to use one. Generic colored circles on dark UI would have technically satisfied the brief; this is what makes the metaphor *click* on first look.

### Zoom-based level of detail

I chose four LOD breakpoints based on the current zoom scale `k` (see the `LOD` table in [LearningMap.tsx](src/components/LearningMap.tsx)):

| Zoom range  | What's shown                                                       |
| ----------- | ------------------------------------------------------------------ |
| `k < 0.45`  | Just topic regions + topic labels. Resources are invisible.        |
| `0.45 – 0.7` | Resources appear as small dots colored by their topic.            |
| `0.7 – 1.1` | Dots recolor to their resource *type* (video / doc / quiz / practice). TAs appear. |
| `1.1 – 1.55` | Dots become icon nodes — easier to read and click.               |
| `k ≥ 1.55`  | Resource titles appear under each node, prerequisite links visible.|

Strokes, dashes, and the journey trail are all divided by `k` so they stay visually constant regardless of zoom. Topic labels are sized inversely to zoom (clamped) so they stay legible without ever ballooning.

Transitions: every zoom action (button, search jump, double-click etc.) uses `d3.transition().ease(easeCubicInOut)`, so panning and scaling feel continuous instead of snapping.

### Resource interaction (Part 3)

Two-tier preview:

1. **Hover** → lightweight paper-card tooltip with type, title, and duration. Stays out of the way.
2. **Click / Enter** → right-hand "place card" slides in with full description, metadata, a primary action, and a **"Nearby"** list. The map stays interactive behind it; clicking another resource smoothly transitions both the card and the camera focus to the new place.

**Nearby = recommendations.** That list is the system's contextual recommendation surface: same-topic resources plus direct graph neighbors (sequence + prerequisite links). It's deliberately *spatial-adjacent* rather than algorithmic — the metaphor for the learner is "what's around this place" rather than "what the algorithm thinks you'll like."

The panel never overlays the center of the map, so the learner can keep navigating while reading.

### Learning journey visualization (Part 4)

Two complementary views of the same data:

- **On the map**: a dashed blue travel route (Catmull-Rom curve through visited resources, in order) with marching-ants animation so it's clearly directional. The most recent stop gets a **"YOU ARE HERE" flag** and a pulsing ring. Every visited pin has an indigo dashed recency ring whose opacity scales with how recently it was visited — older stops literally fade.
- **In the side panel** (toggle with `J` or the "Log" button): a vertical **Travel Log** of stops, newest first, with relative timestamps and a dashed route line tying them together. Clicking a stop snaps the camera back to it.

The journey persists in `localStorage`, so reloading the page preserves the trail.

### UI/UX improvement (Part 5)

I built **three small improvements that compound into one workflow**:

1. **Search + type filter.** Press `/` to search topics and resources. Type filter chips (video / doc / quiz / practice) dim all non-matching nodes on the map — you can immediately *see* where the quizzes are, not just list them. The chips double as a lightweight **comparison** tool: toggle two types on and you can visually compare their distribution across regions ("most of the practice is in Algorithms and Data Structures, but Computer Systems has none").
2. **Minimap.** Bottom-right overview, with a viewport rectangle that tracks where you are. Solves the "I'm zoomed in and lost" problem without forcing a zoom-out.
3. **Onboarding card + keyboard shortcuts.** First visit shows a 6-line legend explaining the metaphor and the shortcuts. The most impactful ones (`/` to search, `J` for journey, `+/-/0` for zoom, `Esc` to close) are discoverable from a `?` button in the header.

**Problem they solve:** spatial UIs are powerful but unfamiliar. Learners need (a) a way to find content without panning around blindly, (b) constant awareness of where they are, and (c) a fast onramp the first time they see it. Search + minimap + onboarding hit all three.

---

## Design assumptions

- **One course, one viewer.** No multi-course switching, no auth.
- **Mock data is the source of truth.** Position is computed deterministically from a small declarative spec — no force layout, no server.
- **Mid-density.** ~6 topics × 5–6 resources. The same component scales to ~10× by adjusting `clusterRadius` and zoom breakpoints; beyond that you'd want a different layout strategy (semantic clustering, virtualized rendering).
- **Resources are atomic.** Clicking one "visits" it. In a real system there'd be progress states (started / completed / mastered) — the model in `types.ts` is ready for those, but I kept the UI binary to keep the demo focused.
- **Light cartographic theme.** The whole palette is tuned for cream paper. Dark mode would be a separate palette, not a CSS class flip.

---

## Tradeoffs & things I deliberately didn't do

- **No force layout / physics.** Determinism + spatial memory matter more here than organic-looking edges.
- **SVG, not Canvas.** With ~30 nodes, SVG gives me CSS animations, focusable elements, and easy text rendering for free. A Canvas + quadtree approach would only pay off at hundreds of nodes.
- **No virtualized list inside the journey panel.** It would never be long enough to matter.
- **No global state library.** Plain React state was sufficient for this surface; reaching for Zustand/Redux would add ceremony without clarity gains.
- **TA interactions are minimal** (tooltip only). The brief described TAs as "support landmarks rather than content items," so I treated them as wayfinding, not a click-through.

---

## Keyboard shortcuts

| Key         | Action                       |
| ----------- | ---------------------------- |
| `/`         | Focus search                 |
| `J`         | Toggle journey panel         |
| `+` / `-`   | Zoom in / out                |
| `0`         | Reset view                   |
| `Esc`       | Close preview                |
| `?`         | Show onboarding card         |
| `Enter` / `Space` | Open the focused resource (when a node has keyboard focus) |
