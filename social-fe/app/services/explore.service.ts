import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { ExploreResponse } from "../interfaces/discovery.interface";

export const ExploreService = {
  getExplore: (q?: string, limit = 10) =>
    apiClient.get<ExploreResponse>(API_ENDPOINT.EXPLORE.GET(q, limit)),
};
