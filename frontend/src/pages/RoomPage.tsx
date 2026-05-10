import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomDetails, generateNPC } from "@/services/rooms";
import { getApiErrorMessage } from "@/services/api";
import { getSocket, connectSocket, disconnectSocket } from "@/services/socket";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);

  const { user } = useAuthStore();
  const { participants, setParticipants, isSocketConnected, boardState } = useRoomStore();
  const [rollingAnimation, setRollingAnimation] = useState<{ active: boolean; type: string; result: number | null }>({
    active: false,
    type: "",
    result: null,
  });
  const [npcTheme, setNpcTheme] = useState("");
  const [isGeneratingNpc, setIsGeneratingNpc] = useState(false);
  const [npcError, setNpcError] = useState<string | null>(null);

  useEffect(() => {
    if (boardState?.lastDiceRoll) {
      const roll = boardState.lastDiceRoll;
      setRollingAnimation({ active: true, type: roll.type, result: null });

      let hideTimer: ReturnType<typeof setTimeout> | null = null;
      const revealTimer = setTimeout(() => {
        setRollingAnimation({ active: true, type: roll.type, result: roll.result });

        hideTimer = setTimeout(() => {
          setRollingAnimation((prev) => ({ ...prev, active: false }));
        }, 3000);
      }, 1500);

      return () => {
        clearTimeout(revealTimer);
        if (hideTimer) {
          clearTimeout(hideTimer);
        }
      };
    }
  }, [boardState?.lastDiceRoll?.timestamp]);

  const { data: room, isLoading, isError, error } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomDetails(roomId),
    enabled: !isNaN(roomId),
  });

  useEffect(() => {
    if (room && user) {
      // Initialize state with fetched participants
      setParticipants(room.participants);

      // Connect socket
      const socket = connectSocket();

      // Emit join event
      socket.emit("join_room", {
        roomId: room.id.toString(),
        userId: user.id,
        displayName: user.displayName,
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [room, user, setParticipants]);

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!user || !boardState) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const socket = getSocket();
    if (socket) {
      socket.emit("update_token", { x, y });
    }
  };

  const handleRollDice = (type: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("roll_dice", { type });
    }
  };

  const handleGenerateNpc = async () => {
    setNpcError(null);
    try {
      setIsGeneratingNpc(true);
      await generateNPC(roomId, npcTheme);
      setNpcTheme("");
    } catch (error) {
      setNpcError(getApiErrorMessage(error, "Failed to generate NPC."));
    } finally {
      setIsGeneratingNpc(false);
    }
  };

  if (isNaN(roomId)) {
    return <div>Invalid Room ID</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-300">Loading room...</div>;
  }

  if (isError || !room) {
    return (
      <div className="p-8 text-center text-amber-300">
        {getApiErrorMessage(error, "Could not load room. Are you sure you're a participant?")}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{room.name}</h1>
          <p className="text-sm text-muted-foreground">
            Invite Code: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{room.code}</span>
          </p>
        </div>
        <div>
          {isSocketConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-sm font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-sm font-medium text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Connecting...
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main Board Area */}
        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Board</CardTitle>
              <CardDescription>Click anywhere to move your token</CardDescription>
            </div>
            {boardState?.lastAction && (
              <span className="text-xs text-muted-foreground">{boardState.lastAction}</span>
            )}
          </CardHeader>
          <CardContent>
            <div 
              className="relative h-[400px] w-full overflow-hidden rounded-md border border-white/10 bg-black/40 cursor-crosshair"
              onClick={handleBoardClick}
            >
              {/* Render grid lines for aesthetics */}
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {/* Render NPCs */}
              {boardState?.npcs?.map((npc) => (
                <div
                  key={npc.id}
                  className="absolute flex flex-col items-center justify-center transition-all duration-300 ease-out group"
                  style={{
                    left: `${npc.x}px`,
                    top: `${npc.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 text-amber-500">
                    <span className="text-xs font-bold">
                      {npc.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-amber-400 backdrop-blur-sm">
                    {npc.name}
                  </span>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 hidden w-48 flex-col gap-1 rounded border border-white/10 bg-zinc-950 p-2 text-xs shadow-xl group-hover:flex">
                    <p className="font-semibold text-white">{npc.name}</p>
                    <p className="text-muted-foreground">{npc.description}</p>
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>HP: {npc.hp}</span>
                      <span>AC: {npc.ac}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Render player tokens */}
              {boardState && Object.values(boardState.tokens).map((token) => (
                <div
                  key={token.userId}
                  className="absolute flex flex-col items-center justify-center transition-all duration-300 ease-out"
                  style={{
                    left: `${token.x}px`,
                    top: `${token.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: token.userId === user?.id ? 10 : 1
                  }}
                >
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg shadow-black/50"
                    style={{ backgroundColor: token.color }}
                  >
                    <span className="text-xs font-bold text-white">
                      {token.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    {token.displayName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span>{p.displayName}</span>
                    {p.id === room.ownerId && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-400">Host</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Dice Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Roll Dice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'd%'].map(dice => (
                  <Button
                    key={dice}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleRollDice(dice)}
                  >
                    {dice}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI NPCs Panel */}
          <Card>
            <CardHeader>
              <CardTitle>AI NPCs</CardTitle>
              <CardDescription>Generate new characters</CardDescription>
            </CardHeader>
            <CardContent>
              {npcError ? (
                <p className="mb-3 text-xs text-amber-300">{npcError}</p>
              ) : null}
              <div className="flex gap-2">
                <Input
                  placeholder="Theme (e.g. Goblin)"
                  value={npcTheme}
                  onChange={(e) => setNpcTheme(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button 
                  size="sm" 
                  className="h-8 shrink-0" 
                  onClick={handleGenerateNpc}
                  disabled={isGeneratingNpc}
                >
                  {isGeneratingNpc ? '...' : 'Spawn'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dice Rolling Animation Overlay */}
      {rollingAnimation.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-6xl text-primary font-bold transition-all duration-300 ${rollingAnimation.result === null ? 'animate-bounce animate-spin' : 'scale-150 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]'}`}>
              {rollingAnimation.result === null ? rollingAnimation.type : rollingAnimation.result}
            </div>
            <div className="text-xl text-white font-medium">
              {rollingAnimation.result === null ? `Rolling ${rollingAnimation.type}...` : `${boardState?.lastDiceRoll?.displayName} rolled a ${rollingAnimation.type}!`}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
