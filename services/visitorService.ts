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
  async exportVisitorsByIds(visitorIds: string[]): Promise<void> {
    const token = await visitorService.getToken();

    const response = await fetch(`${api_url}export/visitors/pdf`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorIds }),
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }
  },

  // Export visitors by date range
  async exportVisitorsByDateRange(
    fromDate: string,
    toDate: string
  ): Promise<void> {
    const token = await visitorService.getToken();

    const response = await fetch(`${api_url}export/visitors/pdf`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fromDate, toDate }),
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }
  },
};
