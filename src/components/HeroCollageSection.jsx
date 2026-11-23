import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import synerlyticsData from "../data/synerlyticsData.json";
import {
  BlueprintHeroMoleculeSVG,
  ResearchStampSticker,
  HandwrittenAnnotation
} from "./CollageStickers";
import MoleculeBlueprintCanvas from "./MoleculeBlueprintCanvas";

const PACLITAXEL_DATA =
  synerlyticsData.drugs.find((d) => d.name === "PACLITAXEL") || {
    name: "PACLITAXEL",
    mw: 855.2,
    smiles:
      "CC(=O)O[C@H]1C(=O)[C@@]2(C)[C@H]([C@H](OC(=O)c3ccccc3)[C@]3(O)[C@H](OC(=O)[C@H](O)[C@@H](NC(=O)c4ccccc4)c4ccccc4)C(C)=C1C3(C)C)[C@]1(OC(C)=O)CO[C@@H]1C[C@@H]2O"
  };

const HERO_DEMO_PAIRS = [
  {
    score: "0.82",
    zipRaw: "+14.8",
    label: "High Synergy",
    drugA: "PACLITAXEL",
    drugB: "DOXORUBICIN",
    smilesA: "CC1=C2C(C(=O)C3=C(COC3=O)C(C2(C)C)(CC1OC(=O)C(C(C4=CC=CC=C4)NC(=O)C5=CC=CC=C5)O)C)OC(=O)C6=CC=CC=C6",
    smilesB: "CC1C(C(CC(O1)OC2C(OC3C(C2O)C(C(C4=CC(=O)C5=CC=CC=C5C4=O)O)(C)C)C)O)(C)O",
    cancer: "Breast Cancer",
    cellLine: "MCF7",
    safety: "0.78",
    note: "Mitotic arrest + Topoisomerase II inhibition"
  },
  {
    score: "0.91",
    zipRaw: "+16.4",
    label: "High Synergy",
    drugA: "OLAPARIB",
    drugB: "CISPLATIN",
    smilesA: "C1CC1C(=O)N2CCN(CC2)C(=O)C3=C(C=CC(=C3)CC4=NN(C(=O)C5=CC=CC=C54)H)F",
    smilesB: "Cl[Pt](Cl)(N)N",
    cancer: "Ovarian Cancer",
    cellLine: "OVCAR-8",
    safety: "0.81",
    note: "Synthetic lethality: PARP trap + DNA crosslink"
  },
  {
    score: "0.76",
    zipRaw: "+11.9",
    label: "High Synergy",
    drugA: "GEMCITABINE",
    drugB: "5-FLUOROURACIL",
    smilesA: "C1=NC(=O)N(C=C1)C2C(C(C(O2)CO)O)O",
    smilesB: "C1=CN(C(=O)NC1=O)F",
    cancer: "Pancreatic Cancer",
    cellLine: "PANC-1",
    safety: "0.84",
    note: "Dual antimetabolite DNA synthesis blockade"
  },
  {
    score: "0.68",
    zipRaw: "+9.4",
    label: "High Synergy",
    drugA: "IMATINIB",
    drugB: "VINCRISTINE",
    smilesA: "CN1CCN(CC1)C2=NC3=C(C=C2)C=C(C=C3)NC(=O)C4=CC=CC=C4",
    smilesB: "CC1(C2CC3C(C2(CC1OC(=O)C4=CC=CC=C4)OC)CN(CC3)C(=O)C5=CC=CC=C5)C",
    cancer: "Leukemia",
    cellLine: "K-562",
    safety: "0.75",
    note: "BCR-ABL kinase inhibition + microtubule disruption"
  }
];

const ARCHIVAL_STICKER_GALLERY = [
  {
    img: "/assets/hq_scientist_microscope.png",
    tag: "NCI ARCHIVE • 1948",
    title: "Cellular Optical Microscopy",
    note: "Early phenotypic screening required manual observation of every treated tumor culture."
  },
  {
    img: "/assets/hq_scientist_tube.png",
    tag: "WELLCOME COLLECTION • 1943",
    title: "Sir Alexander Fleming Assay",
    note: "Quantitative dose-inhibition assays laid the foundation for modern ZIP synergy matrices."
  },
  {
    img: "/assets/hq_pioneer_curie.png",
    tag: "PARIS LABORATORY • 1900",
    title: "Marie & Pierre Curie",
    note: "Pioneering quantitative physical chemistry and targeted radiation oncology."
  },
  {
    img: "/assets/hq_lab_glassware.png",
    tag: "ORGANIC SYNTHESIS",
    title: "Chemical Scaffold Distillation",
    note: "Modern SMILES strings encode complex multi-ring organic structures into molecular graphs."
  },
  {
    img: "/assets/hq_microscopy_pink.png",
    tag: "H&E HISTOPATHOLOGY",
    title: "Carcinoma Tissue Architecture",
    note: "17 distinct primary cancer lineages modeled via one-hot context & DepMap embeddings."
  },
  {
    img: "/assets/hq_microscopy_blue.png",
    tag: "DAPI FLUORESCENCE",
    title: "Nuclear DNA Damage Response",
    note: "Visualizing mitotic arrest and DNA cross-linking synergy in treated cancer cell lines."
  }
];

