import React, { useState, useMemo } from "react";
import MoleculeBlueprintCanvas from "./MoleculeBlueprintCanvas";
import {
  ResearchStampSticker,
  HandwrittenAnnotation
} from "./CollageStickers";
import { TOXICITY_CATEGORIES } from "../utils/chemistryEngine";

// ============================================================================
// 1. RESEARCH PAGE — Dual 4-Layer GINEConv Architecture & Benchmark Dossier
// ============================================================================
export function ResearchView({ onNavigate }) {
  const [selectedLayer, setSelectedLayer] = useState(0);

  const layerDetails = [
    {
      title: "Layer 01 • Molecular Graph Featurization (RDKit → PyGData)",
      tensor: "Node x: [N_atoms, 5] • Edge edge_attr: [N_bonds * 2, 1]",
      desc: "Every SMILES string is parsed into an undirected molecular graph. Each atom carries 5 features: Atomic Number, Total Hydrogens, Node Degree, Implicit Valence, and Aromaticity boolean (0/1). Each chemical bond is encoded bidirectionally as Single (1.0), Aromatic (1.5), Double (2.0), or Triple (3.0)."
    },
    {
      title: "Layer 02 • Dual 4-Layer GINEConv Shared Encoder",
      tensor: "4 × GINEConv(5→192→192) + BatchNorm1d(192) + GlobalMeanPool → [1, 192]",
      desc: "Drug A and Drug B pass through weight-shared 4-layer Graph Isomorphism Network with Edge features (GINEConv) blocks. Edge scalars are projected into node space via Linear(1→192), added to neighbor node states, passed through a 2-layer MLP with BatchNorm1d and ReLU, and aggregated via Global Mean Pooling into two 192-dimensional drug embeddings."
    },
    {
      title: "Layer 03 • Oncology Context Concatenation (449-Dim Fusion)",
      tensor: "Concat([emb1(192), emb2(192), cancer_onehot(17), cell_emb(48)]) → [1, 449]",
      desc: "To capture tissue-specific and genomic sensitivity, the two 192-d drug vectors are fused with a 17-dimensional Cancer Lineage one-hot vector and a learned 48-dimensional Cell Line Embedding table covering 288 distinct DepMap cancer cell lines."
    },
    {
      title: "Layer 04 • Deep MLP Prediction Head & Inverse ZIP Scaling",
      tensor: "Linear(449→512) → Dropout(0.3) → Linear(512→256) → Linear(256→1)",
      desc: "The 449-dimensional multimodal vector passes through three fully connected layers with ReLU activations and 0.3 dropout regularization. Output logits are inverse-transformed using the trained StandardScaler (mean = -0.1458, std = 8.5355) to yield the continuous ZIP Synergy Score."
    }
  ];

  return (
    <div className="secondary-page-wrapper">
      <div className="page-collage-hero hero-tint-blue">
        <div className="hero-banner-content">
          <div className="kicker-tape-yellow">PEER-GRADE METHODOLOGY • GRAPH DEEP LEARNING</div>
          <h1 className="editorial-page-title text-cream">
            Dual GINEConv <em>Graph Neural Network</em> Architecture
          </h1>
          <p className="typewriter-subtitle text-cream-soft">
            Trained on 561,754 symmetry-augmented DrugComb combinations across 288 DepMap cell lines
            and 17 cancer lineages, achieving R² = 0.6137 and MAE = 3.84 on held-out test combinations.
          </p>
        </div>
        <ResearchStampSticker
          topText="TEST SET R² = 0.6137"
          bottomText="MAE = 3.84 (10.7%)"
          centerText="GINEConv"
          color="#F6CA37"
          size={115}
        />
      </div>

      {/* INTERACTIVE ARCHITECTURE PIPELINE */}
      <section className="arch-pipeline-section">
        <div className="section-header-row">
          <div>
            <span className="kicker-tape-coral">INTERACTIVE TENSOR BLUEPRINT</span>
            <h2>Click Any Pipeline Stage to Inspect PyTorch Tensor Shapes</h2>
          </div>
          <HandwrittenAnnotation
            text="Exact weights from final_gnn_model.pt!"
            color="#1745C4"
            rotate={-3}
            arrowDir="none"
          />
        </div>

        <div className="pipeline-nodes-grid">
          {layerDetails.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedLayer(idx)}
              className={`pipeline-stage-card ${selectedLayer === idx ? "active" : ""}`}
            >
              <span className="stage-num">STAGE 0{idx + 1}</span>
              <h4>{item.title}</h4>
              <code className="stage-tensor-pill">{item.tensor}</code>
            </button>
          ))}
        </div>

        <div className="pipeline-detail-dossier torn-card-border">
          <div className="detail-dossier-left">
            <span className="wb-step-badge bg-cobalt">
              ACTIVE LAYER INSPECTION • STAGE 0{selectedLayer + 1}
            </span>
            <h3>{layerDetails[selectedLayer].title}</h3>
            <p className="dossier-desc-p">{layerDetails[selectedLayer].desc}</p>
            <div className="tensor-code-box">
              <code>{layerDetails[selectedLayer].tensor}</code>
            </div>
          </div>

          <div className="detail-dossier-right">
            <div className="arch-diagram-svg-box">
              <svg viewBox="0 0 460 190" className="gnn-flow-svg">
                <rect x="10" y="20" width="95" height="62" rx="6" fill="#1745C4" stroke="#171717" strokeWidth="2.5" />
                <text x="57" y="47" textAnchor="middle" fill="#F5EBDD" fontSize="11" fontWeight="700">DRUG A GRAPH</text>
                <text x="57" y="65" textAnchor="middle" fill="#F6CA37" fontSize="9.5" fontFamily="monospace">GINEConv → 192d</text>

                <rect x="10" y="105" width="95" height="62" rx="6" fill="#1745C4" stroke="#171717" strokeWidth="2.5" />
                <text x="57" y="132" textAnchor="middle" fill="#F5EBDD" fontSize="11" fontWeight="700">DRUG B GRAPH</text>
                <text x="57" y="150" textAnchor="middle" fill="#F6CA37" fontSize="9.5" fontFamily="monospace">GINEConv → 192d</text>

                <rect x="135" y="20" width="95" height="62" rx="6" fill="#E99BC4" stroke="#171717" strokeWidth="2.5" />
                <text x="182" y="47" textAnchor="middle" fill="#171717" fontSize="10.5" fontWeight="700">CANCER TYPE</text>
                <text x="182" y="65" textAnchor="middle" fill="#171717" fontSize="9.5" fontFamily="monospace">One-Hot → 17d</text>

                <rect x="135" y="105" width="95" height="62" rx="6" fill="#F6CA37" stroke="#171717" strokeWidth="2.5" />
                <text x="182" y="132" textAnchor="middle" fill="#171717" fontSize="10.5" fontWeight="700">CELL LINE EMB</text>
                <text x="182" y="150" textAnchor="middle" fill="#171717" fontSize="9.5" fontFamily="monospace">288×48 → 48d</text>

                <rect x="255" y="55" width="92" height="78" rx="8" fill="#F5EBDD" stroke="#171717" strokeWidth="3" />
                <text x="301" y="85" textAnchor="middle" fill="#171717" fontSize="11" fontWeight="800">MLP HEAD</text>
                <text x="301" y="103" textAnchor="middle" fill="#1745C4" fontSize="9.5" fontFamily="monospace">449→512→256</text>
                <text x="301" y="119" textAnchor="middle" fill="#F04B32" fontSize="9" fontFamily="monospace">Dropout 0.3</text>

                <rect x="372" y="62" width="78" height="64" rx="8" fill="#F04B32" stroke="#171717" strokeWidth="3" />
                <text x="411" y="88" textAnchor="middle" fill="#F5EBDD" fontSize="10.5" fontWeight="700">ZIP SCORE</text>
                <text x="411" y="110" textAnchor="middle" fill="#F6CA37" fontSize="16" fontWeight="900" fontFamily="serif">+0.82</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* TRAINING & BENCHMARK METRICS */}
      <section className="research-metrics-grid">
        <div className="workbench-card card-tint-yellow">
          <span className="wb-step-badge bg-ink">MODEL PERFORMANCE (TEST SET)</span>
          <div className="metric-big-list">
            <div className="m-item">
              <span>R² Coefficient of Determination</span>
              <strong>0.6137</strong>
            </div>
            <div className="m-item">
              <span>Mean Absolute Error (MAE)</span>
              <strong>3.84 ZIP (10.7% range)</strong>
            </div>
            <div className="m-item">
              <span>Root Mean Squared Error (RMSE)</span>
              <strong>5.31 ZIP (14.7% range)</strong>
            </div>
            <div className="m-item">
              <span>Symmetry-Augmented Dataset</span>
              <strong>561,754 samples</strong>
            </div>
          </div>
        </div>

        <div className="workbench-card card-tint-cream">
          <span className="wb-step-badge bg-cobalt">TRAINING HYPERPARAMETERS</span>
          <div className="metric-big-list">
            <div className="m-item">
              <span>Optimizer &amp; Loss</span>
              <strong>AdamW (lr=1e-3, wd=1e-5) • MSE</strong>
            </div>
            <div className="m-item">
              <span>LR Scheduler</span>
              <strong>CosineAnnealingWarmRestarts (T_0=10)</strong>
            </div>
            <div className="m-item">
              <span>Batch Size &amp; Gradient Clipping</span>
              <strong>128 • max_norm = 1.0</strong>
            </div>
            <div className="m-item">
              <span>Acceleration &amp; Split</span>
              <strong>AMP Mixed Precision • 80/20 Split</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// 2. DATASETS PAGE — Searchable 650+ 2D Organic Drug Catalog & DepMap Atlas
