import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, fetchRooms, joinRoom } from "@/services/rooms";
import { getApiErrorMessage } from "@/services/api";
import { useRoomStore } from "@/store/roomStore";

export function RoomLobbyPage() {
  const queryClient = useQueryClient();
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
      setFeedback(`Room "${room.name}" created.`);
      setCreateName("");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not create room.")),
  });

  const joinMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (room) => {
      setActiveRoomId(room.id);
      setFeedback(`Joined room "${room.name}".`);
      setJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not join room.")),
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Room Lobby</h1>
        <p className="text-sm text-muted-foreground">
          Create a room or join an existing one with an invite code.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Room</CardTitle>
            <CardDescription>Start a new session and invite players.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!createName.trim()) {
                  setFeedback("Room name is required.");
                  return;
                }
                createMutation.mutate({ name: createName.trim() });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="room-name">Room name</Label>
                <Input
                  id="room-name"
                  placeholder="Friday Campaign"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create room"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Room</CardTitle>
            <CardDescription>Enter a code from your game host.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!joinCode.trim()) {
                  setFeedback("Invite code is required.");
                  return;
                }
                joinMutation.mutate({ code: joinCode.trim() });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="room-code">Invite code</Label>
                <Input
                  id="room-code"
                  placeholder="ABCD12"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={joinMutation.isPending}>
                {joinMutation.isPending ? "Joining..." : "Join room"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Rooms</CardTitle>
          <CardDescription>Fetched from backend rooms API.</CardDescription>
        </CardHeader>
        <CardContent>
          {roomsQuery.isLoading ? <p className="text-sm text-slate-300">Loading rooms...</p> : null}
          {roomsQuery.isError ? (
            <p className="text-sm text-amber-200">
              Rooms endpoint is not available yet. UI is ready and will populate once backend `B-003` is live.
            </p>
          ) : null}
          {roomsQuery.data && roomsQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {roomsQuery.data.map((room) => (
                <li key={room.id} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm font-medium">{room.name}</p>
                  <p className="text-xs text-slate-400">Code: {room.code}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {roomsQuery.data && roomsQuery.data.length === 0 ? (
            <p className="text-sm text-slate-300">No rooms yet. Create one to get started.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
