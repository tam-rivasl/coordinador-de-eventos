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
 * Une intervalos que se solapan para un solo usuario.
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
 * Algoritmo experto para encontrar huecos libres comunes.
 * Utiliza una técnica de "Timeline Events" para identificar cambios en la disponibilidad.
 */
export function getFreeRanges(day: number, people: Person[], availability: Availability): SlotResult[] {
  const DAY_START = 0;
  const DAY_END = 1440; // 24 * 60

  if (people.length === 0) return [];

  // Crear eventos de inicio y fin de BLOQUEO
  const events: { min: number; type: 'start' | 'end'; personId: string }[] = [];
  
  people.forEach(p => {
    const blocks = availability[p.id]?.[day] || [];
    blocks.forEach(b => {
      events.push({ min: b.fromMin, type: 'start', personId: p.id });
      events.push({ min: b.toMin, type: 'end', personId: p.id });
    });
  });

  // Ordenar eventos por tiempo
  events.sort((a, b) => a.min - b.min || (a.type === 'end' ? -1 : 1));

  const results: SlotResult[] = [];
  const currentBlocked = new Set<string>();
  let lastTime = DAY_START;

  const pushResult = (start: number, end: number) => {
    if (end <= start) return;
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

  // Procesar eventos
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

  // Filtrar huecos irrelevantes (ej: menos de 30 min o muy temprano/tarde si se desea)
  return results.filter(r => (r.end - r.start) >= 30);
}

export function scoreAlt(alt: SlotResult, totalPeople: number): number {
  const attendanceWeight = (alt.count / totalPeople) * 10000;
  const durationWeight = (alt.end - alt.start) / 10;
  const dayWeight = (7 - alt.day) * 5; // Preferencia por inicios de semana o fines segun logica
  return attendanceWeight + durationWeight + dayWeight;
}

export function colorFromId(id: string, alpha = 1): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsla(${h % 360}, 70%, 60%, ${alpha})`;
}