// ============================================================================
export function DatasetsView({
  dataset,
  onSendDrugToPredictor,
  onOpenCellLineInRecommender,
  onOpenIn3DExplorer
}) {
  const [subTab, setSubTab] = useState("drugs");
  const [searchQuery, setSearchQuery] = useState("");
  const [lineageFilter, setLineageFilter] = useState("ALL");
  const [copiedSmiles, setCopiedSmiles] = useState(null);
  const [hoveredDrugName, setHoveredDrugName] = useState(null);

  const drugs = dataset?.drugs || [];
  const depmap = dataset?.depmap_samples || [];

  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drugs.slice(0, 48);
    return drugs
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.smiles.toLowerCase().includes(q) ||
          (d.inchikey && d.inchikey.toLowerCase().includes(q))
      )
      .slice(0, 60);
  }, [drugs, searchQuery]);

  const lineages = useMemo(() => {
    const set = new Set(depmap.map((s) => s.primary_disease).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [depmap]);

  const filteredCells = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return depmap
      .filter((s) => {
        const matchLin = lineageFilter === "ALL" || s.primary_disease === lineageFilter;
        const matchQ =
          !q ||
          s.cell_line.toLowerCase().includes(q) ||
          s.primary_disease.toLowerCase().includes(q) ||
          s.subtype.toLowerCase().includes(q) ||
          s.depmap_id.toLowerCase().includes(q);
        return matchLin && matchQ;
      })
      .slice(0, 60);
  }, [depmap, searchQuery, lineageFilter]);

  return (
    <div className="secondary-page-wrapper">
      <div className="page-collage-hero hero-tint-coral">
        <div className="hero-banner-content">
          <div className="kicker-tape-yellow">2D ORGANIC SKELETAL BLUEPRINTS &amp; GENOMIC ATLAS</div>
          <h1 className="editorial-page-title text-cream">
            DrugComb &amp; DepMap <em>Archival Datasets</em>
          </h1>
          <p className="typewriter-subtitle text-cream-soft">
            Hover over any 2D Organic compound card below to expand its full structural blueprint,
            physicochemical descriptors, 8-organ toxicity breakdown, and 1-click Drug A / Drug B
            predictor actions.
          </p>
        </div>
        <ResearchStampSticker
          topText="4,268 DRUG SMILES"
          bottomText="2D ORGANIC ATLAS"
          centerText="ATLAS"
          color="#F5EBDD"
          size={112}
        />
      </div>

      {/* DATASET SWITCHER & SEARCH BAR */}
      <div className="dataset-controls-bar torn-card-border">
        <div className="dataset-tabs">
          <button
            onClick={() => setSubTab("drugs")}
            className={`platform-tab-btn ${subTab === "drugs" ? "active" : ""}`}
          >
            <span className="tab-num">01</span>
            <div className="tab-text">
              <strong>2D Organic Compound Catalog</strong>
              <small>{drugs.length} Indexed Compounds (Hover to Expand)</small>
            </div>
          </button>
          <button
            onClick={() => setSubTab("cells")}
            className={`platform-tab-btn ${subTab === "cells" ? "active" : ""}`}
          >
            <span className="tab-num">02</span>
            <div className="tab-text">
              <strong>DepMap Cancer Cell Line Atlas</strong>
              <small>{depmap.length} Genomic Cell Lines</small>
            </div>
          </button>
        </div>

        <div className="dataset-search-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subTab === "drugs"
                ? "Search compound name (e.g. PACLITAXEL, OLAPARIB), SMILES, or InChIKey..."
                : "Search cell line (e.g. MCF7, A549), DepMap ID, or cancer subtype..."
            }
            className="dataset-search-input"
          />
          {subTab === "cells" && (
            <select
              value={lineageFilter}
              onChange={(e) => setLineageFilter(e.target.value)}
              className="wb-select-inline"
            >
              {lineages.map((l) => (
                <option key={l} value={l}>
                  {l === "ALL" ? "All Primary Diseases" : l}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {subTab === "drugs" ? (
        <div className="drug-catalog-grid">
          {filteredDrugs.map((drug, idx) => {
            const isHovered = hoveredDrugName === drug.name;
            return (
              <div
                key={drug.name}
                onMouseEnter={() => setHoveredDrugName(drug.name)}
                onMouseLeave={() => setHoveredDrugName(null)}
                className={`catalog-drug-card organic-hover-card ${
                  isHovered ? "is-hovered-expanded" : ""
                }`}
              >
                <div className="cat-card-header">
                  <div>
                    <span className="cat-index-tag">2D ORGANIC COMPOUND #{idx + 1}</span>
                    <h4>{drug.name}</h4>
                  </div>
                  <button
                    className="btn-copy-smiles"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard?.writeText(drug.smiles);
                      setCopiedSmiles(drug.name);
                      setTimeout(() => setCopiedSmiles(null), 1800);
                    }}
                  >
                    {copiedSmiles === drug.name ? "✓ Copied" : "Copy SMILES"}
                  </button>
                </div>

                {/* 2D Organic Blueprint Canvas — Automatically grows larger when card is hovered*/}
                <MoleculeBlueprintCanvas
                  smiles={drug.smiles}
                  title={drug.inchikey || "2D Organic Structure"}
                  theme="blueprint"
                  height={isHovered ? 245 : 165}
                  initialMode="2d"
                  hideControls={!isHovered}
                />

                {/* Core Physicochemical Chips */}
                <div className="descriptor-chips-grid">
                  <span>MW: {drug.mw} Da</span>
                  <span>LogP: {drug.logp}</span>
                  <span>TPSA: {drug.tpsa} Å²</span>
                  <span>HBD/HBA: {drug.hbd}/{drug.hba}</span>
                  <span>Rings: {drug.aromatic_rings}</span>
                  <span>{drug.atoms}A / {drug.bonds}B</span>
                </div>

                {/* Expanded Dossier Details on Hover */}
                <div className="organic-hover-expanded-details">
                  <div className="hover-smiles-box">
                    <strong>Canonical SMILES:</strong>
                    <code>{drug.smiles}</code>
                    {drug.inchikey && (
                      <small className="block-inchikey">InChIKey: {drug.inchikey}</small>
                    )}
                  </div>

                  <div className="hover-tox-grid">
                    {TOXICITY_CATEGORIES.map((cat) => {
                      const score = drug.toxicity?.[cat.key] ?? 0.2;
                      return (
                        <div key={cat.key} className="hover-tox-chip">
                          <span>{cat.organ}:</span>
                          <strong
                            style={{
                              color:
                                score >= 0.7 ? "#F04B32" : score >= 0.4 ? "#B38600" : "#1745C4"
                            }}
                          >
                            {score.toFixed(2)}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Use as Drug A or Drug B + 3D View Action Buttons */}
                <div className="cat-card-actions-3">
                  <button
                    className="btn-use-drug-a"
                    onClick={() => onSendDrugToPredictor(drug.name, "A")}
                  >
                    Use as Drug A &rarr;
                  </button>
                  <button
                    className="btn-use-drug-b"
                    onClick={() => onSendDrugToPredictor(drug.name, "B")}
                  >
                    Use as Drug B &rarr;
                  </button>
                  {onOpenIn3DExplorer && (
                    <button
                      className="btn-small-sticker"
                      onClick={() => onOpenIn3DExplorer(drug.name)}
                      title="Open in 3D Interactive Explorer"
                    >
                      3D View ↗
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="batch-table-card torn-card-border">
          <div className="archival-table-scroll">
            <table className="archival-data-table">
              <thead>
                <tr>
                  <th>DepMap ID</th>
                  <th>Cell Line</th>
                  <th>Primary Disease</th>
                  <th>Subtype</th>
                  <th>Lineage</th>
                  <th>Site / Origin</th>
                  <th>Sex / Age</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCells.map((cell, i) => (
                  <tr key={`${cell.depmap_id}-${i}`}>
                    <td>
                      <code>{cell.depmap_id}</code>
                    </td>
                    <td>
                      <strong>{cell.cell_line}</strong>
                    </td>
                    <td>
                      <span className="tag-cobalt">{cell.primary_disease || "Oncology"}</span>
                    </td>
                    <td>{cell.subtype || cell.ncit_disease || "—"}</td>
                    <td>{cell.lineage || "—"}</td>
                    <td>
                      {cell.site || "—"} ({cell.primary_or_metastasis || "Primary"})
                    </td>
                    <td>
                      {cell.sex || "—"} {cell.age ? `/ ${cell.age}y` : ""}
                    </td>
                    <td>
                      <button
                        className="btn-table-inspect"
                        onClick={() => onOpenCellLineInRecommender(cell.cell_line, cell.primary_disease)}
                      >
                        Recommend Pairs &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. DOCS PAGE — Field Manual, API Specs, Jira/Trello Exports & Live Telemetry
// ============================================================================
export function DocsView({ telemetryEvents }) {
  const [docTab, setDocTab] = useState("manual");

  const downloadJiraBacklogCSV = () => {
    const csv = `Issue Type,Summary,Description,Priority,Story Points,Epic Link,Component
Epic,GNN Inference & Molecular Graph Pipeline,Dual 4-layer GINEConv architecture and SMILES featurization engine,High,21,,AI/GNN
Epic,8-Category SMARTS & Lipinski Toxicity Engine,Multi-organ toxicity scoring and combination risk calculation,High,13,,Chemoinformatics
Epic,Editorial Collage Frontend & GSAP Animations,Archival zine interface with interactive 2D chemical blueprints and GSAP stickers,High,21,,Frontend UI
Story,Implement SMILES to PyG 5D Node & 1D Edge Featurizer,"Given a canonical SMILES string, extract atomic number, H-count, degree, valence, and aromaticity",High,5,GNN Inference & Molecular Graph Pipeline,AI/GNN
Story,Build Interactive 8-Axis Multi-Organ Toxicity Radar,"Render SVG polygon comparing Drug A, Drug B, and Combined Risk 1-(1-Ra)(1-Rb)",High,5,8-Category SMARTS & Lipinski Toxicity Engine,Frontend UI
Story,High-Throughput Batch CSV Screening & Validation,"Allow researchers to upload multi-row CSVs, validate SMILES, and export ZIP synergy scores",Medium,8,Editorial Collage Frontend & GSAP Animations,Frontend UI
Story,Instrument GA4 & Mixpanel Product Analytics Events,"Track prediction_completed, smiles_prediction_completed, and batch_screening_executed",Medium,3,Editorial Collage Frontend & GSAP Animations,Analytics`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synerlytics_jira_backlog_import.csv";
    a.click();
  };

  const downloadTrelloBoardJSON = () => {
    const board = {
      name: "Synerlytics — AI Combination Oncology Sprint Board",
      lists: [
        { name: "📥 Product Backlog", cards: ["3D Molecular Conformer Viewer", "PubChem Live REST Autocomplete"] },
        { name: "🎯 Sprint Ready", cards: ["Vercel Production CI/CD Pipeline", "FastAPI Container Microservice"] },
        { name: "🚧 In Progress", cards: ["GA4 & Mixpanel Funnel Telemetry", "DepMap Cell Line Metadata Enrichment"] },
        { name: "🧪 Scientific QA & Validation", cards: ["DrugComb 561K Symmetry Benchmark Check", "SMARTS 8-Organ Alert Verification"] },
        { name: "✅ Done / Released", cards: ["Dual 4-Layer GINEConv Model (R²=0.6137)", "Editorial Collage Frontend & GSAP Stickers", "4-Mode Prediction Workbench"] }
      ]
    };
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synerlytics_trello_board_export.json";
    a.click();
  };

  return (
    <div className="secondary-page-wrapper">
      <div className="page-collage-hero hero-tint-yellow">
        <div className="hero-banner-content">
          <div className="kicker-tape-coral">TECHNICAL SPECIFICATION &amp; ECOSYSTEM MANUAL</div>
          <h1 className="editorial-page-title">
            Synerlytics <em>Documentation &amp; Ops</em>
          </h1>
          <p className="typewriter-subtitle">
            Complete reference for the ZIP Synergy Scale, Batch CSV schemas, Python/REST API usage,
            Jira/Trello project artifacts, and live Mixpanel/GA4 telemetry events.
          </p>
        </div>
        <ResearchStampSticker
          topText="DOCUMENTATION v2.0"
          bottomText="API • AGILE • TELEMETRY"
          centerText="DOCS"
          color="#1745C4"
          size={110}
        />
      </div>

      <div className="platform-tabs-bar">
        {[
          { id: "manual", num: "01", label: "ZIP Scale & Toxicity Rules", sub: "Clinical Interpretation" },
          { id: "api", num: "02", label: "Python GNN & CSV Specs", sub: "Code & Schemas" },
          { id: "ops", num: "03", label: "Product Ops & Live Analytics", sub: "Jira • Trello • GA4 • Mixpanel" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setDocTab(t.id)}
            className={`platform-tab-btn ${docTab === t.id ? "active" : ""}`}
          >
            <span className="tab-num">{t.num}</span>
            <div className="tab-text">
              <strong>{t.label}</strong>
              <small>{t.sub}</small>
            </div>
          </button>
        ))}
      </div>

      {docTab === "manual" && (
        <div className="docs-grid-2col">
          <div className="workbench-card card-tint-cream">
            <span className="wb-step-badge bg-cobalt">ZIP SYNERGY SCALE GUIDE</span>
            <h3>Interpreting Zero Interaction Potency (ZIP) Scores</h3>
            <p className="mb-12">
              The ZIP scale quantifies how much more (or less) effective a two-drug combination is
              compared to the expected non-interacting baseline across dose-response matrices:
            </p>
            <div className="zip-guide-stack">
              <div className="zip-guide-row row-coral">
                <strong>ZIP &gt; +6.0 (High Synergy)</strong>
                <span>Strong positive interaction; high priority for wet-lab validation.</span>
              </div>
              <div className="zip-guide-row row-yellow">
                <strong>+3.0 &lt; ZIP &le; +6.0 (Medium Synergy)</strong>
                <span>Moderate supra-additive efficacy; worth secondary dose-ratio assays.</span>
              </div>
              <div className="zip-guide-row row-blue">
                <strong>0.0 &lt; ZIP &le; +3.0 (Low Synergy)</strong>
                <span>Mildly positive or near-additive interaction.</span>
              </div>
              <div className="zip-guide-row row-ink">
                <strong>ZIP &le; 0.0 (Antagonism)</strong>
                <span>Sub-additive or competitive interaction; likely ineffective or harmful.</span>
              </div>
            </div>
          </div>

          <div className="workbench-card card-tint-blue">
            <span className="wb-step-badge bg-coral">8-ORGAN SMARTS TOXICITY ENGINE</span>
            <h3>Structural Alerts &amp; Combination Risk Math</h3>
            <p className="mb-12">
              Each compound is screened against SMARTS toxicophore patterns and Lipinski descriptors
              (MW, LogP, TPSA, HBD, HBA). Combined multi-drug risk follows independent probability union:
            </p>
            <div className="tensor-code-box mb-12">
              <code>Risk_combined(organ) = 1 - (1 - Risk_A(organ)) × (1 - Risk_B(organ))</code>
            </div>
            <ul className="docs-list">
              {TOXICITY_CATEGORIES.map((c) => (
                <li key={c.key}>
                  <strong>{c.label} ({c.organ}):</strong> <code>{c.smarts}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {docTab === "api" && (
        <div className="docs-grid-2col">
          <div className="workbench-card card-tint-cream">
            <span className="wb-step-badge bg-ink">PYTORCH GEOMETRIC INFERENCE SNIPPET</span>
            <h3>Loading final_gnn_model.pt in Python</h3>
            <pre className="archival-code-pre">
{`import torch
from app import DualGNNModel, mol_to_pyg
from torch_geometric.data import Batch

model = DualGNNModel(
    node_feat_dim=5, cancer_dim=17,
    num_cells=288, cell_emb_dim=48,
    gnn_hidden=192, gnn_layers=4,
    mlp_hidden=512, dropout=0.3, edge_dim=1
)
model.load_state_dict(torch.load("final_gnn_model.pt"))
model.eval()

g1 = Batch.from_data_list([mol_to_pyg(smiles_a)])
g2 = Batch.from_data_list([mol_to_pyg(smiles_b)])
with torch.no_grad():
    pred_scaled = model(g1, g2, cancer_vec, cell_idx)
    synergy_zip = scaler_y.inverse_transform(pred_scaled)`}
            </pre>
          </div>

          <div className="workbench-card card-tint-yellow">
            <span className="wb-step-badge bg-cobalt">BATCH CSV SCHEMA SPECIFICATION</span>
            <h3>Required CSV Columns for High-Throughput Screening</h3>
            <pre className="archival-code-pre">
{`drug_a_name,drug_b_name,drug_a_smiles,drug_b_smiles,cancer_type,cell_line
PACLITAXEL,DOXORUBICIN,CC1=C2...,CC1C(C...,Breast Cancer,MCF7
OLAPARIB,CISPLATIN,C1CC1C...,Cl[Pt](Cl)(N)N,Ovarian Cancer,OVCAR-8`}
            </pre>
            <p className="mt-12">
              <strong>Output Columns Appended Automatically:</strong>{" "}
              <code>synergy_zip</code>, <code>safety_score</code>, <code>synergy_class</code>,{" "}
              <code>error</code>.
            </p>
          </div>
        </div>
      )}

      {docTab === "ops" && (
        <div className="docs-grid-2col">
          <div className="workbench-card card-tint-cream">
            <span className="wb-step-badge bg-cobalt">PROJECT MANAGEMENT &amp; AGILE ARTIFACTS</span>
            <h3>One-Click Jira Backlog &amp; Trello Board Exports</h3>
            <p className="mb-12">
              Download pre-configured Agile artifacts for this project to import directly into your
              Jira and Trello workspaces:
            </p>
            <div className="hero-cta-row">
              <button className="btn-moving-cobalt" onClick={downloadJiraBacklogCSV}>
                <span>Download Jira Backlog CSV</span>
                <span className="btn-arrow">↓</span>
              </button>
              <button className="btn-moving-yellow" onClick={downloadTrelloBoardJSON}>
                <span>Download Trello Board JSON</span>
                <span className="btn-arrow">↓</span>
              </button>
            </div>
          </div>

          <div className="workbench-card card-tint-blue">
            <span className="wb-step-badge bg-coral">LIVE TELEMETRY STREAM (MIXPANEL &amp; GA4)</span>
            <h3>Real-Time Product &amp; Website Analytics Events</h3>
            <div className="telemetry-feed-box">
              {telemetryEvents.length === 0 ? (
                <p>No events fired yet. Navigate or run a prediction to see live telemetry!</p>
              ) : (
                telemetryEvents.map((ev, i) => (
                  <div key={i} className="telemetry-log-item">
                    <span className="t-time">{ev.time}</span>
                    <strong className="t-name">{ev.event}</strong>
                    <code className="t-payload">{JSON.stringify(ev.props)}</code>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. ABOUT PAGE — The Combination Oncology Manifesto & Archival Story
// ============================================================================
export function AboutView({ onNavigate }) {
  return (
    <div className="secondary-page-wrapper">
      <div className="page-collage-hero hero-tint-pink">
        <div className="hero-banner-content">
          <div className="kicker-tape-yellow">MISSION &amp; SCIENTIFIC PROVENANCE</div>
          <h1 className="editorial-page-title">
            Why <em>Synerlytics</em> Exists
          </h1>
          <p className="typewriter-subtitle">
            Bridging Graph Deep Learning, Chemoinformatics, and Functional Genomics to discover
            safer, resistance-breaking cancer drug combinations in silico.
          </p>
        </div>
        <ResearchStampSticker
          topText="OPEN RESEARCH TOOL"
          bottomText="IN-SILICO ONCOLOGY"
          centerText="EST. 2026"
          color="#171717"
          size={110}
        />
      </div>

      <div className="docs-grid-2col">
        <div className="workbench-card card-tint-cream">
          <span className="wb-step-badge bg-coral">THE CLINICAL CHALLENGE</span>
          <h3>Overcoming Monotherapy Resistance &amp; Dose Toxicity</h3>
          <p className="dossier-desc-p">
            In clinical oncology, single-agent therapies frequently fail due to tumor heterogeneity
            and acquired pathway resistance. Combination therapy targets multiple oncogenic pathways
            simultaneously—producing <strong>synergy</strong> at lower individual doses.
          </p>
          <p className="dossier-desc-p mt-12">
            However, testing all possible drug pairs across hundreds of cancer cell lines in the wet
            lab is combinatorially explosive (over 9 million pairs for 4,268 drugs per cell line).
            <strong> Synerlytics</strong> uses a Dual 4-Layer Graph Isomorphism Network (GINEConv) to
            screen combinations virtually and flag multi-organ toxicity before wet-lab synthesis.
          </p>
          <div className="mt-16">
            <button
              className="btn-moving-cobalt"
              onClick={() => onNavigate("Platform", "single")}
            >
              <span>Explore the Prediction Platform</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>
        </div>

        <div className="workbench-card card-tint-yellow">
          <span className="wb-step-badge bg-ink">ARCHIVAL DATA SOURCES &amp; DISCLAIMER</span>
          <h3>Scientific Foundations</h3>
          <ul className="docs-list">
            <li>
              <strong>DrugComb Portal:</strong> 561,754 symmetry-augmented experimental drug
              combination assays calibrated on the Zero Interaction Potency (ZIP) scale.
            </li>
            <li>
              <strong>Broad Institute DepMap (CCLE):</strong> 288 cancer cell line genomic &amp;
              lineage profiles spanning 17 primary cancer types.
            </li>
            <li>
              <strong>RDKit &amp; SMARTS Toxicophores:</strong> 8-organ structural alert matching
              combined with Lipinski physicochemical descriptors.
            </li>
          </ul>
          <div className="archival-disclaimer-stamp mt-16">
            <strong>⚠️ RESEARCH &amp; EDUCATIONAL DISCLAIMER:</strong> Synerlytics is an in-silico
            computational research and educational tool. Predictions must be experimentally validated
            in vitro and in vivo and are not intended as direct clinical medical advice.
          </div>
        </div>
      </div>
    </div>
  );
}
