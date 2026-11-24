import type {
  BilingualLabel,
  CoordsState,
  CourseId,
  CylinderType,
  CylindersState,
  PlanesState,
  QuadricMode,
  QuadricsState,
  TranslatedSurfaceType,
  TranslationState,
} from '../types';

export interface PresetItem<T> {
  id: string;
  label: BilingualLabel;
  badge?: string;
  courses?: CourseId[];
  value: Partial<T>;
}

export function filterPresetsByCourse<T>(
  presets: Array<PresetItem<T>>,
  course: CourseId,
): Array<PresetItem<T>> {
  return presets.filter((p) => !p.courses || p.courses.includes(course));
}

export const COORD_POINT_PRESETS: Array<PresetItem<CoordsState>> = [
  {
    id: 'ex1-a',
    label: { th: 'ตย.1 ข้อ 1: A(1, 4, 2)', en: 'Ex 1.1: A(1, 4, 2)' },
    badge: 'Octant I',
    value: { point: [1, 4, 2], plotStep: 3 },
  },
  {
    id: 'ex1-b',
    label: { th: 'ตย.1 ข้อ 2: B(-1, -3, 2)', en: 'Ex 1.2: B(-1, -3, 2)' },
    badge: 'Octant III',
    value: { point: [-1, -3, 2], plotStep: 3 },
  },
  {
    id: 'ex1-b2',
    label: { th: 'ตย.1 ข้อ 2*: B(-2, -4, 3)', en: 'Ex 1.2*: B(-2, -4, 3)' },
    badge: 'Octant III',
    value: { point: [-2, -4, 3], plotStep: 3 },
  },
  {
    id: 'ex1-c',
    label: { th: 'ตย.1 ข้อ 3: C(1, -3, -2)', en: 'Ex 1.3: C(1, -3, -2)' },
    badge: 'Octant VIII',
    value: { point: [1, -3, -2], plotStep: 3 },
  },
  {
    id: 'ex1-c2',
    label: { th: 'ตย.1 ข้อ 3*: C(1, -2, -3)', en: 'Ex 1.3*: C(1, -2, -3)' },
    badge: 'Octant VIII',
    value: { point: [1, -2, -3], plotStep: 3 },
  },
  {
    id: 'origin',
    label: { th: 'จุดกำเนิด O(0, 0, 0)', en: 'Origin O(0, 0, 0)' },
    badge: '(0, 0, 0)',
    value: { point: [0, 0, 0], plotStep: 3 },
  },
];

export const PLANE_PRESETS: Array<PresetItem<PlanesState>> = [
  {
    id: 'x2',
    label: { th: 'ตย.2 (1): x = 2', en: 'Ex 2 (1): x = 2' },
    badge: 'Parallel to yz',
    value: { a: 1, b: 0, c: 0, d: 2, showRefPlane: true },
  },
  {
    id: 'y2',
    label: { th: 'ตย.2 (2): y = 2', en: 'Ex 2 (2): y = 2' },
    badge: 'Parallel to xz',
    value: { a: 0, b: 1, c: 0, d: 2, showRefPlane: true },
  },
  {
    id: 'z2',
    label: { th: 'ตย.2 (3): z = 2', en: 'Ex 2 (3): z = 2' },
    badge: 'Parallel to xy',
    value: { a: 0, b: 0, c: 1, d: 2, showRefPlane: true },
  },
  {
    id: 'yx',
    label: { th: 'ตย.2 (4): y = x', en: 'Ex 2 (4): y = x' },
    badge: 'x - y = 0',
    value: { a: 1, b: -1, c: 0, d: 0, showRefPlane: false },
  },
  {
    id: '2y3z',
    label: { th: 'ตย.2 (5): 2y + 3z = 6', en: 'Ex 2 (5): 2y + 3z = 6' },
    badge: 'No x-intercept',
    value: { a: 0, b: 2, c: 3, d: 6, showRefPlane: false },
  },
  {
    id: '2xz',
    label: { th: 'ตย.2 (6): 2x - z = 4', en: 'Ex 2 (6): 2x - z = 4' },
    badge: 'No y-intercept',
    value: { a: 2, b: 0, c: -1, d: 4, showRefPlane: false },
  },
  {
    id: 'neg4y3x',
    label: { th: 'ตย.2 (7): -4y + 3x = 12', en: 'Ex 2 (7): -4y + 3x = 12' },
    badge: 'No z-intercept',
    courses: ['01417112'],
    value: { a: 3, b: -4, c: 0, d: 12, showRefPlane: false },
  },
  {
    id: 'general-362',
    label: { th: 'ตย.2: 3x + 6y + 2z = 6', en: 'Ex 2: 3x + 6y + 2z = 6' },
    badge: '3 Axis Intercepts',
    value: { a: 3, b: 6, c: 2, d: 6, showRefPlane: false },
  },
];

