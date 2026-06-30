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

export interface AnalysisResponse {
  image: ImageInfo;
  exif: ExifInfo;
}
