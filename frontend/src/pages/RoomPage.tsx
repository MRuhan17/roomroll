import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Crown,
  Dice5,
  LoaderCircle,
  MapPinned,
  Sparkles,
  Users,
  Wand2,
  CloudRain,
  Music,
  Wifi,
  WifiOff,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCampaignSnapshot } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { SocketEvents, connectSocket, disconnectSocket, getSocket } from "@/services/socket";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TacticalMap, MapToken } from "@/components/campaign/TacticalMap";
import type { DiceType, NarrationEntry, SessionParticipant } from "@/types/campaign";

const toneOptions = [
  { value: "cinematic", label: "Cinematic" },
  { value: "mysterious", label: "Mysterious" },
  { value: "intense", label: "Intense" },
  { value: "light", label: "Light" },
] as const;

function formatClock(value?: string) {
  if (!value) {
    return "just now";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "just now";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getNarrationBadge(entry: NarrationEntry) {
  switch (entry.source) {
    case "ai":
      return {
        label: "AI narration",
        className: "bg-amber-500/15 text-amber-200 border-amber-400/30",
      };
    case "dm":
      return {
        label: "DM override",
        className: "bg-cyan-500/15 text-cyan-100 border-cyan-400/30",
      };
    case "system":
      return {
        label: "System",
        className: "bg-slate-500/15 text-slate-100 border-slate-400/30",
      };
    default:
      return {
        label: "Player beat",
        className: "bg-emerald-500/15 text-emerald-100 border-emerald-400/30",
      };
  }
}

function getWorldEventStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "resolved" || normalized === "ended") {
    return "bg-emerald-500/10 text-emerald-200 border-emerald-400/20";
  }
  if (normalized === "warning" || normalized === "unstable") {
    return "bg-rose-500/10 text-rose-200 border-rose-400/20";
  }
  return "bg-amber-500/10 text-amber-200 border-amber-400/20";
}

function getSessionStatusClass(status?: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-300";
    case "ended":
      return "bg-slate-500/10 text-slate-300";
    default:
      return "bg-amber-500/10 text-amber-300";
  }
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="typing-dot" />
      <span className="typing-dot [animation-delay:160ms]" />
      <span className="typing-dot [animation-delay:320ms]" />
    </span>
  );
}