export const CYLINDER_INFO: Record<
  CylinderType,
  { name: BilingualLabel; desc: BilingualLabel }
> = {
  elliptic: {
    name: { th: 'ทรงกระบอกเชิงวงรี (Elliptic Cylinder)', en: 'Elliptic Cylinder' },
    desc: {
      th: 'สมการขาดไป 1 ตัวแปร โดยมี x²/a² + y²/b² = 1 (หรือคู่แกนอื่น) เส้นโค้งฐานเป็นวงรีแล้วยืดขนานแกนที่ตัวแปรหายไป',
      en: 'One variable is missing; elliptic base curve extruded parallel to the missing variable axis',
    },
  },
  parabolic: {
    name: { th: 'ทรงกระบอกเชิงพาราโบลา (Parabolic Cylinder)', en: 'Parabolic Cylinder' },
    desc: {
      th: 'รางพาราโบลาเกิดจากเส้นโค้งพาราโบลาในระนาบ 2 มิติ เลื่อนขนานไปตามแกนที่ตัวแปรหายไป',
      en: 'Parabolic trough swept parallel to the missing variable axis',
    },
  },
  hyperbolic: {
    name: { th: 'ทรงกระบอกเชิงไฮเพอร์โบลา (Hyperbolic Cylinder)', en: 'Hyperbolic Cylinder' },
    desc: {
      th: 'ผิว 2 แผ่นแยกจากกัน ตัดแกนที่อยู่หน้าเครื่องหมายบวก แต่ไม่ตัดอีก 2 แกน',
      en: 'Two sheets opening along the positive term axis; does not intersect the other two axes',
    },
  },
};

export const CYLINDER_PRESETS: Array<PresetItem<CylindersState>> = [
  {
    id: 'ex-elliptic-yz',
    label: { th: 'ตย.ชีต: 2y² + 8z² - 32 = 0 (ไม่ตัด x)', en: 'Sheet Ex: 2y² + 8z² - 32 = 0' },
    badge: 'y²/16 + z²/4 = 1',
    value: { type: 'elliptic', missingAxis: 'x', a: 4, b: 2, c: 0, extrusionLength: 8 },
  },
  {
    id: 'quiz-hyp-xy',
    label: { th: 'ควิซ: 36 + 4x² - 9y² = 0', en: 'Quiz: 36 + 4x² - 9y² = 0' },
    badge: 'y²/4 - x²/9 = 1',
    courses: ['01417112'],
    value: { type: 'hyperbolic', missingAxis: 'z', hyperbolicSign: -1, a: 3, b: 2, c: 0, extrusionLength: 8 },
  },
  {
    id: 'ex-para-pos',
    label: { th: 'ตย.ชีต: 9y² = 4x', en: 'Sheet Ex: 9y² = 4x' },
    badge: 'x = (9/4)y²',
    courses: ['01417112'],
    value: { type: 'parabolic', missingAxis: 'z', a: 2.25, b: 1, c: 0, extrusionLength: 8 },
  },
  {
    id: 'ex-para-neg',
    label: { th: 'ตย.ชีต: 9y² + 4x = 0', en: 'Sheet Ex: 9y² + 4x = 0' },
    badge: 'x = -(9/4)y²',
    courses: ['02731112'],
    value: { type: 'parabolic', missingAxis: 'z', a: -2.25, b: 1, c: 0, extrusionLength: 8 },
  },
  {
    id: 'ex-hyp-16',
    label: { th: 'ตย.ชีต: 16 + 4x² - 16z² = 0', en: 'Sheet Ex: 16 + 4x² - 16z² = 0' },
    badge: 'z² - x²/4 = 1',
    courses: ['01417112'],
    value: { type: 'hyperbolic', missingAxis: 'y', hyperbolicSign: -1, a: 2, b: 1, c: 0, extrusionLength: 8 },
  },
  {
    id: 'ex-hyp-9',
    label: { th: 'ตย.ชีต: 9 + 4x² - 16z² = 0', en: 'Sheet Ex: 9 + 4x² - 16z² = 0' },
    badge: 'z²/(3/4)² - x²/(3/2)² = 1',
    courses: ['02731112'],
    value: { type: 'hyperbolic', missingAxis: 'y', hyperbolicSign: -1, a: 1.5, b: 0.75, c: 0, extrusionLength: 8 },
  },
];

