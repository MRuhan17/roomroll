import { api } from "./api";
import type { CampaignCharacter, CampaignCharacterDetail } from "@/types/campaign";

export async function listCharacters(campaignId: number) {
  const res = await api.get<{ characters: CampaignCharacter[] }>(`/api/campaigns/${campaignId}/characters`);
  return res.data;
}

export async function getCharacter(campaignId: number, characterId: number) {
  const res = await api.get<{ character: CampaignCharacterDetail }>(
    `/api/campaigns/${campaignId}/characters/${characterId}`,
  );
  return res.data;
}
