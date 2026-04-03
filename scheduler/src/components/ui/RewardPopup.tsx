'use client';
import { Button } from "@/components/ui/Button";

import { useEffect, useState } from "react";

interface RewardPopupProps {
  xp: number;
  onDone: () => void;
}

export function RewardPopup({ xp, onDone }: RewardPopupProps) {
  // Simplified stages: start hidden -> animate to center -> fade/scale out
  const [stage, setStage] = useState<"hidden" | "center" | "exit">("hidden");

  useEffect(() => {
    // Trigger the pop-up slightly after mount
    const t1 = setTimeout(() => setStage("center"), 50);
    // Hold in the center for 1.5 seconds, then exit
    const t2 = setTimeout(() => setStage("exit"), 1500);
    // Unmount completely
    const t3 = setTimeout(onDone, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "none",
        left: "50%",
        // Starts below the screen, moves to 50% (center)
        top: stage === "hidden" ? "120%" : "50%",
        // Scales down on exit
        transform: `translate(-50%, -50%) scale(${stage === "exit" ? 0 : 1})`,
        opacity: stage === "exit" ? 0 : 1,
        // Bouncy spring animation for the entrance
        transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "160px",
        height: "160px",
      }}
    >
      {/* Background Star SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="#facc15" // Yellow/Gold color
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0px 8px 16px rgba(250, 204, 21, 0.4))",
        }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      {/* Points Text Inside the Star */}
      <span
        style={{
          position: "relative",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: "1.75rem",
          textShadow: "1px 2px 4px rgba(0,0,0,0.3)", // Helps readability against the yellow
          marginTop: "12px", // Pushes the text down slightly into the visual center of the star
        }}
      >
        +{xp}
      </span>
    </div>
  );
}