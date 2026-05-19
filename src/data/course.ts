import * as d3 from "d3";
import type {
  Course,
  PathLink,
  Resource,
  ResourceType,
  TeachingAssistant,
  Topic,
} from "../types";

/* Deterministic PRNG so island shapes are stable across reloads. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function islandPath(
  cx: number,
  cy: number,
  baseR: number,
  seed: number,
  pts = 28,
  noise = 0.22
): string {
  const rng = mulberry32(seed);
  const points: [number, number][] = [];
  // Mix two harmonics so the outline isn't uniformly bumpy.
  const phase = rng() * Math.PI * 2;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const wave =
      Math.sin(a * 3 + phase) * 0.45 + Math.sin(a * 5 + phase * 0.7) * 0.25;
    const jitter = (rng() * 2 - 1) * 0.4;
    const r = baseR * (1 + (wave + jitter) * noise);
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const line = d3
    .line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(d3.curveCatmullRomClosed.alpha(0.6));
  return line(points) ?? "";
}

const CENTER = { x: 1000, y: 720 };
const TOPIC_RING_RADIUS = 380;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 1440;

interface TopicSpec {
  id: string;
  title: string;
  summary: string;
  /** Primary identity / coastline color. */
  color: string;
  /** Land fill (lighter pastel for the map). */
  landFill: string;
  /** Coast outline (darker than landFill). */
  coast: string;
  resources: Array<{
    id: string;
    type: ResourceType;
    title: string;
    description: string;
    durationMin: number;
    difficulty: 1 | 2 | 3;
  }>;
  ta: { id: string; name: string; expertise: string; available: boolean };
}

