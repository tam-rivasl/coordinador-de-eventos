"use client";

import { useState, useEffect } from "react";
import { SchedulerState, Person, Availability, TimeRange, SlotResult } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges, scoreAlt } from "@/lib/scheduler-utils";

const LS_KEY = "tiempojuntos_expert_v3";

export function useScheduler() {
  const [state, setState] = useState<SchedulerState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        initializeDefault();
      }
    } else {
      initializeDefault();
    }
  }, []);

  const initializeDefault = () => {
    const defaultState: SchedulerState = {
      people: [
        { id: uid(), name: "Yo" },
        { id: uid(), name: "Amigo 1" },
      ],
      availability: {},
    };
    save(defaultState);
  };

  const save = (newState: SchedulerState) => {
    setState(newState);
    localStorage.setItem(LS_KEY, JSON.stringify(newState));
  };

  const addPerson = (name: string) => {
    if (!state) return;
    const newPerson: Person = { id: uid(), name };
    save({ ...state, people: [...state.people, newPerson] });
  };

  const removePerson = (id: string) => {
    if (!state) return;
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

  const computeResults = (selectedDay?: number): { best: SlotResult | null; alternatives: SlotResult[] } => {
    if (!state || state.people.length === 0) return { best: null, alternatives: [] };

    const allOptions: SlotResult[] = [];
    const mainPersonId = state.people[0]?.id;

    for (let day = 0; day < 7; day++) {
      const ranges = getFreeRanges(day, state.people, state.availability);
      allOptions.push(...ranges);
    }

    const filtered = selectedDay !== undefined 
      ? allOptions.filter(o => o.day === selectedDay)
      : allOptions;

    const totalPeople = state.people.length;
    
    // El ordenamiento ahora es mucho más estricto
    const sorted = filtered.sort((a, b) => 
      scoreAlt(b, totalPeople, mainPersonId) - scoreAlt(a, totalPeople, mainPersonId)
    );

    // Filtrar opciones que son realmente malas (ej: donde falta el organizador y hay mejores opciones)
    const validResults = sorted.filter(s => scoreAlt(s, totalPeople, mainPersonId) > -5000);

    return {
      best: validResults[0] || null,
      alternatives: validResults.slice(0, 30)
    };
  };

  const resetAll = () => {
    if (confirm("¿Limpiar todos los datos?")) {
      localStorage.removeItem(LS_KEY);
      initializeDefault();
    }
  };

  return {
    state,
    addPerson,
    removePerson,
    addSlot,
    removeSlot,
    computeResults,
    resetAll,
  };
}
