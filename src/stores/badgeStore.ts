// stores/badgeStore.ts
import React from "react";
import { create } from 'zustand';

type BadgeState = {
  tasksBadge: boolean;
  notificationsBadge: boolean;
  setBadge: (key: keyof Omit<BadgeState, 'setBadge'>, value: boolean) => void;
};

export const useBadgeStore = create<BadgeState>((set) => ({
  tasksBadge: false,
  notificationsBadge: false,
  setBadge: (key, value) => set({ [key]: value }),
}));
