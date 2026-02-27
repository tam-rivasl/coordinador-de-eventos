"use client";

import { useState, useEffect, useCallback } from "react";
import { SchedulerState, Person, Availability, SlotResult } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges } from "@/lib/scheduler-utils";

const LS_KEY = "tiempojuntos_strict_v3";

export function useScheduler() {
  const [state, setState] = useState<SchedulerState | null>(null);

  // Carga inicial desde LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.people?.length) {
          setState(parsed);
          return;
        }
      } catch (e) {
        console.error("Error al cargar datos:", e);
      }
    }
    
    // Estado inicial por defecto si no hay nada guardado
    setState({
      people: [
        { id: uid(), name: "Yo" },
        { id: uid(), name: "Amigo 1" },
      ],
      availability: {},
    });
  }, []);

  // Persistencia automática cada vez que el estado cambia
  useEffect(() => {
    if (state) {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addPerson = useCallback((name: string) => {
    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        people: [...prev.people, { id: uid(), name: name.trim() }]
      };
    });
  }, []);

  const updatePerson = useCallback((id: string, name: string) => {
    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        people: prev.people.map(p => p.id === id ? { ...p, name: name.trim() } : p)
      };
    });
  }, []);

  const removePerson = useCallback((id: string) => {
    setState(prev => {
      if (!prev || prev.people[0].id === id) return prev;
      
      const newAvailability = { ...prev.availability };
      delete newAvailability[id];
      
      return {
        people: prev.people.filter(p => p.id !== id),
        availability: newAvailability
      };
    });
  }, []);

  const addSlot = useCallback((personId: string, day: number, fromMin: number, toMin: number) => {
    setState(prev => {
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
  }, []);

  const removeSlot = useCallback((personId: string, day: number, index: number) => {
    setState(prev => {
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

  const computeResults = useCallback((selectedDay?: number): { alternatives: SlotResult[] } => {
    if (!state || state.people.length === 0) return { alternatives: [] };

    const totalPeople = state.people.length;
    const allOptions: SlotResult[] = [];

    for (let day = 0; day < 7; day++) {
      const ranges = getFreeRanges(day, state.people, state.availability);
      const perfectRanges = ranges.filter(r => r.count === totalPeople);
      allOptions.push(...perfectRanges);
    }

    const filtered = selectedDay !== undefined 
      ? allOptions.filter(o => o.day === selectedDay)
      : allOptions;

    return {
      alternatives: filtered.sort((a, b) => (b.end - b.start) - (a.end - a.start))
    };
  }, [state]);

  const resetAll = useCallback(() => {
    const freshState = {
      people: [
        { id: uid(), name: "Yo" },
        { id: uid(), name: "Amigo 1" },
      ],
      availability: {},
    };
    localStorage.setItem(LS_KEY, JSON.stringify(freshState));
    setState(freshState);
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
