"use client";

import { useMemeStore } from "@/store/useMemeStore";
import { motion } from "framer-motion";
import { useRef } from "react";

export default function Canvas({ isLocked }: { isLocked: boolean }) {
  const { image, captions, updateCaption, setSelectedCaption, saveHistory, selectedCaptionId } = useMemeStore();
  const constraintsRef = useRef<HTMLDivElement>(null);

  if (!image) {
    return <p className="text-slate-500">Generate or upload an image to start</p>;
  }

  return (
    <div 
      ref={constraintsRef}
      className="relative w-full aspect-square md:aspect-auto md:h-full max-h-full overflow-hidden bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${image})` }}
      onClick={() => setSelectedCaption(null)}
    >
      {captions.map((cap) => (
        <motion.div
          key={cap.id}
          drag={!isLocked}
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            updateCaption(cap.id, { x: cap.x + info.offset.x, y: cap.y + info.offset.y });
            saveHistory();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked) setSelectedCaption(cap.id);
          }}
          initial={{ x: cap.x, y: cap.y, rotate: cap.rotation }}
          animate={{ x: cap.x, y: cap.y, rotate: cap.rotation }}
          style={{
            position: "absolute",
            width: cap.width,
            fontSize: cap.fontSize,
            fontFamily: cap.fontFamily,
            color: cap.color,
            textAlign: cap.align,
            textShadow: cap.shadow 
              ? `2px 2px 4px rgba(0,0,0,0.8), -${cap.outlineWidth}px -${cap.outlineWidth}px 0 ${cap.outlineColor}, ${cap.outlineWidth}px -${cap.outlineWidth}px 0 ${cap.outlineColor}, -${cap.outlineWidth}px ${cap.outlineWidth}px 0 ${cap.outlineColor}, ${cap.outlineWidth}px ${cap.outlineWidth}px 0 ${cap.outlineColor}`
              : `-${cap.outlineWidth}px -${cap.outlineWidth}px 0 ${cap.outlineColor}, ${cap.outlineWidth}px -${cap.outlineWidth}px 0 ${cap.outlineColor}, -${cap.outlineWidth}px ${cap.outlineWidth}px 0 ${cap.outlineColor}, ${cap.outlineWidth}px ${cap.outlineWidth}px 0 ${cap.outlineColor}`,
            cursor: isLocked ? "default" : "grab",
            border: selectedCaptionId === cap.id ? "2px dashed #ec4899" : "none",
            userSelect: "none",
          }}
          className={`font-bold uppercase break-words p-1 leading-tight ${selectedCaptionId === cap.id ? "bg-white/10" : ""}`}
        >
          {cap.text}
        </motion.div>
      ))}
    </div>
  );
}
