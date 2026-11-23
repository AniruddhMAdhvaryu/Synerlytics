import React, { useState, useEffect } from "react";
import gsap from "gsap";
import synerlyticsData from "./data/synerlyticsData.json";
import HeroCollageSection from "./components/HeroCollageSection";
import PlatformView from "./components/PlatformView";
import ThreeDExplorerView from "./components/ThreeDExplorerView";
import {
  ResearchView,
  DatasetsView,
  DocsView,
  AboutView
} from "./components/SecondaryPages";

const NAV_PAGES = ["Home", "Platform", "3D Explorer", "Research", "Datasets", "Docs", "About"];

export default function App() {
  const [activePage, setActivePage] = useState("Home");
  const [platformSubMode, setPlatformSubMode] = useState("single");
  const [prefillPair, setPrefillPair] = useState(null);
  const [explorerDrugName, setExplorerDrugName] = useState("PACLITAXEL");
  const [telemetryEvents, setTelemetryEvents] = useState([
    {
      time: new Date().toLocaleTimeString(),
      event: "app_session_initialized",
      props: { model: "DualGNNModel_4Layer_GINEConv_Organic2D_3D", drugs_loaded: synerlyticsData.drugs.length }
    }
  ]);

  const trackEvent = (eventName, props = {}) => {
    setTelemetryEvents((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        event: eventName,
        props
      },
      ...prev.slice(0, 24)
    ]);
  };

  const handleNavigate = (page, subMode = null) => {
    setActivePage(page);
    if (subMode) {
      setPlatformSubMode(subMode);
    }
    trackEvent("page_viewed", { page, sub_mode: subMode || "default" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickTestPair = (pairObj) => {
    setPrefillPair(pairObj);
    setPlatformSubMode("single");
    setActivePage("Platform");
    trackEvent("quicktest_launched_in_platform", pairObj);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSendDrugToPredictor = (drugName, slot = "A") => {
    setPrefillPair((prev) => ({
      drugA: slot === "A" ? drugName : prev?.drugA || "PACLITAXEL",
      drugB: slot === "B" ? drugName : prev?.drugB || "DOXORUBICIN",
      cancerType: "Breast Cancer",
      cellLine: "MCF7"
    }));
    setPlatformSubMode("single");
    setActivePage("Platform");
    trackEvent("catalog_drug_selected", { drug: drugName, slot });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenIn3DExplorer = (drugName) => {
    setExplorerDrugName(drugName);
    setActivePage("3D Explorer");
    trackEvent("compound_opened_in_3d_explorer", { drug: drugName });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCellLineInRecommender = (cellLineName, primaryDisease) => {
    setPlatformSubMode("recommend");
    setActivePage("Platform");
    trackEvent("depmap_cell_line_inspected", { cell_line: cellLineName, disease: primaryDisease });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    gsap.fromTo(
      ".main-page-transition-stage",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [activePage]);

  return (
    <div className="synerlytics-app-shell">
      {/* Subtle Paper Grain Overlay */}
      <div className="paper-grain-overlay" />

      {/* ================= REFERENCE TOP NAVIGATION BAR ================= */}
      <header className="top-editorial-navbar">
        <div className="navbar-inner">
          {/* Left Brand Block: Molecular Icon + Synerlytics | AI FOR COMBINATION ONCOLOGY */}
          <div
            className="brand-identity-block"
            onClick={() => handleNavigate("Home")}
            style={{ cursor: "pointer" }}
          >
            <svg viewBox="0 0 46 42" className="brand-molecule-logo">
              <line x1="22" y1="20" x2="20" y2="8" stroke="#1745C4" strokeWidth="3.2" />
              <line x1="22" y1="20" x2="10" y2="30" stroke="#1745C4" strokeWidth="3.2" />
              <line x1="22" y1="20" x2="36" y2="27" stroke="#1745C4" strokeWidth="3.2" />
              <circle cx="22" cy="20" r="5" fill="#1745C4" />
              <circle cx="20" cy="7" r="4" fill="#1745C4" />
              <circle cx="9" cy="31" r="4.5" fill="#1745C4" />
              <circle cx="37" cy="27" r="4" fill="#1745C4" />
            </svg>
            <span className="brand-serif-name">Synerlytics</span>
            <span className="brand-vertical-divider" />
            <span className="brand-mono-tagline">
              AI FOR
              <br />
              COMBINATION
              <br />
              ONCOLOGY
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="editorial-nav-links" aria-label="Main Navigation">
            {NAV_PAGES.map((page) => (
              <button
                key={page}
                onClick={() => handleNavigate(page)}
                className={`nav-link-item ${activePage === page ? "active" : ""}`}
              >
                <span>{page}</span>
              </button>
            ))}
          </nav>

          {/* Right Skewed Cobalt CTA Button: Try Synerlytics ↗ */}
          <div className="navbar-cta-wrap">
            <button
              onClick={() => handleNavigate("Platform", "single")}
              className="btn-navbar-try-cobalt"
            >
              <span>Try Synerlytics</span>
              <span className="btn-arrow">↗</span>
            </button>
          </div>
        </div>
        {/* Torn Paper Bottom Edge of Navbar */}
        <div className="navbar-torn-bottom-edge" />
      </header>

      {/* ================= ACTIVE PAGE STAGE ================= */}
      <main className="main-page-transition-stage">
        {activePage === "Home" && (
          <HeroCollageSection
            onNavigate={handleNavigate}
            onQuickTestPair={handleQuickTestPair}
          />
        )}

        {activePage === "Platform" && (
          <PlatformView
            dataset={synerlyticsData}
            activeSubMode={platformSubMode}
            setActiveSubMode={setPlatformSubMode}
            prefillPair={prefillPair}
            onClearPrefill={() => setPrefillPair(null)}
            onTrackEvent={trackEvent}
          />
        )}

        {activePage === "3D Explorer" && (
          <ThreeDExplorerView
            dataset={synerlyticsData}
            initialDrugName={explorerDrugName}
            onSendDrugToPredictor={handleSendDrugToPredictor}
          />
        )}

        {activePage === "Research" && <ResearchView onNavigate={handleNavigate} />}

        {activePage === "Datasets" && (
          <DatasetsView
            dataset={synerlyticsData}
            onSendDrugToPredictor={handleSendDrugToPredictor}
            onOpenCellLineInRecommender={handleOpenCellLineInRecommender}
            onOpenIn3DExplorer={handleOpenIn3DExplorer}
          />
        )}

        {activePage === "Docs" && <DocsView telemetryEvents={telemetryEvents} />}

        {activePage === "About" && <AboutView onNavigate={handleNavigate} />}
      </main>

      {/* ================= ARCHIVAL COLLAGE FOOTER ================= */}
      <footer className="archival-footer">
        <div className="footer-torn-top-edge" />
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <span className="brand-serif-name">Synerlytics</span>
              <span className="footer-version-badge">GINEConv v2.6</span>
            </div>
            <p className="footer-desc">
              Graph Neural Network-based system with 2D Organic Blueprints &amp; 3D Molecular
              Structures for predicting synergistic effects and 8-category organ toxicity.
            </p>
            <small className="footer-disclaimer mt-12">
              For computational oncology research &amp; educational purposes only.
            </small>
          </div>

          <div className="footer-nav-col">
            <h5>NAVIGATION</h5>
            <div className="footer-links-list">
              {NAV_PAGES.map((p) => (
                <button key={p} onClick={() => handleNavigate(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="footer-nav-col">
            <h5>PREDICTION MODES</h5>
            <div className="footer-links-list">
              <button onClick={() => handleNavigate("Platform", "single")}>
                Single Pair Predictor
              </button>
              <button onClick={() => handleNavigate("Platform", "smiles")}>
                SMILES Chemical Sandbox
              </button>
              <button onClick={() => handleNavigate("Platform", "recommend")}>
                AI Recommender Engine
              </button>
              <button onClick={() => handleNavigate("Platform", "batch")}>
                High-Throughput Batch CSV
              </button>
              <button onClick={() => handleNavigate("3D Explorer")}>
                3D Molecular Engine
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