export const QUADRIC_INFO: Record<
  QuadricMode,
  { name: BilingualLabel; summary: BilingualLabel }
> = {
  ellipsoid: {
    name: { th: 'ทรงรี (Ellipsoid)', en: 'Ellipsoid' },
    summary: {
      th: 'x²/a² + y²/b² + z²/c² = 1 — ตัดทั้งแกน x, y และ z ที่ (±a,0,0), (0,±b,0), (0,0,±c)',
      en: 'All three squared terms are positive; intersects x, y, and z axes symmetrically',
    },
  },
  hyperboloid_1: {
    name: { th: 'ไฮเพอร์โบลาเชิงวงรีหนึ่งชิ้น (1-Sheet)', en: 'Hyperboloid of One Sheet' },
    summary: {
      th: 'กำลังสองติดลบ 1 พจน์: ตัดแกนที่อยู่หน้าบวกทั้ง 2 แกน แต่ไม่ตัดแกนหน้าเครื่องหมายลบ',
      en: 'One negative squared term: intersects the two positive axes, does NOT intersect the negative axis',
    },
  },
  hyperboloid_2: {
    name: { th: 'ไฮเพอร์โบลาเชิงวงรีสองชิ้น (2-Sheet)', en: 'Hyperboloid of Two Sheets' },
    summary: {
      th: 'กำลังสองติดลบ 2 พจน์: ตัดเฉพาะแกนหน้าบวก 1 แกน ไม่ตัดอีก 2 แกน',
      en: 'Two negative squared terms: intersects ONLY the single positive axis',
    },
  },
  cone: {
    name: { th: 'กรวยเชิงวงรี (Elliptic Cone)', en: 'Elliptic Cone' },
    summary: {
      th: 'u²/a² + v²/b² = w²/c² (ฝั่งขวาเป็น 0 เมื่อย้ายมาข้างเดียวกัน) ตัดแกน x, y, z ที่ (0, 0, 0)',
      en: 'Double cone meeting at (0, 0, 0); circular/elliptic horizontal traces, intersecting lines vertically',
    },
  },
  elliptic_paraboloid: {
    name: { th: 'พาราโบลาเชิงวงรี (Elliptic Paraboloid)', en: 'Elliptic Paraboloid' },
    summary: {
      th: '2 พจน์เป็นกำลังสองเครื่องหมายเดียวกัน และ 1 พจน์เป็นกำลังหนึ่ง: ตัดแกน x, y, z ที่ (0, 0, 0)',
      en: 'Two positive squared terms + one linear term: vertex at (0, 0, 0)',
    },
  },
  hyperbolic_paraboloid: {
    name: { th: 'พาราโบลาเชิงไฮเพอร์โบลา / อานม้า', en: 'Hyperbolic Paraboloid (Saddle)' },
    summary: {
      th: 'u²/a² - v²/b² = ±cw — รูปทรงอานม้า ตัดแกน x, y, z ที่ (0, 0, 0)',
      en: 'Saddle surface u²/a² - v²/b² = ±cw meeting all axes at (0, 0, 0)',
    },
  },
};

