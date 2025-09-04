'use client';

import React from 'react';
import { createPortal } from 'react-dom';

type BasicTooltipProps = {
  /** Recharts passes these props to Tooltip content */
  active?: boolean;
  payload?: unknown[];
  label?: string | number;
  coordinate?: { x: number; y: number } | null;
};

export interface PortalTooltipProps extends BasicTooltipProps {
  /** The same content used previously (e.g., your RichTooltip component) */
  Panel: React.ComponentType<BasicTooltipProps>;
  /** The chart container ref used to compute absolute position */
  containerRef: React.RefObject<Element | null>;
  /** Optional: extra z-index and offset tuning */
  zIndex?: number;
  offset?: { x?: number; y?: number };
  /** Optional: minimal viewport clamping (avoid going off-screen) */
  clampToViewport?: boolean;
  clampPadding?: number; // px
}

/**
 * Render Recharts tooltip content into document.body using a portal,
 * positioned using the chart container's bounding rect + Recharts coordinate.
 */
const PortalTooltip: React.FC<PortalTooltipProps> = ({
  active,
  payload,
  label,
  coordinate,
  Panel,
  containerRef,
  zIndex = 100000,
  offset = { x: 12, y: -12 },
  clampToViewport = true,
  clampPadding = 8,
}) => {
  // SSR guard
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!active || !payload || !payload.length || !coordinate) return null;

  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return null;

  // Base absolute position relative to page
  let left = rect.left + coordinate.x + window.scrollX + (offset.x ?? 0);
  let top = rect.top + coordinate.y + window.scrollY + (offset.y ?? 0);

  // Optional clamping to viewport to avoid off-screen
  if (clampToViewport) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Assume a conservative tooltip size; the panel is typically narrow
    // If you need pixel-perfect clamping, you can measure with a ref after mount.
    const approxWidth = 360;  // tweak if needed
    const approxHeight = 260; // tweak if needed

    const minLeft = clampPadding + window.scrollX;
    const maxLeft = vw - approxWidth - clampPadding + window.scrollX;
    const minTop = clampPadding + window.scrollY;
    const maxTop = vh - approxHeight - clampPadding + window.scrollY;

    left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));
    top = Math.max(minTop, Math.min(top, Math.max(minTop, maxTop)));
  }

  return createPortal(
    <div
      style={{
        position: 'absolute',
        left,
        top,
        zIndex,
        pointerEvents: 'none', // mimic Recharts default so it doesn't block hover
      }}
      aria-hidden="true"
    >
      {/* Pass through exactly what RichTooltip expects */}
      <Panel active={active} payload={payload} label={label} coordinate={coordinate} />
    </div>,
    document.body
  );
};

export default PortalTooltip;