const TOPIC_SPECS: TopicSpec[] = [
  {
    id: "ct",
    title: "Computational Thinking",
    summary:
      "Decomposition, pattern recognition, abstraction, and algorithmic thinking — the mental model behind every problem you'll solve.",
    color: "#5e7c8f",
    landFill: "#c2d5e0",
    coast: "#5e7c8f",
    ta: {
      id: "ta-ct",
      name: "Maya R.",
      expertise: "Problem decomposition",
      available: true,
    },
    resources: [
      {
        id: "ct-1",
        type: "video",
        title: "Thinking in Steps",
        description:
          "A 7-minute primer on how to decompose problems before writing a single line of code.",
        durationMin: 7,
        difficulty: 1,
      },
      {
        id: "ct-2",
        type: "doc",
        title: "Abstraction & Models",
        description:
          "Short reading on how programmers build mental models that ignore detail and amplify structure.",
        durationMin: 10,
        difficulty: 1,
      },
      {
        id: "ct-3",
        type: "practice",
        title: "Pattern Hunt",
        description:
          "Five small puzzles that reward you for spotting repetition and symmetry.",
        durationMin: 15,
        difficulty: 2,
      },
      {
        id: "ct-4",
        type: "quiz",
        title: "Concept Check",
        description: "Quick 8-question check before moving on.",
        durationMin: 6,
        difficulty: 1,
      },
      {
        id: "ct-5",
        type: "doc",
        title: "From Problem to Algorithm",
        description:
          "A worked example: turning a real-world task into an unambiguous step list.",
        durationMin: 12,
        difficulty: 2,
      },
    ],
  },
  {
    id: "pf",
    title: "Programming Foundations",
    summary:
      "Variables, control flow, functions — the grammar of code. Everything you write later sits on these primitives.",
    color: "#6f5d8f",
    landFill: "#d4c9e3",
    coast: "#6f5d8f",
    ta: {
      id: "ta-pf",
      name: "Devon K.",
      expertise: "Debugging & syntax",
      available: true,
    },
    resources: [
      {
        id: "pf-1",
        type: "video",
        title: "What is a Variable?",
        description: "A grounded explanation with live coding, not just slides.",
        durationMin: 9,
        difficulty: 1,
      },
      {
        id: "pf-2",
        type: "video",
        title: "Conditionals & Branching",
        description: "If, else, and the shape decisions take in code.",
        durationMin: 11,
        difficulty: 1,
      },
      {
        id: "pf-3",
        type: "practice",
        title: "Loop Drills",
        description: "Ten short loop exercises with auto-grading.",
        durationMin: 25,
        difficulty: 2,
      },
      {
        id: "pf-4",
        type: "doc",
        title: "Functions as Tools",
        description:
          "Why functions are the most important abstraction you'll learn this year.",
        durationMin: 14,
        difficulty: 2,
      },
      {
        id: "pf-5",
        type: "quiz",
        title: "Foundations Checkpoint",
        description: "Mixed-format quiz covering everything in this topic.",
        durationMin: 12,
        difficulty: 2,
      },
      {
        id: "pf-6",
        type: "practice",
        title: "Bug Hunt",
        description: "Three broken programs. Find and fix the bugs.",
        durationMin: 20,
        difficulty: 2,
      },
    ],
  },
  {
    id: "ds",
    title: "Data Structures",
    summary:
      "How to organize data so the right operations are fast. Arrays, lists, trees, hash maps — and when each one wins.",
    color: "#8f6f2a",
    landFill: "#e8d8a6",
    coast: "#8f6f2a",
    ta: {
      id: "ta-ds",
      name: "Priya S.",
      expertise: "Trees & hashing",
      available: false,
    },
    resources: [
      {
        id: "ds-1",
        type: "video",
        title: "Arrays vs Linked Lists",
        description: "A visual comparison of access patterns and trade-offs.",
        durationMin: 10,
        difficulty: 2,
      },
      {
        id: "ds-2",
        type: "doc",
        title: "Hash Maps Demystified",
        description:
          "How a hash map turns a key into a slot — without hand-waving.",
        durationMin: 16,
        difficulty: 2,
      },
      {
        id: "ds-3",
        type: "video",
        title: "Trees, Visually",
        description: "Binary trees, traversals, and why they show up everywhere.",
        durationMin: 13,
        difficulty: 2,
      },
      {
        id: "ds-4",
        type: "practice",
        title: "Stack & Queue Lab",
        description:
          "Implement a stack and a queue from scratch using only arrays.",
        durationMin: 30,
        difficulty: 3,
      },
      {
        id: "ds-5",
        type: "quiz",
        title: "Choose the Structure",
        description: "Given a scenario, pick the right data structure.",
        durationMin: 10,
        difficulty: 2,
      },
    ],
  },
  {
    id: "al",
    title: "Algorithms",
    summary:
      "Sorting, searching, recursion, and the language of complexity. Reasoning about time and space.",
    color: "#516e3b",
    landFill: "#c4dcaf",
    coast: "#516e3b",
    ta: {
      id: "ta-al",
      name: "Owen T.",
      expertise: "Recursion & complexity",
      available: true,
    },
    resources: [
      {
        id: "al-1",
        type: "video",
        title: "Big-O, Intuitively",
        description: "No formulas at first — just shapes of growth.",
        durationMin: 11,
        difficulty: 2,
      },
      {
        id: "al-2",
        type: "video",
        title: "Sorting, Compared",
        description: "Bubble, insertion, merge, quick — and when each matters.",
        durationMin: 17,
        difficulty: 2,
      },
      {
        id: "al-3",
        type: "doc",
        title: "Recursion as a Lens",
        description:
          "Recursion isn't a trick — it's a way of seeing problems.",
        durationMin: 14,
        difficulty: 3,
      },
      {
        id: "al-4",
        type: "practice",
        title: "Search Challenges",
        description: "Five problems, each solved best by a different search.",
        durationMin: 35,
        difficulty: 3,
      },
      {
        id: "al-5",
        type: "quiz",
        title: "Complexity Sanity Check",
        description: "Quick check that you can reason about Big-O.",
        durationMin: 8,
        difficulty: 2,
      },
      {
        id: "al-6",
        type: "practice",
        title: "Recursion Drills",
        description: "Short recursive problems, increasing in difficulty.",
        durationMin: 28,
        difficulty: 3,
      },
    ],
  },
  {
    id: "sys",
    title: "Computer Systems",
    summary:
      "What's actually happening under the code: memory, processes, files, and the network. Bridges code to reality.",
    color: "#8f4f64",
    landFill: "#e8c3d0",
    coast: "#8f4f64",
    ta: {
      id: "ta-sys",
      name: "Lin H.",
      expertise: "Systems & networking",
      available: true,
    },
    resources: [
      {
        id: "sys-1",
        type: "video",
        title: "Memory, Demystified",
        description: "Stack, heap, pointers — without the panic.",
        durationMin: 14,
        difficulty: 3,
      },
      {
        id: "sys-2",
        type: "doc",
        title: "Processes & Threads",
        description: "What runs, how it's scheduled, and what can go wrong.",
        durationMin: 18,
        difficulty: 3,
      },
      {
        id: "sys-3",
        type: "video",
        title: "How the Network Sees You",
        description: "TCP, HTTP, and what 'a request' actually is.",
        durationMin: 16,
        difficulty: 2,
      },
      {
        id: "sys-4",
        type: "practice",
        title: "File System Lab",
        description: "Walk a directory tree and aggregate its contents.",
        durationMin: 25,
        difficulty: 2,
      },
      {
        id: "sys-5",
        type: "quiz",
        title: "Systems Checkpoint",
        description: "Mixed quiz across memory, processes, and networking.",
        durationMin: 12,
        difficulty: 3,
      },
    ],
  },
  {
    id: "se",
    title: "Software Engineering",
    summary:
      "Writing code others (including future-you) can read, change, and trust. Tests, version control, and design taste.",
    color: "#476285",
    landFill: "#bcd0e6",
    coast: "#476285",
    ta: {
      id: "ta-se",
      name: "Ana V.",
      expertise: "Code review & testing",
      available: true,
    },
    resources: [
      {
        id: "se-1",
        type: "video",
        title: "Why Tests Exist",
        description: "Not 'how to test' — why teams that test ship faster.",
        durationMin: 9,
        difficulty: 1,
      },
      {
        id: "se-2",
        type: "doc",
        title: "Reading Code",
        description: "A skill we rarely teach explicitly. Worth practicing.",
        durationMin: 12,
        difficulty: 2,
      },
      {
        id: "se-3",
        type: "video",
        title: "Git, Mental Model First",
        description: "Forget commands — learn what a commit really is.",
        durationMin: 15,
        difficulty: 2,
      },
      {
        id: "se-4",
        type: "practice",
        title: "Refactor Lab",
        description: "Take ugly working code and make it kind.",
        durationMin: 30,
        difficulty: 3,
      },
      {
        id: "se-5",
        type: "quiz",
        title: "Engineering Habits",
        description: "Quick check on the habits that distinguish good code.",
        durationMin: 7,
        difficulty: 1,
      },
      {
        id: "se-6",
        type: "doc",
        title: "Design Taste",
        description:
          "A short essay on what 'good design' even means in software.",
        durationMin: 11,
        difficulty: 2,
      },
    ],
  },
];

