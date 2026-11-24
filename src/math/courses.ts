import type { AppLang, CourseId, QuadricMode, TranslatedSurfaceType } from '../types';

export interface CourseSpec {
  id: CourseId;
  code: string;
  shortLabel: string;
  title: string;
  quadricModes: QuadricMode[];
  translationTypes: TranslatedSurfaceType[];
}

export const COURSE_SPECS: Record<CourseId, CourseSpec> = {
  '01417112': {
    id: '01417112',
    code: '01417112',
    shortLabel: '01417112 Calculus II',
    title: '01417112 Calculus II',
    quadricModes: [
      'ellipsoid',
      'hyperboloid_1',
      'hyperboloid_2',
      'elliptic_paraboloid',
    ],
    translationTypes: [
      'ellipsoid',
      'hyperboloid_1',
      'hyperboloid_2',
      'elliptic_paraboloid',
      'elliptic_cylinder',
    ],
  },
  '02731112': {
    id: '02731112',
    code: '02731112',
    shortLabel: '02731112 Calculus of Several Variables',
    title: '02731112 Calculus of Several Variables',
    quadricModes: [
      'ellipsoid',
      'hyperboloid_1',
      'hyperboloid_2',
      'cone',
      'elliptic_paraboloid',
      'hyperbolic_paraboloid',
    ],
    translationTypes: [
      'ellipsoid',
      'hyperboloid_1',
      'hyperboloid_2',
      'cone',
      'elliptic_paraboloid',
      'elliptic_cylinder',
    ],
  },
};

const COURSE_STORAGE_KEY = 'calc_multivar_kusrc_course';
const LANG_STORAGE_KEY = 'calc_multivar_kusrc_lang';

export function resolveInitialCourse(): CourseId {
  try {
    const c = new URLSearchParams(window.location.search).get('course')?.toLowerCase().trim();
    if (c === '02731112' || c === '02731211' || c === 'csv' || c === 'several') {
      return '02731112';
    }
    if (c === '01417112' || c === 'calc2') {
      return '01417112';
    }
    const stored = window.localStorage.getItem(COURSE_STORAGE_KEY);
    if (stored === '02731112' || stored === '01417112') return stored;
  } catch {
    // ignore storage/URL errors
  }
  return '01417112';
}

export function persistCourse(course: CourseId) {
  try {
    window.localStorage.setItem(COURSE_STORAGE_KEY, course);
    const url = new URL(window.location.href);
    url.searchParams.set('course', course);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore storage/URL errors
  }
}

export function resolveInitialLang(): AppLang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')?.toLowerCase().trim();
    if (q === 'en' || q === 'th') return q;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'th') return stored;
  } catch {
    // ignore storage/URL errors
  }
  return 'th';
}

export function persistLang(lang: AppLang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    const url = new URL(window.location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore storage/URL errors
  }
}
