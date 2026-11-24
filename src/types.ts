export type AppLang = 'th' | 'en';

export type CourseId = '01417112' | '02731112';

export type AxisName = 'x' | 'y' | 'z';

export type ModuleTab = 'coords' | 'planes' | 'quadrics' | 'cylinders' | 'translation';

export type CameraPreset = 'isometric' | 'top' | 'front' | 'side';

export interface BilingualLabel {
  th: string;
  en: string;
}

export type Vec3Tuple = [number, number, number];

export interface CoordsState {
  point: Vec3Tuple;
  plotStep: 1 | 2 | 3;
  showCoordBox: boolean;
  showPlaneProjections: boolean;
  showPlaneXY: boolean;
  showPlaneXZ: boolean;
  showPlaneYZ: boolean;
  highlightOctant: boolean;
}

export interface PlanesState {
  a: number;
  b: number;
  c: number;
  d: number;
  showIntercepts: boolean;
  showCoordTraces: boolean;
  showRefPlane: boolean;
}

export type CylinderType = 'elliptic' | 'parabolic' | 'hyperbolic';

export interface CylindersState {
  type: CylinderType;
  missingAxis: AxisName;
  hyperbolicSign: 1 | -1;
  a: number;
  b: number;
  c: number;
  extrusionLength: number;
  isAnimatingExtrusion: boolean;
  showGeneratingCurve: boolean;
  showRulings: boolean;
  slicingEnabled: boolean;
  slicePlane: AxisName;
  sliceK: number;
  quizMode: boolean;
  quizRevealed: boolean;
}

export type QuadricMode =
  | 'ellipsoid'
  | 'hyperboloid_1'
  | 'hyperboloid_2'
  | 'elliptic_paraboloid'
  | 'cone'
  | 'hyperbolic_paraboloid';

export interface QuadricsState {
  mode: QuadricMode;
  symmetryAxis: AxisName;
  paraboloidSign: 1 | -1;
  a: number;
  b: number;
  c: number;
  slicingEnabled: boolean;
  slicePlane: AxisName;
  sliceK: number;
  quizMode: boolean;
  quizRevealed: boolean;
}

export type TranslatedSurfaceType =
  | 'ellipsoid'
  | 'elliptic_paraboloid'
  | 'hyperboloid_1'
  | 'hyperboloid_2'
  | 'elliptic_cylinder'
  | 'cone';

export interface TranslationState {
  surfaceType: TranslatedSurfaceType;
  symmetryAxis: AxisName;
  paraboloidSign: 1 | -1;
  x0: number;
  y0: number;
  z0: number;
  a: number;
  b: number;
  c: number;
  showGhost: boolean;
  showShiftedAxes: boolean;
  quizMode: boolean;
  quizRevealed: boolean;
}

export interface ViewerSettings {
  darkMode: boolean;
  wireframe: boolean;
  transparent: boolean;
  showGrid: boolean;
  autoRotate: boolean;
  presentationMode: boolean;
}

export interface TraceResult {
  classification: BilingualLabel;
  equationLatex: string;
  hAxisLabel: string;
  vAxisLabel: string;
  curves2D: Array<Array<[number, number]>>;
  points2D: Array<[number, number]>;
  curves3D: Array<Array<[number, number, number]>>;
  points3D: Array<[number, number, number]>;
}
