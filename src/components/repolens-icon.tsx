import type { SVGProps } from "react";

interface RepoLensIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

/**
 * Custom-crafted RepoLens AI Unified Icon.
 * Merges a repository architectural cube, optical camera lens aperture,
 * and AI laser-focus scanner reticle into a single bespoke identity mark.
 */
export function RepoLensIcon({
  size = 16,
  color = "currentColor",
  className,
  style,
  ...props
}: RepoLensIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
      {...props}
    >
      {/* Precision Optical Scanner Reticle Notches */}
      <line x1="12" y1="1.5" x2="12" y2="4" strokeWidth={2} />
      <line x1="12" y1="20" x2="12" y2="22.5" strokeWidth={2} />
      <line x1="1.5" y1="12" x2="4" y2="12" strokeWidth={2} />
      <line x1="20" y1="12" x2="22.5" y2="12" strokeWidth={2} />

      {/* Circular Outer Lens Aperture Ring */}
      <circle cx="12" cy="12" r="8.5" strokeWidth={1.5} opacity={0.85} />

      {/* Hexagonal Repository Architecture Facet */}
      <polygon
        points="12,5.2 17.8,8.5 17.8,15.5 12,18.8 6.2,15.5 6.2,8.5"
        strokeWidth={1.6}
      />

      {/* Isometric Internal Structure Beams */}
      <line x1="12" y1="12" x2="12" y2="18.5" strokeWidth={1.4} opacity={0.9} />
      <line x1="12" y1="12" x2="17.8" y2="8.5" strokeWidth={1.4} opacity={0.9} />
      <line x1="12" y1="12" x2="6.2" y2="8.5" strokeWidth={1.4} opacity={0.9} />

      {/* Center AI Focus Core Spark */}
      <circle cx="12" cy="12" r="2.2" fill={color} stroke="none" />
    </svg>
  );
}
