import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { updateCampaign, createMap, createLore, createFaction } from "@/services/campaigns";

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

    try {
      const cid = parseInt(campaignId);
      
      // Update basic details
      if (description || worldType) {
        await updateCampaign(cid, description, worldType);
      }

      // Upload Map if provided
      if (imageBase64 && mapName) {
        await createMap(cid, mapName, imageBase64, true, 50);
      }

      // Create lore if provided
      if (loreTitle && loreContent) {
        await createLore(cid, loreTitle, "General", loreContent);
      }

      // Create faction if provided
      if (factionName && factionDesc) {
        await createFaction(cid, factionName, factionDesc);
      }

      navigate(`/campaign/${cid}`); // Go to session
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to setup campaign. Make sure you are the DM.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 pt-20">
      <div className="max-w-3xl mx-auto space-y-12">
        <header>
          <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter mb-2">Campaign Setup</h1>
          <p className="text-neutral-400">Initialize your world before the session begins.</p>
        </header>

        {error && <div className="p-4 bg-red-900/50 text-red-200 border border-red-800 rounded">{error}</div>}

        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-300">World & Lore</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold uppercase tracking-widest text-neutral-500">World Type</label>
            <input
              type="text"
              value={worldType}
              onChange={(e) => setWorldType(e.target.value)}
              className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              placeholder="e.g., Dark Fantasy, Sci-Fi"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold uppercase tracking-widest text-neutral-500">Campaign Description & Rules</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all min-h-[120px]"
              placeholder="Describe the tone, custom rules, or initial background story..."
            />
          </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-neutral-800">
          <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-300">Initial Map</h2>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold uppercase tracking-widest text-neutral-500">Map Name</label>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              placeholder="e.g., The Prancing Pony"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold uppercase tracking-widest text-neutral-500">Upload Map Image</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors uppercase tracking-widest text-xs font-bold"
              >
                Choose File
              </button>
              <span className="text-neutral-400 text-sm">{imageBase64 ? "Image selected" : "No file chosen"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {imageBase64 && (
              <div className="mt-4 aspect-video bg-neutral-800 rounded overflow-hidden relative">
                <img src={imageBase64} alt="Map preview" className="w-full h-full object-cover opacity-50" />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-neutral-800">
          <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-300">Quick Entities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-400">Add Lore Entry</h3>
              <input
                type="text"
                placeholder="Title"
                value={loreTitle}
                onChange={(e) => setLoreTitle(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              />
              <textarea
                placeholder="Content"
                value={loreContent}
                onChange={(e) => setLoreContent(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-400">Add Faction</h3>
              <input
                type="text"
                placeholder="Faction Name"
                value={factionName}
                onChange={(e) => setFactionName(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              />
              <textarea
                placeholder="Description"
                value={factionDesc}
                onChange={(e) => setFactionDesc(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded p-3 text-[#f5efe2] focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>
          </div>
        </section>

        <div className="pt-8 border-t border-neutral-800 flex justify-end space-x-4">
          <button
            onClick={() => navigate(`/campaign/${campaignId}`)}
            className="px-6 py-3 bg-transparent text-neutral-400 hover:text-[#f5efe2] uppercase tracking-widest text-sm font-bold transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSaveSetup}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-[#f5efe2] uppercase tracking-widest text-sm font-bold rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Initializing..." : "Complete Setup & Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}
