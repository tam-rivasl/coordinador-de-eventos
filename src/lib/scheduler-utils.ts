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

/**
 * Builds a set of minutes where the person is BUSY.
 */
export function buildBusySet(personId: string, day: number, availability: Availability): Set<number> {
  const ranges = availability[personId]?.[day] || [];
  const s = new Set<number>();
  for (const r of ranges) {
    // We populate the set with the start of each STEP interval
    for (let t = r.fromMin; t < r.toMin; t += STEP) {
      s.add(t);
    }
  }
  return s;
}

/**
 * Finds continuous free ranges for a specific day and group of people.
 */
export function getFreeRanges(day: number, people: Person[], availability: Availability): SlotResult[] {
  const START = 8 * 60; // 8:00 AM
  const END = 24 * 60;  // Midnight
  
  const results: SlotResult[] = [];
  let currentGroup: Person[] = [];
  let currentStart = START;

  const busySets = people.map(p => ({
    p,
    set: buildBusySet(p.id, day, availability)
  }));

  for (let t = START; t <= END; t += STEP) {
    const freeAtT = busySets.filter(x => !x.set.has(t)).map(x => x.p);
    
    const currentIds = currentGroup.map(p => p.id).sort().join(',');
    const newIds = freeAtT.map(p => p.id).sort().join(',');

    if (t === START) {
      currentGroup = freeAtT;
    } else if (newIds !== currentIds || t === END) {
      if (currentGroup.length > 0) {
        results.push({
          day,
          start: currentStart,
          end: t,
          count: currentGroup.length,
          can: currentGroup
        });
      }
      currentGroup = freeAtT;
      currentStart = t;
    }
  }
  return results;
}

export function scoreAlt(alt: SlotResult): number {
  // Prioritize ranges with 100% attendance first
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
