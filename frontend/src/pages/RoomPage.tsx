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
  AlertTriangle,
  Lock,
  Unlock,
  XCircle,
  ChevronUp,
  ChevronDown,
  Edit,
  RefreshCw,
  Plus,
  History,
  Flame,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getCampaignSnapshot, 
  getStoryPrep, 
  regenerateStoryPrep, 
  addCustomStoryPoint, 
  updateStoryPoint,
  getSessionRecaps,
  generateSessionRecap,
  updateCampaignPacing
} from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { SocketEvents, connectSocket, disconnectSocket, getSocket } from "@/services/socket";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { SessionRecapCinematic } from "@/components/campaign/SessionRecapCinematic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        className: "bg-[#ab211f]/15 text-[#d5b45d] border-[#ab211f]/30",
      };
    case "system":
      return {
        label: "System",
        className: "tavern-card text-[#cbc3b5]/70 border-slate-400/30",
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
      return "tavern-card text-[#cbc3b5]/70";
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

  // Session Recap Integration State
  const [activeRecap, setActiveRecap] = useState<any | null>(null);
  const [showClimaxConfirm, setShowClimaxConfirm] = useState(false);
  const [climaxSummary, setClimaxSummary] = useState("");
  const [isWeavingRecap, setIsWeavingRecap] = useState(false);
  const [recapFeedback, setRecapFeedback] = useState<string | null>(null);
  const [recapTone, setRecapTone] = useState<string>("dramatic");

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

  const [storyPoints, setStoryPoints] = useState<any[]>([]);
  const [loadingStoryPrep, setLoadingStoryPrep] = useState(false);
  const [expandedPointId, setExpandedPointId] = useState<number | null>(null);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState("");
  const [newCustomDesc, setNewCustomDesc] = useState("");
  const [newCustomBranch, setNewCustomBranch] = useState("main");

  // Campaign Pacing & Progression States
  const [targetSessionsState, setTargetSessionsState] = useState<number>(5);
  const [completedSessionsState, setCompletedSessionsState] = useState<number>(0);
  const [pacingIntensityState, setPacingIntensityState] = useState<'auto' | 'slow' | 'balanced' | 'fast'>("balanced");
  const [criticalArcsState, setCriticalArcsState] = useState<string[]>([]);
  const [newArcInput, setNewArcInput] = useState("");

  useEffect(() => {
    if (campaign && campaign.current_session_state) {
      setTargetSessionsState(campaign.current_session_state.target_sessions ?? 5);
      setCompletedSessionsState(campaign.current_session_state.completed_sessions ?? 0);
      setPacingIntensityState((campaign.current_session_state.pacing_intensity as any) ?? "balanced");
      setCriticalArcsState(campaign.current_session_state.critical_arcs ?? []);
    }
  }, [campaign]);

  const handleSavePacing = async (updatedTarget?: number, updatedCompleted?: number, updatedIntensity?: any, updatedArcs?: string[]) => {
    try {
      const tgt = updatedTarget ?? targetSessionsState;
      const cmp = updatedCompleted ?? completedSessionsState;
      const int = updatedIntensity ?? pacingIntensityState;
      const arc = updatedArcs ?? criticalArcsState;
      await updateCampaignPacing(campaignId, tgt, cmp, int, arc);
      
      // Update local states immediately
      setTargetSessionsState(tgt);
      setCompletedSessionsState(cmp);
      setPacingIntensityState(int);
      setCriticalArcsState(arc);

      // Invalidate snapshot query
      snapshotQuery.refetch();
    } catch (err) {
      console.error("Failed to update campaign pacing:", err);
    }
  };

  const fetchStoryPrep = async () => {
    if (!campaignId) return;
    try {
      setLoadingStoryPrep(true);
      const data = await getStoryPrep(campaignId);
      setStoryPoints(data.storyPoints || []);
    } catch (err) {
      console.error("Failed to load story prep:", err);
    } finally {
      setLoadingStoryPrep(false);
    }
  };

  useEffect(() => {
    if (isDM && campaignId) {
      fetchStoryPrep();
    }
  }, [isDM, campaignId]);

  const handleLockPoint = async (pointId: number, isCurrentlyLocked: boolean) => {
    try {
      setStoryPoints(prev => prev.map(p => p.id === pointId ? { ...p, is_locked: !isCurrentlyLocked } : p));
      await updateStoryPoint(campaignId, pointId, { is_locked: !isCurrentlyLocked });
    } catch (err) {
      console.error("Failed to lock point:", err);
      fetchStoryPrep();
    }
  };

  const handleRejectPoint = async (pointId: number, isCurrentlyRejected: boolean) => {
    try {
      setStoryPoints(prev => prev.map(p => p.id === pointId ? { ...p, is_rejected: !isCurrentlyRejected } : p));
      await updateStoryPoint(campaignId, pointId, { is_rejected: !isCurrentlyRejected });
    } catch (err) {
      console.error("Failed to reject point:", err);
      fetchStoryPrep();
    }
  };

  const handleRegeneratePoints = async () => {
    try {
      setLoadingStoryPrep(true);
      const data = await regenerateStoryPrep(campaignId);
      setStoryPoints(data.storyPoints || []);
    } catch (err) {
      console.error("Failed to regenerate points:", err);
    } finally {
      setLoadingStoryPrep(false);
    }
  };

  const handleSaveEdit = async (pointId: number) => {
    try {
      setStoryPoints(prev => prev.map(p => p.id === pointId ? { ...p, ...editForm } : p));
      await updateStoryPoint(campaignId, pointId, editForm);
      setEditingPointId(null);
    } catch (err) {
      console.error("Failed to save edits:", err);
      fetchStoryPrep();
    }
  };

  const handleAddCustomPoint = async () => {
    if (!newCustomTitle.trim()) return;
    try {
      setLoadingStoryPrep(true);
      const data = await addCustomStoryPoint(campaignId, {
        title: newCustomTitle,
        description: newCustomDesc,
        branch_type: newCustomBranch
      });
      setStoryPoints(prev => [...prev, data.storyPoint]);
      setNewCustomTitle("");
      setNewCustomDesc("");
      setShowAddCustom(false);
    } catch (err) {
      console.error("Failed to add custom point:", err);
    } finally {
      setLoadingStoryPrep(false);
    }
  };

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

  const handleStartSession = () => {
    const socket = getSocket();
    if (!socket) {
      setLastError("Connection to table lost. Reconnecting...");
      return;
    }
    setLastError(null);
    socket.emit(SocketEvents.SessionStarted);
  };

  const handleEndSessionTrigger = () => {
    setClimaxSummary("");
    setShowClimaxConfirm(true);
  };

  const handleEndSessionConfirm = async () => {
    const socket = getSocket();
    if (!socket) {
      setLastError("Connection to table lost. Reconnecting...");
      return;
    }

    const currentSessionId = sessionState?.session_id;
    if (!currentSessionId) {
      setLastError("No active session found to conclude.");
      setShowClimaxConfirm(false);
      return;
    }

    setShowClimaxConfirm(false);
    setIsWeavingRecap(true);
    setRecapFeedback("Fading out the board and calling upon the chronicle bards...");

    try {
      // 1. Emit SessionEnded socket event so that all clients receive the state update
      socket.emit(SocketEvents.SessionEnded, { summary: climaxSummary });

      // 2. Call the REST endpoint to compile and save the gorgeous cinematic recap
      const res = await generateSessionRecap(campaignId, currentSessionId, recapTone);
      
      setIsWeavingRecap(false);
      setRecapFeedback(null);
      
      if (res?.recap) {
        setActiveRecap(res.recap);
      } else {
        setLastError("The chronicle was recorded, but the cinematic projection failed. View it in the recap archive.");
      }
    } catch (error) {
      setIsWeavingRecap(false);
      setRecapFeedback(null);
      setLastError(getApiErrorMessage(error, "The magic failed. Could not weave the chronicle recap."));
    }
  };

  const handleViewRecap = async () => {
    setLastError(null);
    setIsWeavingRecap(true);
    setRecapFeedback("Sifting through the ancient memories...");
    try {
      const res = await getSessionRecaps(campaignId);
      setIsWeavingRecap(false);
      setRecapFeedback(null);
      if (res?.recaps && res.recaps.length > 0) {
        // Show the latest recap
        setActiveRecap(res.recaps[0]);
      } else {
        setLastError("No past chronicles found for this campaign.");
      }
    } catch (error) {
      setIsWeavingRecap(false);
      setRecapFeedback(null);
      setLastError(getApiErrorMessage(error, "Could not retrieve chronicles."));
    }
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
      <div className="relative overflow-hidden rounded-[28px] border border-tavern-border bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(4,9,18,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
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
              <h1 className="font-serif text-3xl text-[#f5efe2] drop-shadow-sm">{campaign?.name ?? "Campaign Session"}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#cbc3b5]/70/85">
                {campaign?.description ||
                  "The table is live. Guide the scene, surface AI world beats, and keep the party in sync between narration and tactics."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", getSessionStatusClass(sessionState?.status))}>
                <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                {sessionState?.status ?? "idle"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-tavern-border bg-white/5 px-3 py-1 text-[#cbc3b5]/70">
                Mode: {sessionState?.mode ?? "narration"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-tavern-border bg-white/5 px-3 py-1 text-[#cbc3b5]/70">
                Invite code: <span className="font-mono text-amber-200">{campaign?.invite_code}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {isDM && (
              <>
                {sessionState?.status === "active" ? (
                  <Button 
                    size="sm" 
                    className="bg-[#ab211f] hover:bg-[#8f1917] text-white text-xs uppercase tracking-wider h-9 font-display px-4 shadow-[0_0_15px_rgba(171,33,31,0.3)] gap-1.5" 
                    onClick={handleEndSessionTrigger}
                    disabled={isWeavingRecap}
                  >
                    <Flame className="h-4 w-4 animate-pulse" />
                    End Session & Recap
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="bg-[#d5b45d] hover:bg-[#c39e3d] text-stone-950 text-xs uppercase tracking-wider h-9 font-display px-4 shadow-[0_0_15px_rgba(213,180,93,0.3)] gap-1.5 animate-pulse" 
                    onClick={handleStartSession}
                    disabled={isWeavingRecap}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    Start Session
                  </Button>
                )}
              </>
            )}

            {sessionState?.status === "ended" && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-[#d5b45d]/40 text-[#d5b45d] hover:bg-[#d5b45d]/10 text-xs uppercase tracking-wider h-9 font-display px-4 gap-1.5" 
                onClick={handleViewRecap}
                disabled={isWeavingRecap}
              >
                <History className="h-4 w-4" />
                View Session Recap
              </Button>
            )}

            <span className="inline-flex items-center gap-2 rounded-full border border-tavern-border bg-black/40 px-3 py-1.5 text-sm text-[#cbc3b5]/70 transition-colors hover:bg-white/5 cursor-pointer">
              <CloudRain className="h-4 w-4 text-indigo-300" />
              Heavy Rain
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-tavern-border bg-black/40 px-3 py-1.5 text-sm text-[#cbc3b5]/70 transition-colors hover:bg-white/5 cursor-pointer">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-tavern-border bg-black/40 px-3 py-1.5 text-sm text-[#cbc3b5]/70 hover:bg-white/5 transition-colors">
              <Users className="h-4 w-4 text-[#d5b45d]" />
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
                  <MapPinned className="h-5 w-5 text-[#d5b45d]" />
                  Tactical Stage
                </CardTitle>
                <CardDescription>
                  {activeMap
                    ? `${activeMap.name} is active. The map softens automatically during AI narration beats.`
                    : "No active map is set yet, so the board is using the placeholder stage."}
                </CardDescription>
              </div>
              <span className="rounded-full border border-tavern-border bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">
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
                <div className="rounded-2xl border border-[#ab211f]/30 bg-[#ab211f]/10 p-4 text-sm text-[#d5b45d]">
                  <PresenceLine participants={typingParticipants} />
                </div>
              ) : null}

              <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
                {narrationFeed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-tavern-border bg-white/5 px-5 py-6 text-sm text-[#cbc3b5]/70">
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
                        "rounded-[22px] border border-tavern-border bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(6,10,18,0.96))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]",
                        isHighlighted && "animate-narration-rise ring-1 ring-amber-300/35",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", badge.className)}>
                            {badge.label}
                          </span>
                          {entry.tone ? (
                            <span className="rounded-full border border-tavern-border bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#cbc3b5]/70">
                              {entry.tone}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">{formatClock(entry.createdAt)}</span>
                      </div>
                      <p className="mt-4 font-serif text-xl leading-8 text-[#f5efe2]">{entry.text}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#cbc3b5]/70">
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
              <div className="rounded-2xl border border-tavern-border bg-black/40 p-3">
                <label htmlFor="player-action" className="mb-2 block text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">
                  Player action
                </label>
                <textarea
                  id="player-action"
                  value={playerAction}
                  onChange={(event) => setPlayerAction(event.target.value)}
                  placeholder="The ranger steps into the torchlight and offers the relic to the priestess..."
                  className="min-h-[120px] w-full resize-none rounded-xl border border-tavern-border bg-transparent px-3 py-3 text-sm text-[#f5efe2] outline-none placeholder:text-[#cbc3b5]/70 focus:border-amber-300/40"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">Narration tone</p>
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
                          : "border-tavern-border bg-white/5 text-[#cbc3b5]/70 hover:bg-white/10",
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
                  className="h-11 justify-center gap-2 bg-amber-500 text-[#cbc3b5]/70 hover:bg-amber-400"
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

              <div className="rounded-2xl border border-tavern-border bg-white/5 px-4 py-3 text-sm text-[#cbc3b5]/70">
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
                  <Crown className="h-5 w-5 text-[#d5b45d]" />
                  DM Override
                </CardTitle>
                <CardDescription>
                  Edit the latest narration or write a manual correction before sending it to the table.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-tavern-border bg-black/40 p-3">
                  <label htmlFor="dm-narration" className="mb-2 block text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">
                    Override narration
                  </label>
                  <textarea
                    id="dm-narration"
                    value={dmNarrationDraft}
                    onChange={(event) => setDmNarrationDraft(event.target.value)}
                    placeholder="Sharpen the beat, correct a detail, or steer the next reveal..."
                    className="min-h-[132px] w-full resize-none rounded-xl border border-tavern-border bg-transparent px-3 py-3 text-sm text-[#f5efe2] outline-none placeholder:text-[#cbc3b5]/70 focus:border-[#ab211f]/30"
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
                  <Button onClick={handleBroadcastNarration} className="gap-2 bg-[#ab211f] text-[#cbc3b5]/70 hover:bg-[#8f1917]">
                    Broadcast override
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isDM ? (
            <Card className="border-[#d5b45d]/25 shadow-[0_4px_30px_rgba(213,180,93,0.05)]">
              <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#d5b45d]" />
                    DM Story Intelligence & Preparation
                  </CardTitle>
                  <CardDescription>
                    Preview future narrative paths, AI pacing recommendations, predictions, and lock crucial secrets before the session unfolds.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#d5b45d]/30 text-[#d5b45d] hover:bg-[#d5b45d]/10 h-9"
                    onClick={handleRegeneratePoints}
                    disabled={loadingStoryPrep}
                  >
                    {loadingStoryPrep ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                    Regenerate Unlocked
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-9 gap-1.5 text-xs uppercase tracking-wider"
                    onClick={() => setShowAddCustom(!showAddCustom)}
                  >
                    <Plus className="h-4 w-4" />
                    Custom Path
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 10.6.1.1 Narrative Pacing & Progression Visual Panel */}
                <div className="grid gap-6 md:grid-cols-3 border border-tavern-border/60 bg-black/35 rounded-2xl p-5 mb-4">
                  
                  {/* Left & Middle Column: Session Pacing Timeline */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-[#d5b45d] animate-pulse" />
                        <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#f5efe2]">Narrative Chapter Progression</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#cbc3b5]/60 bg-white/5 px-2 py-0.5 rounded-full border border-tavern-border/50">
                        Pacing: <span className="text-[#d5b45d] font-semibold uppercase">{pacingIntensityState}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-[#cbc3b5]/60 leading-relaxed">
                      Click a chapter node below to manually align the campaign's temporal flow. The AI storyteller will adjust subplots, twist frequency, and climax intensity based on remaining sessions.
                    </p>

                    {/* Timeline Node Flow */}
                    <div className="flex flex-wrap items-center gap-3 py-3 overflow-x-auto">
                      {Array.from({ length: targetSessionsState }).map((_, idx) => {
                        const sessionNum = idx + 1;
                        const isCompleted = sessionNum <= completedSessionsState;
                        const isActive = sessionNum === completedSessionsState + 1;
                        const isClimax = sessionNum === targetSessionsState;

                        return (
                          <div 
                            key={sessionNum}
                            onClick={() => handleSavePacing(targetSessionsState, isCompleted ? sessionNum - 1 : sessionNum)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all duration-300 relative",
                              isCompleted 
                                ? "bg-[#d5b45d] border-[#d5b45d] text-black shadow-[0_0_12px_rgba(213,180,93,0.3)]"
                                : isActive
                                  ? "bg-black border-[#d5b45d] text-[#d5b45d] shadow-[0_0_15px_rgba(213,180,93,0.2)] animate-pulse"
                                  : isClimax
                                    ? "bg-black border-red-500/40 text-red-400/80 hover:border-red-500"
                                    : "bg-black border-tavern-border text-[#cbc3b5]/40 hover:border-[#cbc3b5]/30 hover:text-white"
                            )}>
                              {isCompleted ? (
                                <span className="text-xs">✓</span>
                              ) : isClimax ? (
                                <Crown className="h-4 w-4" />
                              ) : (
                                <span>{sessionNum}</span>
                              )}
                              
                              {/* Glowing Ring for Active Session */}
                              {isActive && (
                                <span className="absolute -inset-1 rounded-full border border-[#d5b45d]/40 animate-ping opacity-60" />
                              )}
                            </div>
                            
                            <span className={cn(
                              "text-[8px] uppercase tracking-wider font-semibold",
                              isCompleted
                                ? "text-[#d5b45d]"
                                : isActive
                                  ? "text-[#d5b45d] animate-pulse"
                                  : isClimax
                                    ? "text-red-400"
                                    : "text-[#cbc3b5]/40"
                            )}>
                              {isClimax ? "Climax" : `Ch. ${sessionNum}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-tavern-border/30">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          type="button"
                          variant="outline"
                          disabled={completedSessionsState === 0}
                          onClick={() => handleSavePacing(targetSessionsState, completedSessionsState - 1)}
                          className="h-8 px-2.5 text-[10px] uppercase tracking-wider border-tavern-border hover:bg-white/5"
                        >
                          - Prev Chapter
                        </Button>
                        <Button 
                          size="sm"
                          type="button"
                          variant="outline"
                          disabled={completedSessionsState >= targetSessionsState}
                          onClick={() => handleSavePacing(targetSessionsState, completedSessionsState + 1)}
                          className="h-8 px-2.5 text-[10px] uppercase tracking-wider border-tavern-border hover:bg-[#d5b45d]/10 hover:text-[#d5b45d]"
                        >
                          + Next Chapter
                        </Button>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#cbc3b5]/40 font-mono">Campaign Progress:</span>
                        <span className="text-xs font-semibold text-[#f5efe2] font-mono ml-1.5">
                          {completedSessionsState} / {targetSessionsState} Sessions ({targetSessionsState > 0 ? ((completedSessionsState / targetSessionsState) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pacing Configuration & Core Milestones */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-tavern-border/40 pt-4 md:pt-0 md:pl-5">
                    <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#f5efe2] flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" /> Dynamic Controls
                    </h5>

                    {/* Total Duration Changer */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#cbc3b5]/60 block">Campaign Scope Target</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={targetSessionsState}
                          onChange={(e: any) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              handleSavePacing(val);
                            }
                          }}
                          className="bg-black/40 border-tavern-border h-8 w-16 text-center text-xs font-mono text-[#d5b45d]"
                        />
                        <span className="text-[9px] text-[#cbc3b5]/50 leading-tight">Total sessions planned for complete story arc</span>
                      </div>
                    </div>

                    {/* Pacing Speed select */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#cbc3b5]/60 block">AI Climax Urgency</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "slow", label: "🕯️ Slow" },
                          { id: "balanced", label: "⚖️ Bal" },
                          { id: "fast", label: "⚡ Fast" }
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSavePacing(targetSessionsState, completedSessionsState, p.id)}
                            className={cn(
                              "py-1 rounded border text-[9px] font-semibold uppercase tracking-wider transition-all",
                              pacingIntensityState === p.id
                                ? "bg-[#d5b45d]/10 border-[#d5b45d] text-[#d5b45d]"
                                : "bg-black/40 border-tavern-border text-[#cbc3b5]/40 hover:text-white"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Critical Story Arcs / Milestones */}
                    <div className="space-y-2 pt-2 border-t border-tavern-border/30">
                      <label className="text-[9px] uppercase tracking-wider text-[#cbc3b5]/60 block flex justify-between items-center">
                        <span>Critical Plot Arcs</span>
                        <span className="text-[8px] font-mono text-[#cbc3b5]/40">({criticalArcsState.filter(a => a.startsWith("[x]")).length}/{criticalArcsState.length} resolved)</span>
                      </label>
                      
                      <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
                        {criticalArcsState.length === 0 ? (
                          <p className="text-[9px] text-[#cbc3b5]/40 italic">No custom subplots tracked yet.</p>
                        ) : (
                          criticalArcsState.map((arc, index) => {
                            const isResolved = arc.startsWith("[x]");
                            const cleanText = isResolved ? arc.replace("[x]", "").trim() : arc;
                            return (
                              <div key={index} className="flex items-center gap-2 text-[10px] bg-black/20 p-1.5 rounded border border-tavern-border/20">
                                <input 
                                  type="checkbox"
                                  checked={isResolved}
                                  onChange={() => {
                                    const updated = [...criticalArcsState];
                                    if (isResolved) {
                                      updated[index] = cleanText;
                                    } else {
                                      updated[index] = `[x] ${cleanText}`;
                                    }
                                    handleSavePacing(targetSessionsState, completedSessionsState, pacingIntensityState, updated);
                                  }}
                                  className="rounded border-tavern-border text-[#d5b45d] focus:ring-0 focus:ring-offset-0 bg-transparent h-3 w-3 cursor-pointer"
                                />
                                <span className={cn(
                                  "truncate",
                                  isResolved ? "line-through text-[#cbc3b5]/40" : "text-[#cbc3b5]/80"
                                )}>
                                  {cleanText}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add new arc inline */}
                      <div className="flex gap-1">
                        <Input
                          placeholder="e.g. Find Sun relic..."
                          value={newArcInput}
                          onChange={(e: any) => setNewArcInput(e.target.value)}
                          onKeyDown={(e: any) => {
                            if (e.key === "Enter" && newArcInput.trim()) {
                              const updated = [...criticalArcsState, newArcInput.trim()];
                              handleSavePacing(targetSessionsState, completedSessionsState, pacingIntensityState, updated);
                              setNewArcInput("");
                            }
                          }}
                          className="bg-black/30 border-tavern-border h-7 text-[10px] px-2"
                        />
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => {
                            if (newArcInput.trim()) {
                              const updated = [...criticalArcsState, newArcInput.trim()];
                              handleSavePacing(targetSessionsState, completedSessionsState, pacingIntensityState, updated);
                              setNewArcInput("");
                            }
                          }}
                          className="bg-[#d5b45d]/20 border border-[#d5b45d]/30 text-[#d5b45d] hover:bg-[#d5b45d]/30 h-7 text-[10px] px-2"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>

                {showAddCustom && (
                  <div className="p-4 rounded-2xl border border-tavern-border bg-black/50 space-y-4 mb-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[#d5b45d] flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Custom Narrative Branch
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#cbc3b5]/70">Branch Title</label>
                        <Input 
                          placeholder="e.g. The Betrayal of Lord Silas"
                          value={newCustomTitle}
                          onChange={(e: any) => setNewCustomTitle(e.target.value)}
                          className="bg-black/30 border-tavern-border focus:border-[#d5b45d]/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-[#cbc3b5]/70">Branch Type</label>
                        <select
                          value={newCustomBranch}
                          onChange={(e: any) => setNewCustomBranch(e.target.value)}
                          className="w-full bg-black/40 border border-tavern-border rounded-xl h-10 px-3 text-sm text-[#f5efe2] focus:border-[#d5b45d]/40 outline-none"
                        >
                          <option value="main">Main Quest</option>
                          <option value="side_quest">Side Quest</option>
                          <option value="twist">Plot Twist</option>
                          <option value="faction_clash">Faction Action</option>
                          <option value="lore_discovery">Lore Discovery</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#cbc3b5]/70">Description / Narrative Hook</label>
                      <textarea
                        placeholder="Detail the event, key characters involved, and what changes in the world..."
                        value={newCustomDesc}
                        onChange={(e: any) => setNewCustomDesc(e.target.value)}
                        className="w-full min-h-[80px] bg-black/30 border border-tavern-border rounded-xl p-3 text-sm text-[#f5efe2] focus:border-[#d5b45d]/40 outline-none resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddCustom(false)}>Cancel</Button>
                      <Button size="sm" className="bg-[#d5b45d] text-black hover:bg-[#c4a24d]" onClick={handleAddCustomPoint}>Forge Path</Button>
                    </div>
                  </div>
                )}

                {loadingStoryPrep && storyPoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-[#cbc3b5]/50 gap-3">
                    <LoaderCircle className="h-8 w-8 animate-spin text-[#d5b45d]" />
                    <p className="text-sm">Whispering to the fates to forge narrative pathways...</p>
                  </div>
                ) : storyPoints.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-tavern-border rounded-2xl bg-white/5 text-[#cbc3b5]/70">
                    No narrative paths loaded. Regenerate to forge 10 dynamic AI story branches.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {storyPoints.map((point, index) => {
                      const isExpanded = expandedPointId === point.id;
                      const isEditing = editingPointId === point.id;
                      const branchColors: Record<string, string> = {
                        main: "bg-[#d5b45d]/10 text-[#d5b45d] border-[#d5b45d]/30",
                        side_quest: "bg-[#87a8ff]/10 text-[#87a8ff] border-[#87a8ff]/30",
                        twist: "bg-rose-500/10 text-rose-300 border-rose-500/30",
                        faction_clash: "bg-amber-500/10 text-amber-300 border-amber-500/30",
                        lore_discovery: "bg-purple-500/10 text-purple-300 border-purple-500/30",
                      };

                      return (
                        <div 
                          key={point.id} 
                          className={`rounded-2xl border transition-all duration-300 ${
                            point.is_rejected 
                              ? "border-rose-950/40 bg-rose-950/5 opacity-50" 
                              : isExpanded 
                                ? "border-[#d5b45d]/45 bg-[#d5b45d]/[0.02]" 
                                : "border-tavern-border bg-black/20 hover:border-[#cbc3b5]/30"
                          }`}
                        >
                          {/* Point Header */}
                          <div className="flex items-center justify-between p-4 cursor-pointer gap-4" onClick={() => setExpandedPointId(isExpanded ? null : point.id)}>
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tavern-border text-xs font-mono font-bold text-[#d5b45d] border border-[#d5b45d]/20">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-[#f5efe2] text-sm flex items-center gap-2">
                                  {point.title}
                                  {point.is_locked && <Lock className="h-3 w-3 text-[#d5b45d] animate-pulse" />}
                                </h4>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider font-semibold ${branchColors[point.branch_type] || branchColors.main}`}>
                                  {point.branch_type?.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleLockPoint(point.id, !!point.is_locked)}
                                className={`p-1.5 rounded-lg border transition ${
                                  point.is_locked 
                                    ? "bg-[#d5b45d]/20 border-[#d5b45d] text-[#d5b45d]" 
                                    : "bg-black/40 border-tavern-border text-[#cbc3b5]/60 hover:text-white"
                                }`}
                                title={point.is_locked ? "Unlock and allow AI regeneration" : "Lock this path to protect it from AI regeneration"}
                              >
                                {point.is_locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                              </button>
                              <button 
                                onClick={() => handleRejectPoint(point.id, !!point.is_rejected)}
                                className={`p-1.5 rounded-lg border transition ${
                                  point.is_rejected 
                                    ? "bg-rose-500/20 border-rose-500 text-rose-400" 
                                    : "bg-black/40 border-tavern-border text-[#cbc3b5]/60 hover:text-rose-400 hover:border-rose-500/30"
                                }`}
                                title={point.is_rejected ? "Restore this narrative path" : "Reject this path"}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedPointId(null);
                                  } else {
                                    setExpandedPointId(point.id);
                                  }
                                }}
                                className="p-1.5 text-[#cbc3b5]/60 hover:text-white"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-tavern-border/50 p-4 space-y-4 bg-black/30">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase tracking-wider text-[#d5b45d]">Path Title</label>
                                      <Input 
                                        value={editForm.title}
                                        onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="bg-black/50 border-tavern-border"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase tracking-wider text-[#d5b45d]">Branch Type</label>
                                      <select
                                        value={editForm.branch_type}
                                        onChange={(e: any) => setEditForm({ ...editForm, branch_type: e.target.value })}
                                        className="w-full bg-black/50 border border-tavern-border rounded-xl h-10 px-3 text-sm text-[#f5efe2]"
                                      >
                                        <option value="main">Main Quest</option>
                                        <option value="side_quest">Side Quest</option>
                                        <option value="twist">Plot Twist</option>
                                        <option value="faction_clash">Faction Action</option>
                                        <option value="lore_discovery">Lore Discovery</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#d5b45d]">Narrative Hook / Description</label>
                                    <textarea
                                      value={editForm.description}
                                      onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })}
                                      className="w-full min-h-[80px] bg-black/50 border border-tavern-border rounded-xl p-3 text-sm text-[#f5efe2] outline-none"
                                    />
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase tracking-wider text-[#d5b45d]">Pacing Recommendation</label>
                                      <textarea
                                        value={editForm.pacing_recommendation || ""}
                                        onChange={(e: any) => setEditForm({ ...editForm, pacing_recommendation: e.target.value })}
                                        className="w-full min-h-[60px] bg-black/50 border border-tavern-border rounded-xl p-2 text-xs text-[#cbc3b5]"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] uppercase tracking-wider text-[#d5b45d]">Backup Scenario (If derailed)</label>
                                      <textarea
                                        value={editForm.backup_scenario || ""}
                                        onChange={(e: any) => setEditForm({ ...editForm, backup_scenario: e.target.value })}
                                        className="w-full min-h-[60px] bg-black/50 border border-tavern-border rounded-xl p-2 text-xs text-[#cbc3b5]"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingPointId(null)}>Cancel</Button>
                                    <Button size="sm" className="bg-[#d5b45d] text-black hover:bg-[#c4a24d]" onClick={() => handleSaveEdit(point.id)}>Save Changes</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="text-sm leading-relaxed text-[#f5efe2]">
                                    <h5 className="text-[9px] uppercase tracking-wider text-[#d5b45d] font-bold mb-1">Narrative Hook</h5>
                                    {point.description}
                                  </div>

                                  {/* Story Intelligence Grid */}
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {point.pacing_recommendation && (
                                      <div className="p-3 rounded-xl border border-tavern-border bg-black/40">
                                        <h5 className="text-[9px] uppercase tracking-wider text-[#d5b45d] font-bold mb-1">⚡ AI Pacing & Vibe</h5>
                                        <p className="text-[11px] text-[#cbc3b5]/90 leading-relaxed">{point.pacing_recommendation}</p>
                                      </div>
                                    )}
                                    {point.backup_scenario && (
                                      <div className="p-3 rounded-xl border border-tavern-border bg-black/40">
                                        <h5 className="text-[9px] uppercase tracking-wider text-rose-400 font-bold mb-1">🛡️ Contingency & Derailment Backup</h5>
                                        <p className="text-[11px] text-[#cbc3b5]/90 leading-relaxed">{point.backup_scenario}</p>
                                      </div>
                                    )}
                                    {point.emotional_moment && (
                                      <div className="p-3 rounded-xl border border-tavern-border bg-black/40">
                                        <h5 className="text-[9px] uppercase tracking-wider text-violet-300 font-bold mb-1">🎭 Suggested Emotional Moment</h5>
                                        <p className="text-[11px] text-[#cbc3b5]/90 leading-relaxed">{point.emotional_moment}</p>
                                      </div>
                                    )}
                                    {point.player_decision_prediction && (
                                      <div className="p-3 rounded-xl border border-tavern-border bg-black/40">
                                        <h5 className="text-[9px] uppercase tracking-wider text-blue-300 font-bold mb-1">🔮 Predicted Player Choices</h5>
                                        <p className="text-[11px] text-[#cbc3b5]/90 leading-relaxed">{point.player_decision_prediction}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* More details toggle */}
                                  <div className="pt-3 border-t border-tavern-border/40 grid gap-3 md:grid-cols-3 text-[11px]">
                                    {point.possible_encounters && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">⚔️ Encounters</h6>
                                        <p className="text-[#cbc3b5]/75">{point.possible_encounters}</p>
                                      </div>
                                    )}
                                    {point.faction_reactions && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">🏛️ Faction Reaction</h6>
                                        <p className="text-[#cbc3b5]/75">{point.faction_reactions}</p>
                                      </div>
                                    )}
                                    {point.character_consequences && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">👤 Character Consequence</h6>
                                        <p className="text-[#cbc3b5]/75">{point.character_consequences}</p>
                                      </div>
                                    )}
                                    {point.plot_twists && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">🌀 Twist</h6>
                                        <p className="text-[#cbc3b5]/75">{point.plot_twists}</p>
                                      </div>
                                    )}
                                    {point.npc_betrayals && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">🗡️ Betrayal motivation</h6>
                                        <p className="text-[#cbc3b5]/75">{point.npc_betrayals}</p>
                                      </div>
                                    )}
                                    {point.lore_discoveries && (
                                      <div>
                                        <h6 className="font-semibold text-[#f5efe2] mb-0.5">📜 Lore Discovery</h6>
                                        <p className="text-[#cbc3b5]/75">{point.lore_discoveries}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end gap-2 pt-2 border-t border-tavern-border/30">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs border border-tavern-border h-8 hover:bg-[#d5b45d]/10 hover:text-[#d5b45d]"
                                      onClick={() => {
                                        setEditingPointId(point.id);
                                        setEditForm({ ...point });
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit Path Details
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <div className="rounded-2xl border border-dashed border-tavern-border bg-white/5 px-4 py-5 text-sm text-[#cbc3b5]/70">
                  No world events yet. Generate one from the AI panel when the session needs a larger ripple.
                </div>
              ) : null}

              {worldEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="group rounded-2xl border border-tavern-border bg-[linear-gradient(180deg,rgba(250,204,21,0.08),rgba(15,23,42,0.92))] p-4 transition-all hover:scale-[1.02] hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(250,204,21,0.15)] cursor-default"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-serif text-lg text-[#f5efe2]">{event.title}</h3>
                    <span className={cn("rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em]", getWorldEventStatusClass(event.status))}>
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#cbc3b5]/70/85">
                    {event.description || "A shift has been recorded, but its full shape is still emerging."}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[#cbc3b5]/70">{formatClock(event.created_at)}</p>
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
                <div className="rounded-2xl border border-dashed border-tavern-border bg-white/5 px-4 py-5 text-sm text-[#cbc3b5]/70">
                  No NPC tokens are active yet. They’ll appear here as soon as the session spawns them.
                </div>
              ) : null}

              {npcTokens.map((token) => (
                <div
                  key={token.id}
                  className="group rounded-2xl border border-tavern-border bg-[linear-gradient(160deg,rgba(16,185,129,0.12),rgba(15,23,42,0.94))] p-4 transition-all hover:scale-[1.02] hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg text-[#f5efe2]">{token.label ?? `NPC #${token.id}`}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-200/80">{token.token_type}</p>
                    </div>
                    {token.is_hidden ? (
                      <span className="rounded-full border border-tavern-border bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#cbc3b5]/70">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#cbc3b5]/70">
                    <div className="rounded-xl border border-tavern-border bg-black/40 px-3 py-2">
                      HP: {token.hp_current ?? "?"} / {token.hp_max ?? "?"}
                    </div>
                    <div className="rounded-xl border border-tavern-border bg-black/40 px-3 py-2">
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
                  <p className="text-sm text-[#cbc3b5]/70">No rolls recorded yet.</p>
                ) : (
                  diceHistory.slice(0, 4).map((roll) => {
                    const participant = participants.find((entry) => entry.userId === roll.user_id);
                    return (
                      <div
                        key={roll.id}
                        className="flex items-center justify-between rounded-xl border border-tavern-border bg-white/5 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-[#f5efe2]">{participant?.label ?? `Adventurer #${roll.user_id}`}</p>
                          <p className="text-xs text-[#cbc3b5]/70">{roll.dice_type}{roll.context ? ` • ${roll.context}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-violet-200">{roll.total}</p>
                          <p className="text-[11px] text-[#cbc3b5]/70">{formatClock(roll.created_at)}</p>
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
                    className="flex items-center justify-between rounded-xl border border-tavern-border bg-white/5 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          participant.isOnline ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]" : "bg-slate-500",
                        )}
                      />
                      <div>
                        <p className="font-medium text-[#f5efe2]">{participant.label}</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#cbc3b5]/70">{participant.role}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(213,180,93,0.3)] animate-pulse" />
              <div
                className={cn(
                  "relative font-display text-8xl text-[#d5b45d] drop-shadow-[0_0_24px_rgba(213,180,93,0.8)] transition-all duration-700",
                  rollingAnimation.result === null ? "animate-spin-slow scale-90" : "scale-125",
                )}
              >
                {rollingAnimation.result === null ? rollingAnimation.type : rollingAnimation.result}
              </div>
            </div>
            <div className="space-y-2 mt-4 z-10 relative">
              <p className="text-2xl font-serif italic text-[#f5efe2] tracking-wide">
                {rollingAnimation.result === null
                  ? `${rollingAnimation.actor} is rolling ${rollingAnimation.type}...`
                  : `${rollingAnimation.actor} rolled a ${rollingAnimation.result}`}
              </p>
              {rollingAnimation.result !== null && (
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#ab211f] to-transparent mx-auto mt-4" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showEventOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0a09]/95 backdrop-blur-md pointer-events-none"
          >
            <div className="text-center space-y-6">
              <Sparkles className="h-16 w-16 text-[#ab211f] mx-auto animate-pulse" />
              <h2 className="font-display text-5xl md:text-7xl text-[#f5efe2] uppercase tracking-[0.3em] drop-shadow-[0_0_30px_rgba(171,33,31,0.6)]">
                World Event
              </h2>
              <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#d5b45d] to-transparent mx-auto" />
              <p className="text-2xl md:text-4xl text-[#d5b45d] font-serif italic max-w-2xl mx-auto px-4 leading-relaxed">
                {showEventOverlay}
              </p>
            </div>
          </motion.div>
        )}

        {showClimaxConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl overflow-hidden rounded-[28px] border border-tavern-border bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(8,10,15,0.99))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#ab211f]/10 to-transparent" />
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#ab211f]/10 p-2.5 text-[#ab211f]">
                    <Flame className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#f5efe2]">Conclude the Session</h3>
                    <p className="text-sm text-[#cbc3b5]/70 font-sans">Fade the table to black and compile the AI chronicle.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider text-[#d5b45d] font-display">Session Climax & Notes (Optional)</label>
                  <textarea 
                    value={climaxSummary}
                    onChange={(e) => setClimaxSummary(e.target.value)}
                    placeholder="E.g., The party slew the shadow beast but lost the golden chalice. Eldrin was secretly poisoned..."
                    className="w-full min-h-[100px] rounded-xl border border-tavern-border bg-black/40 p-4 text-[#f5efe2] placeholder-[#cbc3b5]/40 focus:border-[#d5b45d]/40 focus:outline-none text-sm transition-colors duration-200 font-sans"
                  />
                  <p className="text-[11px] text-[#cbc3b5]/50 leading-relaxed font-sans">If left empty, the AI bards will fully synthesize the session based on gameplay logs and dice rolls!</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-wider text-[#d5b45d] font-display">Recap Tone</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["dramatic", "heroic", "mysterious", "tragic", "horror"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setRecapTone(tone)}
                        className={cn(
                          "rounded-xl border px-2 py-2 text-[10px] uppercase tracking-wider font-display transition-all duration-300",
                          recapTone === tone 
                            ? "bg-[#d5b45d] border-[#d5b45d] text-stone-950 font-bold shadow-[0_0_12px_rgba(213,180,93,0.3)]" 
                            : "bg-white/5 border-tavern-border text-[#cbc3b5]/70 hover:bg-white/10"
                        )}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-tavern-border/50">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowClimaxConfirm(false)}
                    className="text-[#cbc3b5] hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEndSessionConfirm}
                    className="bg-[#ab211f] hover:bg-[#8f1917] text-white font-display uppercase tracking-wider"
                  >
                    Conclude Session
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isWeavingRecap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg"
          >
            <div className="relative flex flex-col items-center gap-6 max-w-md text-center p-6">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(213,180,93,0.15),_transparent_70%)]" />
              
              <div className="relative">
                <Sparkles className="h-16 w-16 text-[#d5b45d] animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute -inset-4 rounded-full border border-dashed border-[#d5b45d]/40"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-[#f5efe2] tracking-wide">Weaving the Chronicles</h3>
                <p className="text-sm font-sans text-[#cbc3b5]/70 leading-relaxed">
                  {recapFeedback || "The bards are documenting your triumphs and tragedies..."}
                </p>
              </div>

              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/5">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-[#ab211f] to-[#d5b45d]"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeRecap && (
          <SessionRecapCinematic 
            recap={activeRecap}
            onClose={() => setActiveRecap(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
