import { TimeRange, Person, Availability, SlotResult } from "@/types/scheduler";

export function uid(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.randomUUID();
  }
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

/**
 * Une intervalos que se solapan para un solo usuario de forma eficiente.
 */
export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.fromMin - b.fromMin);
  const merged: TimeRange[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].fromMin <= current.toMin) {
      current.toMin = Math.max(current.toMin, sorted[i].toMin);
    } else {
      merged.push(current);
      current = { ...sorted[i] };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Algoritmo experto Sweep-Line para encontrar huecos libres.
 * Identifica cada segmento de tiempo y quién está libre en él.
 */
export function getFreeRanges(day: number, people: Person[], availability: Availability): SlotResult[] {
  const DAY_START = 0;
  const DAY_END = 1440;

  if (people.length === 0) return [];

  const events: { min: number; type: 'start' | 'end'; personId: string }[] = [];
  
  people.forEach(p => {
    const blocks = availability[p.id]?.[day] || [];
    blocks.forEach(b => {
      events.push({ min: b.fromMin, type: 'start', personId: p.id });
      events.push({ min: b.toMin, type: 'end', personId: p.id });
    });
  });

  // Ordenar eventos: los 'end' antes que los 'start' en el mismo minuto para evitar micro-huecos
  events.sort((a, b) => a.min - b.min || (a.type === 'end' ? -1 : 1));

  const results: SlotResult[] = [];
  const currentBlocked = new Set<string>();
  let lastTime = DAY_START;

  const pushResult = (start: number, end: number) => {
    if (end - start < 30) return; // Ignorar huecos menores a 30 min
    const can = people.filter(p => !currentBlocked.has(p.id));
    const cannot = people.filter(p => currentBlocked.has(p.id));
    results.push({
      day,
      start,
      end,
      count: can.length,
      can,
      cannot
    });
  };

  events.forEach(event => {
    if (event.min > lastTime) {
      pushResult(lastTime, event.min);
    }
    
    if (event.type === 'start') {
      currentBlocked.add(event.personId);
    } else {
      currentBlocked.delete(event.personId);
    }
    lastTime = event.min;
  });

  if (lastTime < DAY_END) {
    pushResult(lastTime, DAY_END);
  }

  return results;
}

/**
 * Sistema de puntuación experto para clasificar alternativas.
 * Penaliza fuertemente la falta de asistencia.
 */
export function scoreAlt(alt: SlotResult, totalPeople: number, mainPersonId?: string): number {
  const isPerfect = alt.count === totalPeople;
  const isMainPersonMissing = mainPersonId ? alt.cannot.some(p => p.id === mainPersonId) : false;

  // Multiplicador base por asistencia
  let score = (alt.count / totalPeople) * 5000;
  
  // Bono masivo por perfección
  if (isPerfect) score += 10000;
  
  // Penalización crítica si falta el organizador ("Yo")
  if (isMainPersonMissing) score -= 15000;

  // Bonus por duración (preferimos juntas de 1.5h a 3h)
  const durationMin = alt.end - alt.start;
  if (durationMin >= 90 && durationMin <= 180) score += 500;
  
  // Bonus ligero por horario "amigable" (10am - 9pm)
  if (alt.start >= 600 && alt.end <= 1260) score += 200;

  return score;
}

export function colorFromId(id: string, alpha = 1): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsla(${h % 360}, 70%, 60%, ${alpha})`;
}
