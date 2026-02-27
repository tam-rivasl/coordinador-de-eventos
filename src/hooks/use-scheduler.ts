
"use client";

import { useState, useEffect, useCallback } from "react";
import { SchedulerState, SlotResult } from "@/types/scheduler";
import { uid, mergeRanges, getFreeRanges } from "@/lib/scheduler-utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SCHEMA_VERSION = 5;

function createInitialState(): SchedulerState {
  return {
    people: [{ id: uid(), name: "Yo" }],
    availability: {},
  };
}

export function useScheduler(roomId: string | null) {
  const [state, setState] = useState<SchedulerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay base de datos (por falta de config), caemos a modo local temporal
    if (!db || !roomId) {
      if (!roomId) setLoading(false);
      return;
    }

    const docRef = doc(db, "meetings", roomId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SchedulerState;
        setState(data);
      } else {
        const initial = createInitialState();
        setDoc(docRef, { ...initial, schemaVersion: SCHEMA_VERSION });
        setState(initial);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en Firestore onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const syncToCloud = useCallback(async (newState: SchedulerState) => {
    if (!roomId || !db) {
      // Si no hay nube, guardamos en el estado local para que al menos funcione la sesión
      setState(newState);
      return;
    }
    try {
      await setDoc(doc(db, "meetings", roomId), { ...newState, schemaVersion: SCHEMA_VERSION });
    } catch (e) {
      console.error("Error al guardar en la nube:", e);
    }
  }, [roomId]);

  const addPerson = useCallback(async (name: string) => {
    if (!state) return;
    const newState = {
      ...state,
      people: [...state.people, { id: uid(), name: name.trim() }],
    };
    await syncToCloud(newState);
  }, [state, syncToCloud]);

  const updatePerson = useCallback(async (id: string, name: string) => {
    if (!state) return;
    const newState = {
      ...state,
      people: state.people.map((p) =>
        p.id === id ? { ...p, name: name.trim() } : p
      ),
    };
    await syncToCloud(newState);
  }, [state, syncToCloud]);

  const removePerson = useCallback(async (id: string) => {
    if (!state || state.people.length <= 1) return;

    const newAvailability = { ...state.availability };
    delete newAvailability[id];

    const newState = {
      ...state,
      people: state.people.filter((p) => p.id !== id),
      availability: newAvailability,
    };
    await syncToCloud(newState);
  }, [state, syncToCloud]);

  const addSlot = useCallback(
    async (personId: string, day: number, fromMin: number, toMin: number) => {
      if (!state) return;

      const currentPersonAvail = state.availability[personId] || {};
      const dayRanges = currentPersonAvail[day] || [];
      const newDayRanges = mergeRanges([...dayRanges, { fromMin, toMin }]);

      const newState = {
        ...state,
        availability: {
          ...state.availability,
          [personId]: {
            ...currentPersonAvail,
            [day]: newDayRanges,
          },
        },
      };
      await syncToCloud(newState);
    },
    [state, syncToCloud]
  );

  const removeSlot = useCallback(async (personId: string, day: number, index: number) => {
    if (!state || !state.availability[personId]) return;

    const dayRanges = [...(state.availability[personId][day] || [])];
    dayRanges.splice(index, 1);

    const newState = {
      ...state,
      availability: {
        ...state.availability,
        [personId]: {
          ...state.availability[personId],
          [day]: dayRanges,
        },
      },
    };
    await syncToCloud(newState);
  }, [state, syncToCloud]);

  const computeResults = useCallback(
    (selectedDay?: number): { alternatives: SlotResult[] } => {
      if (!state || state.people.length === 0) return { alternatives: [] };

      const totalPeople = state.people.length;
      const allOptions: SlotResult[] = [];

      const daysToCheck =
        selectedDay !== undefined && selectedDay !== -1 ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];

      for (const day of daysToCheck) {
        const ranges = getFreeRanges(day, state.people, state.availability);
        // Filtramos solo los rangos donde TODOS pueden
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

  const resetAll = useCallback(async () => {
    const initial = createInitialState();
    await syncToCloud(initial);
  }, [syncToCloud]);

  return {
    state,
    loading,
    addPerson,
    updatePerson,
    removePerson,
    addSlot,
    removeSlot,
    computeResults,
    resetAll,
  };
}
