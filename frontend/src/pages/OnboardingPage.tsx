import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Sparkles, Sword, BookOpen, Shield } from "lucide-react";
import { Reveal, AmbientBackdrop, SurfaceCard, Embers } from "@/components/landing/LandingPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign, joinCampaign } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<"choice" | "create" | "join">("choice");
  const [createName, setCreateName] = useState("");
  const [createWorld, setCreateWorld] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; worldType: string }) =>
      createCampaign(data.name, "", data.worldType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      navigate(`/campaigns/${data.campaign.id}/setup`);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Could not forge world.")),
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCampaign(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      navigate(`/campaigns`);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Could not find campaign.")),
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-[#f5efe2] flex flex-col items-center justify-center p-6">
      <AmbientBackdrop />
      <Embers />

      <div className="relative z-10 w-full max-w-2xl">
        {step === "choice" && (
          <div className="text-center space-y-12">
            <Reveal>
              <div className="flex justify-center mb-6">
                <Sparkles className="h-12 w-12 text-[#d5b45d] animate-pulse" />
              </div>
              <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight text-[#f6f2e8]">
                Welcome, <span className="text-[#d5b45d]">{user?.displayName || "Traveler"}</span>
              </h1>
              <p className="mt-6 text-xl text-[#d6d1c8]/80 max-w-lg mx-auto leading-relaxed">
                Your journey begins here. How will you enter the realm?
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2">
              <Reveal delay={0.1}>
                <SurfaceCard 
                  className="p-8 group cursor-pointer hover:border-[#d5b45d]/50 transition-all duration-500 hover:-translate-y-1"
                  onClick={() => setStep("create")}
                >
                  <Plus className="h-8 w-8 text-[#d5b45d] mb-6 group-hover:scale-110 transition-transform" />
                  <h2 className="font-display text-2xl uppercase text-[#f4ecdd]">Forge a World</h2>
                  <p className="mt-4 text-[#cbc3b5]/70 leading-relaxed">
                    Become the Architect. Lead your own campaigns as a Dungeon Master.
                  </p>
                </SurfaceCard>
              </Reveal>

              <Reveal delay={0.2}>
                <SurfaceCard 
                  className="p-8 group cursor-pointer hover:border-[#87a8ff]/50 transition-all duration-500 hover:-translate-y-1"
                  onClick={() => setStep("join")}
                >
                  <Search className="h-8 w-8 text-[#87a8ff] mb-6 group-hover:scale-110 transition-transform" />
                  <h2 className="font-display text-2xl uppercase text-[#f4ecdd]">Join a Party</h2>
                  <p className="mt-4 text-[#cbc3b5]/70 leading-relaxed">
                    Step into an existing story. Enter a secret invite code to begin.
                  </p>
                </SurfaceCard>
              </Reveal>
            </div>
            
            <Reveal delay={0.3}>
                <button 
                    onClick={() => navigate('/campaigns')}
                    className="text-[0.7rem] uppercase tracking-[0.4em] text-[#8e8778] hover:text-[#f4efe3] transition-colors"
                >
                    Or explore the dashboard first
                </button>
            </Reveal>
          </div>
        )}

        {step === "create" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
              <Shield className="h-10 w-10 text-[#d5b45d] mx-auto mb-4" />
              <h2 className="font-display text-4xl uppercase text-[#f6f2e8]">World Smithing</h2>
              <p className="text-[#d6d1c8]/70 mt-2">Define the foundations of your new realm.</p>
            </div>

            <SurfaceCard className="p-8">
              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (createName) createMutation.mutate({ name: createName, worldType: createWorld });
                }}
              >
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Campaign Title</Label>
                  <Input 
                    placeholder="e.g. The Obsidian Spire" 
                    className="bg-black/40 border-tavern-border h-12 text-lg focus:border-[#d5b45d]/50 transition-colors"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">World Setting</Label>
                  <Input 
                    placeholder="e.g. Grimdark Fantasy, Cosmic Horror" 
                    className="bg-black/40 border-tavern-border h-12 focus:border-[#d5b45d]/50 transition-colors"
                    value={createWorld}
                    onChange={(e) => setCreateWorld(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="pt-4 flex flex-col gap-4">
                  <Button 
                    type="submit" 
                    className="h-14 bg-[linear-gradient(180deg,_#ab211f,_#7d1011)] hover:opacity-90 text-white font-display uppercase tracking-widest text-lg"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Forging..." : "Forge World"}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setStep("choice")}
                    className="text-[10px] uppercase tracking-[0.3em] text-[#8e8778] hover:text-white"
                  >
                    Back to Choices
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </motion.div>
        )}

        {step === "join" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
              <Sword className="h-10 w-10 text-[#87a8ff] mx-auto mb-4" />
              <h2 className="font-display text-4xl uppercase text-[#f6f2e8]">Seek a Party</h2>
              <p className="text-[#d6d1c8]/70 mt-2">Enter the secret sigil to join a campaign.</p>
            </div>

            <SurfaceCard className="p-8">
              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCode) joinMutation.mutate(joinCode);
                }}
              >
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-[#87a8ff]">Invite Code</Label>
                  <Input 
                    placeholder="e.g. OBSIDIAN-GATE" 
                    className="bg-black/40 border-tavern-border h-14 text-center text-2xl font-mono uppercase tracking-widest focus:border-[#87a8ff]/50 transition-colors"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="pt-4 flex flex-col gap-4">
                  <Button 
                    type="submit" 
                    className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-display uppercase tracking-widest text-lg"
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Seeking..." : "Join Campaign"}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setStep("choice")}
                    className="text-[10px] uppercase tracking-[0.3em] text-[#8e8778] hover:text-white"
                  >
                    Back to Choices
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
