export type CampaignRole = "DM" | "player";
export type CampaignMode = "narration" | "tactical";
export type CampaignStatus = "idle" | "active" | "ended";
export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
export type AdvantageState = "normal" | "advantage" | "disadvantage";
export type NarrationSource = "ai" | "dm" | "player" | "system";
export type EquipmentSlot = "head" | "chest" | "legs" | "feet" | "hands" | "weapon" | "offhand" | "accessory";
export type InventoryItemType = "weapon" | "armor" | "consumable" | "tool" | "quest" | "misc";
export type StatusEffectType = "buff" | "debuff" | "condition" | "neutral";
export type StatusEffectDurationType = "rounds" | "turns" | "time" | "permanent";
export type ProgressionChangeType = "xp_gain" | "xp_loss" | "level_up" | "level_down" | "milestone" | "respec";

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

export interface CharacterAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterCombatStats {
  hp_current: number;
  hp_max: number;
  armor_class: number;
  speed: number;
  proficiency_bonus: number;
  initiative_bonus?: number;
  spell_save_dc?: number;
}

export interface CharacterProgressionState {
  milestones?: string[];
  talents?: string[];
  notes?: string[];
  [key: string]: unknown;
}

export interface CharacterProgressionSummary {
  level: number;
  xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_into_level: number;
}

export interface InventoryItem {
  id: number;
  campaign_id: number;
  character_id: number;
  name: string;
  description: string | null;
  item_type: InventoryItemType;
  rarity: string | null;
  quantity: number;
  weight: number | null;
  stackable: boolean;
  equippable: boolean;
  item_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CharacterEquipment {
  id: number;
  campaign_id: number;
  character_id: number;
  inventory_item_id: number;
  slot: EquipmentSlot;
  equipped_at: string;
  item: InventoryItem | null;
}

export interface CharacterStatusEffect {
  id: number;
  campaign_id: number;
  character_id: number;
  name: string;
  effect_type: StatusEffectType;
  source: string | null;
  duration_type: StatusEffectDurationType;
  duration_value: number | null;
  remaining_duration: number | null;
  modifiers: Record<string, unknown>;
  is_active: boolean;
  applied_at: string;
  expires_at: string | null;
  removed_at: string | null;
}

export interface CharacterProgressionLogEntry {
  id: number;
  campaign_id: number;
  character_id: number;
  change_type: ProgressionChangeType;
  amount: number;
  previous_xp: number;
  new_xp: number;
  previous_level: number;
  new_level: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_by: number | null;
  created_at: string;
}

export interface CampaignCharacter {
  id: number;
  campaign_id: number;
  user_id: number;
  name: string;
  class_name: string | null;
  species: string | null;
  background: string | null;
  backstory: string | null;
  is_npc: boolean;
  level: number;
  xp: number;
  ability_scores: CharacterAbilityScores;
  combat_stats: CharacterCombatStats;
  progression_state: CharacterProgressionState;
  currency: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  progression_summary: CharacterProgressionSummary;
  inventory: InventoryItem[];
  equipment: CharacterEquipment[];
  status_effects: CharacterStatusEffect[];
}

export interface CampaignCharacterDetail extends CampaignCharacter {
  progression_log: CharacterProgressionLogEntry[];
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
  characters: CampaignCharacter[];
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
