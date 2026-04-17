'use client';

import { useEffect, useState } from 'react';

// Node data with positions and animation assignments
const leftNodes = [
  { cx: 100, cy: 60, r: 5, glowR: 35, float: 1, delay: 0 },
  { cx: 200, cy: 110, r: 6, glowR: 45, float: 2, delay: 1.5 },
  { cx: 310, cy: 80, r: 5, glowR: 35, float: 3, delay: 0.8 },
  { cx: 60, cy: 220, r: 5, glowR: 35, float: 4, delay: 2.2 },
  { cx: 170, cy: 170, r: 7, glowR: 55, float: 5, delay: 0.5 },
  { cx: 140, cy: 310, r: 5, glowR: 35, float: 1, delay: 3.0 },
  { cx: 280, cy: 240, r: 7, glowR: 60, float: 3, delay: 1.0 },
  { cx: 400, cy: 200, r: 6, glowR: 45, float: 2, delay: 2.5 },
  { cx: 220, cy: 400, r: 6, glowR: 45, float: 4, delay: 1.8 },
  { cx: 370, cy: 330, r: 6, glowR: 45, float: 5, delay: 0.3 },
  { cx: 480, cy: 370, r: 5, glowR: 35, float: 1, delay: 3.5 },
  // Extra nodes for density
  { cx: 50, cy: 130, r: 4, glowR: 25, float: 3, delay: 4.0 },
  { cx: 330, cy: 160, r: 4, glowR: 25, float: 5, delay: 2.0 },
  { cx: 450, cy: 120, r: 4, glowR: 25, float: 2, delay: 3.2 },
  { cx: 500, cy: 260, r: 5, glowR: 30, float: 4, delay: 1.2 },
  { cx: 120, cy: 440, r: 4, glowR: 25, float: 1, delay: 2.8 },
  { cx: 420, cy: 440, r: 4, glowR: 25, float: 3, delay: 0.6 },
];

const leftConnections = [
  // Cluster 1
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 4 },
  // Cluster 2
  { from: 3, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 6 },
  // Cluster 3
  { from: 6, to: 7 }, { from: 6, to: 9 }, { from: 1, to: 6 }, { from: 7, to: 2 },
  // Cluster 4
  { from: 5, to: 8 }, { from: 8, to: 9 }, { from: 9, to: 10 },
  // Inter-cluster
  { from: 7, to: 10 }, { from: 5, to: 6 },
  // Extra connections
  { from: 11, to: 0 }, { from: 11, to: 3 },
  { from: 12, to: 2 }, { from: 12, to: 7 },
  { from: 13, to: 2 }, { from: 13, to: 7 },
  { from: 14, to: 7 }, { from: 14, to: 10 },
  { from: 15, to: 5 }, { from: 15, to: 8 },
  { from: 16, to: 10 }, { from: 16, to: 9 },
];

const rightNodes = [
  { cx: 500, cy: 60, r: 5, glowR: 35, float: 2, delay: 1.0 },
  { cx: 400, cy: 110, r: 6, glowR: 45, float: 3, delay: 0.5 },
  { cx: 290, cy: 80, r: 5, glowR: 35, float: 1, delay: 2.0 },
  { cx: 540, cy: 220, r: 5, glowR: 35, float: 5, delay: 0.2 },
  { cx: 430, cy: 170, r: 7, glowR: 55, float: 4, delay: 3.0 },
  { cx: 460, cy: 310, r: 5, glowR: 35, float: 2, delay: 1.5 },
  { cx: 320, cy: 240, r: 7, glowR: 60, float: 1, delay: 2.5 },
  { cx: 200, cy: 200, r: 6, glowR: 45, float: 3, delay: 0.8 },
  { cx: 380, cy: 400, r: 6, glowR: 45, float: 5, delay: 1.2 },
  { cx: 230, cy: 330, r: 6, glowR: 45, float: 4, delay: 3.5 },
  { cx: 120, cy: 370, r: 5, glowR: 35, float: 2, delay: 0.1 },
  // Extra nodes
  { cx: 550, cy: 130, r: 4, glowR: 25, float: 1, delay: 2.2 },
  { cx: 270, cy: 160, r: 4, glowR: 25, float: 3, delay: 3.8 },
  { cx: 150, cy: 120, r: 4, glowR: 25, float: 4, delay: 1.8 },
  { cx: 100, cy: 260, r: 5, glowR: 30, float: 5, delay: 0.6 },
  { cx: 480, cy: 440, r: 4, glowR: 25, float: 2, delay: 4.0 },
  { cx: 180, cy: 440, r: 4, glowR: 25, float: 1, delay: 2.8 },
];

