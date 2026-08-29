import type { HTMLAttributes, ReactNode } from "react";

type GlassStrength = "soft" | "regular" | "strong";

interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strength?: GlassStrength;
}

export function GlassSurface({
  children,
  className = "",
  strength = "regular",
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={`bo-glass bo-glass--${strength} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
