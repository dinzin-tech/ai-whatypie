"use client";

import { ROUTES } from "@/src/constants";
import { Badge } from "@/src/elements/ui/badge";
import { Button } from "@/src/elements/ui/button";
import {
  useDeleteDripCampaignMutation,
  useGetDripCampaignsQuery,
} from "@/src/redux/api/dripCampaignApi";
import { DripCampaign } from "@/src/types/dripCampaign";
import CommonHeader from "@/src/shared/CommonHeader";
import ConfirmModal from "@/src/shared/ConfirmModal";
import { DataTable } from "@/src/shared/DataTable";
import { Column } from "@/src/types/shared";
import { formatDateTime } from "@/src/utils";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  draft: "bg-blue-50 text-blue-700 border-blue-100",
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  paused: "bg-amber-50 text-amber-700 border-amber-100",
  completed: "bg-slate-50 text-slate-600 border-slate-100",
  cancelled: "bg-rose-50 text-rose-700 border-rose-100",
};

const DripCampaignsPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<DripCampaign | null>(null);
  const [poll, setPoll] = useState(false);

  const { data, isLoading, refetch, isFetching } = useGetDripCampaignsQuery(
    { page, limit, search: searchTerm },
    { pollingInterval: poll ? 5000 : 0 }
  );

  const campaigns: DripCampaign[] = data?.data?.campaigns || [];
  const totalCount = data?.data?.pagination?.totalItems || 0;

  useEffect(() => {
    setPoll(campaigns.some((c) => c.status === "active"));
  }, [campaigns]);

  const [deleteDrip, { isLoading: isDeleting }] = useDeleteDripCampaignMutation();

  const deletableStatuses = new Set(["draft", "paused", "completed", "cancelled", "active"]);

  const columns: Column<DripCampaign>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row) => <span className="font-semibold">{row.name}</span>,
    },
    {
      header: "Steps",
      cell: (row) => <span className="tabular-nums">{row.steps?.length ?? 0}</span>,
    },
    {
      header: "Recipients",
      cell: (row) => (
        <span className="tabular-nums">{row.stats?.recipient_count ?? row.analytics?.recipientCount ?? 0}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge variant="outline" className={statusStyles[row.status] || ""}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-slate-500">{row.created_at ? formatDateTime(row.created_at) : "—"}</span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(`${ROUTES.DripCampaigns}/${row._id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
          {deletableStatuses.has(row.status) && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="w-4 h-4 text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="sm:p-8 p-4 space-y-8 bg-(--page-body-bg) dark:bg-(--dark-body) min-h-screen">
      <CommonHeader
        title={t("drip_campaigns", "Drip campaigns")}
        description={t("drip_campaigns_desc", "Multi-step template sequences sent over time after enrollment.")}
        onSearch={setSearchTerm}
        onRefresh={refetch}
        isLoading={isLoading || isFetching}
        onAddClick={() => router.push(ROUTES.DripCampaignsAdd)}
        addLabel={t("create_drip_campaign", "Create drip campaign")}
        addPermission="create.campaigns"
        featureKey="contacts_used"
      />

      <div className="bg-white rounded-xl border shadow-sm dark:bg-(--card-color) dark:border-(--card-border-color)">
        <DataTable
          columns={columns}
          data={campaigns}
          isLoading={isLoading}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteDrip(deleteTarget._id).unwrap();
            toast.success("Drip campaign deleted");
            setDeleteTarget(null);
            refetch();
          } catch (err: unknown) {
            toast.error((err as { data?: { error?: string } })?.data?.error || "Failed to delete");
          }
        }}
        title="Delete drip campaign?"
        subtitle={
          deleteTarget?.status === "active"
            ? "This will stop all pending messages and permanently remove the campaign."
            : "This cannot be undone."
        }
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DripCampaignsPage;
