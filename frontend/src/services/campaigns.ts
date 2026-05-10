import { api } from "./api";
import type { Campaign, CampaignMember, CampaignSnapshot } from "@/types/campaign";

export async function createCampaign(name: string, description?: string, worldType?: string) {
  const res = await api.post<{ campaign: Campaign }>("/api/campaigns", { name, description, worldType });
  return res.data;
}

export async function joinCampaign(inviteCode: string) {
  const res = await api.post<{ campaign: Campaign; membership: CampaignMember }>("/api/campaigns/join", { inviteCode });
  return res.data;
}

export async function getActiveCampaign() {
  const res = await api.get<{ campaign: Campaign }>("/api/campaigns/active");
  return res.data;
}

export async function getCampaign(campaignId: number) {
  const res = await api.get<{ campaign: Campaign; members: CampaignMember[] }>(`/api/campaigns/${campaignId}`);
  return res.data;
}

export async function getCampaignSnapshot(campaignId: number) {
  const res = await api.get<{ snapshot: CampaignSnapshot }>(`/api/campaigns/${campaignId}/snapshot`);
  return res.data;
}