export const QUADRIC_PRESETS: Array<PresetItem<QuadricsState>> = [
  {
    id: 'ex-ellipsoid-36-9-4',
    label: { th: 'ตย.ชีต: 36x² + 9y² + 4z² = 36', en: 'Sheet Ex: 36x² + 9y² + 4z² = 36' },
    badge: 'Ellipsoid (a=1, b=2, c=3)',
    value: { mode: 'ellipsoid', a: 1, b: 2, c: 3, symmetryAxis: 'z' },
  },
  {
    id: 'ex-ellipsoid-36-4-9',
    label: { th: 'ตย.ชีต: 36x² + 4y² + 9z² = 36', en: 'Sheet Ex: 36x² + 4y² + 9z² = 36' },
    badge: 'Ellipsoid (a=1, b=3, c=2)',
    courses: ['02731112'],
    value: { mode: 'ellipsoid', a: 1, b: 3, c: 2, symmetryAxis: 'z' },
  },
  {
    id: 'ex-h1-sheet',
    label: { th: 'ตย.ชีต: 3x² - 4y² + 12z² = 12 (ไม่ตัด y)', en: 'Sheet Ex: 3x² - 4y² + 12z² = 12' },
    badge: '1-Sheet',
    value: { mode: 'hyperboloid_1', symmetryAxis: 'y', a: 2, b: 1, c: Math.sqrt(3) },
  },
  {
    id: 'quiz-h1',
    label: { th: 'ควิซ: 9x² + 4y² - z² - 36 = 0', en: 'Quiz: 9x² + 4y² - z² - 36 = 0' },
    badge: '1-Sheet (a=2, b=3, c=6)',
    courses: ['01417112'],
    value: { mode: 'hyperboloid_1', symmetryAxis: 'z', a: 2, b: 3, c: 6 },
  },
  {
    id: 'ex-h2-25',
    label: { th: 'ตย.ชีต: -25x² + y² - 25z² = 25 (ตัด y ที่ ±5)', en: 'Sheet Ex: -25x² + y² - 25z² = 25' },
    badge: '2-Sheet (y-axis)',
    courses: ['01417112'],
    value: { mode: 'hyperboloid_2', symmetryAxis: 'y', a: 1, b: 1, c: 5 },
  },
  {
    id: 'ex-h2-16',
    label: { th: 'ตย.ชีต: -16x² + 4y² - 9z² = 25 (ตัด y ที่ ±5/2)', en: 'Sheet Ex: -16x² + 4y² - 9z² = 25' },
    badge: '2-Sheet (y-axis)',
    courses: ['02731112'],
    value: { mode: 'hyperboloid_2', symmetryAxis: 'y', a: 1.25, b: 5 / 3, c: 2.5 },
  },
  {
    id: 'ex-cone',
    label: { th: 'ตย.ชีต: -3x² + 12y² + 16z² = 0 (แกน x)', en: 'Sheet Ex: -3x² + 12y² + 16z² = 0' },
    badge: 'Elliptic Cone (x-axis)',
    courses: ['02731112'],
    value: { mode: 'cone', symmetryAxis: 'x', a: 2, b: Math.sqrt(3), c: 4 },
  },
  {
    id: 'ex-paraboloid',
    label: { th: 'ตย.ชีต: 4x² - 9y + 16z² = 0', en: 'Sheet Ex: 4x² - 9y + 16z² = 0' },
    badge: 'Elliptic Paraboloid (+y)',
    value: {
      mode: 'elliptic_paraboloid',
      symmetryAxis: 'y',
      paraboloidSign: 1,
      a: 1.5,
      b: 0.75,
      c: 1,
    },
  },
  {
    id: 'quiz-paraboloid',
    label: { th: 'ควิซ: 4x² + 16y² + 9z = 0', en: 'Quiz: 4x² + 16y² + 9z = 0' },
    badge: 'Elliptic Paraboloid (-z)',
    courses: ['01417112'],
    value: {
      mode: 'elliptic_paraboloid',
      symmetryAxis: 'z',
      paraboloidSign: -1,
      a: 1.5,
      b: 0.75,
      c: 1,
    },
  },
  {
    id: 'ex-saddle',
    label: { th: 'ตย.ชีต: 4x² - 16y² + 9z = 0', en: 'Sheet Ex: 4x² - 16y² + 9z = 0' },
    badge: 'Saddle (-z)',
    courses: ['02731112'],
    value: {
      mode: 'hyperbolic_paraboloid',
      symmetryAxis: 'z',
      paraboloidSign: -1,
      a: 1.5,
      b: 0.75,
      c: 1,
    },
  },
];

