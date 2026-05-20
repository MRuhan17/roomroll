import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Shield, DoorOpen, Scroll, History, Sparkles, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, fetchRooms, joinRoom } from "@/services/rooms";
import { getApiErrorMessage } from "@/services/api";
import { useRoomStore } from "@/store/roomStore";

export function RoomLobbyPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const setActiveRoomId = useRoomStore((state) => state.setActiveRoomId);

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (room) => {
      setActiveRoomId(room.id);
      setFeedback(`Portal to "${room.name}" ignited successfully.`);
      setCreateName("");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate(`/rooms/${room.id}`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not open gathering chamber.")),
  });

  const joinMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (room) => {
      setActiveRoomId(room.id);
      setFeedback(`Stepped into portal "${room.name}".`);
      setJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate(`/rooms/${room.id}`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not locate gathering chamber.")),
  });

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section with atmospheric details */}
      <div className="relative overflow-hidden rounded-xl border border-tavern-border/30 bg-black/40 p-6 md:p-8">
        <div className="absolute top-0 right-0 p-32 bg-[#ab211f]/5 blur-[80px] rounded-full pointer-events-none" />
        <h1 className="text-4xl font-display font-bold tracking-wide text-[#f5efe2] drop-shadow-sm">The Chamber of Gatherings</h1>
        <p className="mt-2 text-[#cbc3b5]/70 font-serif italic text-lg max-w-2xl leading-relaxed">
          Ignite a magical portal to call your party, or enter a secret invite rune to cross planes and join a companion's meeting hall.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-[#ab211f]/30 bg-[#ab211f]/15 px-4 py-3 text-sm text-[#d5b45d] animate-in fade-in duration-300">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Gathering Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Card className="tavern-card border-tavern-border bg-black/30 hover:bg-black/50 transition-all duration-300 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-16 bg-[#ab211f]/3 blur-[40px] rounded-full pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
                <Plus className="h-6 w-6 text-[#ab211f]" />
                Forge Gathering Room
              </CardTitle>
              <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">
                Open an active portal to coordinate battle maps and real-time dice rolls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!createName.trim()) {
                    setFeedback("Chamber designation is required to ignite the portal.");
                    return;
                  }
                  createMutation.mutate({ name: createName.trim() });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="room-name" className="text-xs uppercase tracking-widest text-[#d5b45d]">Chamber Designation</Label>
                  <Input
                    id="room-name"
                    placeholder="e.g., The Screaming Wyvern Tavern"
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    className="bg-black/40 border-tavern-border text-[#f5efe2] placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#ab211f]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#ab211f] hover:bg-[#8f1917] text-[#f5efe2] font-display uppercase tracking-widest" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Igniting Portal..." : "Ignite Portal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Join Gathering Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Card className="tavern-card border-tavern-border bg-black/30 hover:bg-black/50 transition-all duration-300 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-16 bg-[#d5b45d]/2 blur-[40px] rounded-full pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
                <Search className="h-6 w-6 text-[#d5b45d]" />
                Cross-Plane Portal
              </CardTitle>
              <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">
                Enter the secret invitation rune to materialize inside an existing companion's hall.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!joinCode.trim()) {
                    setFeedback("Invitation rune is required to cross planes.");
                    return;
                  }
                  joinMutation.mutate({ code: joinCode.trim() });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="room-code" className="text-xs uppercase tracking-widest text-[#d5b45d]">Invite Rune</Label>
                  <Input
                    id="room-code"
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    className="font-mono uppercase bg-black/40 border-tavern-border text-[#d5b45d] tracking-widest placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#d5b45d]"
                  />
                </div>
                <Button type="submit" className="w-full bg-transparent border border-[#d5b45d]/40 text-[#d5b45d] hover:bg-[#d5b45d]/10 font-display uppercase tracking-widest" disabled={joinMutation.isPending}>
                  {joinMutation.isPending ? "Connecting..." : "Cross Planes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Visited Gathering Halls Section */}
      <Card className="tavern-card border-tavern-border bg-black/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
            <History className="h-5 w-5 text-[#d5b45d]" />
            Chronicles of Active Chambers
          </CardTitle>
          <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">
            A history of visited halls and active gathering portals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roomsQuery.isLoading ? (
            <p className="text-sm font-serif italic text-[#cbc3b5]/60 animate-pulse">Consulting the wizard scrolls...</p>
          ) : null}
          {roomsQuery.isError ? (
            <p className="text-sm text-[#ab211f] font-serif italic">
              {getApiErrorMessage(roomsQuery.error, "Could not open history archives right now.")}
            </p>
          ) : null}
          {roomsQuery.data && roomsQuery.data.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {roomsQuery.data.map((room) => (
                <li 
                  key={room.id} 
                  className="rounded-lg border border-tavern-border bg-black/40 p-4 cursor-pointer hover:bg-white/5 hover:border-[#d5b45d]/40 transition-all duration-300 flex items-center justify-between group"
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <div className="space-y-1">
                    <p className="text-base font-display font-semibold text-[#f5efe2] group-hover:text-[#d5b45d] transition-colors">{room.name}</p>
                    <p className="text-xs font-mono text-[#cbc3b5]/50 tracking-wider">Rune: {room.code}</p>
                  </div>
                  <DoorOpen className="h-5 w-5 text-[#cbc3b5]/40 group-hover:text-[#d5b45d] transition-colors" />
                </li>
              ))}
            </ul>
          ) : null}
          {roomsQuery.data && roomsQuery.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Scroll className="h-10 w-10 text-[#cbc3b5]/30 mb-4" />
              <p className="text-base font-serif italic text-[#cbc3b5]/60">
                No secret chambers have yet been unlocked. Ignite a portal above to call your companions.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
