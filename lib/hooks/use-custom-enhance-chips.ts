"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ai-enhance-custom-chips";
const MAX_CHIPS = 3;

export interface CustomChip {
  id: string;
  label: string;
  direction: string;
  usedAt: number;
}

export function useCustomEnhanceChips() {
  const [chips, setChips] = useState<CustomChip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomChip[];
        // Sort by most recently used
        setChips(parsed.sort((a, b) => b.usedAt - a.usedAt));
      }
    } catch (error) {
      console.error("Failed to load custom chips:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever chips change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chips));
      } catch (error) {
        console.error("Failed to save custom chips:", error);
      }
    }
  }, [chips, isLoaded]);

  const addOrUpdateChip = useCallback((direction: string) => {
    const trimmed = direction.trim();
    if (!trimmed) return;

    // Create a short label (max 20 chars)
    const label =
      trimmed.length > 20 ? trimmed.slice(0, 18) + "..." : trimmed;

    setChips((current) => {
      // Check if this direction already exists
      const existingIndex = current.findIndex(
        (c) => c.direction.toLowerCase() === trimmed.toLowerCase()
      );

      let updated: CustomChip[];

      if (existingIndex >= 0) {
        // Update existing chip's timestamp
        updated = current.map((c, i) =>
          i === existingIndex ? { ...c, usedAt: Date.now() } : c
        );
      } else {
        // Add new chip
        const newChip: CustomChip = {
          id: crypto.randomUUID(),
          label,
          direction: trimmed,
          usedAt: Date.now(),
        };
        updated = [newChip, ...current];
      }

      // Sort by most recently used and keep only MAX_CHIPS
      return updated.sort((a, b) => b.usedAt - a.usedAt).slice(0, MAX_CHIPS);
    });
  }, []);

  const removeChip = useCallback((id: string) => {
    setChips((current) => current.filter((c) => c.id !== id));
  }, []);

  return {
    chips,
    addOrUpdateChip,
    removeChip,
    isLoaded,
  };
}
