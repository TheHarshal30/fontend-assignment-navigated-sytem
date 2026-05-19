export type ResourceType = "video" | "doc" | "quiz" | "practice";

export interface Resource {
  id: string;
  topicId: string;
  type: ResourceType;
  title: string;
  description: string;
  durationMin: number;
  difficulty: 1 | 2 | 3;
  /** Relative angle (radians) from the topic center, used to place around topic. */
  angle: number;
  /** Distance from topic center, in map units. */
  radius: number;
  /** Resolved absolute position in map coords. */
  x: number;
  y: number;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  /** Primary topic identity color (also used for coastline). */
  color: string;
  /** Land fill color (lighter, muted). */
  landFill: string;
  /** Coastline color (darker than landFill). */
  coast: string;
  /** Polar position around the course center. */
  angle: number;
  distance: number;
  x: number;
  y: number;
  /** Radius of the topic cluster halo (used for sizing the island). */
  clusterRadius: number;
  /** SVG path string for the irregular landmass polygon. */
  islandPath: string;
  /** SVG path for a slightly inset second contour, to suggest depth. */
  innerPath: string;
}

export interface TeachingAssistant {
  id: string;
  name: string;
  topicId: string;
  expertise: string;
  available: boolean;
  x: number;
  y: number;
}

export interface PathLink {
  source: string; // resource id
  target: string; // resource id
  kind: "sequence" | "prereq";
}

export interface Course {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
  resources: Resource[];
  tas: TeachingAssistant[];
  links: PathLink[];
  /** Suggested viewport center for initial zoom. */
  center: { x: number; y: number };
  /** Bounding box of all content. */
  width: number;
  height: number;
}

export interface JourneyEntry {
  resourceId: string;
  visitedAt: number; // epoch ms
}
