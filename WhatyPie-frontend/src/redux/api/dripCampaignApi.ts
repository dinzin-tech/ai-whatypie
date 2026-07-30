import { DripAudiencePayload, DripAudiencePreview, DripCampaign } from "@/src/types/dripCampaign";
import { baseApi } from "./baseApi";

export const dripCampaignApi = baseApi.enhanceEndpoints({ addTagTypes: ["DripCampaign"] }).injectEndpoints({
  endpoints: (builder) => ({
    getDripCampaigns: builder.query({
      query: (params) => ({
        url: "/drip-campaigns",
        params,
      }),
      providesTags: ["DripCampaign"],
    }),
    getDripCampaignById: builder.query<{ success: boolean; data: DripCampaign }, string>({
      query: (id) => `/drip-campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: "DripCampaign", id }],
    }),
    createDripCampaign: builder.mutation({
      query: (body) => ({
        url: "/drip-campaigns",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DripCampaign"],
    }),
    updateDripCampaign: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/drip-campaigns/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["DripCampaign", { type: "DripCampaign", id }],
    }),
    deleteDripCampaign: builder.mutation({
      query: (id) => ({
        url: `/drip-campaigns/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DripCampaign"],
    }),
    previewDripAudience: builder.mutation<{ success: boolean; data: DripAudiencePreview }, { id: string; body: DripAudiencePayload }>({
      query: ({ id, body }) => ({
        url: `/drip-campaigns/${id}/preview-audience`,
        method: "POST",
        body,
      }),
    }),
    activateDripCampaign: builder.mutation({
      query: ({ id, body }) => ({
        url: `/drip-campaigns/${id}/activate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["DripCampaign", { type: "DripCampaign", id }],
    }),
    pauseDripCampaign: builder.mutation({
      query: (id) => ({
        url: `/drip-campaigns/${id}/pause`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => ["DripCampaign", { type: "DripCampaign", id }],
    }),
    resumeDripCampaign: builder.mutation({
      query: (id) => ({
        url: `/drip-campaigns/${id}/resume`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => ["DripCampaign", { type: "DripCampaign", id }],
    }),
    retryPendingDripCampaign: builder.mutation({
      query: (id) => ({
        url: `/drip-campaigns/${id}/retry-pending`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => ["DripCampaign", { type: "DripCampaign", id }],
    }),
  }),
});

export const {
  useGetDripCampaignsQuery,
  useGetDripCampaignByIdQuery,
  useCreateDripCampaignMutation,
  useUpdateDripCampaignMutation,
  useDeleteDripCampaignMutation,
  usePreviewDripAudienceMutation,
  useActivateDripCampaignMutation,
  usePauseDripCampaignMutation,
  useResumeDripCampaignMutation,
  useRetryPendingDripCampaignMutation,
} = dripCampaignApi;
