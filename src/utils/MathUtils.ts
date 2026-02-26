export interface Vector {
  x: number;
  y: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(v1: Vector, v2: Vector): number {
  return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
}

export function angleBetween(v1: Vector, v2: Vector): number {
  return Math.atan2(v2.y - v1.y, v2.x - v1.x);
}

export function rotateTowards(currentAngle: number, targetAngle: number, speed: number): number {
  let diff = targetAngle - currentAngle;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  
  if (Math.abs(diff) < speed) return targetAngle;
  return currentAngle + Math.sign(diff) * speed;
}
