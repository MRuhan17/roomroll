import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Backpack,
  BadgePlus,
  CircleAlert,
  Coins,
  HeartPulse,
  Shield,
  Sparkles,
  Star,
  Swords,
  TimerReset,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/services/api";
import { getCampaignSnapshot } from "@/services/campaigns";
import { getCharacter } from "@/services/characters";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type {
  CampaignCharacterDetail,
  CampaignQuest,
  CharacterEquipment,
  CharacterProgressionLogEntry,
  CharacterStatusEffect,
  EquipmentSlot,
  InventoryItem,
} from "@/types/campaign";

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "head",
  "chest",
  "legs",
  "feet",
  "hands",
  "weapon",
  "offhand",
  "accessory",
];

export function CharacterSheetPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const params = useParams<{ campaignId: string; characterId: string }>();
  const campaignId = Number(params.campaignId);
  const characterId = Number(params.characterId);

  const snapshotQuery = useQuery({
    queryKey: ["campaignSnapshot", campaignId],
    queryFn: () => getCampaignSnapshot(campaignId),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
  });

  const characterQuery = useQuery({
    queryKey: ["character", campaignId, characterId],
    queryFn: () => getCharacter(campaignId, characterId),
    enabled: Number.isFinite(campaignId) && campaignId > 0 && Number.isFinite(characterId) && characterId > 0,
  });

  if (!campaignId || !characterId) {
    return (
      <section className="space-y-4">
        <Button variant="ghost" className="gap-2 text-slate-300" onClick={() => navigate("/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
          Back to campaigns
        </Button>
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-6 text-sm text-rose-100">
            Character sheet could not be loaded because the campaign or character ID is missing.
          </CardContent>
        </Card>
      </section>
    );
  }

  const snapshot = snapshotQuery.data?.snapshot;
  const character = characterQuery.data?.character;
  const ownedCharacter = snapshot?.characters.find((entry) => entry.user_id === user?.id && !entry.is_npc);

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" className="w-fit gap-2 px-0 text-slate-300 hover:text-white" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {character?.name ?? "Character Sheet"}
            </h1>
            <p className="mt-2 text-slate-400">
              {character
                ? [character.class_name, character.species, character.background].filter(Boolean).join(" • ") || "Adventurer"
                : "Loading your adventurer dossier."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
            {character ? (
              <>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-100">
                  Level {character.level}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                  {character.is_npc ? "NPC" : "Player Character"}
                </span>
                {ownedCharacter?.id === character.id ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                    Your active sheet
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {snapshot?.characters?.length ? (
          <Card className="w-full max-w-md border-white/10 bg-black/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-100">Party Roster</CardTitle>
              <CardDescription>Jump between party sheets in this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {snapshot.characters.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => navigate(`/campaigns/${campaignId}/characters/${entry.id}`)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                    entry.id === character?.id
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium">{entry.name}</span>
                    <span className="block text-xs text-slate-400">
                      {entry.class_name ?? "Wanderer"} • Level {entry.level}
                    </span>
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em]">
                    {entry.is_npc ? "NPC" : "Sheet"}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {characterQuery.isError ? (
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-rose-100">
            <CircleAlert className="h-4 w-4 shrink-0" />
            {getApiErrorMessage(characterQuery.error, "Could not load character sheet.")}
          </CardContent>
        </Card>
      ) : null}

      {characterQuery.isLoading || snapshotQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : character ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VitalCard
              icon={HeartPulse}
              label="Health"
              accent="rose"
              current={character.combat_stats.hp_current}
              max={character.combat_stats.hp_max}
            />
            <VitalCard
              icon={Swords}
              label="Stamina"
              accent="amber"
              current={readCurrentValue(character, ["stamina_current", "stamina"])}
              max={readMaxValue(character, ["stamina_max", "max_stamina"])}
            />
            <VitalCard
              icon={WandSparkles}
              label="Mana"
              accent="cyan"
              current={readCurrentValue(character, ["mana_current", "mana"])}
              max={readMaxValue(character, ["mana_max", "max_mana"])}
            />
            <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(212,175,55,0.1),rgba(8,8,10,0.88))]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Defense</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{character.combat_stats.armor_class}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      AC • Speed {character.combat_stats.speed} • Prof +{character.combat_stats.proficiency_bonus}
                    </p>
                  </div>
                  <Shield className="h-6 w-6 text-amber-300" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/10 bg-black/20">
              <CardHeader>
                <CardTitle className="text-xl text-slate-100">Character Sheet</CardTitle>
                <CardDescription>Core combat, identity, and roleplay references for the table.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(character.ability_scores).map(([ability, score]) => (
                    <div key={ability} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(ability)}</p>
                      <div className="mt-3 flex items-end justify-between">
                        <span className="text-3xl font-semibold text-white">{score}</span>
                        <span className="text-sm text-slate-400">
                          {formatModifier(score)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <InfoPanel title="Backstory" body={character.backstory ?? "No backstory has been written for this hero yet."} />
                  <InfoPanel title="Notes" body={character.notes ?? "No play notes recorded yet."} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="border-white/10 bg-white/[0.03]">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-slate-100">Passive Traits</CardTitle>
                      <CardDescription>Always-on perks, talents, and long-term advancements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <TraitGroup
                        icon={Sparkles}
                        label="Talents"
                        items={toStringArray(character.progression_state.talents)}
                        empty="No passive talents recorded yet."
                      />
                      <TraitGroup
                        icon={Star}
                        label="Milestones"
                        items={toStringArray(character.progression_state.milestones)}
                        empty="No milestone boons recorded yet."
                      />
                      <TraitGroup
                        icon={BadgePlus}
                        label="Notes"
                        items={toStringArray(character.progression_state.notes)}
                        empty="No passive notes stored in progression metadata."
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/[0.03]">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-slate-100">Status Effects</CardTitle>
                      <CardDescription>Live buffs, debuffs, conditions, and lingering magical states.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {character.status_effects.length ? (
                        character.status_effects.map((effect) => <StatusEffectBadge key={effect.id} effect={effect} />)
                      ) : (
                        <p className="text-sm text-slate-400">No active status effects are currently tracked.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-100">Level Progression</CardTitle>
                  <CardDescription>XP pacing, level thresholds, and recent progression changes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Experience</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {character.progression_summary.xp}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <p>{character.progression_summary.xp_into_level} XP into current level</p>
                        <p className="text-slate-400">
                          {character.progression_summary.xp_for_current_level} to {character.progression_summary.xp_for_next_level}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#fde047)]"
                        style={{ width: `${getXpProgressPercent(character)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(character.progression_log ?? []).length ? (
                      character.progression_log.slice(0, 5).map((entry) => (
                        <ProgressionEntry key={entry.id} entry={entry} />
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No progression history has been logged yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-black/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                    <Coins className="h-5 w-5 text-amber-300" />
                    Currency
                  </CardTitle>
                  <CardDescription>Tracked wealth and table economy for this character.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(character.currency).length ? (
                    Object.entries(character.currency).map(([currency, amount]) => (
                      <div key={currency} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(currency)}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{amount}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No currency is tracked for this character yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-white/10 bg-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                  <Shield className="h-5 w-5 text-cyan-300" />
                  Equipment Slots
                </CardTitle>
                <CardDescription>Quick view of every equipped item by slot.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {EQUIPMENT_SLOTS.map((slot) => {
                  const equipped = findEquipment(character.equipment, slot);
                  return (
                    <div key={slot} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(slot)}</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {equipped?.item?.name ?? "Empty slot"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {equipped?.item
                          ? `${formatLabel(equipped.item.item_type)}${equipped.item.rarity ? ` • ${equipped.item.rarity}` : ""}`
                          : "Nothing equipped here."}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                  <Backpack className="h-5 w-5 text-emerald-300" />
                  Inventory
                </CardTitle>
                <CardDescription>Pack contents, quest items, and equippable gear.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {character.inventory.length ? (
                  character.inventory.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                              {formatLabel(item.item_type)}
                            </span>
                            {item.rarity ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-100">
                                {item.rarity}
                              </span>
                            ) : null}
                            {item.equippable ? (
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-100">
                                Equippable
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            {item.description ?? "No item description recorded."}
                          </p>
                        </div>
                        <div className="shrink-0 text-sm text-slate-300">
                          <p>Qty {item.quantity}</p>
                          <p>{item.weight !== null ? `${item.weight} wt` : "Weight untracked"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">This inventory is empty.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                <TimerReset className="h-5 w-5 text-violet-300" />
                Quest Rewards
              </CardTitle>
              <CardDescription>Campaign quest payout hooks surfaced beside character progression.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {snapshot?.quests?.length ? (
                snapshot.quests.map((quest) => <QuestRewardCard key={quest.id} quest={quest} />)
              ) : (
                <p className="text-sm text-slate-400">No quests are available in this campaign snapshot yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function VitalCard({
  icon: Icon,
  label,
  accent,
  current,
  max,
}: {
  icon: typeof HeartPulse;
  label: string;
  accent: "rose" | "amber" | "cyan";
  current?: number;
  max?: number;
}) {
  const palette = {
    rose: "border-rose-400/20 bg-rose-400/5 text-rose-100",
    amber: "border-amber-400/20 bg-amber-400/5 text-amber-100",
    cyan: "border-cyan-400/20 bg-cyan-400/5 text-cyan-100",
  }[accent];
  const progress = current !== undefined && max !== undefined && max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <Card className={cn("overflow-hidden border-white/10", palette)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {current !== undefined ? current : "—"}
              <span className="ml-2 text-base text-slate-400">/ {max !== undefined ? max : "—"}</span>
            </p>
          </div>
          <Icon className="h-6 w-6" />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white/80" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function TraitGroup({
  icon: Icon,
  label,
  items,
  empty,
}: {
  icon: typeof Sparkles;
  label: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Icon className="h-4 w-4 text-amber-300" />
        {label}
      </p>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">{empty}</p>
      )}
    </div>
  );
}

function StatusEffectBadge({ effect }: { effect: CharacterStatusEffect }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        effect.is_active
          ? getStatusEffectClass(effect.effect_type)
          : "border-white/10 bg-white/[0.03] text-slate-300",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{effect.name}</p>
        <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] uppercase tracking-[0.22em]">
          {effect.effect_type}
        </span>
      </div>
      <p className="mt-2 text-xs">
        {effect.source ? `Source: ${effect.source}` : "Source not recorded"} • {formatDuration(effect)}
      </p>
    </div>
  );
}

function ProgressionEntry({ entry }: { entry: CharacterProgressionLogEntry }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{formatProgressionType(entry.change_type)}</p>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
          {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} XP
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {entry.reason ?? "No reason provided."}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Level {entry.previous_level} to {entry.new_level} • XP {entry.previous_xp} to {entry.new_xp}
      </p>
    </div>
  );
}

function QuestRewardCard({ quest }: { quest: CampaignQuest }) {
  const rewards = extractRewards(quest.progress);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{quest.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{quest.status}</p>
        </div>
        <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-violet-100">
          Rewards
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {quest.description ?? "No quest description available."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {rewards.length ? (
          rewards.map((reward) => (
            <span
              key={reward}
              className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100"
            >
              {reward}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">No explicit reward metadata has been attached to this quest yet.</span>
        )}
      </div>
    </div>
  );
}

function readCurrentValue(character: CampaignCharacterDetail, keys: string[]) {
  return readNumericField(character, keys);
}

function readMaxValue(character: CampaignCharacterDetail, keys: string[]) {
  return readNumericField(character, keys);
}

function readNumericField(character: CampaignCharacterDetail, keys: string[]) {
  const sources = [
    character.combat_stats as unknown as Record<string, unknown>,
    character.progression_state as Record<string, unknown>,
  ];

  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function getXpProgressPercent(character: CampaignCharacterDetail) {
  const span = character.progression_summary.xp_for_next_level - character.progression_summary.xp_for_current_level;
  if (span <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, (character.progression_summary.xp_into_level / span) * 100));
}

function findEquipment(equipment: CharacterEquipment[], slot: EquipmentSlot) {
  return equipment.find((entry) => entry.slot === slot);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatModifier(score: number) {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function formatDuration(effect: CharacterStatusEffect) {
  if (effect.duration_type === "permanent") {
    return "Permanent";
  }

  if (effect.remaining_duration !== null) {
    return `${effect.remaining_duration} ${effect.duration_type} remaining`;
  }

  if (effect.duration_value !== null) {
    return `${effect.duration_value} ${effect.duration_type}`;
  }

  return "Duration untracked";
}

function getStatusEffectClass(effectType: CharacterStatusEffect["effect_type"]) {
  switch (effectType) {
    case "buff":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    case "debuff":
      return "border-rose-400/20 bg-rose-400/10 text-rose-100";
    case "condition":
      return "border-amber-400/20 bg-amber-400/10 text-amber-100";
    default:
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  }
}

function formatProgressionType(changeType: CharacterProgressionLogEntry["change_type"]) {
  return changeType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractRewards(progress: CampaignQuest["progress"]) {
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
    return [];
  }

  const progressRecord = progress as Record<string, unknown>;
  const candidate = progressRecord.rewards ?? progressRecord.reward ?? progressRecord.loot;

  if (Array.isArray(candidate)) {
    return candidate.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }

  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return [candidate];
  }

  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return Object.entries(candidate as Record<string, unknown>).flatMap(([key, value]) => {
      if (typeof value === "number" || typeof value === "string") {
        return [`${formatLabel(key)}: ${value}`];
      }
      if (Array.isArray(value)) {
        return value
          .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
          .map((entry) => `${formatLabel(key)}: ${entry}`);
      }
      return [];
    });
  }

  const directRewardKeys = ["xp", "gold", "silver", "items", "renown", "favor"];
  return directRewardKeys.flatMap((key) => {
    const value = progressRecord[key];
    if (typeof value === "number" || typeof value === "string") {
      return [`${formatLabel(key)}: ${value}`];
    }
    if (Array.isArray(value)) {
      return value
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        .map((entry) => `${formatLabel(key)}: ${entry}`);
    }
    return [];
  });
}
