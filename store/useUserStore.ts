import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/* ---------------- TYPES ---------------- */

export interface User {
  _id: string;
  name: string;
  email: string;
  userType?: string;
  roleName?: string;
  apartment?: string;
  flat?: string;
  [key: string]: any;
}

interface Store {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

/* ---------------- SAFE STORAGE ---------------- */

const makeSafeStorage = (storage: any) => ({
  getItem: async (key: string) => {
    try {
      return await storage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await storage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      await storage.removeItem(key);
    } catch {}
  },
});

/* ---------------- STORE ---------------- */

export const useUserStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      setUser: (user) =>
        set({
          user,
          isLoggedIn: !!user,
        }),

      setToken: (token) =>
        set({
          token,
          isLoggedIn: !!token,
        }),

      // store/useUserStore.ts
      logout: async () => {
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("upbuild_user_store");
        } catch {}
        set({ user: null, isLoggedIn: false });
      },

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "upbuild_user_store",

      // ✅ SAFE + EXPO FRIENDLY
      storage: createJSONStorage(() => makeSafeStorage(AsyncStorage)),

      // ✅ VERY IMPORTANT
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
