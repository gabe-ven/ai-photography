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

export interface AnalysisResponse {
  image: ImageInfo;
  exif: ExifInfo;
  vision: VisionInfo;
}
