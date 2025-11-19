import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_url } from "../utils/apiLocalhost"; // adjust if path differs

export type PermissionResponse = {
  permissions: string[];
  roleSlug: string;
};

// ✅ Fetch permissions & role from backend (mobile-safe)
export async function getMyPermissions(): Promise<PermissionResponse> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      return { permissions: [], roleSlug: "" };
    }

    const res = await fetch(`${api_url}user/get/my/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => null);

    const permissions: string[] = Array.isArray(data?.permissions)
      ? data.permissions
      : [];

    const roleSlug: string =
      typeof data?.roleSlug === "string" ? data.roleSlug : "";

    return { permissions, roleSlug };
  } catch (error) {
    console.error("🔐 Error fetching permissions:", error);
    return { permissions: [], roleSlug: "" };
  }
}
