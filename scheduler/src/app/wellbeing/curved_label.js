"use client";
import { useId } from "react";

export default function CurvedLabel({
  text,
  size = 180,        // matches breath container
  labelOffset = 10,  // distance ABOVE component
  fontSize = 16,
  color = "#fff",
  children,
}) {
  const id = useId();

  const labelRadius = size / 2 + labelOffset;
  const center = size / 2 + labelOffset;

  const svgSize = size + labelOffset * 2;

  return (
    <div
      style={{
        width: svgSize,
        height: svgSize,
        position: "relative",
      }}
    >
      {/* Curved label */}
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <path
            id={id}
            d={`
              M ${center - labelRadius}, ${center}
              a ${labelRadius},${labelRadius} 0 0,1 ${labelRadius * 2},0
            `}
          />
        </defs>

        <text fontSize={fontSize} fill={color}>
          <textPath href={`#${id}`} startOffset="58%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </svg>

      {/* Component slot */}
      <div
        style={{
          position: "absolute",
          top: labelOffset,
          left: labelOffset,
          width: size,
          height: size,
        }}
      >
        {children}
      </div>
    </div>
  );
}
