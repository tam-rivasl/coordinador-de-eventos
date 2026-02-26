"use client";

import { useState, useEffect } from "react";
import { SchedulerState, Person, Availability, TimeRange, SlotResult, STEP } from "@/types/scheduler";
import { uid, mergeRanges, buildBusySet, scoreAlt } from "@/lib/scheduler-utils";

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

  const computeResults = (): { best: SlotResult | null; alternatives: SlotResult[] } => {
    if (!state || state.people.length === 0) return { best: null, alternatives: [] };

    const alts: SlotResult[] = [];
    const people = state.people;

    // Define the range of interest (e.g., 08:00 to 24:00 for hangouts)
    // Or just check the whole 24 hours.
    const START_H = 8 * 60;
    const END_H = 24 * 60;

    for (let day = 0; day < 7; day++) {
      const busySets = people.map((p) => ({
        p,
        set: buildBusySet(p.id, day, state.availability),
      }));

      for (let t = START_H; t < END_H; t += STEP) {
        // A person is free if they are NOT in the busy set
        const freePeople = busySets.filter((x) => !x.set.has(t)).map((x) => x.p);
        
        if (freePeople.length > 0) {
          alts.push({
            day,
            start: t,
            end: t + STEP,
            count: freePeople.length,
            can: freePeople,
          });
        }
      }
    }

    if (alts.length === 0) return { best: null, alternatives: [] };

    // Sort by most people free, then earlier time
    const sorted = alts.sort((a, b) => scoreAlt(b) - scoreAlt(a));
    
    const uniqueAlts: SlotResult[] = [];
    const seen = new Set<string>();

    for (const a of sorted) {
      const key = `${a.day}-${a.start}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAlts.push(a);
      }
      if (uniqueAlts.length >= 15) break;
    }

    return {
      best: uniqueAlts[0] || null,
      alternatives: uniqueAlts.slice(1),
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
