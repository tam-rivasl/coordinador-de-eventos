"use client";

import { useState, useEffect } from "react";
import { SchedulerState, Person, Availability, TimeRange, SlotResult, STEP } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges, scoreAlt } from "@/lib/scheduler-utils";

const LS_KEY = "tiempojuntos_v1";

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
    setState(defaultState);
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

  const renamePerson = (id: string, name: string) => {
    if (!state) return;
    const newPeople = state.people.map((p) => (p.id === id ? { ...p, name } : p));
    save({ ...state, people: newPeople });
  };

  const addSlot = (personId: string, day: number, fromMin: number, toMin: number) => {
    if (!state) return;
    const currentAvailability = state.availability[personId] || {};
    const dayRanges = currentAvailability[day] || [];
    const newDayRanges = mergeRanges([...dayRanges, { fromMin, toMin }]);
    
    save({
      ...state,
      availability: {
        ...state.availability,
        [personId]: {
          ...currentAvailability,
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

  const computeResults = (selectedDay?: number): { best: SlotResult | null; alternatives: SlotResult[]; byDay: Record<number, SlotResult[]> } => {
    if (!state || state.people.length === 0) return { best: null, alternatives: [], byDay: {} };

    const allRanges: SlotResult[] = [];
    const byDay: Record<number, SlotResult[]> = {};

    for (let day = 0; day < 7; day++) {
      const ranges = getFreeRanges(day, state.people, state.availability);
      byDay[day] = ranges;
      allRanges.push(...ranges);
    }

    if (allRanges.length === 0) return { best: null, alternatives: [], byDay: {} };

    // Sort by "quality" (max people, then earlier)
    const sorted = allRanges.sort((a, b) => scoreAlt(b) - scoreAlt(a));
    
    // Filter by selected day if provided
    const filteredSorted = selectedDay !== undefined 
      ? sorted.filter(r => r.day === selectedDay)
      : sorted;

    return {
      best: filteredSorted[0] || null,
      alternatives: filteredSorted.slice(1, 20),
      byDay
    };
  };

  const resetAll = () => {
    localStorage.removeItem(LS_KEY);
    initializeDefault();
  };

  const importData = (data: SchedulerState) => {
    save(data);
  };

  return {
    state,
    addPerson,
    removePerson,
    renamePerson,
    addSlot,
    removeSlot,
    computeResults,
    resetAll,
    importData,
  };
}
