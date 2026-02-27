"use client";

import { useState, useEffect, useCallback } from "react";
import { SchedulerState, Person, Availability, SlotResult } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges } from "@/lib/scheduler-utils";

const LS_KEY = "tiempojuntos_strict_v2";

const DEFAULT_STATE: SchedulerState = {
  people: [
    { id: uid(), name: "Yo" },
    { id: uid(), name: "Amigo 1" },
  ],
  availability: {},
};

export function useScheduler() {
  const [state, setState] = useState<SchedulerState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.people)) {
          setState(parsed);
        } else {
          setState(DEFAULT_STATE);
        }
      } catch (e) {
        setState(DEFAULT_STATE);
      }
    } else {
      setState(DEFAULT_STATE);
    }
  }, []);

  const save = (newState: SchedulerState) => {
    setState(newState);
    localStorage.setItem(LS_KEY, JSON.stringify(newState));
  };

  const addPerson = (name: string) => {
    if (!state) return;
    const newPerson: Person = { id: uid(), name: name.trim() };
    const newState = { ...state, people: [...state.people, newPerson] };
    save(newState);
  };

  const updatePerson = (id: string, name: string) => {
    if (!state) return;
    const newPeople = state.people.map(p => p.id === id ? { ...p, name: name.trim() } : p);
    save({ ...state, people: newPeople });
  };

  const removePerson = (id: string) => {
    if (!state) return;
    // No permitir borrar al usuario principal ("Yo")
    if (state.people[0].id === id) return;
    
    const newPeople = state.people.filter((p) => p.id !== id);
    const newAvailability = { ...state.availability };
    delete newAvailability[id];
    save({ people: newPeople, availability: newAvailability });
  };

  const addSlot = (personId: string, day: number, fromMin: number, toMin: number) => {
    if (!state) return;
    const currentPersonAvail = state.availability[personId] || {};
    const dayRanges = currentPersonAvail[day] || [];
    const newDayRanges = mergeRanges([...dayRanges, { fromMin, toMin }]);
    
    save({
      ...state,
      availability: {
        ...state.availability,
        [personId]: {
          ...currentPersonAvail,
          [day]: newDayRanges,
        },
      },
    });
  };

  const removeSlot = (personId: string, day: number, index: number) => {
    if (!state) return;
    const personAvailability = state.availability[personId];
    if (!personAvailability) return;
    const dayRanges = [...(personAvailability[day] || [])];
    dayRanges.splice(index, 1);

    save({
      ...state,
      availability: {
        ...state.availability,
        [personId]: {
          ...personAvailability,
          [day]: dayRanges,
        },
      },
    });
  };

  const computeResults = useCallback((selectedDay?: number): { alternatives: SlotResult[] } => {
    if (!state || state.people.length === 0) return { alternatives: [] };

    const totalPeople = state.people.length;
    const allOptions: SlotResult[] = [];

    for (let day = 0; day < 7; day++) {
      const ranges = getFreeRanges(day, state.people, state.availability);
      // Solo nos interesan los rangos donde TODOS pueden
      const perfectRanges = ranges.filter(r => r.count === totalPeople);
      allOptions.push(...perfectRanges);
    }

    const filtered = selectedDay !== undefined 
      ? allOptions.filter(o => o.day === selectedDay)
      : allOptions;

    const sorted = filtered.sort((a, b) => (b.end - b.start) - (a.end - a.start));

    return {
      alternatives: sorted
    };
  }, [state]);

  const resetAll = () => {
    localStorage.removeItem(LS_KEY);
    const freshState = {
      people: [
        { id: uid(), name: "Yo" },
        { id: uid(), name: "Amigo 1" },
      ],
      availability: {},
    };
    setState(freshState);
    localStorage.setItem(LS_KEY, JSON.stringify(freshState));
  };

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