export const TRANSLATION_SURFACE_NAMES: Record<TranslatedSurfaceType, BilingualLabel> = {
  ellipsoid: { th: 'ทรงรี (Ellipsoid)', en: 'Ellipsoid' },
  hyperboloid_1: { th: 'ไฮเพอร์โบลา 1 ชิ้น (1-Sheet)', en: 'Hyperboloid (1-Sheet)' },
  hyperboloid_2: { th: 'ไฮเพอร์โบลา 2 ชิ้น (2-Sheet)', en: 'Hyperboloid (2-Sheet)' },
  cone: { th: 'กรวยเชิงวงรี (Cone)', en: 'Elliptic Cone' },
  elliptic_paraboloid: { th: 'พาราโบลาเชิงวงรี (Paraboloid)', en: 'Elliptic Paraboloid' },
  elliptic_cylinder: { th: 'ทรงกระบอกเชิงวงรี (Cylinder)', en: 'Elliptic Cylinder' },
};

export const TRANSLATION_PRESETS: Array<PresetItem<TranslationState>> = [
  {
    id: 'shift-h2',
    label: { th: "ตย.1: 2 ชิ้น O'(-1, 1, 2)", en: "Ex 1: 2-Sheet O'(-1, 1, 2)" },
    badge: '(x+1)²/3 - (y-1)²/2 - (z-2)²/6 = 1',
    value: {
      surfaceType: 'hyperboloid_2',
      symmetryAxis: 'x',
      x0: -1,
      y0: 1,
      z0: 2,
      a: Math.sqrt(2),
      b: Math.sqrt(6),
      c: Math.sqrt(3),
    },
  },
  {
    id: 'shift-para',
    label: { th: "ตย.2: พาราโบลา O'(5, -4, 0)", en: "Ex 2: Paraboloid O'(5, -4, 0)" },
    badge: '(x-5)²/9 + (y+4)²/25 = 2z',
    value: {
      surfaceType: 'elliptic_paraboloid',
      symmetryAxis: 'z',
      paraboloidSign: 1,
      x0: 5,
      y0: -4,
      z0: 0,
      a: 3,
      b: 5,
      c: 2,
    },
  },
  {
    id: 'shift-cyl',
    label: { th: "ตย.3: ทรงกระบอก O'(5, -3, 0)", en: "Ex 3: Cylinder O'(5, -3, 0)" },
    badge: 'x² + y² - 10x + 6y + 18 = 0',
    value: {
      surfaceType: 'elliptic_cylinder',
      symmetryAxis: 'z',
      x0: 5,
      y0: -3,
      z0: 0,
      a: 4,
      b: 4,
      c: 1,
    },
  },
  {
    id: 'shift-h1',
    label: { th: "ตย.4: 1 ชิ้น O'(3, 4, 2)", en: "Ex 4: 1-Sheet O'(3, 4, 2)" },
    badge: '9x²+4y²-4z²-54x-32y+16z+93=0',
    value: {
      surfaceType: 'hyperboloid_1',
      symmetryAxis: 'z',
      x0: 3,
      y0: 4,
      z0: 2,
      a: 2,
      b: 3,
      c: 3,
    },
  },
  {
    id: 'shift-ellip',
    label: { th: "ตย.5: ทรงรี O'(1, -2, -1)", en: "Ex 5: Ellipsoid O'(1, -2, -1)" },
    badge: '3x²+2y²+4z²-6x+8y+8z+3=0',
    value: {
      surfaceType: 'ellipsoid',
      symmetryAxis: 'z',
      x0: 1,
      y0: -2,
      z0: -1,
      a: 2,
      b: Math.sqrt(6),
      c: Math.sqrt(3),
    },
  },
];
