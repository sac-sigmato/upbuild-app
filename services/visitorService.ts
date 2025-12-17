import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_url } from "../utils/apiLocalhost";

export interface FetchVisitorsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  occupantAcceptStatus?: string;
  fromDate?: string;
  toDate?: string;
}

export interface VisitorsResponse {
  visitors: any[];
  total: number;
}

export const visitorService = {
  // Get apartment ID from storage or user store
  async getApartmentId(user: any): Promise<string | null> {
    if (user?.apartment) return user.apartment;

    try {
      const raw = await AsyncStorage.getItem("upbuild_user_store");
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.apartment ?? null;
    } catch {
      return null;
    }
  },

  // Get authentication token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("token");
  },

  // Fetch visitors with filters
  async fetchVisitors(
    params: FetchVisitorsParams,
    user: any
  ): Promise<VisitorsResponse> {
    const apartmentId = await visitorService.getApartmentId(user);
    const token = await visitorService.getToken();

    if (!apartmentId) {
      throw new Error("Apartment ID missing");
    }

    const response = await fetch(
      `${api_url}get/visitors/by/apartmentId/${apartmentId}`,
      {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Export visitors by IDs
  // Update in visitorService.exportVisitorsByIds and exportVisitorsByDateRange
  async exportVisitorsByIds(visitorIds: string[]) {
    const token = await this.getToken();
    const res = await fetch(`${api_url}export/visitors/pdf`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorIds }),
    });

    const contentType = res.headers.get("content-type") || "";
    const status = res.status;

    if (!res.ok) {
      let errBody = null;
      try {
        errBody = await res.json();
      } catch (e) {
        errBody = await res.text().catch(() => null);
      }
      return { ok: false, status, contentType, body: errBody };
    }

    // FIX: Properly get arrayBuffer from response
    const arrayBuffer = await res.arrayBuffer();

    return {
      ok: true,
      status,
      contentType,
      arrayBuffer, // This should now be a proper ArrayBuffer
      arrayBufferData: Array.from(new Uint8Array(arrayBuffer)), // Optional: Also include as array for debugging
    };
  },

  async exportVisitorsByDateRange(fromDate: string, toDate: string) {
    const token = await this.getToken();
    const res = await fetch(`${api_url}export/visitors/pdf`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fromDate, toDate }),
    });

    const contentType = res.headers.get("content-type") || "";
    const status = res.status;

    if (!res.ok) {
      let errBody = null;
      try {
        errBody = await res.json();
      } catch (e) {
        errBody = await res.text().catch(() => null);
      }
      return { ok: false, status, contentType, body: errBody };
    }

    const arrayBuffer = await res.arrayBuffer();
    return { ok: true, status, contentType, arrayBuffer };
  },
};
