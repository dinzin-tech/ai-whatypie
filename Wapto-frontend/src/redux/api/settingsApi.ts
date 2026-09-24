import { AIModelsResponse, AISettings, AISettingsResponse, TestConnectionRequest, TestConnectionResponse } from "@/src/types/settings";
import { baseApi } from "./baseApi";

export const settingsApi = baseApi.enhanceEndpoints({ addTagTypes: ["Settings"] }).injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: (params) => ({
        url: "/setting",
        params,
      }),
    }),
    getUserSettings: builder.query<AISettingsResponse, void>({
      query: () => ({
        url: "/setup",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    getAllModels: builder.query<AIModelsResponse, void>({
      query: () => ({
        url: "/setup/models",
        method: "GET",
      }),
    }),
    updateUserSettings: builder.mutation<void, AISettings | FormData>({
      query: (body) => ({
        url: "/setup",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    testAIConnection: builder.mutation<TestConnectionResponse, TestConnectionRequest>({
      query: (body) => ({
        url: "/setup/test-connection",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetSettingsQuery, useGetUserSettingsQuery, useGetAllModelsQuery, useUpdateUserSettingsMutation, useTestAIConnectionMutation } = settingsApi;

