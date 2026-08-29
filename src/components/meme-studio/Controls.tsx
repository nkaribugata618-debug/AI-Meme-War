"use client";

import { useMemeStore, CaptionStyle } from "@/store/useMemeStore";
import { Button } from "@/components/ui/button";
import { Trash2, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export default function Controls({ isLocked }: { isLocked: boolean }) {
  const { captions, selectedCaptionId, updateCaption, addCaption, removeCaption, saveHistory } = useMemeStore();

  const selected = captions.find(c => c.id === selectedCaptionId);

  if (isLocked) {
    return <div className="p-4 text-center text-slate-500">Editing is locked.</div>;
  }

  const handleUpdate = (updates: Partial<CaptionStyle>) => {
    if (selected) {
      updateCaption(selected.id, updates);
    }
  };

  const handleBlur = () => {
    saveHistory(); // Save history when user finishes typing/sliding
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-6">
      <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => addCaption()}>
        <Type className="w-4 h-4 mr-2" /> Add Text
      </Button>

      {selected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Text</label>
            <textarea
              value={selected.text}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              onBlur={handleBlur}
              className="w-full bg-slate-800 rounded p-2 text-white outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Font Size: {selected.fontSize}px</label>
              <input 
                type="range" min="10" max="120" 
                value={selected.fontSize} 
                onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })} 
                onMouseUp={handleBlur}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rotation: {selected.rotation}°</label>
              <input 
                type="range" min="-180" max="180" 
                value={selected.rotation} 
                onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })} 
                onMouseUp={handleBlur}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Width: {selected.width}px</label>
              <input 
                type="range" min="50" max="800" 
                value={selected.width} 
                onChange={(e) => handleUpdate({ width: Number(e.target.value) })} 
                onMouseUp={handleBlur}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Outline Width: {selected.outlineWidth}px</label>
              <input 
                type="range" min="0" max="10" 
                value={selected.outlineWidth} 
                onChange={(e) => handleUpdate({ outlineWidth: Number(e.target.value) })} 
                onMouseUp={handleBlur}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Text Color</label>
              <input 
                type="color" 
                value={selected.color} 
                onChange={(e) => handleUpdate({ color: e.target.value })}
                onBlur={handleBlur}
                className="w-full h-8 cursor-pointer rounded bg-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Outline Color</label>
              <input 
                type="color" 
                value={selected.outlineColor} 
                onChange={(e) => handleUpdate({ outlineColor: e.target.value })}
                onBlur={handleBlur}
                className="w-full h-8 cursor-pointer rounded bg-transparent"
              />
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-800 p-1 rounded-lg">
            <Button variant="ghost" size="sm" className={selected.align === "left" ? "bg-white/10" : ""} onClick={() => { handleUpdate({ align: "left" }); handleBlur(); }}>
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className={selected.align === "center" ? "bg-white/10" : ""} onClick={() => { handleUpdate({ align: "center" }); handleBlur(); }}>
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className={selected.align === "right" ? "bg-white/10" : ""} onClick={() => { handleUpdate({ align: "right" }); handleBlur(); }}>
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" className="w-full mt-4 bg-red-900/50 hover:bg-red-900 text-red-200 border-red-800" onClick={() => removeCaption(selected.id)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Caption
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-8">Select a caption to edit its properties.</p>
      )}
    </div>
  );
}