function PresenceLine({ participants }: { participants: SessionParticipant[] }) {
  if (participants.length === 0) {
    return <span>No one else is typing.</span>;
  }

  const labels = participants.map((participant) => participant.label);
  const summary =
    labels.length === 1
      ? labels[0]
      : labels.length === 2
        ? `${labels[0]} and ${labels[1]}`
        : `${labels[0]}, ${labels[1]} and ${labels.length - 2} more`;

  return (
    <span>
      {summary} {labels.length === 1 ? "is" : "are"} planning the next move <TypingDots />
    </span>
  );
}

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);

  const { user, token } = useAuthStore();
  const {
    campaign,
    participants,
    isSocketConnected,
    sessionState,
    activeMap,
    mapTokens,
    revealState,
    narrationFeed,
    worldEvents,
    diceHistory,
    lastDiceRoll,
    typingUserIds,
    aiPending,
    lastError,
    activeTurnTokenId,
    applyCampaignSnapshot,
    setActiveRoomId,
    setAiPending,
    setLastError,
    reset,
  } = useRoomStore();

  const [playerAction, setPlayerAction] = useState("");
  const [narrationTone, setNarrationTone] =
    useState<(typeof toneOptions)[number]["value"]>("cinematic");
  const [dmNarrationDraft, setDmNarrationDraft] = useState("");
  const [rollingAnimation, setRollingAnimation] = useState<{
    active: boolean;
    type: string;
    result: number | null;
    actor: string;
  }>({
    active: false,
    type: "",
    result: null,
    actor: "",
  });
  const [cinematicNarrationId, setCinematicNarrationId] = useState<string | null>(null);
  const [showEventOverlay, setShowEventOverlay] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "poor" | "offline">("offline");

  const snapshotQuery = useQuery({
    queryKey: ["campaignSnapshot", campaignId],
    queryFn: () => getCampaignSnapshot(campaignId),
    enabled: Number.isFinite(campaignId) && Boolean(user),
  });

  const typingParticipants = participants.filter((participant) => typingUserIds.includes(participant.userId));
  const isDM = campaign?.dm_user_id === user?.id || participants.some((participant) => participant.isSelf && participant.role === "DM");
  const npcTokens = mapTokens.filter((token) => token.token_type === "npc" || token.token_type === "boss");
  const tacticalTokens: MapToken[] = mapTokens.map((token) => ({
    id: token.id,
    type: token.token_type,
    label: token.label ?? `${token.token_type} ${token.id}`,
    x: token.position.x,
    y: token.position.y,
    hpCurrent: token.hp_current ?? undefined,
    hpMax: token.hp_max ?? undefined,
    isHidden: token.is_hidden,
  }));
  const latestNarration = narrationFeed[0] ?? null;
  const showNarrationThinking = aiPending.narration;
  const mapMode = showNarrationThinking || Boolean(cinematicNarrationId) ? "narration" : "map";

  useEffect(() => {
    reset();
    if (Number.isFinite(campaignId)) {
      setActiveRoomId(campaignId);
    }

    return () => {
      disconnectSocket();
      reset();
    };
  }, [campaignId, reset, setActiveRoomId]);

  useEffect(() => {
    if (!snapshotQuery.data?.snapshot) {
      return;
    }

    applyCampaignSnapshot(snapshotQuery.data.snapshot, user ?? null);
  }, [applyCampaignSnapshot, snapshotQuery.data, user]);

  useEffect(() => {
    if (!token || !snapshotQuery.data?.snapshot || !Number.isFinite(campaignId)) {
      return;
    }

    const socket = connectSocket(token);
    socket.emit(SocketEvents.JoinCampaign, { campaignId });
    setConnectionQuality("excellent");

    const onDisconnect = () => {
      setConnectionQuality("offline");
    };

    const onConnect = () => {
      setConnectionQuality("excellent");
      // Re-join campaign on reconnect (session recovery)
      socket.emit(SocketEvents.JoinCampaign, { campaignId });
    };

    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);

    return () => {
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
      socket.emit(SocketEvents.LeaveCampaign);
      disconnectSocket();
    };
  }, [campaignId, snapshotQuery.data?.snapshot, token]);

  useEffect(() => {
    if (!lastDiceRoll) {
      return;
    }

    setRollingAnimation({
      active: true,
      type: lastDiceRoll.diceType,
      result: null,
      actor: lastDiceRoll.userLabel,
    });

    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const revealTimer = setTimeout(() => {
      setRollingAnimation({
        active: true,
        type: lastDiceRoll.diceType,
        result: lastDiceRoll.total,
        actor: lastDiceRoll.userLabel,
      });

      hideTimer = setTimeout(() => {
        setRollingAnimation((current) => ({ ...current, active: false }));
      }, 2600);
    }, 900);

    return () => {
      clearTimeout(revealTimer);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [lastDiceRoll?.createdAt]);

  useEffect(() => {
    if (!latestNarration?.id.startsWith("live:")) {
      return;
    }

    setCinematicNarrationId(latestNarration.id);
    const timer = setTimeout(() => setCinematicNarrationId(null), 3600);
    return () => clearTimeout(timer);
  }, [latestNarration?.id]);

  useEffect(() => {
    if (worldEvents.length > 0) {
      const latestEvent = worldEvents[0];
      const isRecent = new Date().getTime() - new Date(latestEvent.created_at).getTime() < 8000;
      if (isRecent) {
        setShowEventOverlay(latestEvent.title);
        const timer = setTimeout(() => setShowEventOverlay(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [worldEvents]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isSocketConnected) {
      return;
    }

    const isTyping = playerAction.trim().length > 0;
    socket.emit(SocketEvents.PlayerTyping, { isTyping });

    if (!isTyping) {
      return;
    }

    const timer = setTimeout(() => {
      socket.emit(SocketEvents.PlayerTyping, { isTyping: false });
    }, 1200);

    return () => clearTimeout(timer);
  }, [isSocketConnected, playerAction]);

  const handleTokenMove = (tokenId: number, x: number, y: number, snapped: boolean) => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    socket.emit(SocketEvents.TokenMoved, { tokenId, position: { x, y, snapped } });
  };

  const handleMapPing = (x: number, y: number) => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    socket.emit(SocketEvents.MapPing, { x, y });
  };

  const handleMapReveal = (nextRevealState: Record<string, boolean>) => {
    const socket = getSocket();
    if (!socket || !activeMap) {
      return;
    }

    socket.emit(SocketEvents.MapRevealed, { mapId: activeMap.id, revealState: nextRevealState });
  };

  const handleRollDice = (diceType: DiceType) => {
    const socket = getSocket();
    if (!socket) {
      setLastError("Reconnect to the table before rolling dice.");
      return;
    }

    socket.emit(SocketEvents.DiceRolled, {
      diceType,
      context: playerAction.trim() || undefined,
    });
  };

  const handleRequestNarration = () => {
    const socket = getSocket();
    const trimmedAction = playerAction.trim();

    if (!trimmedAction) {
      setLastError("Describe what your character is attempting first.");
      return;
    }

    if (!socket) {
      setLastError("Reconnect to the table before asking the AI to narrate.");
      return;
    }

    setLastError(null);
    setAiPending("narration", true);
    socket.emit(SocketEvents.PlayerTyping, { isTyping: false });
    socket.emit(SocketEvents.RequestAiNarration, {
      playerAction: trimmedAction,
      tone: narrationTone,
    });
    setPlayerAction("");
  };

  const handleGenerateWorldEvent = () => {
    const socket = getSocket();
    if (!socket) {
      setLastError("Reconnect to the table before generating a world event.");
      return;
    }

    setLastError(null);
    setAiPending("worldEvent", true);
    socket.emit(SocketEvents.RequestAiWorldEvent);
  };

  const handleBroadcastNarration = () => {
    const socket = getSocket();
    const trimmedDraft = dmNarrationDraft.trim();

    if (!trimmedDraft) {
      setLastError("Write the override text before broadcasting it.");
      return;
    }

    if (!socket) {
      setLastError("Reconnect to the table before sending a narration override.");
      return;
    }

    setLastError(null);
    socket.emit(SocketEvents.NewNarration, { text: trimmedDraft });
    setDmNarrationDraft("");
  };

  if (!Number.isFinite(campaignId)) {
    return <div className="p-8 text-center text-amber-300">Invalid campaign ID.</div>;
  }

  if (snapshotQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050507] text-[#f5efe2]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <Sparkles className="h-12 w-12 text-amber-400 animate-pulse" />
          <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl uppercase tracking-[0.2em] text-[#f6f2e8]">Summoning the Realm</h2>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8e8778]">Aligning Leylines...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (snapshotQuery.isError || !snapshotQuery.data?.snapshot) {
    return (
      <div className="p-8 text-center text-amber-300">
        {getApiErrorMessage(snapshotQuery.error, "Could not load this campaign session.")}
      </div>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(4,9,18,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-200/80">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Live narration deck
              </span>
              {campaign?.world_type ? <span>{campaign.world_type}</span> : null}
            </div>
            <div>
              <h1 className="font-serif text-3xl text-white drop-shadow-sm">{campaign?.name ?? "Campaign Session"}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/85">
                {campaign?.description ||
                  "The table is live. Guide the scene, surface AI world beats, and keep the party in sync between narration and tactics."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", getSessionStatusClass(sessionState?.status))}>
                <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                {sessionState?.status ?? "idle"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                Mode: {sessionState?.mode ?? "narration"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                Invite code: <span className="font-mono text-amber-200">{campaign?.invite_code}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5 cursor-pointer">
              <CloudRain className="h-4 w-4 text-indigo-300" />
              Heavy Rain
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5 cursor-pointer">
              <Music className="h-4 w-4 text-violet-300" />
              Tension
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                isSocketConnected
                  ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 cursor-default"
                  : "bg-rose-500/10 text-rose-300 animate-pulse cursor-help"
              )}
              title={isSocketConnected ? "Connection excellent" : "Attempting to recover session..."}
            >
              {isSocketConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isSocketConnected ? "Synchronized" : "Reconnecting..."}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 transition-colors">
              <Users className="h-4 w-4 text-cyan-300" />
              {participants.filter((participant) => participant.isOnline).length}/{participants.length} online
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isSocketConnected && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 flex items-center gap-3 mb-6">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <div>
                <p className="font-medium">Connection Lost</p>
                <p className="text-xs text-rose-200/70">Attempting to recover session state automatically. Changes may not be saved.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 mb-6">
              {lastError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-cyan-300" />
                  Tactical Stage
                </CardTitle>
                <CardDescription>
                  {activeMap
                    ? `${activeMap.name} is active. The map softens automatically during AI narration beats.`
                    : "No active map is set yet, so the board is using the placeholder stage."}
                </CardDescription>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                {mapMode === "narration" ? "Cinematic focus" : "Tactical focus"}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <TacticalMap
                imageUrl={activeMap?.image_url || undefined}
                gridEnabled={activeMap?.grid_enabled ?? true}
                gridSize={activeMap?.grid_size ?? 50}
                tokens={tacticalTokens}
                isDM={isDM}
                revealState={revealState}
                activeTurnTokenId={activeTurnTokenId ?? undefined}
                onTokenMove={handleTokenMove}
                onPing={handleMapPing}
                onMapReveal={handleMapReveal}
                mode={mapMode}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                Narration Feed
              </CardTitle>
              <CardDescription>
                Fresh AI beats, player-driven scenes, and DM overrides appear here in real time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNarrationThinking ? (
                <div className="animate-thinking-pulse rounded-2xl border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(15,23,42,0.84))] p-4 text-sm text-amber-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/10 text-amber-200">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </div>
                    <div>
                      <p className="font-medium">Roomroll AI is shaping the next scene.</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Cinematic response in progress</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {typingParticipants.length > 0 ? (
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/10 p-4 text-sm text-cyan-50">
                  <PresenceLine participants={typingParticipants} />
                </div>
              ) : null}

              <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
                {narrationFeed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">
                    No narration has been recorded yet. Use the AI panel to seed the scene or broadcast a DM beat.
                  </div>
                ) : null}

                {narrationFeed.map((entry) => {
                  const badge = getNarrationBadge(entry);
                  const isHighlighted = cinematicNarrationId === entry.id;

                  return (
                    <article
                      key={entry.id}
                      className={cn(
                        "rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(6,10,18,0.96))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]",
                        isHighlighted && "animate-narration-rise ring-1 ring-amber-300/35",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", badge.className)}>
                            {badge.label}
                          </span>
                          {entry.tone ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                              {entry.tone}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{formatClock(entry.createdAt)}</span>
                      </div>
                      <p className="mt-4 font-serif text-xl leading-8 text-white">{entry.text}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>By {entry.authorLabel}</span>
                        {entry.playerAction ? <span>Prompted by: {entry.playerAction}</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-amber-300" />
                AI Interaction Panel
              </CardTitle>
              <CardDescription>
                Feed the AI a player action, set the tone, and trigger narration or world shifts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <label htmlFor="player-action" className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">
                  Player action
                </label>
                <textarea
                  id="player-action"
                  value={playerAction}
                  onChange={(event) => setPlayerAction(event.target.value)}
                  placeholder="The ranger steps into the torchlight and offers the relic to the priestess..."
                  className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/40"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Narration tone</p>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setNarrationTone(tone.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] transition",
                        narrationTone === tone.value
                          ? "border-amber-300/35 bg-amber-400/10 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                      )}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleRequestNarration}
                  className="h-11 justify-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400"
                  disabled={!isSocketConnected || aiPending.narration}
                >
                  {aiPending.narration ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  Ask for narration
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerateWorldEvent}
                  className="h-11 justify-center gap-2"
                  disabled={!isSocketConnected || aiPending.worldEvent || !isDM}
                >
                  {aiPending.worldEvent ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate world event
                </Button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {typingParticipants.length > 0 ? (
                  <PresenceLine participants={typingParticipants} />
                ) : showNarrationThinking ? (
                  <span>The AI is studying the table and building the next beat.</span>
                ) : (
                  <span>The panel is ready for the next prompt.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {isDM ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-cyan-300" />
                  DM Override
                </CardTitle>
                <CardDescription>
                  Edit the latest narration or write a manual correction before sending it to the table.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <label htmlFor="dm-narration" className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">
                    Override narration
                  </label>
                  <textarea
                    id="dm-narration"
                    value={dmNarrationDraft}
                    onChange={(event) => setDmNarrationDraft(event.target.value)}
                    placeholder="Sharpen the beat, correct a detail, or steer the next reveal..."
                    className="min-h-[132px] w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setDmNarrationDraft(latestNarration?.text ?? "")}
                    disabled={!latestNarration}
                  >
                    Load latest beat
                  </Button>
                  <Button onClick={handleBroadcastNarration} className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                    Broadcast override
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                World Events
              </CardTitle>
              <CardDescription>AI-generated omens and campaign-wide consequences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {worldEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
                  No world events yet. Generate one from the AI panel when the session needs a larger ripple.
                </div>
              ) : null}

              {worldEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="group rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(250,204,21,0.08),rgba(15,23,42,0.92))] p-4 transition-all hover:scale-[1.02] hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(250,204,21,0.15)] cursor-default"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-serif text-lg text-white">{event.title}</h3>
                    <span className={cn("rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em]", getWorldEventStatusClass(event.status))}>
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200/85">
                    {event.description || "A shift has been recorded, but its full shape is still emerging."}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">{formatClock(event.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-emerald-300" />
                NPC Cards
              </CardTitle>
              <CardDescription>Generated or active NPC tokens on the current map.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {npcTokens.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
                  No NPC tokens are active yet. They’ll appear here as soon as the session spawns them.
                </div>
              ) : null}

              {npcTokens.map((token) => (
                <div
                  key={token.id}
                  className="group rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(16,185,129,0.12),rgba(15,23,42,0.94))] p-4 transition-all hover:scale-[1.02] hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg text-white">{token.label ?? `NPC #${token.id}`}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-200/80">{token.token_type}</p>
                    </div>
                    {token.is_hidden ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      HP: {token.hp_current ?? "?"} / {token.hp_max ?? "?"}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      Pos: {Math.round(token.position.x)}, {Math.round(token.position.y)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Dice5 className="h-5 w-5 text-violet-300" />
                Dice & Presence
              </CardTitle>
              <CardDescription>Quick rolls and party status at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {(["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as DiceType[]).map((diceType) => (
                  <Button
                    key={diceType}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleRollDice(diceType)}
                    disabled={!isSocketConnected}
                  >
                    {diceType}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                {diceHistory.length === 0 ? (
                  <p className="text-sm text-slate-300">No rolls recorded yet.</p>
                ) : (
                  diceHistory.slice(0, 4).map((roll) => {
                    const participant = participants.find((entry) => entry.userId === roll.user_id);
                    return (
                      <div
                        key={roll.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-white">{participant?.label ?? `Adventurer #${roll.user_id}`}</p>
                          <p className="text-xs text-slate-400">{roll.dice_type}{roll.context ? ` • ${roll.context}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-violet-200">{roll.total}</p>
                          <p className="text-[11px] text-slate-500">{formatClock(roll.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          participant.isOnline ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]" : "bg-slate-500",
                        )}
                      />
                      <div>
                        <p className="font-medium text-white">{participant.label}</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{participant.role}</p>
                      </div>
                    </div>
                    {participant.role === "DM" ? (
                      <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-amber-100">
                        Host
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {rollingAnimation.active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={cn(
                "font-serif text-7xl text-amber-200 drop-shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-all duration-500",
                rollingAnimation.result === null ? "animate-spin-slow scale-95" : "scale-125",
              )}
            >
              {rollingAnimation.result === null ? rollingAnimation.type : rollingAnimation.result}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium text-white">
                {rollingAnimation.result === null
                  ? `${rollingAnimation.actor} is rolling ${rollingAnimation.type}...`
                  : `${rollingAnimation.actor} rolled ${rollingAnimation.type}`}
              </p>
              {rollingAnimation.result !== null ? (
                <p className="text-sm uppercase tracking-[0.28em] text-amber-100/80">Total: {rollingAnimation.result}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showEventOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="text-center space-y-4">
              <Sparkles className="h-16 w-16 text-rose-400 mx-auto animate-pulse" />
              <h2 className="font-serif text-5xl md:text-7xl text-rose-100 uppercase tracking-widest drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]">
                World Event
              </h2>
              <p className="text-xl md:text-3xl text-rose-200/90 font-medium tracking-wide">
                {showEventOverlay}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
