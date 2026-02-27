export type TimeRange = {
  fromMin: number;
  toMin: number;
};

export type Person = {
  id: string;
  name: string;
};

export type Availability = Record<string, Record<number, TimeRange[]>>;

export type SchedulerState = {
  people: Person[];
  availability: Availability;
};

export type SlotResult = {
  day: number;
  start: number;
  end: number;
  count: number;
  can: Person[];
  cannot: Person[];
};

export const DAYS_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const STEP = 15; // Mayor granularidad
