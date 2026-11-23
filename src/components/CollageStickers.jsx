import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { TOXICITY_CATEGORIES } from "../utils/chemistryEngine";

// Chalk Blueprint Organic Chemical Structure SVG
export function BlueprintHeroMoleculeSVG({ className = "" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll(".chalk-stroke");
    gsap.fromTo(
      paths,
      { strokeDasharray: 260, strokeDashoffset: 260, opacity: 0.2 },
      {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.08,
        ease: "power2.out"
      }
    );
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 330 165"
      className={`blueprint-hero-molecule ${className}`}
      fill="none"
    >
      {/* Left Hexagon (Benzene ring) */}
      <polygon
        className="chalk-stroke"
        points="115,38 153,38 172,70 153,102 115,102 96,70"
        stroke="#F5EBDD"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Inner double bonds of left ring */}
      <line className="chalk-stroke" x1="118" y1="46" x2="149" y2="46" stroke="#F5EBDD" strokeWidth="2.4" />
      <line className="chalk-stroke" x1="105" y1="70" x2="117" y2="94" stroke="#F5EBDD" strokeWidth="2.4" />
      <line className="chalk-stroke" x1="163" y1="68" x2="150" y2="93" stroke="#F5EBDD" strokeWidth="2.4" />

      {/* Right Fused Heterocycle */}
      <polyline
        className="chalk-stroke"
        points="153,38 190,26 218,46 218,90 190,108 153,102"
        stroke="#F5EBDD"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Double bond C=O top right */}
      <line className="chalk-stroke" x1="215" y1="43" x2="240" y2="27" stroke="#F5EBDD" strokeWidth="2.6" />
      <line className="chalk-stroke" x1="220" y1="49" x2="245" y2="33" stroke="#F5EBDD" strokeWidth="2.6" />

      {/* HO- group bottom left */}
      <line className="chalk-stroke" x1="96" y1="70" x2="72" y2="90" stroke="#F5EBDD" strokeWidth="2.8" />
      <line className="chalk-stroke" x1="72" y1="90" x2="54" y2="90" stroke="#F5EBDD" strokeWidth="2.8" />

      {/* Bottom C=O ketone */}
      <line className="chalk-stroke" x1="112" y1="102" x2="112" y2="128" stroke="#F5EBDD" strokeWidth="2.5" />
      <line className="chalk-stroke" x1="119" y1="102" x2="119" y2="128" stroke="#F5EBDD" strokeWidth="2.5" />

      {/* Right N-H bond */}
      <line className="chalk-stroke" x1="218" y1="90" x2="246" y2="104" stroke="#F5EBDD" strokeWidth="2.6" />

      {/* Labels in Chalk White */}
      <text x="16" y="99" fill="#F5EBDD" fontSize="22" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        HO
      </text>
      <text x="107" y="151" fill="#F5EBDD" fontSize="22" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        O
      </text>
      <text x="184" y="21" fill="#F5EBDD" fontSize="21" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        N
      </text>
      <text x="181" y="128" fill="#F5EBDD" fontSize="20" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        N
      </text>
      <text x="247" y="29" fill="#F5EBDD" fontSize="22" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        O
      </text>
      <text x="251" y="114" fill="#F5EBDD" fontSize="20" fontWeight="700" fontFamily="'Space Grotesk', monospace">
        H
      </text>
    </svg>
  );
}

// Rotating Vintage Research Rubber Stamp Sticker
export function ResearchStampSticker({
  topText = "DRUGCOMB • VALIDATED",
  bottomText = "561,754 SYNERGY PAIRS",
  centerText = "R² 0.61",
  color = "#F04B32",
  size = 112,
  className = ""
}) {
  const stampRef = useRef(null);

  const handleTrigger = () => {
    if (!stampRef.current) return;
    gsap.fromTo(
      stampRef.current,
      { scale: 0.82, rotation: "-=25" },
      { scale: 1, rotation: "+=25", duration: 0.6, ease: "elastic.out(1.2, 0.4)" }
    );
  };

  return (
    <div
      ref={stampRef}
      onClick={handleTrigger}
      onMouseEnter={handleTrigger}
      className={`research-stamp-sticker ${className}`}
      style={{ width: size, height: size, cursor: "pointer" }}
      title="Click to stamp!"
    >
      <svg viewBox="0 0 140 140" width={size} height={size}>
        <defs>
          <path id={`topArc-${centerText}`} d="M 22,70 A 48,48 0 1,1 118,70" />
          <path id={`botArc-${centerText}`} d="M 118,70 A 48,48 0 1,1 22,70" />
        </defs>
        <circle cx="70" cy="70" r="64" fill="#F5EBDD" fillOpacity="0.92" stroke={color} strokeWidth="3.5" strokeDasharray="8 3" />
        <circle cx="70" cy="70" r="56" fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx="70" cy="70" r="35" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
        <text fill={color} fontSize="9.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.4">
          <textPath href={`#topArc-${centerText}`} startOffset="50%" textAnchor="middle">
            {topText}
          </textPath>
        </text>
        <text fill={color} fontSize="9" fontWeight="700" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.2">
          <textPath href={`#botArc-${centerText}`} startOffset="50%" textAnchor="middle">
            {bottomText}
          </textPath>
        </text>
        <text
          x="70"
          y="75"
          textAnchor="middle"
          fill={color}
          fontSize="16"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="'Playfair Display', serif"
        >
          {centerText}
        </text>
      </svg>
    </div>
  );
}

