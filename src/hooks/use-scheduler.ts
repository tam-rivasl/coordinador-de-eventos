"use client";

import { useState, useEffect, useCallback } from "react";
import { SchedulerState, SlotResult } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges } from "@/lib/scheduler-utils";

const LS_KEY = "tiempojuntos_strict_v4";
const SCHEMA_VERSION = 4;

type PersistedState = SchedulerState & { schemaVersion: number };

function initialState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    people: [{ id: uid(), name: "Yo" }],
    availability: {},
  };
}

export function useScheduler() {
  const [state, setState] = useState<PersistedState | null>(null);

  // Carga inicial desde LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<PersistedState>;

        // ✅ si no coincide la versión del schema, se resetea
        if (parsed?.schemaVersion !== SCHEMA_VERSION) {
          setState(initialState());
          return;
        }

        // ✅ validar mínimo esperable
        if (Array.isArray(parsed?.people) && parsed.people.length > 0 && parsed.availability) {
          setState(parsed as PersistedState);
          return;
        }
      } catch (e) {
        console.error("Error al cargar datos:", e);
      }
    }

    setState(initialState());
  }, []);

  // Persistencia automática
  useEffect(() => {
    if (state) {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addPerson = useCallback((name: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        people: [...prev.people, { id: uid(), name: name.trim() }],
      };
    });
  }, []);

  const updatePerson = useCallback((id: string, name: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        people: prev.people.map((p) =>
          p.id === id ? { ...p, name: name.trim() } : p
        ),
      };
    });
  }, []);

  const removePerson = useCallback((id: string) => {
    setState((prev) => {
      if (!prev || prev.people[0]?.id === id) return prev; // no borrar "Yo"

      const newAvailability = { ...prev.availability };
      delete newAvailability[id];

      return {
        ...prev,
        people: prev.people.filter((p) => p.id !== id),
        availability: newAvailability,
      };
    });
  }, []);

  const addSlot = useCallback(
    (personId: string, day: number, fromMin: number, toMin: number) => {
      setState((prev) => {
        if (!prev) return prev;

        const currentPersonAvail = prev.availability[personId] || {};
        const dayRanges = currentPersonAvail[day] || [];
        const newDayRanges = mergeRanges([...dayRanges, { fromMin, toMin }]);

        return {
          ...prev,
          availability: {
            ...prev.availability,
            [personId]: {
              ...currentPersonAvail,
              [day]: newDayRanges,
            },
          },
        };
      });
    },
    []
  );

  const removeSlot = useCallback((personId: string, day: number, index: number) => {
    setState((prev) => {
      if (!prev || !prev.availability[personId]) return prev;

      const dayRanges = [...(prev.availability[personId][day] || [])];
      dayRanges.splice(index, 1);

      return {
        ...prev,
        availability: {
          ...prev.availability,
          [personId]: {
            ...prev.availability[personId],
            [day]: dayRanges,
          },
        },
      };
    });
  }, []);

  const computeResults = useCallback(
    (selectedDay?: number): { alternatives: SlotResult[] } => {
      if (!state || state.people.length === 0) return { alternatives: [] };

      const totalPeople = state.people.length;
      const allOptions: SlotResult[] = [];

      const daysToCheck =
        selectedDay !== undefined ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];

      for (const day of daysToCheck) {
        const ranges = getFreeRanges(day, state.people, state.availability);
        const perfectRanges = ranges.filter((r) => r.count === totalPeople);
        allOptions.push(...perfectRanges);
      }

      return {
        alternatives: allOptions.sort(
          (a, b) => (b.end - b.start) - (a.end - a.start)
        ),
      };
    },
    [state]
  );

  // ✅ Reset real: borra storage y vuelve a estado inicial
  const resetAll = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setState(initialState());
  }, []);

  return {
    state,
    addPerson,
    updatePerson,
    removePerson,
    addSlot,
    removeSlot,
    computeResults,
    resetAll,
  };
}