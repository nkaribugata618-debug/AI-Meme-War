"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useMemeStore, CaptionStyle } from "@/store/useMemeStore";
import { debounce } from "lodash";
import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("./Canvas"), { 
  ssr: false, 
  loading: () => <div className="text-slate-500 animate-pulse">Loading Studio...</div> 
});
import Controls from "./Controls";
import AIControls from "./AIControls";
import { Button } from "@/components/ui/button";
import { Save, Undo, Redo, CheckCircle } from "lucide-react";

interface MemeStudioProps {
  roundId: string;
  roundPrompt: string;
  isLocked: boolean;
}

export default function MemeStudio({ roundId, roundPrompt, isLocked }: MemeStudioProps) {
  const {
    image,
    captions,
    historyIndex,
    history,
    undo,
    redo,
    isSaving,
    lastSavedAt,
    setSaving,
    setLastSavedAt,
  } = useMemeStore();

  const handleSave = useCallback(
    async (currentImage: string | null, currentCaptions: CaptionStyle[]) => {
      if (isLocked) return;
      setSaving(true);
      try {
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SAVE_DRAFT",
            roundId,
            imageUrl: currentImage,
            state: { captions: currentCaptions },
          }),
        });
        setLastSavedAt(new Date());
      } catch {
        console.error("Autosave failed");
      } finally {
        setSaving(false);
      }
    },
    [roundId, isLocked, setLastSavedAt, setSaving]
  );

  const debouncedSave = useMemo(() => debounce(handleSave, 3000), [handleSave]);

  useEffect(() => {
    // Trigger debounced save whenever image or captions change
    if (!isLocked && (image || captions.length > 0)) {
      debouncedSave(image, captions);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [image, captions, debouncedSave, isLocked]);

  const handleFinalSubmit = async () => {
    if (confirm("Are you sure you want to lock in your final submission? You cannot edit this afterwards.")) {
      setSaving(true);
      try {
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "FINAL_SUBMIT",
            roundId,
            imageUrl: image,
            state: { captions },
          }),
        });
        alert("Submission locked successfully!");
      } catch {
        alert("Failed to submit");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-h-[800px]">
      <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
        <AIControls prompt={roundPrompt} />
      </div>

      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex === 0 || isLocked}>
              <Undo className="w-4 h-4 mr-2" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex === history.length - 1 || isLocked}>
              <Redo className="w-4 h-4 mr-2" /> Redo
            </Button>
          </div>
          <div className="text-sm text-slate-400 flex items-center gap-2">
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : lastSavedAt ? (
              <><Save className="w-4 h-4 text-green-400" /> Saved just now</>
            ) : (
              "Unsaved"
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-black/50 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center">
          <Canvas isLocked={isLocked} />
        </div>
        
        <Button 
          className="w-full py-6 text-lg bg-green-600 hover:bg-green-700" 
          disabled={isLocked || !image}
          onClick={handleFinalSubmit}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Final Submit
        </Button>
      </div>

      <div className="lg:col-span-3 overflow-y-auto pr-2">
        <Controls isLocked={isLocked} />
      </div>
    </div>
  );
}
