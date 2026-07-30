import DripCampaignDetail from "@/src/components/drip-campaigns/DripCampaignDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DripCampaignDetail id={id} />;
}