function buildCourse(): Course {
  const topics: Topic[] = TOPIC_SPECS.map((spec, i) => {
    const angle = (i / TOPIC_SPECS.length) * Math.PI * 2 - Math.PI / 2;
    const x = CENTER.x + Math.cos(angle) * TOPIC_RING_RADIUS;
    const y = CENTER.y + Math.sin(angle) * TOPIC_RING_RADIUS;
    const clusterRadius = 150;
    // Stable per-topic seed so islands keep their shape across reloads.
    const seed = i * 1000 + 17;
    return {
      id: spec.id,
      title: spec.title,
      summary: spec.summary,
      color: spec.color,
      landFill: spec.landFill,
      coast: spec.coast,
      angle,
      distance: TOPIC_RING_RADIUS,
      x,
      y,
      clusterRadius,
      islandPath: islandPath(x, y, clusterRadius, seed, 28, 0.22),
      innerPath: islandPath(x, y, clusterRadius * 0.7, seed + 1, 24, 0.18),
    };
  });

  const resources: Resource[] = [];
  const tas: TeachingAssistant[] = [];
  const links: PathLink[] = [];

  TOPIC_SPECS.forEach((spec, ti) => {
    const topic = topics[ti];
    const count = spec.resources.length;

    // Resources arranged in a small arc around the topic, biased outward.
    spec.resources.forEach((r, ri) => {
      // distribute across an arc that faces "outward" from course center
      const spread = Math.PI * 1.25;
      const start = topic.angle - spread / 2;
      const a = start + (spread * ri) / Math.max(1, count - 1);
      // small radial variation for organic look
      const radius = 80 + ((ri * 23) % 35);
      const x = topic.x + Math.cos(a) * radius;
      const y = topic.y + Math.sin(a) * radius;
      resources.push({
        id: r.id,
        topicId: topic.id,
        type: r.type,
        title: r.title,
        description: r.description,
        durationMin: r.durationMin,
        difficulty: r.difficulty,
        angle: a,
        radius,
        x,
        y,
      });

      // Sequence link between consecutive resources within a topic.
      if (ri > 0) {
        links.push({
          source: spec.resources[ri - 1].id,
          target: r.id,
          kind: "sequence",
        });
      }
    });

    // TA placed slightly inward toward course center.
    const taAngle = topic.angle + Math.PI; // toward center
    const taRadius = 70;
    tas.push({
      id: spec.ta.id,
      name: spec.ta.name,
      expertise: spec.ta.expertise,
      available: spec.ta.available,
      topicId: topic.id,
      x: topic.x + Math.cos(taAngle) * taRadius,
      y: topic.y + Math.sin(taAngle) * taRadius,
    });
  });

  // A few cross-topic prerequisite links — show the curriculum is a graph, not a list.
  const crossLinks: Array<[string, string]> = [
    ["ct-5", "pf-1"], // CT -> PF
    ["pf-4", "ds-1"], // PF -> DS
    ["ds-3", "al-1"], // DS -> AL
    ["al-1", "sys-1"], // AL -> SYS
    ["pf-4", "se-2"], // PF -> SE
    ["ds-2", "al-2"], // DS -> AL
  ];
  crossLinks.forEach(([s, t]) =>
    links.push({ source: s, target: t, kind: "prereq" })
  );

  return {
    id: "intro-cs",
    title: "Introduction to Computer Science",
    description:
      "A guided map of foundational CS, from computational thinking to engineering practice.",
    topics,
    resources,
    tas,
    links,
    center: CENTER,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  };
}

export const COURSE: Course = buildCourse();
