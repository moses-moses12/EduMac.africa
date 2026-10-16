import React from 'react';

export interface EduMaxLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  textClassName?: string;
  subtitleClassName?: string;
  variant?: 'full' | 'icon-only';
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24',
};

/**
 * EduMax Official Academic Emblem:
 * Precision 1:1 vector recreation of the reference emblem:
 * - 3D Mortarboard Graduation Cap with cyan beveled rim and golden tassel
 * - Open Book with glowing amber/gold fanned pages and interior page lines
 * - Deep royal blue outer protective book wings and curved bottom spine
 */
export function EduMaxLogoIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EduMax Emblem"
    >
      <defs>
        {/* Cap Top Rhombus Gradient */}
        <linearGradient id="emCapDiamond" x1="16" y1="12" x2="104" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="45%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f265c" />
        </linearGradient>

        {/* Cap Cyan Rim Accent */}
        <linearGradient id="emCyanRim" x1="16" y1="24" x2="104" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Cap Skullcap Base Underneath */}
        <linearGradient id="emCapSkull" x1="36" y1="28" x2="84" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f2d6b" />
          <stop offset="100%" stopColor="#08183a" />
        </linearGradient>

        {/* Left Golden Book Page */}
        <linearGradient id="emPageLeft" x1="22" y1="36" x2="58" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Right Golden Book Page */}
        <linearGradient id="emPageRight" x1="98" y1="36" x2="62" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Deep Royal Blue Outer Book Wings */}
        <linearGradient id="emBookBlue" x1="14" y1="40" x2="106" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f265c" />
        </linearGradient>

        {/* Gold Tassel Gradient */}
        <linearGradient id="emTasselGold" x1="60" y1="22" x2="90" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. OUTER BLUE BOOK WINGS & BOTTOM SPINE FRAME                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Left Blue Flap / Wing */}
      <path
        d="M 18 45 L 26 42 L 26 80 L 18 76 Z"
        fill="url(#emBookBlue)"
      />
      {/* Right Blue Flap / Wing */}
      <path
        d="M 102 45 L 94 42 L 94 80 L 102 76 Z"
        fill="url(#emBookBlue)"
      />

      {/* Curved Blue Book Spine Foundation (Sweeping underneath the book) */}
      <path
        d="M 18 76 C 36 68 50 72 60 78 C 70 72 84 68 102 76 L 102 85 C 84 78 70 81 60 88 C 50 81 36 78 18 85 Z"
        fill="url(#emBookBlue)"
      />
      {/* Spine Bottom Notch */}
      <path
        d="M 57 86 L 60 91 L 63 86 Z"
        fill="#0a1936"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. GLOWING AMBER/GOLD OPEN BOOK PAGES                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Left Golden Page */}
      <path
        d="M 58 50 C 44 42 28 44 24 49 C 23 52 24 74 24 75 C 36 69 48 71 58 78 Z"
        fill="url(#emPageLeft)"
      />
      {/* Left Golden Page White Inner Arch Swoosh */}
      <path
        d="M 55 56 C 44 50 33 52 30 56 C 29 60 30 68 30 69 C 38 65 47 67 55 72 Z"
        fill="#ffffff"
        opacity="0.32"
      />
      {/* Left Page Inner Ray */}
      <path
        d="M 53 62 C 45 58 38 60 35 63"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Right Golden Page */}
      <path
        d="M 62 50 C 76 42 92 44 96 49 C 97 52 96 74 96 75 C 84 69 72 71 62 78 Z"
        fill="url(#emPageRight)"
      />
      {/* Right Golden Page White Inner Arch Swoosh */}
      <path
        d="M 65 56 C 76 50 87 52 90 56 C 91 60 90 68 90 69 C 82 65 73 67 65 72 Z"
        fill="#ffffff"
        opacity="0.32"
      />
      {/* Right Page Inner Ray */}
      <path
        d="M 67 62 C 75 58 82 60 85 63"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Vertical Spine White Valley Line */}
      <line
        x1="60"
        y1="49"
        x2="60"
        y2="78"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. GRADUATION MORTARBOARD CAP (Top Academic Icon)             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Skullcap / Band Underneath Cap Top */}
      <path
        d="M 38 24.5 C 38 34 47 38.5 60 38.5 C 73 38.5 82 34 82 24.5 L 60 32.5 Z"
        fill="url(#emCapSkull)"
      />
      <path
        d="M 44 28 C 48 33 54 35 60 35 C 66 35 72 33 76 28 L 60 31 Z"
        fill="#061226"
        opacity="0.7"
      />

      {/* Cap Rhombus Diamond Top */}
      <polygon
        points="60,7 98,22 60,37 22,22"
        fill="url(#emCapDiamond)"
      />

      {/* Cap Diamond Rim Accent (Bright Cyan/Sky highlight line) */}
      <polygon
        points="60,8.5 96,22 60,35.5 24,22"
        stroke="url(#emCyanRim)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center Cap Button */}
      <ellipse
        cx="60"
        cy="22"
        rx="2.5"
        ry="1.8"
        fill="#e0f2fe"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. GOLDEN TASSEL                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Tassel Cord draping over right edge */}
      <path
        d="M 60 22 C 70 21 82 25 86 30 C 88 33 88 39 88 43"
        stroke="url(#emTasselGold)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tassel Fringe Knot / Teardrop */}
      <ellipse
        cx="88"
        cy="44"
        rx="2.5"
        ry="3.8"
        fill="#f59e0b"
      />
      <circle
        cx="88"
        cy="41.5"
        r="1.8"
        fill="#fef08a"
      />
    </svg>
  );
}

/**
 * Standard EduMax Branding Component:
 * Combines the icon emblem with official EduMax typography.
 */
export function EduMaxLogo({
  className = '',
  size = 'md',
  showText = true,
  textClassName = 'text-white',
  subtitleClassName = 'text-indigo-300',
}: EduMaxLogoProps) {
  const sizeClass = typeof size === 'string' ? SIZE_MAP[size] || SIZE_MAP.md : '';
  const inlineStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className={`${sizeClass} shrink-0 flex items-center justify-center drop-shadow-md transition-transform hover:scale-105 duration-200`}
        style={inlineStyle}
      >
        <EduMaxLogoIcon className="w-full h-full" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`text-base font-black tracking-tight ${textClassName}`}>
            EduMax
          </span>
          <span className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${subtitleClassName}`}>
            Schools System
          </span>
        </div>
      )}
    </div>
  );
}
