/**
 * Automatically computes a color based on the score/weight value.
 * We interpolate between beautiful UI system soft colors (for 1 & -1)
 * and deep warning/premium colors (for 10 & -10) based on typical gamified app visual standards.
 */
export function getHabitColor(value: number): string {
  const isNegative = value < 0;
  // Get magnitude of the score (clamped between 1 and 10)
  const v = Math.min(Math.max(1, Math.abs(value)), 10);
  const ratio = (v - 1) / 9; // 0 at v=1, 1 at v=10

  let r, g, b;

  if (isNegative) {
    // Red/Rose gradient
    // v=1: #f87171 (pleasant soft red) -> RGB(248, 113, 113)
    // v=10: #991b1b (deep warning crimson) -> RGB(153, 27, 27)
    r = Math.round(248 + ratio * (153 - 248));
    g = Math.round(113 + ratio * (27 - 113));
    b = Math.round(113 + ratio * (27 - 113));
  } else {
    // Green/Emerald gradient
    // v=1: #34d399 (pleasant bright mint) -> RGB(52, 211, 153)
    // v=10: #047857 (deep rich emerald) -> RGB(4, 120, 87)
    r = Math.round(52 + ratio * (4 - 52));
    g = Math.round(211 + ratio * (120 - 211));
    b = Math.round(153 + ratio * (87 - 153));
  }

  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}
