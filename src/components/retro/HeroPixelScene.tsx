import React from 'react';

export const HeroPixelScene: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden bg-[#070B14] select-none">
      {/* ─────────────────────────────────────────────────────────────
          PIXEL ART HERO SCENE (MATCHING REFERENCE PROPORTIONS & SCENE)
          Occupies ~380px–460px height. No marketing text in hero!
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-6xl mx-auto flex items-end justify-center">
        {/* SVG Canvas with Crisp Pixel Rendering */}
        <svg
          viewBox="0 0 1000 460"
          className="w-full h-auto block select-none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
        >
          <defs>
            {/* CRT Screen Glow Filter */}
            <filter id="crt-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Moon Glow Filter */}
            <filter id="moon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Tiled Floor Pattern */}
            <pattern id="retro-floor-grid" width="40" height="24" patternUnits="userSpaceOnUse">
              <rect width="40" height="24" fill="#102528" />
              <rect x="0" y="0" width="38" height="22" fill="#153236" />
              <line x1="0" y1="23" x2="40" y2="23" stroke="#0B1A1C" strokeWidth="2" />
              <line x1="39" y1="0" x2="39" y2="24" stroke="#0B1A1C" strokeWidth="2" />
            </pattern>
          </defs>

          {/* ═══════════════════════════════════════════════════════════
              1. BACKGROUND: NIGHT SKY & CELESTIAL ELEMENTS
              ═══════════════════════════════════════════════════════════ */}
          <rect x="0" y="0" width="1000" height="460" fill="#070B14" />

          {/* Crescent Moon (Top Left - as in reference) */}
          <g transform="translate(260, 60)" filter="url(#moon-glow)">
            {/* Outer golden crescent */}
            <path
              d="M38,0 C48,16 48,40 34,56 C20,72 0,72 -14,64 C10,64 28,46 28,26 C28,14 20,4 12,0 C22,0 32,0 38,0 Z"
              fill="#F8C02F"
            />
            {/* Pixel craters */}
            <rect x="24" y="24" width="4" height="4" fill="#E2A612" />
            <rect x="18" y="40" width="6" height="4" fill="#E2A612" />
            <rect x="28" y="34" width="4" height="4" fill="#E2A612" />
          </g>

          {/* Sparkling 4-Point Stars (Matching Reference placements) */}
          {/* Star 1 - Cyan */}
          <g transform="translate(360, 48)">
            <rect x="6" y="0" width="4" height="16" fill="#00E5FF" />
            <rect x="0" y="6" width="16" height="4" fill="#00E5FF" />
            <rect x="6" y="6" width="4" height="4" fill="#FFFFFF" />
          </g>

          {/* Star 2 - Coral */}
          <g transform="translate(680, 52)">
            <rect x="5" y="0" width="4" height="14" fill="#FF4742" />
            <rect x="0" y="5" width="14" height="4" fill="#FF4742" />
            <rect x="5" y="5" width="4" height="4" fill="#FFFFFF" />
          </g>

          {/* Star 3 - Yellow */}
          <g transform="translate(740, 80)">
            <rect x="4" y="0" width="4" height="12" fill="#F8C02F" />
            <rect x="0" y="4" width="12" height="4" fill="#F8C02F" />
          </g>

          {/* Star 4 - White/Cyan (Far Left) */}
          <g transform="translate(140, 90)">
            <rect x="4" y="0" width="3" height="10" fill="#00E5FF" />
            <rect x="0" y="4" width="10" height="3" fill="#00E5FF" />
          </g>

          {/* Star 5 - Cyan (Far Right) */}
          <g transform="translate(860, 96)">
            <rect x="4" y="0" width="3" height="10" fill="#00E5FF" />
            <rect x="0" y="4" width="10" height="3" fill="#00E5FF" />
          </g>

          {/* Scattered Celestial Pixel Dots */}
          <rect x="200" y="110" width="3" height="3" fill="#FFFFFF" opacity="0.8" />
          <rect x="310" y="90" width="3" height="3" fill="#00E5FF" opacity="0.9" />
          <rect x="420" y="70" width="3" height="3" fill="#F8C02F" opacity="0.7" />
          <rect x="580" y="40" width="3" height="3" fill="#FFFFFF" opacity="0.8" />
          <rect x="630" y="95" width="3" height="3" fill="#FF4742" opacity="0.8" />
          <rect x="800" y="60" width="3" height="3" fill="#00E5FF" opacity="0.8" />
          <rect x="830" y="130" width="3" height="3" fill="#FFFFFF" opacity="0.7" />
          <rect x="170" y="140" width="3" height="3" fill="#FF4742" opacity="0.6" />

          {/* ═══════════════════════════════════════════════════════════
              2. PERSPECTIVE TILED FLOOR / STAGE (Exact Reference Geometry)
              ═══════════════════════════════════════════════════════════ */}
          {/* Main Floor Polygon in Teal/Green */}
          <polygon
            points="180,300 820,300 1000,460 0,460"
            fill="#122A2E"
            stroke="#0A181A"
            strokeWidth="3"
          />

          {/* Floor Tiled Grid Lines with Perspective */}
          {/* Vertical perspective lines */}
          <line x1="260" y1="300" x2="120" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="340" y1="300" x2="260" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="420" y1="300" x2="390" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="500" y1="300" x2="500" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="580" y1="300" x2="610" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="660" y1="300" x2="740" y2="460" stroke="#1A3E44" strokeWidth="2" />
          <line x1="740" y1="300" x2="880" y2="460" stroke="#1A3E44" strokeWidth="2" />

          {/* Horizontal perspective rows */}
          <line x1="165" y1="320" x2="835" y2="320" stroke="#1A3E44" strokeWidth="2" />
          <line x1="145" y1="345" x2="855" y2="345" stroke="#1A3E44" strokeWidth="2" />
          <line x1="120" y1="375" x2="880" y2="375" stroke="#1A3E44" strokeWidth="2" />
          <line x1="90" y1="410" x2="910" y2="410" stroke="#1A3E44" strokeWidth="2.5" />
          <line x1="50" y1="450" x2="950" y2="450" stroke="#1A3E44" strokeWidth="3" />

          {/* Glowing Coral/Gold Runway Indicator Tiles on Front Border (Reference Detail) */}
          <rect x="50" y="434" width="34" height="16" fill="#FF4742" rx="0" />
          <rect x="135" y="434" width="34" height="16" fill="#F8C02F" rx="0" />
          <rect x="220" y="434" width="34" height="16" fill="#FF4742" rx="0" />
          <rect x="305" y="434" width="34" height="16" fill="#F8C02F" rx="0" />
          <rect x="390" y="434" width="34" height="16" fill="#FF4742" rx="0" />
          <rect x="475" y="434" width="34" height="16" fill="#00E5FF" rx="0" />
          <rect x="560" y="434" width="34" height="16" fill="#FF4742" rx="0" />
          <rect x="645" y="434" width="34" height="16" fill="#F8C02F" rx="0" />
          <rect x="730" y="434" width="34" height="16" fill="#FF4742" rx="0" />
          <rect x="815" y="434" width="34" height="16" fill="#F8C02F" rx="0" />
          <rect x="900" y="434" width="34" height="16" fill="#FF4742" rx="0" />

          {/* ═══════════════════════════════════════════════════════════
              3. CENTRAL RETRO AI COMPUTER TERMINAL (Main Focal Point)
              ═══════════════════════════════════════════════════════════ */}
          <g transform="translate(390, 110)">
            {/* Monitor Outer Chassis (Dark Slate with Hard Pixel Border) */}
            <rect x="0" y="0" width="220" height="175" fill="#141B2D" stroke="#070B14" strokeWidth="6" />
            <rect x="6" y="6" width="208" height="163" fill="#1F2942" stroke="#0D1322" strokeWidth="3" />

            {/* Top Ventilation Grills */}
            <rect x="20" y="12" width="180" height="4" fill="#0D1322" />
            <rect x="20" y="18" width="180" height="4" fill="#0D1322" />

            {/* CRT Screen Bezel */}
            <rect x="18" y="28" width="184" height="114" fill="#0B101D" stroke="#070B14" strokeWidth="4" />

            {/* Glowing Phosphor Screen (Cyan/Teal) */}
            <rect
              x="24"
              y="34"
              width="172"
              height="102"
              fill="#062228"
              stroke="#00E5FF"
              strokeWidth="2"
              filter="url(#crt-glow)"
            />

            {/* Screen Content: Pixel Art AI Study OS Interface */}
            {/* Header bar on screen */}
            <rect x="28" y="38" width="164" height="14" fill="#00E5FF" />
            <text
              x="110"
              y="49"
              fontFamily="Press Start 2P, monospace"
              fontSize="7"
              fill="#062228"
              textAnchor="middle"
              fontWeight="bold"
            >
              AI STUDY OS
            </text>

            {/* Pixel Art Study Diagram: Book + Neural Nodes */}
            {/* Open Book Pixel Sprite */}
            <rect x="42" y="62" width="24" height="20" fill="#0B353E" stroke="#00E5FF" strokeWidth="1.5" />
            <rect x="70" y="62" width="24" height="20" fill="#0B353E" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="68" y1="62" x2="68" y2="82" stroke="#FF4742" strokeWidth="2" />
            <line x1="46" y1="68" x2="62" y2="68" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="46" y1="74" x2="60" y2="74" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="74" y1="68" x2="90" y2="68" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="74" y1="74" x2="88" y2="74" stroke="#00E5FF" strokeWidth="1.5" />

            {/* Neural Vector Nodes */}
            <circle cx="120" cy="66" r="4" fill="#FF4742" />
            <circle cx="150" cy="60" r="4" fill="#F8C02F" />
            <circle cx="135" cy="80" r="4" fill="#00E5FF" />
            <circle cx="160" cy="82" r="4" fill="#39FF14" />
            {/* Neural connectors */}
            <line x1="120" y1="66" x2="135" y2="80" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="120" y1="66" x2="150" y2="60" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="150" y1="60" x2="135" y2="80" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="135" y1="80" x2="160" y2="82" stroke="#00E5FF" strokeWidth="1.5" />

            {/* Math Formula & Vector Status readout on screen */}
            <text
              x="36"
              y="102"
              fontFamily="VT323, monospace"
              fontSize="12"
              fill="#00E5FF"
              letterSpacing="1"
            >
              FAISS::TOP-K RETRIEVAL [p.42]
            </text>
            <text
              x="36"
              y="120"
              fontFamily="VT323, monospace"
              fontSize="11"
              fill="#F8C02F"
              letterSpacing="1"
            >
              θ := θ - η ∇J(θ) // GROUNDED
            </text>

            {/* Bottom Controls / Buttons Bar */}
            <rect x="24" y="146" width="60" height="14" fill="#FF4742" stroke="#070B14" strokeWidth="2" />
            <text
              x="54"
              y="156"
              fontFamily="Press Start 2P, monospace"
              fontSize="6"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              RAG
            </text>

            {/* Colored Status Indicator LEDs */}
            <circle cx="150" cy="153" r="3" fill="#39FF14" />
            <circle cx="165" cy="153" r="3" fill="#00E5FF" />
            <circle cx="180" cy="153" r="3" fill="#FF4742" />

            {/* Terminal Stand / Neck */}
            <rect x="85" y="175" width="50" height="20" fill="#0D1322" stroke="#070B14" strokeWidth="3" />
            {/* Terminal Base Foot */}
            <rect x="65" y="195" width="90" height="10" fill="#1F2942" stroke="#070B14" strokeWidth="3" />
          </g>

          {/* ═══════════════════════════════════════════════════════════
              4. FLOATING STUDY ARTIFACTS ORBITING THE CENTRAL AI
              ═══════════════════════════════════════════════════════════ */}
          {/* Floating Document Left: Page 42 with citation tag */}
          <g transform="translate(300, 150)">
            <rect x="0" y="0" width="60" height="74" fill="#FBF5E6" stroke="#0C1220" strokeWidth="3" />
            {/* Red PDF Header */}
            <rect x="0" y="0" width="60" height="12" fill="#FF4742" />
            <text x="6" y="9" fontFamily="Press Start 2P, monospace" fontSize="5" fill="#FFFFFF">
              PDF
            </text>
            {/* Document Lines */}
            <line x1="8" y1="20" x2="52" y2="20" stroke="#0C1220" strokeWidth="2" />
            <line x1="8" y1="27" x2="48" y2="27" stroke="#0C1220" strokeWidth="2" />
            <line x1="8" y1="34" x2="52" y2="34" stroke="#0C1220" strokeWidth="2" />
            <line x1="8" y1="41" x2="40" y2="41" stroke="#0C1220" strokeWidth="2" />
            {/* Highlighted passage */}
            <rect x="8" y="47" width="44" height="12" fill="#FFE58F" stroke="#F8C02F" strokeWidth="1" />
            <line x1="12" y1="53" x2="48" y2="53" stroke="#FF4742" strokeWidth="2" />
            {/* Citation badge below page */}
            <rect x="4" y="63" width="52" height="7" fill="#00E5FF" />
            <text x="30" y="69" fontFamily="Press Start 2P, monospace" fontSize="4.5" fill="#0C1220" textAnchor="middle">
              PAGE 42
            </text>
          </g>

          {/* Floating Open Textbook Right */}
          <g transform="translate(640, 140)">
            <polygon points="0,15 35,5 35,45 0,55" fill="#FBF5E6" stroke="#0C1220" strokeWidth="2.5" />
            <polygon points="35,5 70,15 70,55 35,45" fill="#FBF5E6" stroke="#0C1220" strokeWidth="2.5" />
            {/* Book Spine in Coral */}
            <line x1="35" y1="5" x2="35" y2="45" stroke="#FF4742" strokeWidth="4" />
            {/* Page text lines */}
            <line x1="6" y1="22" x2="30" y2="14" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="6" y1="29" x2="28" y2="21" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="6" y1="36" x2="30" y2="28" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="40" y1="14" x2="64" y2="22" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="42" y1="21" x2="64" y2="29" stroke="#0C1220" strokeWidth="1.5" />
            <line x1="40" y1="28" x2="62" y2="36" stroke="#0C1220" strokeWidth="1.5" />
            {/* Bookmark ribbon */}
            <path d="M35,45 L35,58 L40,54 L45,58 L45,45" fill="#00E5FF" stroke="#0C1220" strokeWidth="1.5" />
          </g>

          {/* Floating Data Floppy / Vector Cartridge */}
          <g transform="translate(620, 220)">
            <rect x="0" y="0" width="36" height="36" fill="#1F2942" stroke="#0C1220" strokeWidth="2.5" />
            <rect x="6" y="2" width="24" height="14" fill="#C0C6D8" stroke="#0C1220" strokeWidth="1" />
            <rect x="6" y="20" width="24" height="12" fill="#FBF5E6" />
            <text x="18" y="28" fontFamily="Press Start 2P, monospace" fontSize="4" fill="#FF4742" textAnchor="middle">
              FAISS
            </text>
          </g>

          {/* Floating Neural Pulse Node Left */}
          <g transform="translate(330, 240)">
            <rect x="0" y="0" width="24" height="24" fill="#062228" stroke="#00E5FF" strokeWidth="2" />
            <circle cx="12" cy="12" r="5" fill="#FF4742" />
            <line x1="0" y1="12" x2="24" y2="12" stroke="#00E5FF" strokeWidth="1" />
            <line x1="12" y1="0" x2="12" y2="24" stroke="#00E5FF" strokeWidth="1" />
          </g>

          {/* ═══════════════════════════════════════════════════════════
              5. LEFT WORKSTATION / EQUIPMENT (Matching Red Units in Reference)
              ═════════════════════════════════════════════════════ */}
          <g transform="translate(10, 230)">
            {/* Main Coral Console Unit */}
            <rect x="30" y="40" width="130" height="90" fill="#FF4742" stroke="#070B14" strokeWidth="5" />
            <rect x="38" y="48" width="114" height="74" fill="#E23631" stroke="#A81C18" strokeWidth="2" />

            {/* Secondary Retro Monitor Unit on Console */}
            <rect x="50" y="2" width="80" height="56" fill="#141B2D" stroke="#070B14" strokeWidth="4" />
            <rect x="58" y="10" width="64" height="40" fill="#062228" stroke="#00E5FF" strokeWidth="2" />
            {/* Monitor screen lines */}
            <line x1="64" y1="20" x2="114" y2="20" stroke="#00E5FF" strokeWidth="2" />
            <line x1="64" y1="28" x2="104" y2="28" stroke="#00E5FF" strokeWidth="2" />
            <line x1="64" y1="36" x2="110" y2="36" stroke="#F8C02F" strokeWidth="2" />

            {/* Modular Equipment Panels & Dials on Left */}
            <rect x="46" y="65" width="46" height="46" fill="#0D1322" stroke="#070B14" strokeWidth="3" />
            <circle cx="60" cy="78" r="6" fill="#F8C02F" stroke="#070B14" strokeWidth="2" />
            <circle cx="78" cy="78" r="6" fill="#00E5FF" stroke="#070B14" strokeWidth="2" />
            <rect x="54" y="94" width="30" height="8" fill="#FF4742" />

            {/* Stack of Colored Textbooks on Deck */}
            <rect x="100" y="70" width="48" height="12" fill="#00E5FF" stroke="#070B14" strokeWidth="2" />
            <rect x="96" y="82" width="52" height="12" fill="#F8C02F" stroke="#070B14" strokeWidth="2" />
            <rect x="94" y="94" width="56" height="14" fill="#141B2D" stroke="#070B14" strokeWidth="2" />

            {/* Desk Antenna / Signal Rod */}
            <line x1="150" y1="40" x2="150" y2="-10" stroke="#F8C02F" strokeWidth="3" />
            <circle cx="150" cy="-12" r="5" fill="#FF4742" stroke="#070B14" strokeWidth="2" />

            {/* Miniature Potted Bonsai/Pine Plant (Exactly as in Reference!) */}
            <rect x="175" y="80" width="22" height="18" fill="#C85A32" stroke="#070B14" strokeWidth="2" />
            {/* Pine foliage in stepped pixel triangles */}
            <polygon points="186,40 172,60 200,60" fill="#1A5E44" stroke="#070B14" strokeWidth="2" />
            <polygon points="186,52 170,72 202,72" fill="#247858" stroke="#070B14" strokeWidth="2" />
            <polygon points="186,64 168,82 204,82" fill="#1A5E44" stroke="#070B14" strokeWidth="2" />
          </g>

          {/* ═══════════════════════════════════════════════════════════
              6. RIGHT WORKSTATION / EQUIPMENT (Matching Right in Reference)
              ═══════════════════════════════════════════════════════════ */}
          <g transform="translate(730, 230)">
            {/* Main Coral Console Unit */}
            <rect x="30" y="40" width="130" height="90" fill="#FF4742" stroke="#070B14" strokeWidth="5" />
            <rect x="38" y="48" width="114" height="74" fill="#E23631" stroke="#A81C18" strokeWidth="2" />

            {/* Secondary Retro Monitor Unit */}
            <rect x="50" y="2" width="80" height="56" fill="#141B2D" stroke="#070B14" strokeWidth="4" />
            <rect x="58" y="10" width="64" height="40" fill="#062228" stroke="#00E5FF" strokeWidth="2" />
            {/* Waveform / telemetry line */}
            <polyline
              points="64,30 76,20 84,36 94,16 104,32 114,24"
              fill="none"
              stroke="#39FF14"
              strokeWidth="2"
            />

            {/* Circular Holographic Radar/Gauge Unit (Inspired by bicycle wheel in ref) */}
            <g transform="translate(145, 10)">
              <circle cx="20" cy="20" r="24" fill="#082A30" stroke="#00E5FF" strokeWidth="3" filter="url(#crt-glow)" />
              <circle cx="20" cy="20" r="14" fill="#0E3D46" stroke="#00E5FF" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="4" fill="#FF4742" />
              <line x1="20" y1="0" x2="20" y2="40" stroke="#00E5FF" strokeWidth="1.5" />
              <line x1="0" y1="20" x2="40" y2="20" stroke="#00E5FF" strokeWidth="1.5" />
              {/* Stand */}
              <rect x="16" y="44" width="8" height="30" fill="#F8C02F" stroke="#070B14" strokeWidth="2" />
            </g>

            {/* Drive slots and indicator panels */}
            <rect x="46" y="65" width="56" height="46" fill="#0D1322" stroke="#070B14" strokeWidth="3" />
            <line x1="52" y1="75" x2="96" y2="75" stroke="#FF4742" strokeWidth="3" />
            <line x1="52" y1="85" x2="96" y2="85" stroke="#00E5FF" strokeWidth="3" />
            <line x1="52" y1="95" x2="96" y2="95" stroke="#F8C02F" strokeWidth="3" />

            {/* Miniature Potted Bonsai/Pine Plant (Right Side - Reference Detail) */}
            <rect x="-10" y="80" width="22" height="18" fill="#C85A32" stroke="#070B14" strokeWidth="2" />
            <polygon points="1,40 -13,60 15,60" fill="#1A5E44" stroke="#070B14" strokeWidth="2" />
            <polygon points="1,52 -15,72 17,72" fill="#247858" stroke="#070B14" strokeWidth="2" />
            <polygon points="1,64 -17,82 19,82" fill="#1A5E44" stroke="#070B14" strokeWidth="2" />
          </g>

          {/* Foreground Stage Border Line */}
          <line x1="0" y1="460" x2="1000" y2="460" stroke="#070B14" strokeWidth="4" />
        </svg>
      </div>
    </div>
  );
};
