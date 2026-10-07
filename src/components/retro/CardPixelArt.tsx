import React from 'react';

export type CardPixelArtType =
  | 'library'
  | 'study-room'
  | 'citations'
  | 'rag'
  | 'reader'
  | 'quiz'
  | 'recall'
  | 'formula';

interface CardPixelArtProps {
  type: CardPixelArtType;
  className?: string;
}

export const CardPixelArt: React.FC<CardPixelArtProps> = ({ type, className = '' }) => {
  const renderIllustration = () => {
    switch (type) {
      case 'library':
        /* Matching the left card in the reference image: Landscape with mountains, trees, retro bezel */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            {/* Sky */}
            <rect width="200" height="70" fill="#2A7B9B" />
            <rect x="0" y="45" width="200" height="25" fill="#E88258" />
            {/* Sun */}
            <rect x="90" y="32" width="20" height="20" fill="#F8C02F" />
            {/* Distant Mountains in Teal */}
            <polygon points="20,70 60,35 100,70" fill="#1C4B5E" />
            <polygon points="80,70 125,25 170,70" fill="#153B4B" />
            <polygon points="140,70 175,40 200,70" fill="#1C4B5E" />
            {/* Ground / Road */}
            <rect x="0" y="70" width="200" height="50" fill="#507E32" />
            <polygon points="75,120 90,70 110,70 125,120" fill="#D49A6A" />
            {/* Pine Trees flanking the road (as in reference) */}
            {/* Left Pine Tree */}
            <polygon points="20,105 10,120 30,120" fill="#1B4D2E" />
            <polygon points="20,95 12,110 28,110" fill="#25693F" />
            <polygon points="20,85 14,100 26,100" fill="#1B4D2E" />
            {/* Right Pine Tree */}
            <polygon points="180,105 170,120 190,120" fill="#1B4D2E" />
            <polygon points="180,95 172,110 188,110" fill="#25693F" />
            <polygon points="180,85 174,100 186,100" fill="#1B4D2E" />
            {/* Pixel Document Floating in Sky */}
            <rect x="92" y="10" width="16" height="20" fill="#FBF5E6" stroke="#0C1220" strokeWidth="1.5" />
            <rect x="92" y="10" width="16" height="4" fill="#FF4742" />
          </svg>
        );

      case 'study-room':
        /* Matching the center card in the reference image: Starry night with diagonal hazard frame, sparks */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            {/* Deep Space Background */}
            <rect width="200" height="120" fill="#070B14" />
            {/* Stars */}
            <rect x="30" y="20" width="3" height="3" fill="#00E5FF" />
            <rect x="70" y="45" width="2" height="2" fill="#FFFFFF" />
            <rect x="150" y="25" width="3" height="3" fill="#F8C02F" />
            <rect x="170" y="80" width="2" height="2" fill="#FF4742" />
            <rect x="40" y="90" width="2" height="2" fill="#FFFFFF" />
            {/* Central Terminal / Floating Book in Space */}
            <rect x="70" y="35" width="60" height="45" fill="#141B2D" stroke="#00E5FF" strokeWidth="2" />
            <rect x="75" y="40" width="50" height="30" fill="#062228" />
            {/* Terminal Screen Graphics */}
            <line x1="80" y1="48" x2="115" y2="48" stroke="#00E5FF" strokeWidth="2" />
            <line x1="80" y1="55" x2="110" y2="55" stroke="#39FF14" strokeWidth="2" />
            <line x1="80" y1="62" x2="120" y2="62" stroke="#FF4742" strokeWidth="2" />
            {/* Lightning Sparks / Energy Pulses (Reference detail) */}
            <polyline points="45,40 55,50 48,60 62,75" stroke="#F8C02F" strokeWidth="2" fill="none" />
            <polyline points="155,40 145,50 152,60 138,75" stroke="#00E5FF" strokeWidth="2" fill="none" />
            {/* Space Shuttle / Document Craft at bottom */}
            <polygon points="100,90 90,105 110,105" fill="#FF4742" />
            <polygon points="100,94 94,103 106,103" fill="#FBF5E6" />
          </svg>
        );

      case 'citations':
        /* Matching the right apparatus in the reference image: Mechanical apparatus with glowing blue sphere */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            <rect width="200" height="120" fill="#FFFDF7" />
            {/* Grid paper lines in background */}
            <line x1="0" y1="30" x2="200" y2="30" stroke="#EDE4CE" strokeWidth="1" />
            <line x1="0" y1="60" x2="200" y2="60" stroke="#EDE4CE" strokeWidth="1" />
            <line x1="0" y1="90" x2="200" y2="90" stroke="#EDE4CE" strokeWidth="1" />
            <line x1="50" y1="0" x2="50" y2="120" stroke="#EDE4CE" strokeWidth="1" />
            <line x1="100" y1="0" x2="100" y2="120" stroke="#EDE4CE" strokeWidth="1" />
            <line x1="150" y1="0" x2="150" y2="120" stroke="#EDE4CE" strokeWidth="1" />
            {/* Glowing Holographic Sphere Apparatus (Reference bicycle-like frame) */}
            <circle cx="55" cy="45" r="22" fill="#082A30" stroke="#00E5FF" strokeWidth="3" />
            <circle cx="55" cy="45" r="14" fill="#00E5FF" opacity="0.6" />
            <circle cx="55" cy="45" r="5" fill="#FFFFFF" />
            {/* Support struts / mechanical chassis */}
            <line x1="55" y1="67" x2="55" y2="105" stroke="#0C1220" strokeWidth="3" />
            <line x1="55" y1="75" x2="125" y2="75" stroke="#0C1220" strokeWidth="3" />
            <line x1="125" y1="75" x2="155" y2="105" stroke="#0C1220" strokeWidth="3" />
            <line x1="55" y1="105" x2="155" y2="105" stroke="#0C1220" strokeWidth="3" />
            {/* Wheels / Gear cogs */}
            <circle cx="55" cy="105" r="8" fill="#FF4742" stroke="#0C1220" strokeWidth="2" />
            <circle cx="155" cy="105" r="8" fill="#F8C02F" stroke="#0C1220" strokeWidth="2" />
            {/* Cited Source Document Card Attached */}
            <rect x="110" y="25" width="55" height="40" fill="#FBF5E6" stroke="#0C1220" strokeWidth="2" />
            <rect x="110" y="25" width="55" height="10" fill="#FF4742" />
            <text x="137" y="32" fontFamily="Press Start 2P, monospace" fontSize="5" fill="#FFFFFF" textAnchor="middle">
              PAGE 42
            </text>
            <line x1="115" y1="42" x2="155" y2="42" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="115" y1="48" x2="148" y2="48" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="115" y1="54" x2="160" y2="54" stroke="#00E5FF" strokeWidth="2" />
          </svg>
        );

      case 'rag':
        /* Matching the bottom right card in reference: Hexagonal core floating in cosmos with FAISS nodes */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            <rect width="200" height="120" fill="#070B14" />
            {/* Cosmic pixel stars */}
            <rect x="25" y="20" width="3" height="3" fill="#00E5FF" />
            <rect x="165" y="30" width="2" height="2" fill="#FFFFFF" />
            <rect x="40" y="90" width="2" height="2" fill="#F8C02F" />
            <rect x="175" y="85" width="3" height="3" fill="#FF4742" />
            {/* Hexagonal / Octagonal Vector Core (Reference motif) */}
            <polygon points="100,25 140,40 140,80 100,95 60,80 60,40" fill="#141B2D" stroke="#FF4742" strokeWidth="3" />
            <polygon points="100,35 130,46 130,74 100,85 70,74 70,46" fill="#0D1322" stroke="#00E5FF" strokeWidth="2" />
            {/* Central Glowing Core */}
            <circle cx="100" cy="60" r="12" fill="#FF4742" />
            <circle cx="100" cy="60" r="6" fill="#F8C02F" />
            {/* Orbiting Vector Nodes */}
            <circle cx="45" cy="50" r="4" fill="#00E5FF" />
            <line x1="49" y1="50" x2="60" y2="50" stroke="#00E5FF" strokeWidth="1.5" />
            <circle cx="155" cy="70" r="4" fill="#39FF14" />
            <line x1="140" y1="70" x2="151" y2="70" stroke="#39FF14" strokeWidth="1.5" />
          </svg>
        );

      case 'reader':
        /* Matching the bottom center card in reference: Alpine snow mountains under deep blue sky */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            {/* Sky */}
            <rect width="200" height="80" fill="#143644" />
            {/* Cloud pixels */}
            <rect x="20" y="25" width="30" height="8" fill="#FBF5E6" opacity="0.6" />
            <rect x="25" y="20" width="20" height="6" fill="#FBF5E6" opacity="0.6" />
            {/* Snow Capped Mountains */}
            <polygon points="30,80 75,30 120,80" fill="#1B4D5E" />
            <polygon points="75,30 65,45 75,50 85,45" fill="#FFFFFF" />
            <polygon points="90,80 140,20 190,80" fill="#163F4E" />
            <polygon points="140,20 128,38 140,44 152,38" fill="#FFFFFF" />
            {/* Foreground Green Valley with pixel grid */}
            <rect x="0" y="80" width="200" height="40" fill="#1F5A38" />
            <rect x="0" y="95" width="200" height="25" fill="#16432A" />
            {/* Document Reader Overlay Frame */}
            <rect x="75" y="75" width="50" height="35" fill="#FBF5E6" stroke="#0C1220" strokeWidth="2" />
            <rect x="75" y="75" width="50" height="8" fill="#FF4742" />
            <line x1="82" y1="90" x2="118" y2="90" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="82" y1="96" x2="112" y2="96" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="82" y1="102" x2="116" y2="102" stroke="#00E5FF" strokeWidth="1.5" />
          </svg>
        );

      case 'quiz':
        /* Active recall multiple-choice question drill in retro CRT screen */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            <rect width="200" height="120" fill="#070B14" />
            {/* Monitor Bezel */}
            <rect x="15" y="10" width="170" height="100" fill="#121829" stroke="#FF4742" strokeWidth="2" />
            <rect x="22" y="16" width="156" height="88" fill="#062228" />
            {/* Header */}
            <text x="32" y="30" fontFamily="Press Start 2P, monospace" fontSize="6" fill="#00E5FF">
              Q: OPTIMIZATION?
            </text>
            {/* Option A (Checked) */}
            <rect x="32" y="40" width="8" height="8" fill="#39FF14" stroke="#00E5FF" strokeWidth="1" />
            <line x1="46" y1="45" x2="150" y2="45" stroke="#39FF14" strokeWidth="2" />
            {/* Option B */}
            <rect x="32" y="55" width="8" height="8" fill="#0B1522" stroke="#00E5FF" strokeWidth="1" />
            <line x1="46" y1="60" x2="135" y2="60" stroke="#FBF5E6" strokeWidth="1.5" />
            {/* Option C */}
            <rect x="32" y="70" width="8" height="8" fill="#0B1522" stroke="#00E5FF" strokeWidth="1" />
            <line x1="46" y1="75" x2="140" y2="75" stroke="#FBF5E6" strokeWidth="1.5" />
            {/* Result Tag */}
            <rect x="32" y="85" width="70" height="12" fill="#39FF14" />
            <text x="67" y="93" fontFamily="Press Start 2P, monospace" fontSize="5" fill="#070B14" textAnchor="middle">
              CORRECT // 100%
            </text>
          </svg>
        );

      case 'recall':
        /* Spaced repetition memory decay curve */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            <rect width="200" height="120" fill="#070B14" />
            {/* Grid axes */}
            <line x1="25" y1="15" x2="25" y2="105" stroke="#1A2942" strokeWidth="2" />
            <line x1="25" y1="105" x2="185" y2="105" stroke="#1A2942" strokeWidth="2" />
            {/* Retention curve */}
            <path
              d="M25,25 Q70,90 180,95"
              fill="none"
              stroke="#FF4742"
              strokeWidth="3"
            />
            {/* Boost curve with repetition */}
            <path
              d="M80,60 Q120,40 180,50"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
            {/* Memory nodes */}
            <circle cx="25" cy="25" r="4" fill="#F8C02F" />
            <circle cx="80" cy="60" r="5" fill="#00E5FF" />
            <circle cx="140" cy="46" r="4" fill="#39FF14" />
            {/* Legend */}
            <text x="35" y="30" fontFamily="Press Start 2P, monospace" fontSize="5" fill="#F8C02F">
              RECALL BOOST
            </text>
          </svg>
        );

      case 'formula':
        /* Mathematical formulas on green phosphor CRT screen */
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full" shapeRendering="crispEdges">
            <rect width="200" height="120" fill="#051A0E" />
            {/* Scanlines */}
            <line x1="0" y1="20" x2="200" y2="20" stroke="#082A17" strokeWidth="1" />
            <line x1="0" y1="40" x2="200" y2="40" stroke="#082A17" strokeWidth="1" />
            <line x1="0" y1="60" x2="200" y2="60" stroke="#082A17" strokeWidth="1" />
            <line x1="0" y1="80" x2="200" y2="80" stroke="#082A17" strokeWidth="1" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="#082A17" strokeWidth="1" />
            {/* Formula Text */}
            <text x="20" y="35" fontFamily="VT323, monospace" fontSize="16" fill="#39FF14">
              LOSS = -∑ y_i * log(p_i)
            </text>
            <text x="20" y="60" fontFamily="VT323, monospace" fontSize="16" fill="#00E5FF">
              θ := θ - η * ∇J(θ)
            </text>
            <text x="20" y="85" fontFamily="VT323, monospace" fontSize="15" fill="#F8C02F">
              COS_SIM = (A·B) / (||A||*||B||)
            </text>
            <text x="20" y="105" fontFamily="VT323, monospace" fontSize="13" fill="#39FF14">
              &gt; STATUS: SANITIZED // STEM OK_
            </text>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full overflow-hidden border-2 border-[#0C1220] ${className}`}>
      {renderIllustration()}
    </div>
  );
};
