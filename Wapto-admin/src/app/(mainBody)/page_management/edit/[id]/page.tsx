"use client";

import PageForm from "@/src/components/pages/PageForm";
import { ROUTES } from "@/src/constants";
import { useGetPageByIdQuery, useUpdatePageMutation } from "@/src/redux/api/pageApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const REDIRECT_DELAY_MS = 4000;

const EditPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams();
  const { data, isLoading: isFetching, isError, error } = useGetPageByIdQuery(id as string);
  const [updatePage, { isLoading: isUpdating }] = useUpdatePageMutation();
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isError) return;

    const message =
      (error as { data?: { message?: string } })?.data?.message ||
      t("pages_error_fetch", "Failed to load page");
    setFetchError(message);

    const isAuthError =
      (error as { status?: number })?.status === 401 ||
      (error as { status?: number })?.status === 403;

    if (!isAuthError) {
      toast.error(message);
    }

    const timer = setTimeout(() => {
      router.replace(ROUTES.ManagePages);
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isError, error, router, t]);

  const handleSubmit = async (formData: FormData) => {
    try {
      await updatePage({ id: id as string, data: formData }).unwrap();
      toast.success(t("pages_success_updated", "Page updated successfully"));
      router.push(ROUTES.ManagePages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.data?.message || t("pages_error_update", "Failed to update page"));
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="w-10 h-10 border-4 border-(--text-green-primary)/30 border-t-(--text-green-primary) rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data?.data?._id) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {fetchError || t("pages_error_fetch", "Failed to load page")}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("pages_redirecting", "Returning to page list…")}
        </p>
      </div>
    );
  }

  return <PageForm initialData={data.data} onSubmit={handleSubmit} isLoading={isUpdating} isEdit />;
};

export default EditPage;
