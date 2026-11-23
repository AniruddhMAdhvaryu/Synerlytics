import React, { useState, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import MoleculeBlueprintCanvas from "./MoleculeBlueprintCanvas";
import {
  ResearchStampSticker,
  HandwrittenAnnotation,
  ToxicityRadarChart
} from "./CollageStickers";
import {
  QUICK_SMILES_EXAMPLES,
  TOXICITY_CATEGORIES,
  validateSmiles,
  computeDescriptorsAndToxicity,
  combineSideEffects,
  classifyRiskLevel,
  classifySynergyScore,
  predictSynergyGNN,
  SAMPLE_BATCH_CSV
} from "../utils/chemistryEngine";

export default function PlatformView({
  dataset,
  activeSubMode,
  setActiveSubMode,
  prefillPair,
  onClearPrefill,
  onTrackEvent
}) {
  const containerRef = useRef(null);
  const drugs = dataset?.drugs || [];
  const cancerMapping = dataset?.cancer_cell_mapping || {};
  const cancerTypes = Object.keys(cancerMapping);

  // ================= 1. SINGLE PREDICTION STATE =================
  const [drugAName, setDrugAName] = useState(drugs[0]?.name || "PACLITAXEL");
  const [drugBName, setDrugBName] = useState(drugs[1]?.name || "DOXORUBICIN");
  const [drugSearchA, setDrugSearchA] = useState("");
  const [drugSearchB, setDrugSearchB] = useState("");
  const [cancerType, setCancerType] = useState(cancerTypes[3] || "Breast Cancer");
  const [cellLine, setCellLine] = useState(cancerMapping[cancerTypes[3] || "Breast Cancer"]?.[1] || "MCF7");
  const [singleResult, setSingleResult] = useState(null);
  const [autoFillBanner, setAutoFillBanner] = useState(null);

  // Handle incoming prefill from Home QuickTest or Recommendation Engine "Test This Combination"
  useEffect(() => {
    if (prefillPair && prefillPair.drugA && prefillPair.drugB) {
      setDrugAName(prefillPair.drugA);
      setDrugBName(prefillPair.drugB);
      if (prefillPair.cancerType && cancerMapping[prefillPair.cancerType]) {
        setCancerType(prefillPair.cancerType);
        const lines = cancerMapping[prefillPair.cancerType];
        if (prefillPair.cellLine && lines.includes(prefillPair.cellLine)) {
          setCellLine(prefillPair.cellLine);
        } else if (lines.length > 0) {
          setCellLine(lines[0]);
        }
      }
      setAutoFillBanner(`${prefillPair.drugA} + ${prefillPair.drugB} (${prefillPair.cellLine || cellLine})`);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillPair]);

  // Keep cellLine synced when cancerType changes
  const availableCellLines = useMemo(() => {
    return cancerMapping[cancerType] || ["MCF7"];
  }, [cancerMapping, cancerType]);

  useEffect(() => {
    if (!availableCellLines.includes(cellLine)) {
      setCellLine(availableCellLines[0]);
    }
  }, [availableCellLines, cellLine]);

  const drugAObj = useMemo(
    () => drugs.find((d) => d.name === drugAName) || drugs[0],
    [drugs, drugAName]
  );
  const drugBObj = useMemo(
    () => drugs.find((d) => d.name === drugBName) || drugs[1],
    [drugs, drugBName]
  );

  const filteredDrugsA = useMemo(() => {
    if (!drugSearchA.trim()) return drugs.slice(0, 140);
    const q = drugSearchA.toLowerCase();
    return drugs.filter((d) => d.name.toLowerCase().includes(q) || d.smiles.toLowerCase().includes(q)).slice(0, 120);
  }, [drugs, drugSearchA]);

  const filteredDrugsB = useMemo(() => {
    if (!drugSearchB.trim()) return drugs.slice(0, 140);
    const q = drugSearchB.toLowerCase();
    return drugs.filter((d) => d.name.toLowerCase().includes(q) || d.smiles.toLowerCase().includes(q)).slice(0, 120);
  }, [drugs, drugSearchB]);

  const runSinglePrediction = () => {
    if (!drugAObj || !drugBObj) return;
    if (drugAObj.name === drugBObj.name) {
      setSingleResult({ error: "Please select two different drugs for combination synergy analysis." });
      return;
    }
    const score = predictSynergyGNN({
      drugA: drugAObj.name,
      drugB: drugBObj.name,
      smilesA: drugAObj.smiles,
      smilesB: drugBObj.smiles,
      cancerType,
      cellLine,
      dataset
    });
    const classification = classifySynergyScore(score);
    const toxA = drugAObj.toxicity || computeDescriptorsAndToxicity(drugAObj.smiles).toxicity;
    const toxB = drugBObj.toxicity || computeDescriptorsAndToxicity(drugBObj.smiles).toxicity;
    const comboTox = combineSideEffects(toxA, toxB);
    const avgRisk =
      Object.values(comboTox).reduce((a, b) => a + b, 0) / Object.values(comboTox).length;
    const safetyScore = Number((1.0 - avgRisk).toFixed(2));

    setSingleResult({
      drugA: drugAObj.name,
      drugB: drugBObj.name,
      cancerType,
      cellLine,
      synergyScore: score,
      safetyScore,
      avgRisk: Number(avgRisk.toFixed(2)),
      ...classification,
      toxA,
      toxB,
      comboTox
    });

    if (onTrackEvent) {
      onTrackEvent("prediction_completed", {
        mode: "single",
        drug_a: drugAObj.name,
        drug_b: drugBObj.name,
        cancer_type: cancerType,
        cell_line: cellLine,
        synergy_score: score,
        synergy_class: classification.synergyClass,
        safety_score: safetyScore
      });
    }
  };

  // Run initial prediction automatically so the dashboard is immediately alive
  useEffect(() => {
    if (drugAObj && drugBObj && drugAObj.name !== drugBObj.name) {
      runSinglePrediction();
    }
  }, [drugAName, drugBName, cancerType, cellLine]);

  // ================= 2. ADVANCED SMILES STATE =================
  const [smiles1, setSmiles1] = useState(
    "CN1CCC2=CC3=C(C=C2C1C4C5=C(C6=C(C=C5)OCO6)C(=O)O4)OCO3"
  );
  const [smiles2, setSmiles2] = useState("CN(C)CCC(C1=CC=C(C=C1)Cl)C2=CC=CC=N2");
  const [smilesName1, setSmilesName1] = useState("Bicuculline (Custom 1)");
  const [smilesName2, setSmilesName2] = useState("Chlorpheniramine (Custom 2)");
  const [advCancer, setAdvCancer] = useState("Breast Cancer");
  const [advCellLine, setAdvCellLine] = useState("MCF7");
  const [selectedQuickEx, setSelectedQuickEx] = useState(0);
  const [smilesResult, setSmilesResult] = useState(null);
  const [showPubchemHelp, setShowPubchemHelp] = useState(false);

  const advCellLines = useMemo(() => cancerMapping[advCancer] || ["MCF7"], [cancerMapping, advCancer]);
  useEffect(() => {
    if (!advCellLines.includes(advCellLine)) setAdvCellLine(advCellLines[0]);
  }, [advCellLines, advCellLine]);

  const val1 = useMemo(() => validateSmiles(smiles1), [smiles1]);
  const val2 = useMemo(() => validateSmiles(smiles2), [smiles2]);
  const desc1 = useMemo(() => (val1.valid ? computeDescriptorsAndToxicity(smiles1) : null), [smiles1, val1]);
  const desc2 = useMemo(() => (val2.valid ? computeDescriptorsAndToxicity(smiles2) : null), [smiles2, val2]);

  const runSmilesPrediction = () => {
    if (!val1.valid || !val2.valid) {
      setSmilesResult({ error: `Invalid SMILES: ${!val1.valid ? "Drug 1 — " + val1.reason : "Drug 2 — " + val2.reason}` });
      return;
    }
    if (smiles1.trim() === smiles2.trim()) {
      setSmilesResult({ error: "Drug 1 and Drug 2 SMILES strings are identical. Enter two distinct structures." });
      return;
    }
    const score = predictSynergyGNN({
      drugA: smilesName1,
      drugB: smilesName2,
      smilesA: smiles1.trim(),
      smilesB: smiles2.trim(),
      cancerType: advCancer,
      cellLine: advCellLine,
      dataset
    });
    const classification = classifySynergyScore(score);
    const comboTox = combineSideEffects(desc1.toxicity, desc2.toxicity);
    const avgRisk = Object.values(comboTox).reduce((a, b) => a + b, 0) / 8;

    setSmilesResult({
      drugA: smilesName1 || "Custom Compound 1",
      drugB: smilesName2 || "Custom Compound 2",
      cancerType: advCancer,
      cellLine: advCellLine,
      synergyScore: score,
      safetyScore: Number((1 - avgRisk).toFixed(2)),
      ...classification,
      toxA: desc1.toxicity,
      toxB: desc2.toxicity,
      comboTox
    });

    if (onTrackEvent) {
      onTrackEvent("smiles_prediction_completed", {
        cancer_type: advCancer,
        cell_line: advCellLine,
        synergy_score: score,
        synergy_class: classification.synergyClass
      });
    }
  };

  useEffect(() => {
    if (activeSubMode === "smiles" && !smilesResult && val1.valid && val2.valid) {
      runSmilesPrediction();
    }
  }, [activeSubMode]);

  // ================= 3. RECOMMENDATION ENGINE STATE =================
  const [recCancer, setRecCancer] = useState("Breast Cancer");
  const [recCellLine, setRecCellLine] = useState("MCF7");
  const [topK, setTopK] = useState(12);
  const [copiedRecs, setCopiedRecs] = useState(false);

  const recCellLines = useMemo(() => cancerMapping[recCancer] || ["MCF7"], [cancerMapping, recCancer]);
  useEffect(() => {
    if (!recCellLines.includes(recCellLine)) setRecCellLine(recCellLines[0]);
  }, [recCellLines, recCellLine]);

  const cellStats = useMemo(() => {
    const st = dataset?.cell_line_stats?.[recCellLine];
    const avail = dataset?.cell_line_drugs?.[recCellLine]?.length || 22;
    return {
      total_drugs: st?.total_drugs || avail + 5,
      available_drugs: avail,
      possible_combinations: st?.possible_combinations || Math.floor((avail * (avail - 1)) / 2)
    };
  }, [dataset, recCellLine]);

  const recommendations = useMemo(() => {
    const raw = dataset?.precomputed_recommendations?.[recCellLine] || [];
    return raw.slice(0, topK);
  }, [dataset, recCellLine, topK]);

  const recSummary = useMemo(() => {
    if (recommendations.length === 0) return { avgSynergy: 0, avgSafety: 0 };
    const avgSyn =
      recommendations.reduce((s, r) => s + r.synergy_score, 0) / recommendations.length;
    const avgSaf =
      recommendations.reduce((s, r) => s + r.safety_score, 0) / recommendations.length;
    return {
      avgSynergy: avgSyn.toFixed(1),
      avgSafety: avgSaf.toFixed(2)
    };
  }, [recommendations]);

  const handleTestRecommendedPair = (rec) => {
    setDrugAName(rec.drug1);
    setDrugBName(rec.drug2);
    setCancerType(recCancer);
    setCellLine(recCellLine);
    setAutoFillBanner(`Auto-filled from Recommender: ${rec.drug1} + ${rec.drug2} (${recCellLine})`);
    setActiveSubMode("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadRecsCSV = () => {
    const headers = "Rank,Drug_A,Drug_B,Cancer_Type,Cell_Line,Synergy_ZIP,Safety_Score,Recommendation_Score,Average_Risk\n";
    const rows = recommendations
      .map(
        (r, i) =>
          `${i + 1},"${r.drug1}","${r.drug2}","${recCancer}","${recCellLine}",${r.synergy_score},${r.safety_score},${r.recommendation_score},${r.avg_risk}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synerlytics_recommendations_${recCancer.replace(/\s+/g, "_")}_${recCellLine}.csv`;
    a.click();
  };

  // ================= 4. BATCH SCREENING STATE =================
  const [batchCsvText, setBatchCsvText] = useState(SAMPLE_BATCH_CSV);
  const [batchResults, setBatchResults] = useState(null);
  const [batchFilterClass, setBatchFilterClass] = useState("ALL");

  const runBatchScreening = (csvInput = batchCsvText) => {
    const lines = csvInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return;

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idxNameA = headers.indexOf("drug_a_name");
    const idxNameB = headers.indexOf("drug_b_name");
    const idxSmilesA = headers.indexOf("drug_a_smiles");
    const idxSmilesB = headers.indexOf("drug_b_smiles");
    const idxCancer = headers.indexOf("cancer_type");
    const idxCell = headers.indexOf("cell_line");

    if (idxSmilesA === -1 || idxSmilesB === -1) {
      setBatchResults({
        error:
          "Missing required CSV columns! Expected: drug_a_name, drug_b_name, drug_a_smiles, drug_b_smiles, cancer_type, cell_line"
      });
      return;
    }

    const rows = [];
    let validACount = 0;
    let validBCount = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length < 4) continue;
      const dA = cols[idxNameA] || `Row_${i}_A`;
      const dB = cols[idxNameB] || `Row_${i}_B`;
      const sA = cols[idxSmilesA] || "";
      const sB = cols[idxSmilesB] || "";
      const cType = cols[idxCancer] || "Breast Cancer";
      const cLine = cols[idxCell] || "MCF7";

      const vA = validateSmiles(sA);
      const vB = validateSmiles(sB);
      if (vA.valid) validACount++;
      if (vB.valid) validBCount++;

      if (!vA.valid || !vB.valid) {
        failCount++;
        rows.push({
          rowNum: i,
          drug_a_name: dA,
          drug_b_name: dB,
          drug_a_smiles: sA,
          drug_b_smiles: sB,
          cancer_type: cType,
          cell_line: cLine,
          synergy_zip: null,
          safety_score: null,
          synergy_class: "Invalid SMILES",
          error: !vA.valid ? "Invalid Drug A SMILES" : "Invalid Drug B SMILES"
        });
        continue;
      }

      const syn = predictSynergyGNN({
        drugA: dA,
        drugB: dB,
        smilesA: sA,
        smilesB: sB,
        cancerType: cType,
        cellLine: cLine,
        dataset
      });
      const tA = computeDescriptorsAndToxicity(sA).toxicity;
      const tB = computeDescriptorsAndToxicity(sB).toxicity;
      const combT = combineSideEffects(tA, tB);
      const avgR = Object.values(combT).reduce((a, b) => a + b, 0) / 8;
      const saf = Number((1 - avgR).toFixed(3));
      const cls = classifySynergyScore(syn);

      successCount++;
      rows.push({
        rowNum: i,
        drug_a_name: dA,
        drug_b_name: dB,
        drug_a_smiles: sA,
        drug_b_smiles: sB,
        cancer_type: cType,
        cell_line: cLine,
        synergy_zip: syn,
        safety_score: saf,
        synergy_class: cls.synergyClass,
        badgeColor: cls.badgeColor,
        error: null
      });
    }

    const validRows = rows.filter((r) => r.synergy_zip !== null);
    const syns = validRows.map((r) => r.synergy_zip);
    const safs = validRows.map((r) => r.safety_score);
    const avgSyn = syns.length ? syns.reduce((a, b) => a + b, 0) / syns.length : 0;
    const maxSyn = syns.length ? Math.max(...syns) : 0;
    const minSyn = syns.length ? Math.min(...syns) : 0;
    const avgSaf = safs.length ? safs.reduce((a, b) => a + b, 0) / safs.length : 0;

    setBatchResults({
      rows,
      total: rows.length,
      validACount,
      validBCount,
      successCount,
      failCount,
      avgSyn: avgSyn.toFixed(2),
      maxSyn: maxSyn.toFixed(2),
      minSyn: minSyn.toFixed(2),
      avgSaf: avgSaf.toFixed(3),
      highSynergyCount: validRows.filter((r) => r.synergy_zip > 6).length,
      medSynergyCount: validRows.filter((r) => r.synergy_zip > 3 && r.synergy_zip <= 6).length,
      lowSynergyCount: validRows.filter((r) => r.synergy_zip > 0 && r.synergy_zip <= 3).length,
      antagonismCount: validRows.filter((r) => r.synergy_zip <= 0).length
    });

    if (onTrackEvent) {
      onTrackEvent("batch_screening_executed", {
        total_rows: rows.length,
        successful: successCount,
        failed: failCount
      });
    }
  };

  useEffect(() => {
    if (activeSubMode === "batch" && !batchResults) {
      runBatchScreening(SAMPLE_BATCH_CSV);
    }
  }, [activeSubMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const txt = ev.target?.result;
      if (typeof txt === "string") {
        setBatchCsvText(txt);
        runBatchScreening(txt);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadBatchCSV = () => {
    if (!batchResults?.rows) return;
    const header =
      "drug_a_name,drug_b_name,drug_a_smiles,drug_b_smiles,cancer_type,cell_line,synergy_zip,safety_score,synergy_class,error\n";
    const body = batchResults.rows
      .map(
        (r) =>
          `"${r.drug_a_name}","${r.drug_b_name}","${r.drug_a_smiles}","${r.drug_b_smiles}","${r.cancer_type}","${r.cell_line}",${r.synergy_zip ?? ""},${r.safety_score ?? ""},"${r.synergy_class}","${r.error ?? ""}"`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synerlytics_batch_predictions.csv";
    a.click();
  };

  // GSAP Tab transition animation
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      ".platform-mode-panel",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, [activeSubMode]);

  // Shared Results Renderer for Single & SMILES modes
  const renderPredictionReadout = (res, descA, descB) => {
    if (!res) return null;
    if (res.error) {
      return (
        <div className="archival-error-banner">
          <strong>⚠️ Validation Alert:</strong> {res.error}
        </div>
      );
    }

    return (
      <div className="prediction-results-collage">
        {/* TOP ROW: BIG COLLAGE SYNERGY SCORECARD + 8-ORGAN TOXICITY RADAR */}
        <div className="results-top-grid">
          {/* Left: Torn-Paper Synergy Scorecard */}
          <div className="synergy-dossier-card torn-card-border">
            <div className="dossier-top-row">
              <div>
                <span className="dossier-kicker">GINECONV DUAL-GNN INFERENCE</span>
                <h3 className="dossier-pair-title">
                  {res.drugA} <span>+</span> {res.drugB}
                </h3>
                <div className="dossier-context-pills">
                  <span className="tag-cobalt">{res.cancerType}</span>
                  <span className="tag-yellow">Cell Line: {res.cellLine}</span>
                  <span className="tag-pink">Confidence: {res.confidenceLevel}</span>
                </div>
              </div>

              {/* Iconic Torn Paper ZIP Scorecard */}
              <div className="inline-zip-scorecard">
                <span className="zip-caption">Synergy (ZIP)</span>
                <strong className="zip-giant-value">
                  {res.synergyScore > 0 ? `+${res.synergyScore}` : res.synergyScore}
                </strong>
                <span className={`zip-ribbon-badge badge-${res.badgeColor}`}>
                  {res.synergyClass}
                </span>
              </div>
            </div>

            {/* ZIP Scale Meter (-15 to +20) */}
            <div className="zip-scale-meter-wrap">
              <div className="zip-scale-labels">
                <span>Antagonism (&le; 0)</span>
                <span>Low (0–3)</span>
                <span>Medium (3–6)</span>
                <span>High Synergy (&gt; 6)</span>
              </div>
              <div className="zip-scale-bar">
                <div
                  className="zip-scale-marker"
                  style={{
                    left: `${Math.max(4, Math.min(96, ((res.synergyScore + 12) / 30) * 100))}%`
                  }}
                >
                  <span>▲ {res.synergyScore}</span>
                </div>
              </div>
            </div>

            <div className="dossier-interpretation-grid">
              <div className="interp-box">
                <small>BIOLOGICAL INTERPRETATION</small>
                <p>{res.interpretation}</p>
              </div>
              <div className="interp-box">
                <small>PRECLINICAL RECOMMENDATION</small>
                <p>{res.recommendation}</p>
              </div>
              <div className="interp-box">
                <small>COMBINED SAFETY SCORE</small>
                <p>
                  <strong>{res.safetyScore} / 1.00</strong> (Higher is safer)
                </p>
              </div>
            </div>
          </div>

          {/* Right: 8-Axis Multi-Organ Toxicity Radar Chart */}
          <ToxicityRadarChart
            toxA={res.toxA}
            toxB={res.toxB}
            comboTox={res.comboTox}
            nameA={res.drugA}
            nameB={res.drugB}
          />
        </div>

        {/* BOTTOM ROW: 8-CATEGORY MULTI-ORGAN TOXICITY BREAKDOWN CARDS */}
        <div className="organ-toxicity-section">
          <div className="organ-section-header">
            <div>
              <span className="kicker-tape-coral">8-CATEGORY SMARTS &amp; LIPINSKI PROFILER</span>
              <h3>Multi-Organ Toxicity &amp; Side-Effect Risk Matrix</h3>
            </div>
            <div className="formula-sticker-pill">
              Formula: <code>Risk_combined = 1 - (1 - Risk_A) &times; (1 - Risk_B)</code>
            </div>
          </div>

          <div className="organ-cards-grid">
            {TOXICITY_CATEGORIES.map((cat) => {
              const rA = res.toxA?.[cat.key] ?? 0.2;
              const rB = res.toxB?.[cat.key] ?? 0.2;
              const rCombo = res.comboTox?.[cat.key] ?? 0.35;
              const riskInfo = classifyRiskLevel(rCombo);

              return (
                <div key={cat.key} className={`organ-risk-card ${riskInfo.badgeClass}`}>
                  <div className="organ-card-top">
                    <div>
                      <span className="organ-tag">{cat.organ}</span>
                      <h4>{cat.label}</h4>
                    </div>
                    <span className={`risk-level-pill ${riskInfo.badgeClass}`}>
                      {riskInfo.label} ({rCombo.toFixed(2)})
                    </span>
                  </div>

                  {/* Individual vs Combined Progress Bars */}
                  <div className="organ-bars-stack">
                    <div className="organ-bar-row">
                      <span>{res.drugA.slice(0, 12)}</span>
                      <div className="organ-bar-track">
                        <div
                          className="organ-bar-fill fill-blue"
                          style={{ width: `${Math.round(rA * 100)}%` }}
                        />
                      </div>
                      <strong>{rA.toFixed(2)}</strong>
                    </div>

                    <div className="organ-bar-row">
                      <span>{res.drugB.slice(0, 12)}</span>
                      <div className="organ-bar-track">
                        <div
                          className="organ-bar-fill fill-yellow"
                          style={{ width: `${Math.round(rB * 100)}%` }}
                        />
                      </div>
                      <strong>{rB.toFixed(2)}</strong>
                    </div>

                    <div className="organ-bar-row combo-row">
                      <span>Combined</span>
                      <div className="organ-bar-track">
                        <div
                          className="organ-bar-fill fill-coral"
                          style={{ width: `${Math.round(rCombo * 100)}%` }}
                        />
                      </div>
                      <strong>{rCombo.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="organ-smarts-caption">
                    <small>Rule: {cat.smarts}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="platform-page-wrapper">
      {/* PLATFORM COLLAGE HEADER */}
      <div className="platform-hero-banner">
        <div className="platform-banner-left">
          <div className="kicker-tape-yellow">SYNERLYTICS COMPUTATIONAL WORKBENCH</div>
          <h1 className="platform-main-title">
            Combination Oncology <em>Prediction Suite</em>
          </h1>
          <p className="typewriter-subtitle">
            Switch between Single Drug Pair Analysis, De-Novo SMILES Chemical Sandbox, AI Cell-Line
            Recommender, and High-Throughput Batch CSV Screening.
          </p>
        </div>

        <ResearchStampSticker
          topText="PYTORCH GEOMETRIC"
          bottomText="DUAL 4-LAYER GINECONV"
          centerText="449-DIM"
          color="#F04B32"
          size={108}
          className="platform-header-stamp"
        />
      </div>

      {/* 4-MODE ARCHIVAL TAB SWITCHER */}
      <div className="platform-tabs-bar">
        {[
          { id: "single", num: "01", label: "Single Prediction", sub: "650+ Curated Drugs" },
          { id: "smiles", num: "02", label: "Advanced (SMILES)", sub: "Custom Chemical Input" },
          { id: "recommend", num: "03", label: "Recommendation Engine", sub: "Top Cell-Line Pairs" },
          { id: "batch", num: "04", label: "Batch Screening", sub: "High-Throughput CSV" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubMode(tab.id)}
            className={`platform-tab-btn ${activeSubMode === tab.id ? "active" : ""}`}
          >
            <span className="tab-num">{tab.num}</span>
            <div className="tab-text">
              <strong>{tab.label}</strong>
              <small>{tab.sub}</small>
            </div>
          </button>
        ))}
      </div>

      {/* ================= MODE 01: SINGLE PREDICTION ================= */}
      {activeSubMode === "single" && (
        <div className="platform-mode-panel">
          {autoFillBanner && (
            <div className="autofill-notice-banner">
              <span>✨ {autoFillBanner}</span>
              <button onClick={() => setAutoFillBanner(null)}>Clear Notice ✕</button>
            </div>
          )}

          <div className="single-workbench-grid-large">
            {/* Drug A Selection & Large 2D Organic / 3D Blueprint Card */}
            <div className="workbench-card card-tint-blue workbench-compound-large">
              <div className="wb-card-header">
                <span className="wb-step-badge bg-cobalt">COMPOUND A • LARGE STRUCTURE VIEWPORT</span>
                <input
                  type="text"
                  placeholder="Filter 650+ drugs..."
                  value={drugSearchA}
                  onChange={(e) => setDrugSearchA(e.target.value)}
                  className="wb-filter-input"
                />
              </div>

              <label className="wb-field-label">Select Drug A</label>
              <select
                value={drugAName}
                onChange={(e) => setDrugAName(e.target.value)}
                className="wb-select"
              >
                {filteredDrugsA.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} (MW: {d.mw} • LogP: {d.logp})
                  </option>
                ))}
              </select>

              {drugAObj && (
                <>
                  <MoleculeBlueprintCanvas
                    smiles={drugAObj.smiles}
                    title={drugAObj.name}
                    theme="blueprint"
                    height={345}
                    initialMode="2d"
                  />
                  <div className="descriptor-chips-grid">
                    <span>MW: {drugAObj.mw} Da</span>
                    <span>LogP: {drugAObj.logp}</span>
                    <span>TPSA: {drugAObj.tpsa} Å²</span>
                    <span>HBD/HBA: {drugAObj.hbd}/{drugAObj.hba}</span>
                    <span>Rings: {drugAObj.aromatic_rings}</span>
                    <span>{drugAObj.atoms} Atoms • {drugAObj.bonds} Bonds</span>
                  </div>
                </>
              )}
            </div>

            {/* Drug B Selection & Large 2D Organic / 3D Blueprint Card */}
            <div className="workbench-card card-tint-cream workbench-compound-large">
              <div className="wb-card-header">
                <span className="wb-step-badge bg-coral">COMPOUND B • LARGE STRUCTURE VIEWPORT</span>
                <input
                  type="text"
                  placeholder="Filter 650+ drugs..."
                  value={drugSearchB}
                  onChange={(e) => setDrugSearchB(e.target.value)}
                  className="wb-filter-input"
                />
              </div>

              <label className="wb-field-label">Select Drug B</label>
              <select
                value={drugBName}
                onChange={(e) => setDrugBName(e.target.value)}
                className="wb-select"
              >
                {filteredDrugsB.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} (MW: {d.mw} • LogP: {d.logp})
                  </option>
                ))}
              </select>

              {drugBObj && (
                <>
                  <MoleculeBlueprintCanvas
                    smiles={drugBObj.smiles}
                    title={drugBObj.name}
                    theme="blueprint"
                    height={345}
                    initialMode="2d"
                  />
                  <div className="descriptor-chips-grid">
                    <span>MW: {drugBObj.mw} Da</span>
                    <span>LogP: {drugBObj.logp}</span>
                    <span>TPSA: {drugBObj.tpsa} Å²</span>
                    <span>HBD/HBA: {drugBObj.hbd}/{drugBObj.hba}</span>
                    <span>Rings: {drugBObj.aromatic_rings}</span>
                    <span>{drugBObj.atoms} Atoms • {drugBObj.bonds} Bonds</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Full-Width Cancer Context & Execution Deck */}
          <div className="workbench-card card-tint-yellow context-deck-bar mb-24">
            <div className="context-deck-grid">
              <div>
                <span className="wb-step-badge bg-ink mb-8">ONCOLOGY CONTEXT</span>
                <label className="wb-field-label">Select Cancer Type (17 Lineages)</label>
                <select
                  value={cancerType}
                  onChange={(e) => setCancerType(e.target.value)}
                  className="wb-select"
                >
                  {cancerTypes.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct} ({cancerMapping[ct]?.length || 0} cell lines)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <HandwrittenAnnotation
                  text="288 DepMap Cell Lines!"
                  color="#1745C4"
                  rotate={-2}
                  arrowDir="none"
                />
                <label className="wb-field-label">Select DepMap Cell Line</label>
                <select
                  value={cellLine}
                  onChange={(e) => setCellLine(e.target.value)}
                  className="wb-select"
                >
                  {availableCellLines.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="context-deck-buttons">
                <div className="context-quick-actions">
                  <button
                    type="button"
                    className="btn-small-sticker"
                    onClick={() => {
                      const tmp = drugAName;
                      setDrugAName(drugBName);
                      setDrugBName(tmp);
                    }}
                  >
                    ⇄ Swap Drug A &amp; B
                  </button>
                  <button
                    type="button"
                    className="btn-small-sticker"
                    onClick={() => {
                      const recs = dataset?.precomputed_recommendations?.[cellLine] || [];
                      if (recs.length > 0) {
                        const pick = recs[Math.floor(Math.random() * Math.min(5, recs.length))];
                        setDrugAName(pick.drug1);
                        setDrugBName(pick.drug2);
                      }
                    }}
                  >
                    ★ Load Top Synergistic Pair
                  </button>
                </div>

                <button
                  type="button"
                  onClick={runSinglePrediction}
                  className="btn-moving-cobalt btn-full-width"
                >
                  <span>Predict Synergy &amp; Side Effects</span>
                  <span className="btn-arrow">↗</span>
                </button>
              </div>
            </div>
          </div>

          {renderPredictionReadout(singleResult, drugAObj, drugBObj)}
        </div>
      )}

      {/* ================= MODE 02: ADVANCED (SMILES) SANDBOX ================= */}
      {activeSubMode === "smiles" && (
        <div className="platform-mode-panel">
          {/* Quick SMILES Example Loader Bar */}
          <div className="smiles-examples-bar torn-card-border">
            <div className="examples-bar-left">
              <span className="wb-step-badge bg-cobalt">QUICK SMILES LIBRARY</span>
              <select
                value={selectedQuickEx}
                onChange={(e) => setSelectedQuickEx(Number(e.target.value))}
                className="wb-select-inline"
              >
                {QUICK_SMILES_EXAMPLES.map((ex, i) => (
                  <option key={ex.name} value={i}>
                    {ex.name} — {ex.category}
                  </option>
                ))}
              </select>
            </div>
            <div className="examples-bar-actions">
              <button
                className="btn-small-sticker"
                onClick={() => {
                  const ex = QUICK_SMILES_EXAMPLES[selectedQuickEx];
                  setSmiles1(ex.smiles);
                  setSmilesName1(ex.name);
                }}
              >
                &rarr; Load as Drug 1
              </button>
              <button
                className="btn-small-sticker"
                onClick={() => {
                  const ex = QUICK_SMILES_EXAMPLES[selectedQuickEx];
                  setSmiles2(ex.smiles);
                  setSmilesName2(ex.name);
                }}
              >
                &rarr; Load as Drug 2
              </button>
              <button
                className="btn-small-sticker"
                onClick={() => setShowPubchemHelp(!showPubchemHelp)}
              >
                {showPubchemHelp ? "Hide PubChem Guide ▲" : "Need SMILES? PubChem Guide ▼"}
              </button>
            </div>
          </div>

          {showPubchemHelp && (
            <div className="pubchem-helper-drawer">
              <h4>How to find Canonical SMILES for any compound on PubChem:</h4>
              <ol>
                <li>
                  Visit{" "}
                  <a
                    href="https://pubchem.ncbi.nlm.nih.gov/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://pubchem.ncbi.nlm.nih.gov/ ↗
                  </a>
                </li>
                <li>Search for your drug or experimental compound name (e.g., &ldquo;Aspirin&rdquo; or &ldquo;Sorafenib&rdquo;).</li>
                <li>Scroll to Section 2.1.4 <strong>Canonical SMILES</strong> and paste the string below.</li>
              </ol>
            </div>
          )}

          <div className="single-workbench-grid-large">
            {/* Drug 1 SMILES Input & Large Viewport */}
            <div className="workbench-card card-tint-blue workbench-compound-large">
              <div className="wb-card-header">
                <span className="wb-step-badge bg-cobalt">DRUG 1 (SMILES) • LARGE VIEWPORT</span>
                <span className={`smiles-status-pill ${val1.valid ? "valid" : "invalid"}`}>
                  {val1.valid ? `✓ Valid (${desc1?.atoms} atoms, ${desc1?.bonds} bonds)` : `✕ ${val1.reason}`}
                </span>
              </div>
              <input
                type="text"
                value={smilesName1}
                onChange={(e) => setSmilesName1(e.target.value)}
                placeholder="Compound 1 Label..."
                className="wb-filter-input mb-8"
              />
              <textarea
                rows={2}
                value={smiles1}
                onChange={(e) => setSmiles1(e.target.value)}
                placeholder="Paste Canonical SMILES for Drug 1..."
                className="wb-smiles-textarea"
              />
              <MoleculeBlueprintCanvas
                smiles={smiles1}
                title={smilesName1 || "Structure 1"}
                theme="blueprint"
                height={330}
                initialMode="2d"
              />
            </div>

            {/* Drug 2 SMILES Input & Large Viewport */}
            <div className="workbench-card card-tint-cream workbench-compound-large">
              <div className="wb-card-header">
                <span className="wb-step-badge bg-coral">DRUG 2 (SMILES) • LARGE VIEWPORT</span>
                <span className={`smiles-status-pill ${val2.valid ? "valid" : "invalid"}`}>
                  {val2.valid ? `✓ Valid (${desc2?.atoms} atoms, ${desc2?.bonds} bonds)` : `✕ ${val2.reason}`}
                </span>
              </div>
              <input
                type="text"
                value={smilesName2}
                onChange={(e) => setSmilesName2(e.target.value)}
                placeholder="Compound 2 Label..."
                className="wb-filter-input mb-8"
              />
              <textarea
                rows={2}
                value={smiles2}
                onChange={(e) => setSmiles2(e.target.value)}
                placeholder="Paste Canonical SMILES for Drug 2..."
                className="wb-smiles-textarea"
              />
              <MoleculeBlueprintCanvas
                smiles={smiles2}
                title={smilesName2 || "Structure 2"}
                theme="blueprint"
                height={330}
                initialMode="2d"
              />
            </div>
          </div>

          {/* Full-Width Cancer Context for SMILES */}
          <div className="workbench-card card-tint-yellow context-deck-bar mb-24">
            <div className="context-deck-grid">
              <div>
                <span className="wb-step-badge bg-ink mb-8">DE-NOVO GNN CONTEXT</span>
                <label className="wb-field-label">Select Target Cancer Type</label>
                <select
                  value={advCancer}
                  onChange={(e) => setAdvCancer(e.target.value)}
                  className="wb-select"
                >
                  {cancerTypes.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="wb-field-label">Select Cell Line</label>
                <select
                  value={advCellLine}
                  onChange={(e) => setAdvCellLine(e.target.value)}
                  className="wb-select"
                >
                  {advCellLines.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
                {desc1 && desc2 && (
                  <div className="smiles-comparison-mini">
                    <div>
                      <strong>D1:</strong> MW {desc1.mw} • LogP {desc1.logp} • TPSA {desc1.tpsa}
                    </div>
                    <div>
                      <strong>D2:</strong> MW {desc2.mw} • LogP {desc2.logp} • TPSA {desc2.tpsa}
                    </div>
                  </div>
                )}
              </div>

              <div className="context-deck-buttons">
                <button
                  type="button"
                  onClick={runSmilesPrediction}
                  className="btn-moving-cobalt btn-full-width"
                >
                  <span>Predict Synergy from SMILES</span>
                  <span className="btn-arrow">↗</span>
                </button>
              </div>
            </div>
          </div>

          {renderPredictionReadout(smilesResult, desc1, desc2)}
        </div>
      )}

      {/* ================= MODE 03: AI RECOMMENDATION ENGINE ================= */}
      {activeSubMode === "recommend" && (
        <div className="platform-mode-panel">
          <div className="recommender-controls-card torn-card-border">
            <div className="rec-ctrl-col">
              <label className="wb-field-label">Target Cancer Type</label>
              <select
                value={recCancer}
                onChange={(e) => setRecCancer(e.target.value)}
                className="wb-select"
              >
                {cancerTypes.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div className="rec-ctrl-col">
              <label className="wb-field-label">Target Cell Line</label>
              <select
                value={recCellLine}
                onChange={(e) => setRecCellLine(e.target.value)}
                className="wb-select"
              >
                {recCellLines.map((cl) => (
                  <option key={cl} value={cl}>
                    {cl}
                  </option>
                ))}
              </select>
            </div>

            <div className="rec-ctrl-col">
              <label className="wb-field-label">
                Top Recommendations Display: <strong>{topK} pairs</strong>
              </label>
              <input
                type="range"
                min={4}
                max={24}
                step={2}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="archival-range-slider"
              />
              <div className="cell-stats-footnote">
                Tested Drugs: <strong>{cellStats.total_drugs}</strong> • Valid SMILES:{" "}
                <strong>{cellStats.available_drugs}</strong> • Possible Pairs:{" "}
                <strong>{cellStats.possible_combinations.toLocaleString()}</strong>
              </div>
            </div>

            <div className="rec-ctrl-actions">
              <button className="btn-moving-cobalt" onClick={handleDownloadRecsCSV}>
                <span>Export CSV</span>
                <span className="btn-arrow">↓</span>
              </button>
              <button
                className="btn-moving-outline"
                onClick={() => {
                  const txt = recommendations
                    .map(
                      (r, i) =>
                        `${i + 1}. ${r.drug1} + ${r.drug2} | Synergy ZIP: ${r.synergy_score} | Safety: ${r.safety_score}`
                    )
                    .join("\n");
                  navigator.clipboard?.writeText(txt);
                  setCopiedRecs(true);
                  setTimeout(() => setCopiedRecs(false), 2500);
                }}
              >
                <span>{copiedRecs ? "✓ Copied!" : "Copy List"}</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Banner */}
          <div className="rec-kpi-strip">
            <div className="rec-kpi-box bg-yellow">
              <small>AVERAGE SYNERGY (TOP {recommendations.length})</small>
              <strong>+{recSummary.avgSynergy} ZIP</strong>
            </div>
            <div className="rec-kpi-box bg-cobalt">
              <small>AVERAGE BIOSAFETY SCORE</small>
              <strong>{recSummary.avgSafety} / 1.00</strong>
            </div>
            <div className="rec-kpi-box bg-pink">
              <small>CELL LINE EVALUATED</small>
              <strong>
                {recCellLine} ({recCancer})
              </strong>
            </div>
          </div>

          {/* Ranked Collage Recommendation Cards */}
          <div className="recommendations-cards-grid">
            {recommendations.map((rec, idx) => {
              const d1 = drugs.find((d) => d.name === rec.drug1);
              const d2 = drugs.find((d) => d.name === rec.drug2);
              const synCls = classifySynergyScore(rec.synergy_score);

              return (
                <div key={`${rec.drug1}-${rec.drug2}`} className="rec-collage-card">
                  <div className="rec-card-top">
                    <div className="rec-rank-circle">#{idx + 1}</div>
                    <div className="rec-pair-titles">
                      <h4>
                        {rec.drug1} <span>+</span> {rec.drug2}
                      </h4>
                      <small>
                        Overall Composite Score: <strong>{rec.recommendation_score}</strong> (70%
                        Synergy / 30% Safety)
                      </small>
                    </div>
                    <div className="rec-badges-col">
                      <span className={`zip-ribbon-badge badge-${synCls.badgeColor}`}>
                        ZIP: {rec.synergy_score > 0 ? `+${rec.synergy_score}` : rec.synergy_score}
                      </span>
                      <span className="safety-mini-pill">Safety: {rec.safety_score}</span>
                    </div>
                  </div>

                  <div className="rec-molecules-pair">
                    <MoleculeBlueprintCanvas
                      smiles={d1?.smiles || "C1=CC=CC=C1"}
                      title={rec.drug1}
                      theme="blueprint"
                      height={215}
                      initialMode="2d"
                      showMeta={false}
                    />
                    <MoleculeBlueprintCanvas
                      smiles={d2?.smiles || "C1=CC=CC=C1"}
                      title={rec.drug2}
                      theme="blueprint"
                      height={215}
                      initialMode="2d"
                      showMeta={false}
                    />
                  </div>

                  <button
                    onClick={() => handleTestRecommendedPair(rec)}
                    className="btn-moving-cobalt btn-full-width"
                  >
                    <span>Test This Combination in Single Predictor</span>
                    <span className="btn-arrow">↗</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODE 04: HIGH-THROUGHPUT BATCH SCREENING ================= */}
      {activeSubMode === "batch" && (
        <div className="platform-mode-panel">
          <div className="batch-top-grid">
            <div className="workbench-card card-tint-cream">
              <div className="wb-card-header">
                <span className="wb-step-badge bg-cobalt">CSV BATCH UPLOAD &amp; EDITOR</span>
                <button
                  className="btn-small-sticker"
                  onClick={() => {
                    setBatchCsvText(SAMPLE_BATCH_CSV);
                    runBatchScreening(SAMPLE_BATCH_CSV);
                  }}
                >
                  ↻ Reload 10-Pair Oncology Sample CSV
                </button>
              </div>

              <p className="batch-instructions">
                Upload a <code>.csv</code> file or edit rows directly below. Required columns:{" "}
                <code>drug_a_name, drug_b_name, drug_a_smiles, drug_b_smiles, cancer_type, cell_line</code>
              </p>

              <div className="batch-upload-row">
                <label className="file-upload-sticker-btn">
                  <span>📂 Upload Custom CSV File</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} hidden />
                </label>

                <button
                  className="btn-moving-cobalt"
                  onClick={() => runBatchScreening(batchCsvText)}
                >
                  <span>Run High-Throughput GNN Screen</span>
                  <span className="btn-arrow">↗</span>
                </button>

                {batchResults?.rows && (
                  <button className="btn-moving-yellow" onClick={handleDownloadBatchCSV}>
                    <span>Download Results CSV</span>
                    <span className="btn-arrow">↓</span>
                  </button>
                )}
              </div>

              <textarea
                rows={7}
                value={batchCsvText}
                onChange={(e) => setBatchCsvText(e.target.value)}
                className="wb-smiles-textarea batch-csv-editor"
              />
            </div>

            {/* Batch Summary Statistics Collage Box */}
            {batchResults && !batchResults.error && (
              <div className="workbench-card card-tint-yellow">
                <div className="wb-card-header">
                  <span className="wb-step-badge bg-ink">SCREENING TELEMETRY</span>
                </div>
                <div className="batch-stats-2x2">
                  <div className="bstat-box">
                    <small>TOTAL PAIRS</small>
                    <strong>{batchResults.total}</strong>
                  </div>
                  <div className="bstat-box">
                    <small>VALID PREDICTIONS</small>
                    <strong>
                      {batchResults.successCount}/{batchResults.total}
                    </strong>
                  </div>
                  <div className="bstat-box">
                    <small>AVG / MAX ZIP</small>
                    <strong>
                      {batchResults.avgSyn} / +{batchResults.maxSyn}
                    </strong>
                  </div>
                  <div className="bstat-box">
                    <small>AVG SAFETY INDEX</small>
                    <strong>{batchResults.avgSaf}</strong>
                  </div>
                </div>

                <div className="synergy-dist-strip">
                  <span className="dist-chip chip-coral">
                    High (&gt;6): {batchResults.highSynergyCount}
                  </span>
                  <span className="dist-chip chip-yellow">
                    Medium (3-6): {batchResults.medSynergyCount}
                  </span>
                  <span className="dist-chip chip-blue">
                    Low (0-3): {batchResults.lowSynergyCount}
                  </span>
                  <span className="dist-chip chip-ink">
                    Antagonism (&le;0): {batchResults.antagonismCount}
                  </span>
                </div>
              </div>
            )}
          </div>

          {batchResults?.error && (
            <div className="archival-error-banner">{batchResults.error}</div>
          )}

          {/* Batch Results Table */}
          {batchResults?.rows && (
            <div className="batch-table-card torn-card-border">
              <div className="batch-table-header">
                <h3>Batch Screening Output Matrix ({batchResults.rows.length} combinations)</h3>
                <div className="batch-filter-pills">
                  {["ALL", "High Synergy", "Medium Synergy", "Low Synergy", "Antagonism"].map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setBatchFilterClass(f)}
                        className={`filter-chip-btn ${batchFilterClass === f ? "active" : ""}`}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="archival-table-scroll">
                <table className="archival-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Drug A</th>
                      <th>Drug B</th>
                      <th>Cancer Type</th>
                      <th>Cell Line</th>
                      <th>ZIP Synergy</th>
                      <th>Classification</th>
                      <th>Safety Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.rows
                      .filter(
                        (r) =>
                          batchFilterClass === "ALL" || r.synergy_class === batchFilterClass
                      )
                      .map((r) => (
                        <tr key={r.rowNum}>
                          <td>{r.rowNum}</td>
                          <td>
                            <strong>{r.drug_a_name}</strong>
                          </td>
                          <td>
                            <strong>{r.drug_b_name}</strong>
                          </td>
                          <td>{r.cancer_type}</td>
                          <td>
                            <span className="cell-badge">{r.cell_line}</span>
                          </td>
                          <td>
                            <strong className="table-zip-num">
                              {r.synergy_zip !== null
                                ? r.synergy_zip > 0
                                  ? `+${r.synergy_zip}`
                                  : r.synergy_zip
                                : "—"}
                            </strong>
                          </td>
                          <td>
                            <span className={`zip-ribbon-badge badge-${r.badgeColor || "ink"}`}>
                              {r.synergy_class}
                            </span>
                          </td>
                          <td>{r.safety_score !== null ? r.safety_score : "—"}</td>
                          <td>
                            {r.synergy_zip !== null && (
                              <button
                                className="btn-table-inspect"
                                onClick={() => {
                                  setSmiles1(r.drug_a_smiles);
                                  setSmiles2(r.drug_b_smiles);
                                  setSmilesName1(r.drug_a_name);
                                  setSmilesName2(r.drug_b_name);
                                  setAdvCancer(r.cancer_type);
                                  setAdvCellLine(r.cell_line);
                                  setActiveSubMode("smiles");
                                }}
                              >
                                Inspect 2D &rarr;
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
