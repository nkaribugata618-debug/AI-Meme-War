"use client";

import { useState } from "react";
import { useMemeStore } from "@/store/useMemeStore";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Upload, MessageSquare } from "lucide-react";
import imageCompression from "browser-image-compression";

export default function AIControls({ prompt }: { prompt: string }) {
  const { setImage, addCaption, isGenerating, setGenerating } = useMemeStore();
  
  const [ideas, setIdeas] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageError, setImageError] = useState("");

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) setIdeas(data.ideas);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCaptions = async (context: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = await res.json();
      if (data.success) setCaptions(data.captions);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setImageError("");
    if (!imagePrompt) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: "1:1" }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setImage(data.imageUrl);
      } else {
        if (data.code === "IMAGE_GEN_UNAVAILABLE") {
          setImageError("Image generation is currently unavailable with your standard API key. Please use the upload feature below.");
        } else {
          setImageError(data.error || "Failed to generate image.");
        }
      }
    } catch {
      setImageError("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.onload = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error("Compression error:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Gen Section */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-pink-500" /> AI Image Generation
        </h3>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="Describe the meme image..."
          className="w-full bg-slate-800 rounded p-2 text-white outline-none"
          rows={3}
        />
        <Button 
          onClick={handleGenerateImage} 
          disabled={isGenerating || !imagePrompt} 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isGenerating ? "Generating..." : "Generate Image Variations"}
        </Button>
        
        {imageError && (
          <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-lg text-sm text-red-200">
            {imageError}
          </div>
        )}

        <div className="relative">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="upload-image" 
            onChange={handleUpload}
          />
          <label 
            htmlFor="upload-image" 
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer text-sm text-slate-300 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload Custom Image
          </label>
        </div>
      </div>

      {/* Ideas Section */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> AI Meme Ideas
          </h3>
          <Button variant="outline" size="sm" onClick={handleGenerateIdeas} disabled={isGenerating}>
            Generate (3)
          </Button>
        </div>
        
        {ideas.length > 0 && (
          <div className="space-y-2">
            {ideas.map((idea, idx) => (
              <div key={idx} className="bg-slate-800 p-3 rounded-lg flex flex-col gap-2">
                <p className="text-sm text-slate-300">{idea}</p>
                <Button variant="outline" size="sm" onClick={() => handleGenerateCaptions(idea)} disabled={isGenerating}>
                  <MessageSquare className="w-3 h-3 mr-2" /> Get Captions
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Captions Section */}
      {captions.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" /> Suggested Captions
          </h3>
          <div className="space-y-2">
            {captions.map((cap, idx) => (
              <button
                key={idx}
                onClick={() => addCaption({ text: cap })}
                className="w-full text-left bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {cap}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
