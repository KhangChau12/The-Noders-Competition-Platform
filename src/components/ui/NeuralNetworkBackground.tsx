'use client';

/**
 * Neural Network Background Component
 *
 * Displays an animated neural network pattern with nodes and connections
 * Uses fixed positioning so it stays in place while content scrolls
 *
 * Based on The Noders PTNK website design
 */
export default function NeuralNetworkBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Left Network */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] opacity-30 md:opacity-40 animate-pulse" style={{ animationDuration: '8s' }}>
        <defs>
          <filter id="glow-left-bg">
            <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="node-glow-left-bg">
            <feGaussianBlur stdDeviation="35" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="node-gradient-left-bg">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.6)" />
            <stop offset="30%" stopColor="rgba(96, 165, 250, 0.3)" />
            <stop offset="60%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </radialGradient>
        </defs>

        {/* Cluster 1: Top-left area */}
        <line x1="120" y1="80" x2="200" y2="120" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="200" y1="120" x2="280" y2="100" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="120" y1="80" x2="180" y2="180" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-left-bg)" />

        {/* Cluster 2: Middle-left area */}
        <line x1="80" y1="250" x2="180" y2="180" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="80" y1="250" x2="160" y2="320" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="180" y1="180" x2="280" y2="250" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-left-bg)" />

        {/* Cluster 3: Center area */}
        <line x1="280" y1="250" x2="380" y2="220" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="280" y1="250" x2="360" y2="340" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="200" y1="120" x2="280" y2="250" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" filter="url(#glow-left-bg)" />
        <line x1="380" y1="220" x2="280" y2="100" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-left-bg)" />

        {/* Cluster 4: Bottom area */}
        <line x1="160" y1="320" x2="240" y2="420" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="240" y1="420" x2="360" y2="340" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-left-bg)" />
        <line x1="360" y1="340" x2="460" y2="380" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-left-bg)" />

        {/* Inter-cluster connections */}
        <line x1="380" y1="220" x2="460" y2="380" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" filter="url(#glow-left-bg)" />
        <line x1="160" y1="320" x2="280" y2="250" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" filter="url(#glow-left-bg)" />

        {/* Node glows (background) */}
        <circle cx="120" cy="80" r="60" fill="url(#node-gradient-left-bg)" opacity="0.5" filter="url(#node-glow-left-bg)" />
        <circle cx="200" cy="120" r="70" fill="url(#node-gradient-left-bg)" opacity="0.6" filter="url(#node-glow-left-bg)" />
        <circle cx="280" cy="100" r="60" fill="url(#node-gradient-left-bg)" opacity="0.5" filter="url(#node-glow-left-bg)" />
        <circle cx="80" cy="250" r="60" fill="url(#node-gradient-left-bg)" opacity="0.5" filter="url(#node-glow-left-bg)" />
        <circle cx="180" cy="180" r="70" fill="url(#node-gradient-left-bg)" opacity="0.6" filter="url(#node-glow-left-bg)" />
        <circle cx="160" cy="320" r="60" fill="url(#node-gradient-left-bg)" opacity="0.5" filter="url(#node-glow-left-bg)" />
        <circle cx="280" cy="250" r="80" fill="url(#node-gradient-left-bg)" opacity="0.7" filter="url(#node-glow-left-bg)" />
        <circle cx="380" cy="220" r="70" fill="url(#node-gradient-left-bg)" opacity="0.6" filter="url(#node-glow-left-bg)" />
        <circle cx="240" cy="420" r="70" fill="url(#node-gradient-left-bg)" opacity="0.6" filter="url(#node-glow-left-bg)" />
        <circle cx="360" cy="340" r="70" fill="url(#node-gradient-left-bg)" opacity="0.6" filter="url(#node-glow-left-bg)" />
        <circle cx="460" cy="380" r="60" fill="url(#node-gradient-left-bg)" opacity="0.5" filter="url(#node-glow-left-bg)" />

        {/* Nodes (foreground) */}
        <circle cx="120" cy="80" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-left-bg)" />
        <circle cx="200" cy="120" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="280" cy="100" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-left-bg)" />
        <circle cx="80" cy="250" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-left-bg)" />
        <circle cx="180" cy="180" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="160" cy="320" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-left-bg)" />
        <circle cx="280" cy="250" r="12" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="380" cy="220" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="240" cy="420" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="360" cy="340" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-left-bg)" />
        <circle cx="460" cy="380" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-left-bg)" />
      </svg>

      {/* Right Network */}
      <svg className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] opacity-30 md:opacity-40 animate-pulse" style={{ animationDuration: '8s', animationDelay: '4s' }}>
        <defs>
          <filter id="glow-right-bg">
            <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="node-glow-right-bg">
            <feGaussianBlur stdDeviation="35" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="node-gradient-right-bg">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.6)" />
            <stop offset="30%" stopColor="rgba(96, 165, 250, 0.3)" />
            <stop offset="60%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </radialGradient>
        </defs>

        {/* Cluster 1: Top-right area */}
        <line x1="480" y1="80" x2="400" y2="120" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="400" y1="120" x2="320" y2="100" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="480" y1="80" x2="420" y2="180" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-right-bg)" />

        {/* Cluster 2: Middle-right area */}
        <line x1="520" y1="250" x2="420" y2="180" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="520" y1="250" x2="440" y2="320" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="420" y1="180" x2="320" y2="250" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-right-bg)" />

        {/* Cluster 3: Center area */}
        <line x1="320" y1="250" x2="220" y2="220" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="320" y1="250" x2="240" y2="340" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="400" y1="120" x2="320" y2="250" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" filter="url(#glow-right-bg)" />
        <line x1="220" y1="220" x2="320" y2="100" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-right-bg)" />

        {/* Cluster 4: Bottom area */}
        <line x1="440" y1="320" x2="360" y2="420" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="360" y1="420" x2="240" y2="340" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2.5" filter="url(#glow-right-bg)" />
        <line x1="240" y1="340" x2="140" y2="380" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" filter="url(#glow-right-bg)" />

        {/* Inter-cluster connections */}
        <line x1="220" y1="220" x2="140" y2="380" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" filter="url(#glow-right-bg)" />
        <line x1="440" y1="320" x2="320" y2="250" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" filter="url(#glow-right-bg)" />

        {/* Node glows (background) */}
        <circle cx="480" cy="80" r="60" fill="url(#node-gradient-right-bg)" opacity="0.5" filter="url(#node-glow-right-bg)" />
        <circle cx="400" cy="120" r="70" fill="url(#node-gradient-right-bg)" opacity="0.6" filter="url(#node-glow-right-bg)" />
        <circle cx="320" cy="100" r="60" fill="url(#node-gradient-right-bg)" opacity="0.5" filter="url(#node-glow-right-bg)" />
        <circle cx="520" cy="250" r="60" fill="url(#node-gradient-right-bg)" opacity="0.5" filter="url(#node-glow-right-bg)" />
        <circle cx="420" cy="180" r="70" fill="url(#node-gradient-right-bg)" opacity="0.6" filter="url(#node-glow-right-bg)" />
        <circle cx="440" cy="320" r="60" fill="url(#node-gradient-right-bg)" opacity="0.5" filter="url(#node-glow-right-bg)" />
        <circle cx="320" cy="250" r="80" fill="url(#node-gradient-right-bg)" opacity="0.7" filter="url(#node-glow-right-bg)" />
        <circle cx="220" cy="220" r="70" fill="url(#node-gradient-right-bg)" opacity="0.6" filter="url(#node-glow-right-bg)" />
        <circle cx="360" cy="420" r="70" fill="url(#node-gradient-right-bg)" opacity="0.6" filter="url(#node-glow-right-bg)" />
        <circle cx="240" cy="340" r="70" fill="url(#node-gradient-right-bg)" opacity="0.6" filter="url(#node-glow-right-bg)" />
        <circle cx="140" cy="380" r="60" fill="url(#node-gradient-right-bg)" opacity="0.5" filter="url(#node-glow-right-bg)" />

        {/* Nodes (foreground) */}
        <circle cx="480" cy="80" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-right-bg)" />
        <circle cx="400" cy="120" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="320" cy="100" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-right-bg)" />
        <circle cx="520" cy="250" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-right-bg)" />
        <circle cx="420" cy="180" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="440" cy="320" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-right-bg)" />
        <circle cx="320" cy="250" r="12" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="220" cy="220" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="360" cy="420" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="240" cy="340" r="10" fill="rgba(59, 130, 246, 1)" filter="url(#glow-right-bg)" />
        <circle cx="140" cy="380" r="8" fill="rgba(96, 165, 250, 1)" filter="url(#glow-right-bg)" />
      </svg>

      {/* Center Glow Background */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1400px] md:h-[1400px] lg:w-[1600px] lg:h-[1600px] opacity-30 md:opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.5) 0%, rgba(59, 130, 246, 0.3) 40%, transparent 70%)',
          filter: 'blur(120px)'
        }}
      />
    </div>
  );
}
