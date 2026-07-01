// Mirrors the backend Pydantic schemas in app/schemas/analysis.py.
// Grows alongside the API contract as features are added.

export interface ImageInfo {
  filename: string;
  format: string;
  mode: string;
  width: number;
  height: number;
  megapixels: number;
  aspect_ratio: number;
  size_bytes: number;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface ExifInfo {
  has_exif: boolean;
  make: string | null;
  model: string | null;
  lens: string | null;
  iso: number | null;
  aperture: string | null;
  shutter_speed: string | null;
  focal_length: string | null;
  date_taken: string | null;
  gps: GpsCoordinates | null;
}

export interface ColorSwatch {
  hex: string;
  rgb: number[];
  proportion: number;
}

export interface Dimensions {
  width: number;
  height: number;
  aspect_ratio: number;
}

export interface Histogram {
  bins: number;
  r: number[];
  g: number[];
  b: number[];
}

export interface DynamicRange {
  low: number;
  high: number;
  range: number;
  stops: number;
}

export type Orientation = "portrait" | "landscape" | "square";

export interface VisionInfo {
  brightness: number;
  contrast: number;
  sharpness: number;
  dominant_colors: ColorSwatch[];
  histogram: Histogram;
  dynamic_range: DynamicRange;
  dimensions: Dimensions;
  orientation: Orientation;
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type SubjectSource = "detector" | "saliency" | "vlm";

/**
 * Maps a SubjectSource to a human-readable display label.
 *
 * The never check in the default branch makes TypeScript flag this function
 * as a compile error whenever a new SubjectSource variant is added without
 * a corresponding case — use this (or the same pattern) in any component
 * that switches on source, so regressions are caught at build time.
 */
export function subjectSourceLabel(source: SubjectSource): string {
  switch (source) {
    case "detector":
      return "Object Detector";
    case "saliency":
      return "Saliency Fallback";
    case "vlm":
      return "VLM";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export interface RuleOfThirds {
  score: number;
  follows_rule: boolean;
  centroid: Point;
  nearest_power_point: Point;
  distance_to_power_point: number;
  source: SubjectSource;
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

export interface LeadingLines {
  has_leading_lines: boolean;
  line_count: number;
  dominant_angle: number | null;
  lines: LineSegment[];
}

export interface Horizon {
  horizon_detected: boolean;
  horizon_y: number | null;
  is_level: boolean;
  tilt_angle: number | null;
}

export interface Symmetry {
  vertical: number;
  horizontal: number;
  is_symmetric: boolean;
  dominant_axis: "vertical" | "horizontal";
}

export interface SubjectPosition {
  centroid: Point;
  region: string;
  offset_from_center: number;
  bbox: BoundingBox | null;
  label: string | null;
  confidence: number;
  has_mask: boolean;
  source: SubjectSource;
}

export interface EdgeRegions {
  top: number;
  bottom: number;
  left: number;
  right: number;
  center: number;
}

export interface EdgeDensity {
  edge_density: number;
  busyness: "minimal" | "moderate" | "busy";
  regions: EdgeRegions;
}

export interface NegativeSpace {
  negative_space_ratio: number;
  subject_excluded_ratio: number;
  has_significant_negative_space: boolean;
}

export interface CompositionInfo {
  rule_of_thirds: RuleOfThirds;
  leading_lines: LeadingLines;
  horizon: Horizon;
  symmetry: Symmetry;
  subject_position: SubjectPosition;
  edge_density: EdgeDensity;
  negative_space: NegativeSpace;
}

export interface AnalysisResponse {
  image: ImageInfo;
  exif: ExifInfo;
  vision: VisionInfo;
  composition: CompositionInfo;
}