const rightConnections = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 4 },
  { from: 3, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 6 },
  { from: 6, to: 7 }, { from: 6, to: 9 }, { from: 1, to: 6 }, { from: 7, to: 2 },
  { from: 5, to: 8 }, { from: 8, to: 9 }, { from: 9, to: 10 },
  { from: 7, to: 10 }, { from: 5, to: 6 },
  { from: 11, to: 0 }, { from: 11, to: 3 },
  { from: 12, to: 2 }, { from: 12, to: 7 },
  { from: 13, to: 2 }, { from: 13, to: 7 },
  { from: 14, to: 7 }, { from: 14, to: 10 },
  { from: 15, to: 5 }, { from: 15, to: 8 },
  { from: 16, to: 10 }, { from: 16, to: 9 },
];

// Select some connections to have traveling particles (reduced from 8 to 5 per side)
const leftParticleLines = [0, 6, 8, 14, 22];
const rightParticleLines = [1, 7, 9, 15, 25];

function NetworkSVG({
  side,
  nodes,
  connections,
  particleLines,
  className,
  mobile = false,
  simplified = false,
}: {
  side: 'left' | 'right' | 'center';
  nodes: typeof leftNodes;
  connections: typeof leftConnections;
  particleLines: number[];
  className?: string;
  mobile?: boolean;
  simplified?: boolean;
}) {
  const prefix = `nn-${side}`;
  // In simplified mode: no filters, no particles, animate only every other line
  const useFilters = !mobile && !simplified;
  const showParticles = !mobile && !simplified;

  return (
    <svg
      className={`absolute ${className}`}
      viewBox="0 0 600 500"
    >
      <defs>
        {useFilters && (
          <>
            <filter id={`${prefix}-glow`} x="-100%" y="-100%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id={`${prefix}-node-glow`}>
              <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id={`${prefix}-soft-glow`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </>
        )}
        <radialGradient id={`${prefix}-node-grad`}>
          <stop offset="0%" stopColor="rgba(96, 165, 250, 0.5)" />
          <stop offset="40%" stopColor="rgba(96, 165, 250, 0.2)" />
          <stop offset="70%" stopColor="rgba(59, 130, 246, 0.05)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </radialGradient>
        <radialGradient id={`${prefix}-node-grad-bright`}>
          <stop offset="0%" stopColor="rgba(130, 200, 255, 0.8)" />
          <stop offset="30%" stopColor="rgba(96, 165, 250, 0.4)" />
          <stop offset="60%" stopColor="rgba(59, 130, 246, 0.1)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </radialGradient>
      </defs>

      {/* Connection lines with dash animation */}
      {connections.map((conn, i) => {
        // In simplified mode, animate only every other line to halve animation count
        if (simplified && i % 2 !== 0) return null;
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        const dist = Math.sqrt((to.cx - from.cx) ** 2 + (to.cy - from.cy) ** 2);
        const opacity = dist > 200 ? 0.15 : dist > 120 ? 0.25 : 0.35;
        const width = dist > 200 ? 0.8 : dist > 120 ? 1.2 : 1.5;

        return (
          <line
            key={`${prefix}-line-${i}`}
            x1={from.cx} y1={from.cy}
            x2={to.cx} y2={to.cy}
            stroke="rgba(96, 165, 250, 1)"
            strokeWidth={width}
            opacity={opacity}
            strokeDasharray="4 4"
            {...(useFilters && { filter: `url(#${prefix}-soft-glow)` })}
            style={{
              animation: `nn-line-flow ${3 + (i % 4)}s linear infinite`,
              animationDelay: `${(i * 0.7) % 5}s`,
              willChange: 'stroke-dashoffset',
            }}
          />
        );
      })}

      {/* Traveling particles along connections - desktop + non-simplified only */}
      {showParticles && particleLines.map((lineIdx) => {
        if (lineIdx >= connections.length) return null;
        const conn = connections[lineIdx];
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        const dist = Math.sqrt((to.cx - from.cx) ** 2 + (to.cy - from.cy) ** 2);
        const duration = 2 + dist / 80;

        return (
          <circle
            key={`${prefix}-particle-${lineIdx}`}
            r="2.5"
            fill="rgba(130, 210, 255, 0.9)"
            filter={`url(#${prefix}-soft-glow)`}
            style={{
              offsetPath: `path("M${from.cx},${from.cy} L${to.cx},${to.cy}")`,
              animation: `nn-particle-travel ${duration}s ease-in-out infinite`,
              animationDelay: `${(lineIdx * 1.3) % 8}s`,
              willChange: 'offset-distance, opacity',
            }}
          />
        );
      })}

      {/* Node glow backgrounds */}
      {nodes.map((node, i) => (
        <circle
          key={`${prefix}-glow-${i}`}
          cx={node.cx} cy={node.cy}
          r={node.glowR}
          fill={node.r >= 7 ? `url(#${prefix}-node-grad-bright)` : `url(#${prefix}-node-grad)`}
          opacity={node.r >= 7 ? 0.6 : 0.4}
          {...(useFilters && { filter: `url(#${prefix}-node-glow)` })}
        />
      ))}

      {/* Foreground nodes */}
      {nodes.map((node, i) => (
        <circle
          key={`${prefix}-node-${i}`}
          cx={node.cx} cy={node.cy}
          r={node.r}
          fill={node.r >= 7 ? 'rgba(130, 200, 255, 1)' : node.r >= 6 ? 'rgba(96, 165, 250, 1)' : 'rgba(80, 150, 240, 0.9)'}
          {...(useFilters && { filter: `url(#${prefix}-glow)` })}
        />
      ))}
    </svg>
  );
}

export default function NeuralNetworkBackground() {
  const [simplified, setSimplified] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;
    setSimplified(prefersReduced || lowEnd);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Desktop: left + right networks */}
      <NetworkSVG
        side="left"
        nodes={leftNodes}
        connections={leftConnections}
        particleLines={leftParticleLines}
        className="hidden md:block left-0 -translate-x-[15%] top-1/2 -translate-y-1/2 w-[750px] h-[550px] lg:w-[850px] lg:h-[600px]"
        simplified={simplified}
      />
      <NetworkSVG
        side="right"
        nodes={rightNodes}
        connections={rightConnections}
        particleLines={rightParticleLines}
        className="hidden md:block right-0 translate-x-[15%] top-1/2 -translate-y-1/2 w-[750px] h-[550px] lg:w-[850px] lg:h-[600px]"
        simplified={simplified}
      />

      {/* Mobile: single centered network, no filters or particles */}
      <NetworkSVG
        side="center"
        nodes={leftNodes}
        connections={leftConnections}
        particleLines={leftParticleLines}
        className="block md:hidden left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[380px] h-[420px]"
        mobile
      />

      {/* Center Glow Background */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] opacity-15 md:opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.2) 35%, transparent 65%)',
          filter: simplified ? 'blur(40px)' : 'blur(80px)',
        }}
      />
    </div>
  );
}
