import { TimeRange, STEP, Person, Availability, SlotResult } from "@/types/scheduler";

export function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  const arr = ranges
    .filter((r) => r.toMin > r.fromMin)
    .sort((a, b) => a.fromMin - b.fromMin);

  const merged: TimeRange[] = [];
  for (const r of arr) {
    const last = merged[merged.length - 1];
    if (!last || r.fromMin > last.toMin) {
      merged.push({ ...r });
    } else {
      last.toMin = Math.max(last.toMin, r.toMin);
    }
  }
  return merged;
}

export function buildAvailabilitySet(personId: string, day: number, availability: Availability): Set<number> {
  const ranges = availability[personId]?.[day] || [];
  const s = new Set<number>();
  for (const r of ranges) {
    for (let t = r.fromMin; t < r.toMin; t += STEP) {
      s.add(t);
    }
  }
  return s;
}

export function scoreAlt(alt: SlotResult): number {
  return alt.count * 1000000 - alt.day * 1000 - alt.start;
}

export function colorFromId(id: string, alpha = 1): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r = 100 + (h % 155);
  const g = 100 + ((h >> 8) % 155);
  const b = 150 + ((h >> 16) % 105);
  return alpha === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}
