import { api } from "./api";
import type { Campaign, CampaignParticipant, CampaignSnapshot } from "@/types/campaign";

export async function createCampaign(
  name: string, 
  description?: string, 
  worldType?: string, 
  playMode?: 'human_dm' | 'player_only' | 'ai_dm',
  genre?: string,
  tone?: string,
  storyFootnotes?: string,
  guidance?: any,
  targetSessions?: number,
  pacingIntensity?: 'auto' | 'slow' | 'balanced' | 'fast',
  criticalArcs?: string[]
) {
  const res = await api.post<{ campaign: Campaign }>("/api/campaigns", { 
    name, 
    description, 
    worldType, 
    playMode,
    genre,
    tone,
    storyFootnotes,
    guidance,
    targetSessions,
    pacingIntensity,
    criticalArcs
  });
  return res.data;
}

export async function updateCampaignPacing(
  campaignId: number,
  targetSessions?: number,
  completedSessions?: number,
  pacingIntensity?: 'auto' | 'slow' | 'balanced' | 'fast',
  criticalArcs?: string[]
) {
  const res = await api.put<{ campaign: Campaign }>(`/api/campaigns/${campaignId}/pacing`, {
    targetSessions,
    completedSessions,
    pacingIntensity,
    criticalArcs
  });
  return res.data;
}

export async function joinCampaign(inviteCode: string) {
  const res = await api.post<{ campaign: Campaign; membership: CampaignParticipant }>("/api/campaigns/join", { inviteCode });
  return res.data;
}

export async function getActiveCampaign() {
  const res = await api.get<{ campaign: Campaign }>("/api/campaigns/active");
  return res.data;
}

export async function getCampaign(campaignId: number) {
  const res = await api.get<{ campaign: Campaign; members: CampaignParticipant[] }>(`/api/campaigns/${campaignId}`);
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
  const res = await api.post(`/api/campaigns/${campaignId}/world/lore`, { title, category, content });
  return res.data;
}

export async function createFaction(campaignId: number, name: string, description: string, baseLocation?: string) {
  const res = await api.post(`/api/campaigns/${campaignId}/world/factions`, { name, description, baseLocation });
  return res.data;
}

export async function getStoryPrep(campaignId: number) {
  const res = await api.get<{ storyPoints: any[] }>(`/api/campaigns/${campaignId}/story-prep`);
  return res.data;
}

export async function regenerateStoryPrep(campaignId: number) {
  const res = await api.post<{ storyPoints: any[] }>(`/api/campaigns/${campaignId}/story-prep/regenerate`);
  return res.data;
}

export async function addCustomStoryPoint(campaignId: number, point: any) {
  const res = await api.post<{ storyPoint: any }>(`/api/campaigns/${campaignId}/story-prep/points`, point);
  return res.data;
}

export async function updateStoryPoint(campaignId: number, pointId: number, updates: any) {
  const res = await api.put<{ storyPoint: any }>(`/api/campaigns/${campaignId}/story-prep/points/${pointId}`, updates);
  return res.data;
}

export async function getSessionRecaps(campaignId: number) {
  const res = await api.get<{ recaps: any[] }>(`/api/campaigns/${campaignId}/sessions/recaps`);
  return res.data;
}

export async function generateSessionRecap(campaignId: number, sessionId: string, tone: string) {
  const res = await api.post<{ recap: any }>(`/api/campaigns/${campaignId}/sessions/${sessionId}/recap/generate`, { tone });
  return res.data;
}

export async function getTavern(campaignId: number) {
  const res = await api.get<{ tavern: any }>(`/api/campaigns/${campaignId}/tavern`);
  return res.data;
}

export async function generateTavern(campaignId: number) {
  const res = await api.post<{ tavern: any }>(`/api/campaigns/${campaignId}/tavern/generate`);
  return res.data;
}

export async function chatWithNpc(campaignId: number, npcId: string, message: string) {
  const res = await api.post<{ reply: string; tavern: any }>(`/api/campaigns/${campaignId}/tavern/npcs/${npcId}/chat`, { message });
  return res.data;
}

export async function respondToFactionRecruitment(campaignId: number, encounterId: string, action: 'accept' | 'decline') {
  const res = await api.post<{ tavern: any }>(`/api/campaigns/${campaignId}/tavern/factions/${encounterId}/respond`, { action });
  return res.data;
}

export async function triggerTavernEvent(campaignId: number) {
  const res = await api.post<{ event: any; tavern: any }>(`/api/campaigns/${campaignId}/tavern/events/trigger`);
  return res.data;
}

export async function updateCampaignAmbience(campaignId: number, mood?: string, ambience?: string) {
  const res = await api.put<{ campaign: Campaign }>(`/api/campaigns/${campaignId}/ambience`, { mood, ambience });
  return res.data;
}

export async function getUserCampaigns() {
  const res = await api.get<{ campaigns: any[] }>("/api/campaigns");
  return res.data;
}

