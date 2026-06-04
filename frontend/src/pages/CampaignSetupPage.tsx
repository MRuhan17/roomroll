import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decodeCampaignId, encodeCampaignId } from "@/lib/campaignId";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Map, 
  BookOpen, 
  Swords, 
  FileText, 
  ArrowRight,
  Compass, 
  Sparkles, 
  Upload,
  ArrowLeft
} from "lucide-react";
import { AmbientBackdrop, SurfaceCard, Embers } from "@/components/landing/LandingPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCampaign, createMap, createLore, createFaction } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { login } from "@/services/auth";

export default function CampaignSetupPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [worldType, setWorldType] = useState("fantasy");
  const [mapName, setMapName] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loreTitle, setLoreTitle] = useState("");
  const [loreContent, setLoreContent] = useState("");
  const [factionName, setFactionName] = useState("");
  const [factionDesc, setFactionDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progressive forging steps
  const [forgeSteps, setForgeSteps] = useState<Record<string, 'pending' | 'saving' | 'success' | 'failed'>>({
    foundations: 'pending',
    map: 'pending',
    lore: 'pending',
    faction: 'pending'
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string | null>>({
    foundations: null,
    map: null,
    lore: null,
    faction: null
  });

  // Reforge session states
  const [showReforgeModal, setShowReforgeModal] = useState(false);
  const [reforgePassword, setReforgePassword] = useState("");
  const [reforgeError, setReforgeError] = useState<string | null>(null);
  const [isReforging, setIsReforging] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSetup = async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    const cid = decodeCampaignId(campaignId);

    try {
      // Step 1: Foundations
      if (description || worldType) {
        if (forgeSteps.foundations !== 'success') {
          setForgeSteps(prev => ({ ...prev, foundations: 'saving' }));
          setStepErrors(prev => ({ ...prev, foundations: null }));
          try {
            await updateCampaign(cid, description, worldType);
            setForgeSteps(prev => ({ ...prev, foundations: 'success' }));
          } catch (err: any) {
            const msg = getApiErrorMessage(err, "Failed to update foundations.");
            setForgeSteps(prev => ({ ...prev, foundations: 'failed' }));
            setStepErrors(prev => ({ ...prev, foundations: msg }));
            throw err;
          }
        }
      } else {
        setForgeSteps(prev => ({ ...prev, foundations: 'success' }));
      }

      // Step 2: Cartography Map Scroll
      if (imageBase64 && mapName) {
        if (forgeSteps.map !== 'success') {
          setForgeSteps(prev => ({ ...prev, map: 'saving' }));
          setStepErrors(prev => ({ ...prev, map: null }));
          try {
            await createMap(cid, mapName, imageBase64, true, 50);
            setForgeSteps(prev => ({ ...prev, map: 'success' }));
          } catch (err: any) {
            const msg = getApiErrorMessage(err, "Failed to upload map scroll.");
            setForgeSteps(prev => ({ ...prev, map: 'failed' }));
            setStepErrors(prev => ({ ...prev, map: msg }));
            throw err;
          }
        }
      } else {
        setForgeSteps(prev => ({ ...prev, map: 'success' }));
      }

      // Step 3: Primary Lore Chronicle
      if (loreTitle && loreContent) {
        if (forgeSteps.lore !== 'success') {
          setForgeSteps(prev => ({ ...prev, lore: 'saving' }));
          setStepErrors(prev => ({ ...prev, lore: null }));
          try {
            await createLore(cid, loreTitle, "General", loreContent);
            setForgeSteps(prev => ({ ...prev, lore: 'success' }));
          } catch (err: any) {
            const msg = getApiErrorMessage(err, "Failed to record lore chronicle.");
            setForgeSteps(prev => ({ ...prev, lore: 'failed' }));
            setStepErrors(prev => ({ ...prev, lore: msg }));
            throw err;
          }
        }
      } else {
        setForgeSteps(prev => ({ ...prev, lore: 'success' }));
      }

      // Step 4: Ruling Alliance Factions
      if (factionName && factionDesc) {
        if (forgeSteps.faction !== 'success') {
          setForgeSteps(prev => ({ ...prev, faction: 'saving' }));
          setStepErrors(prev => ({ ...prev, faction: null }));
          try {
            await createFaction(cid, factionName, factionDesc);
            setForgeSteps(prev => ({ ...prev, faction: 'success' }));
          } catch (err: any) {
            const msg = getApiErrorMessage(err, "Failed to establish alliance factions.");
            setForgeSteps(prev => ({ ...prev, faction: 'failed' }));
            setStepErrors(prev => ({ ...prev, faction: msg }));
            throw err;
          }
        }
      } else {
        setForgeSteps(prev => ({ ...prev, faction: 'success' }));
      }

      navigate(`/rooms/${encodeCampaignId(cid)}`); // Go to session dashboard
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Failed to setup campaign.");
      if (msg.toLowerCase().includes("invalid or expired token") || msg.toLowerCase().includes("unauthorized")) {
        setError("Your connection to the world archive has faded. Whisper your password to re-forge the connection and save your configurations.");
        setShowReforgeModal(true);
      } else {
        setError("Chronicle Forging was interrupted. Please review the highlighted stage errors below and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReforgeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !reforgePassword) return;
    setIsReforging(true);
    setReforgeError(null);
    try {
      const response = await login({ email: user.email, password: reforgePassword });
      setAuth(response.user, response.token);
      setShowReforgeModal(false);
      setReforgePassword("");
      setError(null);
      
      // Retry campaign setup automatically!
      await handleSaveSetup();
    } catch (err) {
      setReforgeError(getApiErrorMessage(err, "Verification failed. Try again."));
    } finally {
      setIsReforging(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070503] text-[#f4efe3] overflow-x-hidden font-sans">
      <AmbientBackdrop />
      <Embers />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 md:py-32 space-y-10">
        
        {/* Cinematic Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d5b45d]/10 border border-[#d5b45d]/20 text-[#d5b45d] text-[10px] tracking-[0.2em] font-display uppercase">
            <Compass className="h-3.5 w-3.5 animate-spin-slow" /> Chronicle Forging
          </div>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-widest text-[#f4efe3] [text-shadow:0_0_30px_rgba(255,255,255,0.1)]">
            World Archetype Setup
          </h1>
          <p className="text-sm text-[#cbc3b5]/70 italic leading-relaxed">
            "Before the legends unfold, etch the foundational lore, ancient cartography, and primary factions into the history stone."
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#ab211f]/10 border border-[#ab211f]/30 text-[#f4efe3] rounded-lg text-xs leading-relaxed text-center font-display uppercase tracking-wider animate-pulse animate-duration-1000"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Section 1: World & Lore */}
          <SurfaceCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#211d15] pb-4">
              <BookOpen className="h-5 w-5 text-[#d5b45d]" />
              <h2 className="font-display text-lg uppercase tracking-wider text-[#f4efe3]">World & Foundations</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">World Type / Genre</Label>
                <Input
                  type="text"
                  value={worldType}
                  onChange={(e) => setWorldType(e.target.value)}
                  className="bg-black/60 border-[#211d15] h-11 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                  placeholder="e.g. Dark Fantasy, Cyberpunk"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">World Summary & Rules</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-[#211d15] rounded-md p-3 text-xs text-[#f4efe3] focus:border-[#d5b45d]/30 transition-all min-h-[44px] focus:ring-0 resize-none font-sans"
                  placeholder="Describe the initial background story, cultural traits, or custom world rules..."
                />
              </div>
            </div>
          </SurfaceCard>

          {/* Section 2: Cartography */}
          <SurfaceCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#211d15] pb-4">
              <Map className="h-5 w-5 text-[#d5b45d]" />
              <h2 className="font-display text-lg uppercase tracking-wider text-[#f4efe3]">Ancient Cartography</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Map Title</Label>
                  <Input
                    type="text"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    className="bg-black/60 border-[#211d15] h-11 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                    placeholder="e.g. Map of Eldoria"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Upload Map Scroll</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 px-4 border border-[#211d15] hover:border-[#cbc3b5]/30 bg-black/60 text-[#cbc3b5] hover:text-white font-display uppercase tracking-wider text-xs flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4 text-[#d5b45d]" /> Browse Map
                    </Button>
                    <span className="text-[10px] text-[#cbc3b5]/60 italic">
                      {imageBase64 ? "Scroll Selected" : "No scroll chosen"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center border border-[#211d15] bg-black/40 rounded-lg p-2 min-h-[140px] relative overflow-hidden">
                {imageBase64 ? (
                  <img src={imageBase64} alt="Map preview" className="max-h-[140px] w-full object-cover rounded opacity-80" />
                ) : (
                  <div className="text-center p-4">
                    <Compass className="h-8 w-8 text-[#cbc3b5]/20 mx-auto mb-2" />
                    <span className="text-[10px] text-[#cbc3b5]/40 uppercase tracking-widest block">No Map Uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </SurfaceCard>

          {/* Section 3: Chronicles & Factions */}
          <SurfaceCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#211d15] pb-4">
              <Swords className="h-5 w-5 text-[#d5b45d]" />
              <h2 className="font-display text-lg uppercase tracking-wider text-[#f4efe3]">Chronicles & Power Entities</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lore */}
              <div className="space-y-4 p-4 rounded-lg bg-black/30 border border-[#211d15]">
                <h3 className="font-display text-sm uppercase tracking-widest text-[#d5b45d] border-b border-[#211d15] pb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Primary Chronicle Lore
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] uppercase tracking-[0.2em] text-[#cbc3b5]">Lore Title</Label>
                    <Input
                      placeholder="e.g. The Cataclysm of Stars"
                      value={loreTitle}
                      onChange={(e) => setLoreTitle(e.target.value)}
                      className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] uppercase tracking-[0.2em] text-[#cbc3b5]">Historical Content</Label>
                    <textarea
                      placeholder="Etch the historical facts and legend details..."
                      value={loreContent}
                      onChange={(e) => setLoreContent(e.target.value)}
                      className="w-full bg-black/60 border border-[#211d15] rounded-md p-3 text-xs text-[#f4efe3] focus:border-[#d5b45d]/30 transition-all min-h-[90px] focus:ring-0 resize-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Factions */}
              <div className="space-y-4 p-4 rounded-lg bg-black/30 border border-[#211d15]">
                <h3 className="font-display text-sm uppercase tracking-widest text-[#d5b45d] border-b border-[#211d15] pb-2 flex items-center gap-2">
                  <Swords className="h-4 w-4" /> Ruling Faction / Alliance
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] uppercase tracking-[0.2em] text-[#cbc3b5]">Faction Name</Label>
                    <Input
                      placeholder="e.g. The Obsidian Order"
                      value={factionName}
                      onChange={(e) => setFactionName(e.target.value)}
                      className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] uppercase tracking-[0.2em] text-[#cbc3b5]">Faction Purpose & Allegiance</Label>
                    <textarea
                      placeholder="Describe their sigil, ruling territory, and goals..."
                      value={factionDesc}
                      onChange={(e) => setFactionDesc(e.target.value)}
                      className="w-full bg-black/60 border border-[#211d15] rounded-md p-3 text-xs text-[#f4efe3] focus:border-[#d5b45d]/30 transition-all min-h-[90px] focus:ring-0 resize-none font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Real-time Progressive Forging Log */}
        {(loading || Object.values(forgeSteps).some(s => s !== 'pending')) && (
          <SurfaceCard className="p-6 border-[#d5b45d]/20 bg-black/40 space-y-4">
            <h3 className="font-display text-xs uppercase tracking-widest text-[#d5b45d] flex items-center gap-2 border-b border-[#211d15] pb-2">
              <Compass className="h-4 w-4 animate-spin-slow text-[#d5b45d]" /> Chronicle Forging Logs
            </h3>
            <div className="grid gap-3 text-xs">
              {/* Foundations Step */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded bg-black/30 border border-[#211d15] gap-2">
                <div className="space-y-1">
                  <div className="font-display uppercase tracking-wider flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${forgeSteps.foundations === 'success' ? 'bg-green-400' : forgeSteps.foundations === 'failed' ? 'bg-red-400' : 'bg-[#d5b45d]'}`} />
                    World Foundations
                  </div>
                  {stepErrors.foundations && (
                    <p className="text-[10px] text-red-400 font-sans pl-3.5 leading-relaxed">{stepErrors.foundations}</p>
                  )}
                </div>
                <span className={`text-[10px] uppercase font-display tracking-widest px-2.5 py-0.5 rounded self-start sm:self-center ${
                  forgeSteps.foundations === 'success' ? 'bg-green-500/10 text-green-400' :
                  forgeSteps.foundations === 'failed' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                  forgeSteps.foundations === 'saving' ? 'bg-[#d5b45d]/10 text-[#d5b45d] animate-pulse' : 'text-neutral-500 bg-neutral-900/40'
                }`}>
                  {forgeSteps.foundations}
                </span>
              </div>

              {/* Map Step */}
              {(imageBase64 && mapName) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded bg-black/30 border border-[#211d15] gap-2">
                  <div className="space-y-1">
                    <div className="font-display uppercase tracking-wider flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${forgeSteps.map === 'success' ? 'bg-green-400' : forgeSteps.map === 'failed' ? 'bg-red-400' : 'bg-[#d5b45d]'}`} />
                      Ancient Cartography Map
                    </div>
                    {stepErrors.map && (
                      <p className="text-[10px] text-red-400 font-sans pl-3.5 leading-relaxed">{stepErrors.map}</p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-display tracking-widest px-2.5 py-0.5 rounded self-start sm:self-center ${
                    forgeSteps.map === 'success' ? 'bg-green-500/10 text-green-400' :
                    forgeSteps.map === 'failed' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                    forgeSteps.map === 'saving' ? 'bg-[#d5b45d]/10 text-[#d5b45d] animate-pulse' : 'text-neutral-500 bg-neutral-900/40'
                  }`}>
                    {forgeSteps.map}
                  </span>
                </div>
              )}

              {/* Lore Step */}
              {(loreTitle && loreContent) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded bg-black/30 border border-[#211d15] gap-2">
                  <div className="space-y-1">
                    <div className="font-display uppercase tracking-wider flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${forgeSteps.lore === 'success' ? 'bg-green-400' : forgeSteps.lore === 'failed' ? 'bg-red-400' : 'bg-[#d5b45d]'}`} />
                      Primary History Lore
                    </div>
                    {stepErrors.lore && (
                      <p className="text-[10px] text-red-400 font-sans pl-3.5 leading-relaxed">{stepErrors.lore}</p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-display tracking-widest px-2.5 py-0.5 rounded self-start sm:self-center ${
                    forgeSteps.lore === 'success' ? 'bg-green-500/10 text-green-400' :
                    forgeSteps.lore === 'failed' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                    forgeSteps.lore === 'saving' ? 'bg-[#d5b45d]/10 text-[#d5b45d] animate-pulse' : 'text-neutral-500 bg-neutral-900/40'
                  }`}>
                    {forgeSteps.lore}
                  </span>
                </div>
              )}

              {/* Factions Step */}
              {(factionName && factionDesc) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded bg-black/30 border border-[#211d15] gap-2">
                  <div className="space-y-1">
                    <div className="font-display uppercase tracking-wider flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${forgeSteps.faction === 'success' ? 'bg-green-400' : forgeSteps.faction === 'failed' ? 'bg-red-400' : 'bg-[#d5b45d]'}`} />
                      Ruling Faction Alliance
                    </div>
                    {stepErrors.faction && (
                      <p className="text-[10px] text-red-400 font-sans pl-3.5 leading-relaxed">{stepErrors.faction}</p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-display tracking-widest px-2.5 py-0.5 rounded self-start sm:self-center ${
                    forgeSteps.faction === 'success' ? 'bg-green-500/10 text-green-400' :
                    forgeSteps.faction === 'failed' ? 'bg-red-500/10 text-red-400 animate-pulse' :
                    forgeSteps.faction === 'saving' ? 'bg-[#d5b45d]/10 text-[#d5b45d] animate-pulse' : 'text-neutral-500 bg-neutral-900/40'
                  }`}>
                    {forgeSteps.faction}
                  </span>
                </div>
              )}
            </div>
          </SurfaceCard>
        )}

        {/* Buttons */}
        <div className="pt-6 border-t border-[#211d15] flex flex-col sm:flex-row justify-end gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/campaigns`)}
            className="h-12 px-6 border border-transparent hover:border-[#211d15] hover:bg-white/5 text-[#cbc3b5] hover:text-white font-display uppercase tracking-wider text-xs"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSaveSetup}
            disabled={loading}
            className="h-12 px-8 bg-[linear-gradient(180deg,_#d5b45d,_#a28135)] hover:opacity-90 text-black font-display uppercase tracking-widest text-xs font-bold shadow-[0_0_20px_rgba(213,180,93,0.15)] flex items-center justify-center gap-2"
          >
            {loading ? "Etching Details..." : <>Complete Setup & Launch <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>

        {/* Immersive Reforge Session Modal */}
        {showReforgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-labelledby="loading-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md border border-[#d5b45d]/30 bg-[#0a0806]/95 p-8 rounded-lg shadow-[0_0_50px_rgba(213,180,93,0.15)] space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                  <ShieldAlert className="h-10 w-10 text-[#ab211f] animate-pulse" />
                </div>
                <h3 className="font-display text-2xl uppercase tracking-widest text-[#f4efe3]">
                  Connection Severed
                </h3>
                <p className="text-[10px] text-[#cbc3b5]/70 italic leading-relaxed">
                  "Your link to the world archive has faded. Whisper your password to re-forge the connection and save your configurations."
                </p>
              </div>

              <form onSubmit={handleReforgeSession} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Active Traveler</Label>
                  <div className="p-3 bg-black/40 border border-[#2d281e] rounded-lg text-xs text-[#cbc3b5] font-mono select-none overflow-hidden text-ellipsis">
                    {user?.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Verify Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="Enter password..."
                    className="bg-black/60 border-[#2d281e] h-12 focus:border-[#d5b45d]/50 focus:ring-1 focus:ring-[#d5b45d]/20 text-[#f4efe3]"
                    value={reforgePassword}
                    onChange={(e) => setReforgePassword(e.target.value)}
                  />
                </div>

                {reforgeError && (
                  <p className="text-red-400 text-[10px] text-center font-display uppercase tracking-wider">
                    {reforgeError}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-12 bg-[linear-gradient(180deg,_#d5b45d,_#a28135)] hover:opacity-90 text-black font-display uppercase tracking-wider text-xs font-semibold"
                    disabled={isReforging}
                  >
                    {isReforging ? "Reforging..." : "Reforge Connection"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReforgeModal(false);
                      setReforgePassword("");
                      setReforgeError(null);
                    }}
                    className="text-[9px] uppercase tracking-[0.2em] text-[#cbc3b5]/40 hover:text-white transition-colors py-2"
                  >
                    Keep Offline Config
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
