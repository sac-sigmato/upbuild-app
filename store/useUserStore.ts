import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  _id: string;
  name: string;
  email: string;
  userRole?: string;
  [key: string]: any;
}

interface Store {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

const makeSafeStorage = (s: any) => ({
  getItem: async (key: string) => {
    try {
      return await s.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await s.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      await s.removeItem(key);
    } catch {}
  },
});

export const useUserStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      logout: () => set({ user: null, isLoggedIn: false }),

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "upbuild_user_store",

      // 🔥 THE REAL FIX
      storage: createJSONStorage(() => makeSafeStorage(AsyncStorage)),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
