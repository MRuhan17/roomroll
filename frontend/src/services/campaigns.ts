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

export async function updateCampaign(campaignId: number, description?: string, worldType?: string) {
  const res = await api.put<{ campaign: Campaign }>(`/api/campaigns/${campaignId}`, { description, worldType });
  return res.data;
}

export async function createMap(campaignId: number, name: string, imageBase64: string, gridEnabled: boolean = true, gridSize: number = 50) {
  const res = await api.post(`/api/campaigns/${campaignId}/maps`, { name, imageBase64, gridEnabled, gridSize });
  return res.data;
}

export async function createLore(campaignId: number, title: string, category: string, content: string) {
  const res = await api.post(`/api/campaigns/${campaignId}/lore`, { title, category, content });
  return res.data;
}

export async function createFaction(campaignId: number, name: string, description: string, baseLocation?: string) {
  const res = await api.post(`/api/campaigns/${campaignId}/factions`, { name, description, baseLocation });
  return res.data;
}
