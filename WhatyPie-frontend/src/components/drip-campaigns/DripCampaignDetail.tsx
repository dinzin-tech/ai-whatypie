"use client";

import { Badge } from "@/src/elements/ui/badge";
import { Button } from "@/src/elements/ui/button";
import { Card } from "@/src/elements/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/elements/ui/tabs";
import { ROUTES } from "@/src/constants";
import {
  useDeleteDripCampaignMutation,
  useGetDripCampaignByIdQuery,
  usePauseDripCampaignMutation,
  useResumeDripCampaignMutation,
  useRetryPendingDripCampaignMutation,
} from "@/src/redux/api/dripCampaignApi";
import ConfirmModal from "@/src/shared/ConfirmModal";
import { formatOffsetLabel } from "@/src/utils/dripOffset";
import { ArrowLeft, Loader2, Pause, Play, RefreshCw, Rocket, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DripActivateModal from "./DripActivateModal";

const statusColor: Record<string, string> = {
  draft: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  completed: "bg-slate-100 text-slate-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const DripCampaignDetail = ({ id }: { id: string }) => {
  const router = useRouter();
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "config">("steps");
  const [pollingInterval, setPollingInterval] = useState(0);
  const { data, isLoading, refetch, isFetching } = useGetDripCampaignByIdQuery(id, {
    pollingInterval,
  });

  useEffect(() => {
    setPollingInterval(data?.data?.status === "active" ? 5000 : 0);
  }, [data?.data?.status]);
  const [pause, { isLoading: pausing }] = usePauseDripCampaignMutation();
  const [resume, { isLoading: resuming }] = useResumeDripCampaignMutation();
  const [retryPending, { isLoading: retrying }] = useRetryPendingDripCampaignMutation();
  const [deleteCampaign, { isLoading: deleting }] = useDeleteDripCampaignMutation();

  const campaign = data?.data;
  const analytics = campaign?.analytics;

  const handlePause = async () => {
    try {
      await pause(id).unwrap();
      toast.success("Campaign paused");
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Failed to pause");
    }
  };

  const handleResume = async () => {
    try {
      await resume(id).unwrap();
      toast.success("Campaign resumed");
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Failed to resume");
    }
  };

  const pendingTotal =
    analytics?.perStep?.reduce((sum, row) => sum + (row.pending ?? 0), 0) ?? 0;

  const handleRetryPending = async () => {
    try {
      await retryPending(id).unwrap();
      toast.success("Pending steps re-queued");
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Failed to retry pending steps");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaign(id).unwrap();
      toast.success("Drip campaign deleted");
      router.push(ROUTES.DripCampaigns);
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Failed to delete campaign");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-muted-foreground">Campaign not found</p>;
  }

  const showActivate = campaign.status === "draft" && (analytics?.recipientCount ?? 0) === 0;
  const deleteSubtitle =
    campaign.status === "active"
      ? "This will stop all pending messages and permanently remove the campaign."
      : "This cannot be undone. All campaign data will be removed.";

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.DripCampaigns)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{campaign.name}</h1>
            <Badge className={statusColor[campaign.status] || ""}>{campaign.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {showActivate && (
            <Button onClick={() => setActivateOpen(true)} className="rounded-lg gap-2">
              <Rocket className="w-4 h-4" /> Activate
            </Button>
          )}
          {campaign.status === "active" && (
            <Button variant="outline" onClick={handlePause} disabled={pausing}>
              <Pause className="w-4 h-4 mr-1" /> Pause
            </Button>
          )}
          {campaign.status === "paused" && (analytics?.recipientCount ?? 0) > 0 && (
            <Button onClick={handleResume} disabled={resuming}>
              <Play className="w-4 h-4 mr-1" /> Resume
            </Button>
          )}
          {(campaign.status === "active" || campaign.status === "paused") && pendingTotal > 0 && (
            <Button variant="outline" onClick={handleRetryPending} disabled={retrying}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry pending steps
            </Button>
          )}
          <Button
            variant="outline"
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          {isFetching && <Loader2 className="w-4 h-4 animate-spin self-center" />}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-bold">Recipients</p>
          <p className="text-2xl font-bold tabular-nums">{analytics?.recipientCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-bold">Steps</p>
          <p className="text-2xl font-bold tabular-nums">{campaign.steps?.length ?? 0}</p>
        </Card>
      </div>

      <Tabs>
        <TabsList>
          <TabsTrigger active={activeTab === "steps"} onClick={() => setActiveTab("steps")}>
            Steps funnel
          </TabsTrigger>
          <TabsTrigger active={activeTab === "config"} onClick={() => setActiveTab("config")}>
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent active={activeTab === "steps"} className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Step</th>
                  <th className="p-3 text-left">Template</th>
                  <th className="p-3 text-left">Delay</th>
                  <th className="p-3 text-right">Sent</th>
                  <th className="p-3 text-right">Delivered</th>
                  <th className="p-3 text-right">Read</th>
                  <th className="p-3 text-right">Failed</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.perStep || []).map((row) => (
                  <tr key={row.step_index} className="border-t">
                    <td className="p-3">{row.step_index + 1}</td>
                    <td className="p-3">{row.template_name}</td>
                    <td className="p-3">{formatOffsetLabel(row.offset_ms)}</td>
                    <td className="p-3 text-right tabular-nums">{row.sent}</td>
                    <td className="p-3 text-right tabular-nums">{row.delivered}</td>
                    <td className="p-3 text-right tabular-nums">{row.read}</td>
                    <td className="p-3 text-right tabular-nums">{row.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(analytics?.perStep || []).some((row) => (row.failed ?? 0) > 0 && row.sample_failures?.length) && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40 p-4 space-y-3">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Delivery errors</p>
              {(analytics?.perStep || [])
                .filter((row) => (row.failed ?? 0) > 0 && row.sample_failures?.length)
                .map((row) => (
                  <div key={row.step_index} className="text-sm">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      Step {row.step_index + 1} ({row.failed} failed)
                    </p>
                    <ul className="list-disc pl-5 mt-1 text-rose-700 dark:text-rose-300 space-y-0.5">
                      {row.sample_failures!.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent active={activeTab === "config"} className="mt-4 space-y-2">
          <p className="text-sm">
            <span className="font-bold">Opt-out field:</span>{" "}
            {campaign.opt_out_custom_field_key || "None (all matched contacts eligible)"}
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {campaign.steps?.map((s, i) => (
              <li key={i}>
                {s.template_name} — {formatOffsetLabel(s.offset_ms)}
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <DripActivateModal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        campaignId={id}
        onActivated={() => refetch()}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete drip campaign?"
        subtitle={deleteSubtitle}
        isLoading={deleting}
      />
    </div>
  );
};

export default DripCampaignDetail;
