export type CampaignRole = "DM" | "player";
export type CampaignMode = "narration" | "tactical";
export type CampaignStatus = "idle" | "active" | "ended";
export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
export type AdvantageState = "normal" | "advantage" | "disadvantage";
export type NarrationSource = "ai" | "dm" | "player" | "system";

export interface CampaignSessionState {
  status?: CampaignStatus;
  started_at?: string;
  ended_at?: string;
  mode?: CampaignMode;
  active_scene?: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  world_type: string | null;
  dm_user_id: number;
  invite_code: string;
  active_map_id: number | null;
  current_session_state: CampaignSessionState | null;
  created_at: string;
}

export interface CampaignMember {
  id: number;
  campaign_id: number;
  user_id: number;
  role: CampaignRole;
  joined_at: string;
}

export interface CampaignEvent {
  id: number;
  campaign_id: number;
  event_type: string;
  content: Record<string, unknown> | null;
  created_by: number | null;
  created_at: string;
}

export interface CampaignQuest {
  id: number;
  campaign_id: number;
  title: string;
  description: string | null;
  status: string;
  progress: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWorldEvent {
  id: number;
  campaign_id: number;
  title: string;
  description: string | null;
  status: string;
  created_by: number | null;
  created_at: string;
}

export interface CampaignMemory {
  id: number;
  campaign_id: number;
  summary: string;
  key_facts: Array<Record<string, unknown>> | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignMap {
  id: number;
  campaign_id: number;
  name: string;
  image_url: string;
  grid_enabled: boolean;
  grid_size: number | null;
  reveal_state: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface CampaignMapTokenPosition {
  x: number;
  y: number;
  snapped?: boolean;
}

export interface CampaignMapToken {
  id: number;
  campaign_id: number;
  map_id: number;
  token_type: "player" | "enemy" | "npc" | "boss";
  label: string | null;
  hp_current: number | null;
  hp_max: number | null;
  position: CampaignMapTokenPosition;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiceRollRow {
  id: number;
  campaign_id: number;
  user_id: number;
  dice_type: DiceType;
  rolls: number[];
  result: number;
  modifier: number;
  total: number;
  advantage_state: AdvantageState;
  context: string | null;
  created_at: string;
}

export interface CampaignSnapshot {
  campaign: Campaign | null;
  members: CampaignMember[];
  activeMap: CampaignMap | null;
  tokens: CampaignMapToken[];
  quests: CampaignQuest[];
  worldEvents: CampaignWorldEvent[];
  recentEvents: CampaignEvent[];
  diceHistory: DiceRollRow[];
  memories: CampaignMemory[];
}

export interface CampaignSocketStatePayload {
  snapshot: CampaignSnapshot;
  onlineUserIds: number[];
}

export interface SessionParticipant {
  userId: number;
  label: string;
  role: CampaignRole;
  isOnline: boolean;
  isSelf: boolean;
}

export interface NarrationEntry {
  id: string;
  text: string;
  source: NarrationSource;
  authorId: number | null;
  authorLabel: string;
  createdAt: string;
  tone?: string;
  playerAction?: string;
}

export interface LiveDiceRoll {
  userId: number;
  userLabel: string;
  diceType: DiceType;
  result: number;
  total: number;
  createdAt: string;
  context?: string | null;
  isCriticalSuccess: boolean;
  isCriticalFail: boolean;
}

export interface AiPendingState {
  narration: boolean;
  worldEvent: boolean;
}
