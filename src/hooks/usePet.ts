// ════════════════════════════════════════════════════════════════
// usePet — React Hook for Virtual Pet State Management
// ════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PetState, CareAction, NeedDecayResult, PetSpecies } from '@/lib/pet/PetEngine';
import {
  performCareAction,
  processOfflineDecay,
  evolvePet,
  earnCarePoints,
  toggleSleep,
  createPet,
} from '@/lib/pet/PetEngine';
import { apiFetch } from '@/lib/api';

export interface UsePetReturn {
  pet: PetState | null;
  isLoading: boolean;
  error: string | null;
  lastDecayResult: NeedDecayResult | null;

  // Actions
  care: (action: CareAction) => Promise<boolean>;
  evolve: () => Promise<boolean>;
  addCarePoints: (points: number, activity: string) => Promise<boolean>;
  sleep: () => Promise<boolean>;
  create: (name: string, species: PetSpecies) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePet(childId: string | null): UsePetReturn {
  const [pet, setPet] = useState<PetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDecayResult, setLastDecayResult] = useState<NeedDecayResult | null>(null);

  const fetchPet = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(`/api/pet?childId=${childId}`);
      const data = await res.json();

      if (data.success && data.pet) {
        // Process offline decay
        const decayResult = processOfflineDecay(data.pet);
        setPet(decayResult.state);
        setLastDecayResult(decayResult);
      } else {
        // No pet yet — this is normal, child hasn't created one
        setPet(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pet');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const care = useCallback(async (action: CareAction): Promise<boolean> => {
    if (!pet || !childId) return false;

    const result = performCareAction(pet, action);
    if (!result.success) {
      setError(result.message);
      return false;
    }

    setPet(result.state);

    try {
      await apiFetch('/api/pet/care', {
        method: 'POST',
        body: JSON.stringify({ childId, action }),
      });
    } catch {
      // Non-critical: state is optimistic
    }

    return true;
  }, [pet, childId]);

  const evolve = useCallback(async (): Promise<boolean> => {
    if (!pet || !childId) return false;

    const result = evolvePet(pet);
    setPet(result.state);

    try {
      await apiFetch('/api/pet/evolve', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
    } catch {
      // Non-critical
    }

    return true;
  }, [pet, childId]);

  const addCarePoints = useCallback(async (points: number, activity: string): Promise<boolean> => {
    if (!pet || !childId) return false;

    const result = earnCarePoints(pet, points, activity);
    setPet(result.state);

    try {
      await apiFetch('/api/pet/cp', {
        method: 'POST',
        body: JSON.stringify({ childId, points, activity }),
      });
    } catch {
      // Non-critical
    }

    return true;
  }, [pet, childId]);

  const sleep = useCallback(async (): Promise<boolean> => {
    if (!pet || !childId) return false;

    const newState = toggleSleep(pet);
    setPet(newState);

    try {
      await apiFetch('/api/pet/sleep', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
    } catch {
      // Non-critical
    }

    return true;
  }, [pet, childId]);

  const create = useCallback(async (name: string, species: PetSpecies): Promise<boolean> => {
    if (!childId) return false;

    try {
      const res = await apiFetch('/api/pet', {
        method: 'POST',
        body: JSON.stringify({ childId, name, species }),
      });
      const data = await res.json();

      if (data.success && data.pet) {
        setPet(data.pet);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pet');
      return false;
    }
  }, [childId]);

  return {
    pet,
    isLoading,
    error,
    lastDecayResult,
    care,
    evolve,
    addCarePoints,
    sleep,
    create,
    refresh: fetchPet,
  };
}
