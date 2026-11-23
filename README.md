# Synerlytics — Drug Combination Synergy & Biosafety Predictor

**Live Application:** [https://synerlytics-ai.vercel.app](https://synerlytics-ai.vercel.app)

Synerlytics is a computational oncology platform that predicts the synergistic effects (Zero Interaction Potency / ZIP scale) and multi-organ toxicity profiles of drug combinations across cancer cell lines. Each compound is represented as a molecular graph and processed through a dual 4-layer Graph Isomorphism Network with Edge features (`GINEConv`), integrated with cancer lineage context and Broad Institute DepMap cell-line embeddings.

---

## Core Modules

- **Single Pair Predictor** — Evaluate pairwise combinations across 650+ indexed oncology compounds, 17 cancer types, and 155+ experimentally mapped DepMap cell lines with interactive 2D organic skeletal blueprints, 3D ball-and-stick/CPK views, and an 8-axis multi-organ toxicity radar.
- **Advanced SMILES Sandbox** — Input custom canonical SMILES strings to construct molecular graphs on the fly and run de-novo synergy and toxicity inference for experimental or uncataloged compounds.
- **AI Recommendation Engine** — Rank top synergistic drug combinations for a target cancer type and cell line using a weighted composite of predicted ZIP synergy (70%) and multi-organ safety (30%).
- **High-Throughput Batch Screening** — Upload multi-pair CSV libraries for automated SMILES validation, batch inference, synergy distribution analysis, and downloadable CSV reports.
- **3D Molecular Conformer Explorer** — Inspect any indexed compound in real-time 3D (`3D Ball & Stick`, `3D CPK Spacefill`, and `2D Organic Blueprint`) with 360° rotation, zoom, atom coordinate telemetry, and physicochemical descriptors.
- **Datasets & Field Manual** — Searchable catalog of 2D organic structures and DepMap cell-line metadata alongside API documentation and ZIP interpretation guidelines.

---

## Model Architecture

### Graph Neural Network (`DualGNNModel`)
- **Graph Encoder:** 4-layer weight-shared `GINEConv` (Graph Isomorphism Network with Edge features), `BatchNorm1d(192)`, ReLU activations, and global mean pooling.
- **Node Features (5D):** Atomic number, total hydrogen count, node degree, implicit valence, and aromaticity flag.
- **Edge Features (1D):** Bidirectional bond-order encoding (`Single = 1.0`, `Aromatic = 1.5`, `Double = 2.0`, `Triple = 3.0`).
- **Drug Embeddings:** 192-dimensional latent vector per compound (`384-d` pair representation).
- **Oncology Context Integration:** 17-dimensional one-hot cancer lineage vector + 48-dimensional learned cell-line embedding (`vocab size = 288`).
- **Prediction Head:** Multi-layer perceptron (`449 → 512 → 256 → 1`) with `0.3` dropout regularization, inverse-scaled via `StandardScaler` (`mean = -0.1458`, `std = 8.5355`).

### Training & Evaluation Summary
- **Dataset:** DrugComb portal (~561,754 samples after drug-pair symmetry augmentation; ZIP range `36.05` points; 80/20 train-test split).
- **Optimization:** AdamW (`lr = 1e-3`, `weight_decay = 1e-5`), MSE loss, `CosineAnnealingWarmRestarts` (`T_0 = 10`), batch size `128`, gradient clipping (`max_norm = 1.0`), mixed-precision (`AMP`).
- **Test Set Metrics:**
  - **$R^2$:** `0.6137`
  - **MAE:** `3.84` (`10.7%` of data range)
  - **RMSE:** `5.31` (`14.7%` of data range)

### 8-Organ Toxicity & Safety Assessment
Evaluates individual and combined risk across eight organ/system categories using SMARTS structural alert matching and Lipinski physicochemical descriptors (`MW`, `LogP`, `TPSA`, `HBD`, `HBA`, rotatable bonds, aromatic rings):
1. Hepatotoxicity (Liver)
2. Nephrotoxicity (Kidney)
3. Cardiotoxicity (Heart)
4. Neurotoxicity (Nervous System)
5. Gastrointestinal Effects (GI Tract)
6. Dermatological Effects (Skin)
7. Central Nervous System (CNS / BBB Penetration)
8. Metabolic Issues (Clearance / Mass Burden)

Combined pairwise toxicity risk is calculated as:
$$\text{Risk}_{\text{combined}} = 1 - (1 - \text{Risk}_A) \times (1 - \text{Risk}_B)$$

---

## Repository Structure

```text
├── public/
│   └── assets/                  # Archival scientific imagery & cutouts
├── src/
│   ├── components/
│   │   ├── CollageStickers.jsx          # SVG stamps, organic blueprints & 8-axis toxicity radar
│   │   ├── HeroCollageSection.jsx       # Home view, quick-test bench & archival showcase
│   │   ├── MoleculeBlueprintCanvas.jsx  # 2D organic skeletal & 3D interactive canvas engine
│   │   ├── PlatformView.jsx             # 4-mode prediction workbench
│   │   ├── SecondaryPages.jsx           # Research, Datasets, Docs & About views
│   │   └── ThreeDExplorerView.jsx       # Dedicated 3D conformer explorer
│   ├── data/
│   │   └── synerlyticsData.json         # Indexed compounds, GNN embeddings & DepMap mappings
│   ├── styles/
│   │   └── index.css                    # Layout & styling rules
│   ├── utils/
│   │   └── chemistryEngine.js           # SSSR ring-polygon layout, 3D geometry & GNN inference
│   ├── App.jsx
│   └── main.jsx
├── model/
│   ├── Datasets/                # Drug SMILES catalog & DepMap sample metadata
│   ├── notebooks/               # Data cleaning, SMILES resolution, EDA & hybrid GNN training
│   ├── app.py                   # Python PyTorch Geometric & RDKit reference script
│   ├── final_gnn_model.pt       # Trained PyTorch DualGNNModel state dict
│   ├── cancer_cols.pkl          # One-hot cancer lineage column definitions
│   ├── cell_le.pkl              # Cell line LabelEncoder artifact
│   ├── scaler_y.pkl             # Target ZIP synergy StandardScaler artifact
│   └── requirements.txt
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## Local Development

### Prerequisites
- Node.js `18+` and npm

### Run the Web Application
```bash
npm install
npm run dev
```
The local development server starts at `http://localhost:5173`.

### Production Build
```bash
npm run build
npm run preview
```

---

## Disclaimer
This project is intended for computational oncology research, preclinical virtual screening, and educational use only. Predictions require experimental validation and should not be used as clinical medical advice.