// Handwritten Lab Note Annotation Sticker with Hand-Drawn Arrow
export function HandwrittenAnnotation({
  text,
  color = "#1745C4",
  bg = "transparent",
  rotate = -4,
  arrowDir = "right",
  className = ""
}) {
  const noteRef = useRef(null);

  const wiggle = () => {
    if (!noteRef.current) return;
    gsap.fromTo(
      noteRef.current,
      { rotation: rotate - 6, scale: 1.08 },
      { rotation: rotate, scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }
    );
  };

  return (
    <div
      ref={noteRef}
      onMouseEnter={wiggle}
      onClick={wiggle}
      className={`handwritten-annotation ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        color,
        backgroundColor: bg,
        cursor: "pointer"
      }}
    >
      <span className="handwritten-text">{text}</span>
      {arrowDir !== "none" && (
        <svg width="38" height="22" viewBox="0 0 42 24" fill="none" className={`hand-arrow arrow-${arrowDir}`}>
          <path
            d="M3 16 C 14 4, 26 4, 37 14 M 30 7 L 38 15 L 27 19"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// 8-Category Multi-Organ Toxicity Radar Chart (Drug A vs Drug B vs Combined Risk)
export function ToxicityRadarChart({ toxA, toxB, comboTox, nameA = "Drug A", nameB = "Drug B" }) {
  const width = 360;
  const height = 310;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 94;

  const getPoints = (toxObj) => {
    return TOXICITY_CATEGORIES.map((cat, idx) => {
      const angle = (Math.PI * 2 * idx) / TOXICITY_CATEGORIES.length - Math.PI / 2;
      const val = Math.max(0.05, Math.min(1.0, toxObj?.[cat.key] ?? 0.2));
      const r = val * radius;
      return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
    }).join(" ");
  };

  return (
    <div className="toxicity-radar-card">
      <div className="radar-header">
        <span className="radar-kicker">8-ORGAN BIOSAFETY PROFILER</span>
        <h4>Multi-Organ Toxicity Radar</h4>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="toxicity-radar-svg">
        {/* Concentric grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <circle
            key={level}
            cx={cx}
            cy={cy}
            r={radius * level}
            fill="none"
            stroke="#171717"
            strokeOpacity={level === 0.7 ? "0.45" : "0.16"}
            strokeDasharray={level === 0.75 ? "4 3" : "none"}
            strokeWidth="1.2"
          />
        ))}

        {/* 8 Organ Axes */}
        {TOXICITY_CATEGORIES.map((cat, idx) => {
          const angle = (Math.PI * 2 * idx) / TOXICITY_CATEGORIES.length - Math.PI / 2;
          const x2 = cx + Math.cos(angle) * radius;
          const y2 = cy + Math.sin(angle) * radius;
          const lx = cx + Math.cos(angle) * (radius + 28);
          const ly = cy + Math.sin(angle) * (radius + 22);
          return (
            <g key={cat.key}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#171717" strokeOpacity="0.22" strokeWidth="1" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#171717"
                fontSize="9.5"
                fontWeight="700"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {cat.organ}
              </text>
            </g>
          );
        })}

        {/* Drug A Polygon (Cobalt Blue) */}
        {toxA && (
          <polygon
            points={getPoints(toxA)}
            fill="#1745C4"
            fillOpacity="0.18"
            stroke="#1745C4"
            strokeWidth="2.2"
          />
        )}

        {/* Drug B Polygon (Butter Yellow / Gold) */}
        {toxB && (
          <polygon
            points={getPoints(toxB)}
            fill="#F6CA37"
            fillOpacity="0.25"
            stroke="#C89600"
            strokeWidth="2.2"
          />
        )}

        {/* Combined Risk Polygon (Vermilion Coral) */}
        {comboTox && (
          <polygon
            points={getPoints(comboTox)}
            fill="#F04B32"
            fillOpacity="0.24"
            stroke="#F04B32"
            strokeWidth="2.8"
          />
        )}
      </svg>
      <div className="radar-legend">
        <span className="legend-item">
          <i className="dot dot-blue" /> {nameA.slice(0, 14)}
        </span>
        <span className="legend-item">
          <i className="dot dot-yellow" /> {nameB.slice(0, 14)}
        </span>
        <span className="legend-item">
          <i className="dot dot-coral" /> Combined Risk
        </span>
      </div>
    </div>
  );
}