const CANCER_LINEAGES_LIST = [
  "Breast Cancer", "Lung Cancer", "Ovarian Cancer", "Colon/Colorectal Cancer",
  "Pancreatic Cancer", "Brain Cancer", "Leukemia", "Skin Cancer (Melanoma)",
  "Bladder Cancer", "Kidney Cancer", "Gastric Cancer", "Prostate Cancer",
  "Lymphoma", "Bone Cancer", "Sarcoma", "Myeloma"
];

export default function HeroCollageSection({ onNavigate, onQuickTestPair }) {
  const heroRef = useRef(null);
  const [activePairIdx, setActivePairIdx] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const activePair = HERO_DEMO_PAIRS[activePairIdx];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-torn-headline-1",
        { x: -50, opacity: 0, rotation: -3 },
        { x: 0, opacity: 1, rotation: -0.8, duration: 0.7, ease: "back.out(1.4)" }
      );
      gsap.fromTo(
        ".hero-torn-yellow-banner",
        { x: -60, opacity: 0, rotation: 2, scale: 0.94 },
        { x: 0, opacity: 1, rotation: -1.2, scale: 1, duration: 0.75, delay: 0.1, ease: "back.out(1.6)" }
      );
      gsap.fromTo(
        ".hero-torn-headline-3",
        { x: -45, opacity: 0, y: 15 },
        { x: 0, opacity: 1, y: 0, duration: 0.65, delay: 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        ".hero-torn-copy-box",
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, delay: 0.28, ease: "power3.out" }
      );
      gsap.fromTo(
        ".flow-sticker-item",
        { scale: 0.86, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.65, delay: 0.18, stagger: 0.08, ease: "back.out(1.5)" }
      );

      // Gentle float that stays within each item's grid cell padding (max 4px vertical movement, never overlaps!)
      gsap.to(".float-sticker-safe", {
        y: -4,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.35
      });
      gsap.to(".microscopy-spin-slow", {
        rotation: 360,
        duration: 65,
        repeat: -1,
        ease: "none"
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="home-view-wrapper">
      {/* ================= 1. ZERO-OVERLAP FLOW-GRID EDITORIAL COLLAGE HERO ================= */}
      <section className="hero-collage-stage">
        {/* Decorative Background Color Panels */}
        <div className="hero-bg-pink-grid-left" />
        <div className="hero-bg-coral-center">
          <div className="halftone-overlay" />
        </div>
        <div className="hero-bg-blue-grid-right" />
        <div className="hero-bg-pink-grid-bottom-right" />

        {/* FOREGROUND 3-COLUMN FLOW GRID (Every sticker lives in its own grid cell with explicit gap!) */}
        <div className="hero-flow-grid">
          {/* ================= COLUMN 1: HEADLINES, COPY & BOTTOM-LEFT STICKERS ================= */}
          <div className="hero-flow-col-left font-preset-poster">
            {/* Torn Paper Strip 1: DISCOVER POWERFUL */}
            <div className="hero-torn-headline-1 torn-paper-cream">
              <h1 className="hero-title-discover">
                <span className="kinetic-word">DISCOVER</span>
                <span className="kinetic-word">POWERFUL</span>
              </h1>
            </div>

            {/* Torn Butter Yellow Highlight Tape: DRUG COMBINATIONS */}
            <div className="hero-torn-yellow-banner torn-paper-yellow">
              <h2 className="hero-title-combinations">
                <span className="kinetic-word">DRUG</span>
                <span className="kinetic-word">COMBINATIONS</span>
              </h2>
            </div>

            {/* Torn Paper Strip 3: for Cancer Therapy */}
            <div className="hero-torn-headline-3 torn-paper-cream">
              <h3 className="hero-title-therapy">
                <span className="for-italic">for</span>{" "}
                <span className="cancer-therapy-coral">
                  Cancer Therapy
                  <svg className="coral-brush-underline" viewBox="0 0 210 14" fill="none">
                    <path
                      d="M4 9 C 58 3, 148 3, 206 8"
                      stroke="#F04B32"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h3>
            </div>

            {/* Torn Paper Body Copy & Moving Buttons */}
            <div className="hero-torn-copy-box torn-paper-cream">
              <p className="hero-typewriter-desc">
                An AI-powered platform that predicts drug synergy, efficacy, and multi-organ
                toxicity using Graph Neural Networks, molecular structures, and cancer cell data.
              </p>

              <div className="hero-cta-row">
                <button
                  onClick={() => onNavigate("Platform", "single")}
                  className="btn-moving-cobalt"
                >
                  <span>Try the Platform</span>
                  <span className="btn-arrow">↗</span>
                </button>

                <button
                  onClick={() => onNavigate("3D Explorer")}
                  className="btn-moving-yellow"
                >
                  <span>3D Molecule Engine</span>
                  <span className="btn-arrow">↗</span>
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="btn-moving-outline"
                >
                  <span className="play-circle">▶</span>
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Bottom-Left Sticker Row: Blue DAPI Circle + Handwritten Note + IC50 Badge */}
            <div className="hero-left-bottom-tray">
              <div className="flow-sticker-item tray-blue-microscopy float-sticker-safe">
                <img
                  src="/assets/hq_microscopy_blue.png"
                  alt="High-Res DAPI Blue Fluorescent Cells Sticker"
                />
              </div>

              <div className="tray-notes-stack">
                <HandwrittenAnnotation
                  text="★ Trained on 561,754 DrugComb pairs!"
                  color="#171717"
                  bg="rgba(245, 235, 221, 0.92)"
                  rotate={-1.5}
                  arrowDir="right"
                  className="flow-sticker-item tray-hand-note"
                />
                <div className="tray-badges-row">
                  <div className="flow-sticker-item chem-doodle-badge float-sticker-safe">
                    <svg viewBox="0 0 70 46" width="46" height="30" fill="none">
                      <polygon points="20,6 36,6 44,20 36,34 20,34 12,20" stroke="#1745C4" strokeWidth="2.4" />
                      <circle cx="28" cy="20" r="8" stroke="#F04B32" strokeWidth="2" strokeDasharray="3 2" />
                      <line x1="44" y1="20" x2="58" y2="20" stroke="#1745C4" strokeWidth="2.4" />
                      <text x="59" y="24" fill="#F04B32" fontSize="10" fontWeight="800">OH</text>
                    </svg>
                    <span>IC50 &lt; 12nM</span>
                  </div>
                  <div className="flow-sticker-item mini-yellow-tape-sticker float-sticker-safe">
                    <span>★ R² = 0.6137 • MAE 3.84</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: CENTER CORAL STAGE (VERTICAL STACK WITH GAP) ================= */}
          <div className="hero-flow-col-center">
            {/* Top Center: NCI Microscopy Scientist Sticker */}
            <div className="flow-sticker-item center-microscope-card float-sticker-safe">
              <div className="sticker-tape-top" />
              <img
                src="/assets/hq_scientist_microscope.png"
                alt="High-Resolution Archival Scientist at Microscope"
                className="hq-sticker-img"
              />
              <span className="sticker-caption-tag">NCI ARCHIVE • MICROSCOPY LAB</span>
            </div>

            {/* Middle Center Row: In-Silico Stamp + Coral Lab Glassware Sticker */}
            <div className="center-bottom-pair">
              <div className="flow-sticker-item center-stamp-box float-sticker-safe">
                <ResearchStampSticker
                  topText="DRUGCOMB • 561K"
                  bottomText="VALIDATED • R² 0.61"
                  centerText="IN-SILICO"
                  color="#F6CA37"
                  size={88}
                />
              </div>

              <div className="flow-sticker-item center-glassware-card float-sticker-safe">
                <img
                  src="/assets/hq_lab_glassware.png"
                  alt="High-Resolution Vintage Laboratory Glassware"
                  className="hq-sticker-img"
                />
              </div>
            </div>

            {/* Bottom Center Filler Row: Archival DepMap Tape Note + GINEConv Layer Ticket */}
            <div className="center-extra-stickers-row">
              <div
                className="flow-sticker-item center-depmap-ticket torn-paper-cream float-sticker-safe"
                onClick={() => onNavigate("Datasets")}
              >
                <span className="ticket-kicker">DEPMAP • CCLE ATLAS</span>
                <strong>288 Cancer Cell Lines</strong>
                <small>17 Primary Oncology Lineages</small>
              </div>

              <div
                className="flow-sticker-item center-gnn-pill-sticker float-sticker-safe"
                onClick={() => onNavigate("Research")}
              >
                <span className="pill-sticker-top">DUAL 4-LAYER</span>
                <strong>GINEConv</strong>
                <small>449-Dim Fusion</small>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3: RIGHT COBALT BLUEPRINT STAGE (2x2 BENTO GRID WITH GAP) ================= */}
          <div className="hero-flow-col-right">
            {/* Top Row: Generic Organic Molecule Sticker (Left) + Pink Carcinoma Tissue Circle (Right) */}
            <div className="right-top-bento-row">
              <div className="flow-sticker-item right-organic-mol-box float-sticker-safe">
                <BlueprintHeroMoleculeSVG />
              </div>

              <div className="flow-sticker-item right-pink-microscopy-box">
                <img
                  src="/assets/hq_microscopy_pink.png"
                  alt="High-Res Histopathology H&E Microscopy Sticker"
                  className="microscopy-spin-slow"
                />
              </div>
            </div>

            {/* Bottom Row: Left Sub-Column (GNN Powered + Curie Lab + 8-Organ Note) & Right Sub-Column (Fleming + Formula Stickers) */}
            <div className="right-bottom-bento-row">
              <div className="right-left-substack">
                <div
                  className="flow-sticker-item right-gnn-note torn-paper-cream float-sticker-safe"
                  onClick={() => onNavigate("Research")}
                  title="Click to inspect Dual 4-Layer GINEConv Architecture"
                >
                  <span className="gnn-sticker-text">GNN Powered</span>
                  <svg className="cobalt-brush-underline" viewBox="0 0 120 10" fill="none">
                    <path
                      d="M6 6 C 40 2, 85 2, 114 6"
                      stroke="#1745C4"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div
                  className="flow-sticker-item right-curie-card float-sticker-safe"
                  onClick={() => onNavigate("Research")}
                  title="Marie & Pierre Curie Archival Lab • 1900"
                >
                  <div className="sticker-tape-top" />
                  <img
                    src="/assets/hq_pioneer_curie.png"
                    alt="Marie and Pierre Curie Laboratory Sticker"
                    className="hq-sticker-img"
                  />
                  <span className="sticker-caption-tag">CURIE LAB • 1900</span>
                </div>

                <div className="flow-sticker-item right-biosafety-card torn-paper-yellow float-sticker-safe">
                  <span className="biosafety-stamp-title">✓ 8-ORGAN SMARTS</span>
                  <small>Multi-Organ Toxicity &amp; Lipinski Rules</small>
                </div>
              </div>

              {/* Right Sub-Column: Sir Alexander Fleming Assay Sticker + Handwritten & Molecular Graph Stickers */}
              <div className="right-right-substack">
                <div className="flow-sticker-item right-fleming-card-wrap float-sticker-safe">
                  <div className="fleming-yellow-halo" />
                  <div className="right-fleming-card">
                    <div className="sticker-tape-top" />
                    <img
                      src="/assets/hq_scientist_tube.png"
                      alt="High-Resolution Archival Scientist Examining Assay"
                      className="hq-sticker-img"
                    />
                    <span className="sticker-caption-tag">ASSAY VERIFICATION • 1943</span>
                  </div>
                </div>

                <div className="flow-sticker-item right-zip-note-sticker torn-paper-cream float-sticker-safe">
                  <span className="zip-note-hand">ZIP &gt; +6.0 = High Synergy ✓</span>
                  <small>SMILES &rarr; 192-D Molecular Graph</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM 4-PILLAR TORN PAPER FEATURE BAR (In Normal Flow — Never Overlaps Stickers!) */}
        <div className="hero-bottom-feature-strip-flow">
          <button
            className="hero-pillar-item"
            onClick={() => onNavigate("Platform", "single")}
          >
            <svg viewBox="0 0 44 40" className="pillar-icon">
              <circle cx="22" cy="8" r="3.5" fill="#1745C4" />
              <circle cx="10" cy="28" r="3.5" fill="#1745C4" />
              <circle cx="34" cy="28" r="3.5" fill="#1745C4" />
              <circle cx="22" cy="20" r="4.5" fill="none" stroke="#1745C4" strokeWidth="2.5" />
              <line x1="22" y1="11.5" x2="22" y2="15.5" stroke="#1745C4" strokeWidth="2.5" />
              <line x1="18" y1="22.5" x2="12.5" y2="26" stroke="#1745C4" strokeWidth="2.5" />
              <line x1="26" y1="22.5" x2="31.5" y2="26" stroke="#1745C4" strokeWidth="2.5" />
            </svg>
            <span className="pillar-title">
              Predict
              <br />
              Synergy
            </span>
          </button>

          <div className="pillar-divider" />

          <button
            className="hero-pillar-item"
            onClick={() => onNavigate("Platform", "single")}
          >
            <svg viewBox="0 0 40 42" className="pillar-icon">
              <path
                d="M20 4 L34 10 V21 C34 30 27.5 36.5 20 39 C12.5 36.5 6 30 6 21 V10 Z"
                fill="none"
                stroke="#1745C4"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              <line x1="20" y1="14" x2="20" y2="27" stroke="#1745C4" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="13.5" y1="20.5" x2="26.5" y2="20.5" stroke="#1745C4" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <span className="pillar-title">
              Assess
              <br />
              Safety
            </span>
          </button>

          <div className="pillar-divider" />

          <button
            className="hero-pillar-item"
            onClick={() => onNavigate("Platform", "recommend")}
          >
            <svg viewBox="0 0 44 40" className="pillar-icon">
              <polygon
                points="22,5 38,13 22,21 6,13"
                fill="none"
                stroke="#1745C4"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <polyline
                points="6,20 22,28 38,20"
                fill="none"
                stroke="#1745C4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="6,27 22,35 38,27"
                fill="none"
                stroke="#1745C4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="pillar-title">
              Get
              <br />
              Recommendations
            </span>
          </button>

          <div className="pillar-divider" />

          <button
            className="hero-pillar-item"
            onClick={() => onNavigate("Platform", "batch")}
          >
            <svg viewBox="0 0 40 40" className="pillar-icon">
              {[7, 17, 27].map((x) =>
                [7, 17, 27].map((y) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width="6.5"
                    height="6.5"
                    rx="1"
                    fill="none"
                    stroke="#1745C4"
                    strokeWidth="2.1"
                  />
                ))
              )}
            </svg>
            <span className="pillar-title">
              Screen
              <br />
              at Scale
            </span>
          </button>
        </div>
      </section>

      {/* ================= 2. KINETIC ARCHIVAL TICKER STRIP ================= */}
      <div className="archival-marquee-bar">
        <div className="marquee-track">
          <span>★ 2D ORGANIC SKELETAL BLUEPRINTS &amp; 3D CONFORMER ENGINE</span>
          <span>•</span>
          <span>DUAL 4-LAYER GINECONV GRAPH NEURAL NETWORK</span>
          <span>•</span>
          <span>561,754 SYMMETRY-AUGMENTED DRUGCOMB SAMPLES</span>
          <span>•</span>
          <span>R² = 0.6137 TEST PERFORMANCE</span>
          <span>•</span>
          <span>8-CATEGORY SMARTS &amp; LIPINSKI TOXICITY PROFILING</span>
          <span>•</span>
          <span>288 DEPMAP CANCER CELL LINE EMBEDDINGS</span>
          <span>•</span>
          <span>★ 2D ORGANIC SKELETAL BLUEPRINTS &amp; 3D CONFORMER ENGINE</span>
          <span>•</span>
          <span>561,754 SYMMETRY-AUGMENTED DRUGCOMB SAMPLES</span>
        </div>
      </div>

      {/* 3D Paclitaxel Conformer Preview */}
      <section className="home-paclitaxel-3d-section">
        <div className="paclitaxel-preview-wrapper torn-card-border">
          <div className="home-paclitaxel-3d-frame">
            <MoleculeBlueprintCanvas
              smiles={PACLITAXEL_DATA.smiles}
              title={`${PACLITAXEL_DATA.name} • MW ${PACLITAXEL_DATA.mw} Da`}
              theme="blueprint"
              height={460}
              initialMode="3d-ball"
            />
          </div>

          <div className="paclitaxel-preview-copy">
            <span className="kicker-tape-coral">LIVE 3D TEASER • 1 OF 650+ COMPOUNDS</span>
            <h2 className="editorial-section-title">
              Grab, Spin &amp; Zoom <em>Paclitaxel in 3D</em>
            </h2>
            <p className="typewriter-subtitle">
              Drag the molecule on the left to rotate 360°, hover any atom for 3D coordinates, or
              click <strong>3D CPK</strong>. This is just one compound—unlock the full interactive
              3D conformer engine to inspect every drug in our oncology catalog.
            </p>

            <HandwrittenAnnotation
              text="← Try dragging or zooming right now!"
              color="#1745C4"
              rotate={-2}
              arrowDir="none"
              className="preview-hand-hook"
            />

            <div className="preview-locked-chips">
              <button
                type="button"
                className="preview-teaser-chip"
                onClick={() => onNavigate("3D Explorer")}
              >
                🔒 DOXORUBICIN 3D
              </button>
              <button
                type="button"
                className="preview-teaser-chip"
                onClick={() => onNavigate("3D Explorer")}
              >
                🔒 OLAPARIB 3D
              </button>
              <button
                type="button"
                className="preview-teaser-chip"
                onClick={() => onNavigate("3D Explorer")}
              >
                🔒 IMATINIB 3D
              </button>
              <button
                type="button"
                className="preview-teaser-chip chip-more"
                onClick={() => onNavigate("3D Explorer")}
              >
                + 646 More Drugs ↗
              </button>
            </div>

            <button
              type="button"
              className="btn-moving-cobalt preview-launch-btn"
              onClick={() => onNavigate("3D Explorer")}
            >
              <span>Unlock All 650+ Compounds in 3D Explorer</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 3. INTERACTIVE QUICK-TEST BENCH ON HOME ================= */}
      <section className="home-quicktest-section">
        <div className="section-collage-header">
          <div className="kicker-tape-yellow">ARCHIVAL LAB BENCH • INTERACTIVE PREVIEW</div>
          <h2 className="editorial-section-title">
            Test Validated <em>Oncology Combinations</em> Instantly
          </h2>
          <p className="typewriter-subtitle">
            Click any reference regimen below to inspect its 2D Organic Blueprint or 3D structure,
            GNN ZIP synergy score, and multi-organ safety index—or launch it in the full predictor.
          </p>
        </div>

        <div className="quicktest-pills-row">
          {HERO_DEMO_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              onClick={() => setActivePairIdx(idx)}
              className={`quicktest-pill-btn ${activePairIdx === idx ? "active" : ""}`}
            >
              <span className="pill-idx">0{idx + 1}</span>
              <span className="pill-names">
                {pair.drugA} + {pair.drugB}
              </span>
              <span className="pill-cell">{pair.cellLine}</span>
            </button>
          ))}
        </div>

        <div className="quicktest-stage-card torn-card-border">
          <div className="qt-molecules-col">
            <div className="qt-mol-box">
              <MoleculeBlueprintCanvas
                smiles={activePair.smilesA}
                title={`DRUG A: ${activePair.drugA}`}
                theme="blueprint"
                height={235}
                initialMode="2d"
              />
            </div>
            <div className="qt-plus-badge">+</div>
            <div className="qt-mol-box">
              <MoleculeBlueprintCanvas
                smiles={activePair.smilesB}
                title={`DRUG B: ${activePair.drugB}`}
                theme="blueprint"
                height={235}
                initialMode="2d"
              />
            </div>
          </div>

          <div className="qt-readout-col">
            <div className="qt-context-tags">
              <span className="tag-cobalt">{activePair.cancer}</span>
              <span className="tag-pink">Cell Line: {activePair.cellLine}</span>
              <span className="tag-yellow">Safety Index: {activePair.safety}</span>
            </div>
            <h3 className="qt-pair-heading">
              {activePair.drugA} <em>&times;</em> {activePair.drugB}
            </h3>
            <p className="qt-mechanism-note">
              <strong>Mechanism Hypothesis:</strong> {activePair.note}
            </p>
            <div className="qt-metrics-strip">
              <div className="qt-metric-box bg-yellow">
                <small>ZIP SYNERGY</small>
                <strong>{activePair.zipRaw}</strong>
              </div>
              <div className="qt-metric-box bg-coral">
                <small>NORMALIZED INDEX</small>
                <strong>{activePair.score}</strong>
              </div>
              <div className="qt-metric-box bg-cream">
                <small>CLASSIFICATION</small>
                <strong>{activePair.label}</strong>
              </div>
            </div>
            <div className="qt-actions">
              <button
                className="btn-moving-cobalt"
                onClick={() => {
                  onQuickTestPair({
                    drugA: activePair.drugA,
                    drugB: activePair.drugB,
                    cancerType: activePair.cancer,
                    cellLine: activePair.cellLine
                  });
                }}
              >
                <span>Open Full 8-Organ Analysis in Platform</span>
                <span className="btn-arrow">↗</span>
              </button>
            </div>
          </div>

          <ResearchStampSticker
            topText="GINECONV • 4-LAYER"
            bottomText="ORGANIC BLUEPRINT"
            centerText={activePair.zipRaw}
            color="#1745C4"
            size={105}
            className="qt-floating-stamp float-sticker-safe"
          />
        </div>
      </section>

      {/* ================= 4. 4-WAY ARCHIVAL ZINE BENTO SHOWCASE ================= */}
      <section className="home-bento-section">
        <div className="bento-grid">
          <div className="bento-card bento-blue">
            <div className="bento-num">MODE 01</div>
            <h3>Single Pair &amp; 8-Organ Toxicity Predictor</h3>
            <p>
              Select from 650+ curated oncology compounds across 16 cancer lineages and 155 DepMap
              cell lines. Inspect large 2D Organic Blueprints or 3D structures, ZIP synergy, and 8
              SMARTS toxicity categories.
            </p>
            <button
              onClick={() => onNavigate("Platform", "single")}
              className="btn-moving-yellow"
            >
              <span>Launch Single Predictor</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>

          <div className="bento-card bento-coral">
            <div className="bento-num">MODE 02</div>
            <h3>Custom SMILES Chemical Sandbox</h3>
            <p>
              Designing a novel chemical scaffold? Paste any canonical SMILES string to construct
              its 2D Organic &amp; 3D molecular graph on the fly and run de-novo GNN synergy inference.
            </p>
            <button
              onClick={() => onNavigate("Platform", "smiles")}
              className="btn-moving-cream"
            >
              <span>Open SMILES Sandbox</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>

          <div className="bento-card bento-yellow">
            <div className="bento-num">MODE 03</div>
            <h3>AI Combination Recommendation Engine</h3>
            <p>
              Choose a target cancer type and cell line to rank top synergistic drug pairs balancing
              70% ZIP efficacy with 30% multi-organ safety profile.
            </p>
            <button
              onClick={() => onNavigate("Platform", "recommend")}
              className="btn-moving-cobalt"
            >
              <span>Explore Top Combinations</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>

          <div className="bento-card bento-pink">
            <div className="bento-num">MODE 04</div>
            <h3>High-Throughput Batch CSV Screening</h3>
            <p>
              Upload multi-pair CSV libraries for automated SMILES validation, batch GNN inference,
              synergy distribution analytics, and 1-click report export.
            </p>
            <button
              onClick={() => onNavigate("Platform", "batch")}
              className="btn-moving-ink"
            >
              <span>Run Batch Screening</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 5. WET-LAB BOTTLENECK VS. SYNERLYTICS DUAL-GNN BREAKTHROUGH ================= */}
      <section className="landing-comparison-section">
        <div className="section-collage-header">
          <div className="kicker-tape-yellow">WHY IN-SILICO COMBINATION ONCOLOGY MATTERS</div>
          <h2 className="editorial-section-title">
            From 9 Million Wet-Lab Assays to <em>Millisecond GNN Inference</em>
          </h2>
        </div>

        <div className="comparison-zine-grid">
          <div className="comparison-card comp-traditional">
            <span className="wb-step-badge bg-ink">TRADITIONAL WET-LAB SCREENING</span>
            <h3>Combinatorial Bottleneck</h3>
            <ul className="comp-points-list">
              <li>
                <strong>9,105,778+ Possible Pairs</strong> across 4,268 drugs per single cancer cell
                line—impossible to test exhaustively in vitro.
              </li>
              <li>
                <strong>Months of Plate Assays</strong> and high reagent costs before discovering
                whether a pair is synergistic or antagonistic.
              </li>
              <li>
                <strong>Late-Stage Toxicity Failures</strong> when multi-organ cumulative side
                effects appear only during animal or clinical trials.
              </li>
            </ul>
          </div>

          <div className="comparison-card comp-synerlytics">
            <div className="comp-header-row">
              <span className="wb-step-badge bg-coral">THE SYNERLYTICS BREAKTHROUGH</span>
              <ResearchStampSticker
                topText="DRUGCOMB 561K"
                bottomText="R² = 0.6137"
                centerText="10x FASTER"
                color="#F6CA37"
                size={92}
              />
            </div>
            <h3>Dual 4-Layer GINEConv + 8-Organ Biosafety</h3>
            <ul className="comp-points-list">
              <li>
                <strong>Instant Continuous ZIP Prediction</strong> trained on 561,754 symmetry-augmented
                DrugComb experimental assays (R² = 0.6137, MAE = 3.84).
              </li>
              <li>
                <strong>De-Novo SMILES Generalization</strong> converts any novel chemical structure
                into a 5D-node / 1D-edge graph for zero-shot synergy prediction.
              </li>
              <li>
                <strong>Simultaneous 8-Organ Toxicity Radar</strong> screens Hepatotoxicity,
                Nephrotoxicity, Cardiotoxicity, Neurotoxicity, GI, Skin, CNS, and Metabolic risk.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= 6. HIGH-RESOLUTION ARCHIVAL SCIENCE STICKERS & PIONEERS WALL ================= */}
      <section className="landing-stickers-wall-section">
        <div className="section-collage-header">
          <div className="kicker-tape-coral">ARCHIVAL PHOTOGRAPHY &amp; RESEARCH STICKERS</div>
          <h2 className="editorial-section-title">
            A Century of <em>Oncology &amp; Pharmacology</em> Discovery
          </h2>
          <p className="typewriter-subtitle">
            Hover or click any high-resolution archival sticker below to inspect the visual heritage
            behind modern computational drug combination discovery.
          </p>
        </div>

        <div className="stickers-wall-grid">
          {ARCHIVAL_STICKER_GALLERY.map((st) => (
            <div
              key={st.title}
              className="landing-sticker-card"
              onClick={() => onNavigate("Platform", "single")}
            >
              <div className="sticker-card-img-wrap">
                <img src={st.img} alt={st.title} className="sticker-gallery-img" />
              </div>
              <div className="sticker-card-meta">
                <span className="cat-index-tag">{st.tag}</span>
                <h4>{st.title}</h4>
                <p>{st.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 7. 17 CANCER LINEAGES COVERAGE & GRAND LAUNCH CTA ================= */}
      <section className="landing-lineages-cta-section">
        <div className="lineages-poster-card torn-card-border">
          <div className="poster-top-row">
            <div>
              <span className="kicker-tape-yellow">288 DEPMAP CELL LINES • 17 CANCER LINEAGES</span>
              <h2 className="editorial-section-title text-cream">
                Precision Context Across <em>Every Major Cancer Type</em>
              </h2>
            </div>
            <HandwrittenAnnotation
              text="Click any lineage to launch!"
              color="#F6CA37"
              rotate={-3}
              arrowDir="none"
            />
          </div>

          <div className="lineage-chips-cloud">
            {CANCER_LINEAGES_LIST.map((lin) => (
              <button
                key={lin}
                onClick={() => onNavigate("Platform", "recommend")}
                className="lineage-sticker-chip"
              >
                <span>✦ {lin}</span>
              </button>
            ))}
          </div>

          <div className="poster-bottom-cta">
            <button
              onClick={() => onNavigate("Platform", "single")}
              className="btn-moving-yellow"
            >
              <span>Launch the 4-Mode Prediction Workbench</span>
              <span className="btn-arrow">↗</span>
            </button>
            <button
              onClick={() => onNavigate("3D Explorer")}
              className="btn-moving-coral-cta"
            >
              <span>Open 3D Interactive Molecule Engine</span>
              <span className="btn-arrow">↗</span>
            </button>
            <button
              onClick={() => onNavigate("Datasets")}
              className="btn-moving-cream"
            >
              <span>Browse 650+ 2D Organic Drug Catalog</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= WATCH DEMO (2 MIN) INTERACTIVE MODAL ================= */}
      {showDemoModal && (
        <div className="archival-modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div className="archival-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-tape-header">
              <span>ARCHIVAL FILM REEL • HOW SYNERLYTICS WORKS (2 MIN OVERVIEW)</span>
              <button className="modal-close-btn" onClick={() => setShowDemoModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body-grid">
              <div className="modal-step-card">
                <span className="step-badge">STEP 01</span>
                <h4>2D Organic &amp; 3D Molecular Graph</h4>
                <p>
                  Each drug SMILES string is converted into an organic ring-polygon skeletal graph
                  and 3D conformer where atoms carry 5D node features and bonds carry 1D edge weights.
                </p>
              </div>
              <div className="modal-step-card">
                <span className="step-badge">STEP 02</span>
                <h4>Dual 4-Layer GINEConv Encoder</h4>
                <p>
                  Both drug graphs pass through 4 shared Graph Isomorphism Network layers with edge
                  features (GINEConv), BatchNorm1d, ReLU, and global mean pooling to yield two
                  192-dimensional molecular embeddings.
                </p>
              </div>
              <div className="modal-step-card">
                <span className="step-badge">STEP 03</span>
                <h4>Cancer &amp; Cell Line Integration</h4>
                <p>
                  The two 192-d drug vectors are concatenated with a 17-d Cancer Type one-hot vector
                  and a learned 48-d DepMap Cell Line embedding (449 dimensions total) and passed
                  through a 3-layer MLP head (449 &rarr; 512 &rarr; 256 &rarr; 1).
                </p>
              </div>
              <div className="modal-step-card">
                <span className="step-badge">STEP 04</span>
                <h4>ZIP Synergy + 8-Organ Toxicity</h4>
                <p>
                  The model outputs a continuous ZIP synergy score alongside a rule-based SMARTS
                  &amp; Lipinski toxicity assessment across 8 organ systems, combined via{" "}
                  <code>1 - (1 - R_A)(1 - R_B)</code>.
                </p>
              </div>
            </div>
            <div className="modal-footer-actions">
              <button
                className="btn-moving-cobalt"
                onClick={() => {
                  setShowDemoModal(false);
                  onNavigate("Platform", "single");
                }}
              >
                <span>Launch Interactive Platform Now</span>
                <span className="btn-arrow">↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
