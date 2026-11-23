import React, { useState, useMemo, useEffect } from "react";
import MoleculeBlueprintCanvas from "./MoleculeBlueprintCanvas";
import {
  ResearchStampSticker,
  HandwrittenAnnotation
} from "./CollageStickers";
import {
  TOXICITY_CATEGORIES,
  classifyRiskLevel
} from "../utils/chemistryEngine";

export default function ThreeDExplorerView({
  dataset,
  initialDrugName,
  onSendDrugToPredictor
}) {
  const drugs = dataset?.drugs || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrugName, setSelectedDrugName] = useState(
    initialDrugName || drugs[0]?.name || "PACLITAXEL"
  );
  const [bgTheme, setBgTheme] = useState("blueprint");
  const [copiedSmiles, setCopiedSmiles] = useState(false);

  useEffect(() => {
    if (initialDrugName && drugs.some((d) => d.name === initialDrugName)) {
      setSelectedDrugName(initialDrugName);
    }
  }, [initialDrugName, drugs]);

  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.smiles.toLowerCase().includes(q) ||
        (d.inchikey && d.inchikey.toLowerCase().includes(q))
    );
  }, [drugs, searchQuery]);

  const activeDrug = useMemo(() => {
    return drugs.find((d) => d.name === selectedDrugName) || filteredDrugs[0] || drugs[0];
  }, [drugs, selectedDrugName, filteredDrugs]);

  return (
    <div className="secondary-page-wrapper">
      {/* HEADER BANNER */}
      <div className="page-collage-hero hero-tint-blue">
        <div className="hero-banner-content">
          <div className="kicker-tape-coral">3D INTERACTIVE CHEMOINFORMATICS ENGINE</div>
          <h1 className="editorial-page-title text-cream">
            Explore 3D <em>Zoomable Molecular Structures</em>
          </h1>
          <p className="typewriter-subtitle text-cream-soft">
            Every chemical structure in Synerlytics is rendered in real-time 3D. Drag to rotate
            360°, scroll or click <code>＋ / －</code> to zoom, hover any atom to inspect its 3D
            coordinates, and switch between <strong>3D Ball &amp; Stick</strong>,{" "}
            <strong>3D CPK Spacefill</strong>, and <strong>2D Organic Blueprint</strong> across all{" "}
            {drugs.length}+ indexed compounds.
          </p>
        </div>
        <ResearchStampSticker
          topText="650+ 3D CONFORMERS"
          bottomText="360° INTERACTIVE"
          centerText="3D LAB"
          color="#F6CA37"
          size={112}
        />
      </div>

      {/* MAIN 3-COLUMN 3D EXPLORER WORKBENCH */}
      <div className="explorer-3d-full-grid torn-card-border">
        {/* LEFT COLUMN: SEARCHABLE ALL-COMPOUND DIRECTORY (ALL 650+ DRUGS) */}
        <div className="explorer-compound-sidebar">
          <div className="wb-card-header">
            <span className="wb-step-badge bg-ink">
              ALL COMPOUNDS ({filteredDrugs.length})
            </span>
            <HandwrittenAnnotation
              text="Pick any drug!"
              color="#1745C4"
              rotate={-2}
              arrowDir="none"
            />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any of 650+ compounds..."
            className="wb-filter-input mb-8"
          />

          <select
            value={activeDrug?.name || ""}
            onChange={(e) => setSelectedDrugName(e.target.value)}
            className="wb-select"
          >
            {filteredDrugs.slice(0, 300).map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} (MW: {d.mw} Da)
              </option>
            ))}
          </select>

          <div className="explorer-scrollable-drug-list">
            {filteredDrugs.slice(0, 120).map((d) => (
              <button
                key={d.name}
                onClick={() => setSelectedDrugName(d.name)}
                className={`mol-pick-btn ${activeDrug?.name === d.name ? "active" : ""}`}
              >
                <div className="mol-pick-top">
                  <strong>{d.name}</strong>
                  <span className="mol-pick-tag">{d.mw} Da</span>
                </div>
                <small>
                  LogP: {d.logp} • TPSA: {d.tpsa} • {d.atoms}A / {d.bonds}B
                </small>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: LARGE 3D INTERACTIVE & ZOOMABLE VIEWPORT */}
        <div className="explorer-3d-center-stage">
          <div className="explorer-stage-toolbar">
            <div>
              <span className="wb-step-badge bg-cobalt">ACTIVE 3D CONFORMER VIEWPORT</span>
              <strong className="ml-8">{activeDrug?.name}</strong>
            </div>
            <div className="theme-toggle-group">
              <button
                type="button"
                onClick={() => setBgTheme("blueprint")}
                className={`btn-small-sticker ${bgTheme === "blueprint" ? "active-theme-btn" : ""}`}
              >
                Blueprint Grid
              </button>
              <button
                type="button"
                onClick={() => setBgTheme("paper")}
                className={`btn-small-sticker ${bgTheme === "paper" ? "active-theme-btn" : ""}`}
              >
                Archival Paper
              </button>
            </div>
          </div>

          {activeDrug && (
            <MoleculeBlueprintCanvas
              smiles={activeDrug.smiles}
              title={`${activeDrug.name} • MW ${activeDrug.mw} Da`}
              theme={bgTheme}
              height={460}
              initialMode="3d-ball"
            />
          )}

          <div className="explorer-smiles-bar">
            <div className="smiles-code-scroll">
              <code>SMILES: {activeDrug?.smiles}</code>
            </div>
            <button
              className="btn-small-sticker"
              onClick={() => {
                if (activeDrug?.smiles) {
                  navigator.clipboard?.writeText(activeDrug.smiles);
                  setCopiedSmiles(true);
                  setTimeout(() => setCopiedSmiles(false), 1800);
                }
              }}
            >
              {copiedSmiles ? "✓ Copied" : "Copy SMILES"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLETE PHYSICOCHEMICAL & 8-ORGAN BIOSAFETY DOSSIER */}
        {activeDrug && (
          <div className="mol-3d-dossier-col">
            <div>
              <span className="wb-step-badge bg-coral">COMPOUND TELEMETRY DOSSIER</span>
              <h3 className="qt-pair-heading mt-8">{activeDrug.name}</h3>
              {activeDrug.inchikey && (
                <small className="inchikey-badge">InChIKey: {activeDrug.inchikey}</small>
              )}

              <div className="descriptor-chips-grid mt-12 mb-12">
                <span>MW: {activeDrug.mw} Da</span>
                <span>LogP: {activeDrug.logp}</span>
                <span>TPSA: {activeDrug.tpsa} Å²</span>
                <span>HBD: {activeDrug.hbd}</span>
                <span>HBA: {activeDrug.hba}</span>
                <span>Rings: {activeDrug.aromatic_rings}</span>
                <span>RotBonds: {activeDrug.rotatable_bonds}</span>
                <span>Atoms: {activeDrug.atoms}</span>
                <span>Bonds: {activeDrug.bonds}</span>
              </div>

              <h4 className="dossier-sub-h4">8-Organ Intrinsic Toxicity Profile</h4>
              <div className="explorer-tox-mini-list">
                {TOXICITY_CATEGORIES.map((cat) => {
                  const val = activeDrug.toxicity?.[cat.key] ?? 0.2;
                  const rInfo = classifyRiskLevel(val);
                  return (
                    <div key={cat.key} className="exp-tox-row">
                      <span>{cat.label}</span>
                      <div className="organ-bar-track">
                        <div
                          className={`organ-bar-fill ${
                            val >= 0.7 ? "fill-coral" : val >= 0.4 ? "fill-yellow" : "fill-blue"
                          }`}
                          style={{ width: `${Math.round(val * 100)}%` }}
                        />
                      </div>
                      <strong>{val.toFixed(2)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="explorer-cta-stack mt-16">
              <button
                className="btn-moving-cobalt btn-full-width"
                onClick={() => onSendDrugToPredictor(activeDrug.name, "A")}
              >
                <span>Use as Drug A in Predictor</span>
                <span className="btn-arrow">↗</span>
              </button>
              <button
                className="btn-moving-yellow btn-full-width"
                onClick={() => onSendDrugToPredictor(activeDrug.name, "B")}
              >
                <span>Use as Drug B in Predictor</span>
                <span className="btn-arrow">↗</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
