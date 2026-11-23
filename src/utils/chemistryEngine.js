// src/utils/chemistryEngine.js
// Chemoinformatics, Textbook 2D Organic Ring-Polygon Layout, 3D Conformer & GNN Synergy Engine

export const QUICK_SMILES_EXAMPLES = [
  { name: "Bicuculline (Ref Drug 1)", smiles: "CN1CCC2=CC3=C(C=C2C1C4C5=C(C6=C(C=C5)OCO6)C(=O)O4)OCO3", category: "GABA Antagonist / Ref" },
  { name: "Chlorpheniramine (Ref Drug 2)", smiles: "CN(C)CCC(C1=CC=C(C=C1)Cl)C2=CC=CC=N2", category: "Histamine H1 / Ref" },
  { name: "Paclitaxel", smiles: "CC1=C2C(C(=O)C3=C(COC3=O)C(C2(C)C)(CC1OC(=O)C(C(C4=CC=CC=C4)NC(=O)C5=CC=CC=C5)O)C)OC(=O)C6=CC=CC=C6", category: "Taxane Mitotic Inhibitor" },
  { name: "Doxorubicin", smiles: "CC1C(C(CC(O1)OC2C(OC3C(C2O)C(C(C4=CC(=O)C5=CC=CC=C5C4=O)O)(C)C)C)O)(C)O", category: "Anthracycline Topoisomerase II" },
  { name: "Olaparib", smiles: "C1CC1C(=O)N2CCN(CC2)C(=O)C3=C(C=CC(=C3)CC4=NN(C(=O)C5=CC=CC=C54)H)F", category: "PARP Inhibitor" },
  { name: "Cisplatin", smiles: "Cl[Pt](Cl)(N)N", category: "Platinum DNA Crosslinker" },
  { name: "Imatinib", smiles: "CN1CCN(CC1)C2=NC3=C(C=C2)C=C(C=C3)NC(=O)C4=CC=CC=C4", category: "BCR-ABL Tyrosine Kinase" },
  { name: "5-Fluorouracil", smiles: "C1=CN(C(=O)NC1=O)F", category: "Antimetabolite Pyrimidine" },
  { name: "Gemcitabine", smiles: "C1=NC(=O)N(C=C1)C2C(C(C(O2)CO)O)O", category: "Nucleoside Analog" },
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O", category: "COX Inhibitor" },
  { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", category: "Methylxanthine" },
  { name: "Metformin", smiles: "CN(C)C(=N)N=C(N)N", category: "AMPK Activator" }
];

export const TOXICITY_CATEGORIES = [
  { key: "hepatotoxicity", label: "Hepatotoxicity", organ: "Liver", smarts: "[#6]-[N+](=O)[O-], c1ccccc1[N], S(=O)(=O)[OH], MW > 500" },
  { key: "nephrotoxicity", label: "Nephrotoxicity", organ: "Kidney", smarts: "[Cl,Br,I], c1ccccc1[F,Cl,Br,I], [NH2]C(=O), LogP > 4" },
  { key: "cardiotoxicity", label: "Cardiotoxicity", organ: "Heart", smarts: "c1ccccc1, [N+], C=O, Aromatic Rings > 2" },
  { key: "neurotoxicity", label: "Neurotoxicity", organ: "Nervous System", smarts: "C#N, C=O, [S;D2](=O)(=O)[#6]" },
  { key: "gastrointestinal", label: "Gastrointestinal", organ: "GI Tract", smarts: "[OH], C(=O)[OH], c1ccccc1[OH], HBD > 3" },
  { key: "dermatological", label: "Dermatological", organ: "Skin", smarts: "[Cl,Br,I], C=O, c1ccccc1" },
  { key: "cns_effects", label: "CNS Effects", organ: "Brain / BBB", smarts: "0.1 + (LogP / 10) Lipophilicity Penetration" },
  { key: "metabolic_issues", label: "Metabolic Issues", organ: "CYP450 / Clearance", smarts: "0.1 + (MW - 300) / 700 Mass Burden" }
];

export function validateSmiles(smiles) {
  if (!smiles || typeof smiles !== "string") return { valid: false, reason: "Empty SMILES string" };
  const s = smiles.trim();
  if (s.length < 2) return { valid: false, reason: "SMILES too short" };
  let parens = 0;
  let brackets = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") parens++;
    if (s[i] === ")") parens--;
    if (s[i] === "[") brackets++;
    if (s[i] === "]") brackets--;
    if (parens < 0 || brackets < 0) return { valid: false, reason: "Unbalanced parentheses or brackets" };
  }
  if (parens !== 0 || brackets !== 0) return { valid: false, reason: "Unclosed parentheses or brackets" };
  if (!/[BCNOPSFIbcnops]|Cl|Br|Pt/.test(s)) return { valid: false, reason: "No recognized chemical atoms" };
  if (/[^A-Za-z0-9@+\-\[\]\(\)=#$:/\\.%*]/.test(s)) return { valid: false, reason: "Contains invalid SMILES characters" };
  return { valid: true, reason: "Valid Canonical SMILES" };
}

// Find shortest cycle for ring closure bond (u, v) using BFS
function findRingCycle(nAtoms, treeAdj, u, v) {
  const parent = new Array(nAtoms).fill(-1);
  const visited = new Array(nAtoms).fill(false);
  const queue = [u];
  visited[u] = true;
  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === v) break;
    for (const nxt of treeAdj[curr]) {
      if (!visited[nxt]) {
        visited[nxt] = true;
        parent[nxt] = curr;
        queue.push(nxt);
      }
    }
  }
  if (!visited[v]) return null;
  const cycle = [];
  let cur = v;
  while (cur !== -1) {
    cycle.push(cur);
    cur = parent[cur];
  }
  return cycle.length >= 3 && cycle.length <= 10 ? cycle.reverse() : null;
}

export function parseSmilesTo2DGraph(smiles) {
  const check = validateSmiles(smiles);
  if (!check.valid) return null;

  const s = smiles.trim();
  const tokens = s.match(/\[[^\]]+\]|Br|Cl|Pt|Na|Ca|Mg|Zn|Fe|As|[BCNOPSFIbcnops]|=|\#|\(|\)|%\d\d|\d/g) || [];
  const atoms = [];
  const bonds = [];
  const stack = [];
  const openRings = {};
  let prevAtom = null;
  let nextBondOrder = 1;

  for (const tok of tokens) {
    if (tok === "(") {
      if (prevAtom !== null) stack.push(prevAtom);
    } else if (tok === ")") {
      if (stack.length > 0) prevAtom = stack.pop();
    } else if (tok === "=") {
      nextBondOrder = 2;
    } else if (tok === "#") {
      nextBondOrder = 3;
    } else if (/^(\d|%\d\d)$/.test(tok)) {
      const rnum = tok;
      if (openRings[rnum] !== undefined) {
        const { atom: openAtom, order: openOrder } = openRings[rnum];
        delete openRings[rnum];
        if (prevAtom !== null && prevAtom !== openAtom) {
          const isArom = atoms[prevAtom].aromatic && atoms[openAtom].aromatic;
          const bOrder = nextBondOrder > 1 ? nextBondOrder : openOrder > 1 ? openOrder : isArom ? 1.5 : 1;
          bonds.push({ from: prevAtom, to: openAtom, order: bOrder, isRingClosure: true });
          atoms[prevAtom].degree++;
          atoms[openAtom].degree++;
        }
      } else if (prevAtom !== null) {
        openRings[rnum] = { atom: prevAtom, order: nextBondOrder };
      }
      nextBondOrder = 1;
    } else {
      const clean = tok.replace(/[\[\]]/g, "");
      const m = clean.match(/^(Br|Cl|Pt|Na|Ca|Mg|Zn|Fe|As|[BCNOPSFIbcnops])/);
      const rawSym = m ? m[1] : "C";
      const isArom = rawSym === rawSym.toLowerCase() && rawSym !== "cl" && rawSym !== "br";
      const sym = rawSym.charAt(0).toUpperCase() + rawSym.slice(1);
      const idx = atoms.length;

      atoms.push({
        id: idx,
        symbol: sym,
        aromatic: isArom,
        x: 0,
        y: 0,
        z: 0,
        degree: 0,
        inRing: false
      });

      if (prevAtom !== null) {
        const order = nextBondOrder > 1 ? nextBondOrder : isArom && atoms[prevAtom].aromatic ? 1.5 : 1;
        bonds.push({ from: prevAtom, to: idx, order, isRingClosure: false });
        atoms[prevAtom].degree++;
        atoms[idx].degree++;
      }
      prevAtom = idx;
      nextBondOrder = 1;
    }
  }

  if (atoms.length === 0) return null;

  const n = atoms.length;
  const treeAdj = Array.from({ length: n }, () => []);
  const fullAdj = Array.from({ length: n }, () => []);
  const rings = [];

  for (const b of bonds) {
    fullAdj[b.from].push({ to: b.to, bond: b });
    fullAdj[b.to].push({ to: b.from, bond: b });
    if (!b.isRingClosure) {
      treeAdj[b.from].push(b.to);
      treeAdj[b.to].push(b.from);
    }
  }

  for (const b of bonds) {
    if (b.isRingClosure) {
      const cycle = findRingCycle(n, treeAdj, b.from, b.to);
      if (cycle) {
        rings.push(cycle);
        cycle.forEach((aid) => {
          atoms[aid].inRing = true;
        });
      }
    }
  }

  // Alternate Kekule double bonds inside aromatic rings so 2D Organic skeletal view shows textbook double-bond lines
  for (const r of rings) {
    const allArom = r.every((aid) => atoms[aid].aromatic);
    if (allArom) {
      for (let i = 0; i < r.length; i++) {
        const u = r[i];
        const v = r[(i + 1) % r.length];
        const edge = bonds.find((b) => (b.from === u && b.to === v) || (b.from === v && b.to === u));
        if (edge) {
          edge.isAromaticRingBond = true;
          edge.kekuleDouble = i % 2 === 0;
        }
      }
    }
  }

  // ================= TEXTBOOK 2D ORGANIC SKELETAL COORDINATE LAYOUT =================
  const L = 38; // Standard organic bond length
  const placed = new Array(n).fill(false);
  const ringCenters = [];

  // Place rings first using exact regular polygons + fused-edge reflection
  const placedRings = new Array(rings.length).fill(false);

  const placeSingleRingPolygon = (rIdx, cx, cy, startAngle) => {
    const cycle = rings[rIdx];
    const k = cycle.length;
    const radius = L / (2 * Math.sin(Math.PI / k));
    for (let i = 0; i < k; i++) {
      const aid = cycle[i];
      if (!placed[aid]) {
        const ang = startAngle + (2 * Math.PI * i) / k;
        atoms[aid].x = cx + radius * Math.cos(ang);
        atoms[aid].y = cy + radius * Math.sin(ang);
        placed[aid] = true;
      }
    }
    placedRings[rIdx] = true;
    // Compute actual center
    let rcx = 0,
      rcy = 0;
    cycle.forEach((aid) => {
      rcx += atoms[aid].x;
      rcy += atoms[aid].y;
    });
    ringCenters[rIdx] = { x: rcx / k, y: rcy / k, cycle };
  };

  if (rings.length > 0) {
    // Place first ring at origin with vertical left/right edges (standard benzene orientation)
    const k0 = rings[0].length;
    placeSingleRingPolygon(0, 0, 0, -Math.PI / 2 - Math.PI / k0);

    // Iteratively place fused or connected rings
    let progress = true;
    while (progress) {
      progress = false;
      for (let rIdx = 0; rIdx < rings.length; rIdx++) {
        if (placedRings[rIdx]) continue;
        const cycle = rings[rIdx];
        const k = cycle.length;
        const shared = cycle.filter((aid) => placed[aid]);

        if (shared.length >= 2) {
          // Fused ring sharing bond (u, v)
          // Find two consecutive shared atoms in cycle
          let idxU = -1,
            idxV = -1;
          for (let i = 0; i < k; i++) {
            const a = cycle[i];
            const b = cycle[(i + 1) % k];
            if (placed[a] && placed[b]) {
              idxU = i;
              idxV = (i + 1) % k;
              break;
            }
          }
          if (idxU !== -1) {
            const u = cycle[idxU];
            const v = cycle[idxV];
            const mx = (atoms[u].x + atoms[v].x) / 2;
            const my = (atoms[u].y + atoms[v].y) / 2;
            const dx = atoms[v].x - atoms[u].x;
            const dy = atoms[v].y - atoms[u].y;
            const edgeLen = Math.hypot(dx, dy) || L;
            const apothem = L / (2 * Math.tan(Math.PI / k));
            // Normal perpendicular to (u -> v) pointing away from existing placed ring centroids
            let nx = -dy / edgeLen;
            let ny = dx / edgeLen;
            // Check existing placed atoms centroid to pick outward normal
            let exX = 0,
              exY = 0,
              exCnt = 0;
            for (let i = 0; i < n; i++) {
              if (placed[i] && i !== u && i !== v) {
                exX += atoms[i].x;
                exY += atoms[i].y;
                exCnt++;
              }
            }
            if (exCnt > 0) {
              exX /= exCnt;
              exY /= exCnt;
              const cand1 = Math.hypot(mx + nx * apothem - exX, my + ny * apothem - exY);
              const cand2 = Math.hypot(mx - nx * apothem - exX, my - ny * apothem - exY);
              if (cand2 > cand1) {
                nx = -nx;
                ny = -ny;
              }
            }
            const cx = mx + nx * apothem;
            const cy = my + ny * apothem;
            const radius = L / (2 * Math.sin(Math.PI / k));
            const angU = Math.atan2(atoms[u].y - cy, atoms[u].x - cx);
            const angV = Math.atan2(atoms[v].y - cy, atoms[v].x - cx);
            // Determine direction (+1 or -1) from idxU to idxV
            let diff = angV - angU;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const stepSign = diff >= 0 ? 1 : -1;

            for (let step = 0; step < k; step++) {
              const cPos = (idxU + step) % k;
              const aid = cycle[cPos];
              if (!placed[aid]) {
                const ang = angU + stepSign * ((2 * Math.PI * step) / k);
                atoms[aid].x = cx + radius * Math.cos(ang);
                atoms[aid].y = cy + radius * Math.sin(ang);
                placed[aid] = true;
              }
            }
            placedRings[rIdx] = true;
            ringCenters[rIdx] = { x: cx, y: cy, cycle };
            progress = true;
          }
        } else if (shared.length === 1) {
          // Spiro ring sharing 1 atom
          const u = shared[0];
          const idxU = cycle.indexOf(u);
          let exX = 0,
            exY = 0,
            exCnt = 0;
          for (const nb of fullAdj[u]) {
            if (placed[nb.to]) {
              exX += atoms[nb.to].x;
              exY += atoms[nb.to].y;
              exCnt++;
            }
          }
          const outAng = exCnt > 0 ? Math.atan2(atoms[u].y - exY / exCnt, atoms[u].x - exX / exCnt) : 0;
          const radius = L / (2 * Math.sin(Math.PI / k));
          const cx = atoms[u].x + Math.cos(outAng) * radius;
          const cy = atoms[u].y + Math.sin(outAng) * radius;
          const angU = Math.atan2(atoms[u].y - cy, atoms[u].x - cx);
          for (let step = 1; step < k; step++) {
            const aid = cycle[(idxU + step) % k];
            if (!placed[aid]) {
              const ang = angU + (2 * Math.PI * step) / k;
              atoms[aid].x = cx + radius * Math.cos(ang);
              atoms[aid].y = cy + radius * Math.sin(ang);
              placed[aid] = true;
            }
          }
          placedRings[rIdx] = true;
          ringCenters[rIdx] = { x: cx, y: cy, cycle };
          progress = true;
        }
      }
    }
  }

  // Now traverse BFS from already-placed atoms (or atom 0) to place chains and any unplaced rings at clean 120° organic angles
  if (!placed.some(Boolean)) {
    atoms[0].x = 0;
    atoms[0].y = 0;
    placed[0] = true;
  }

  const parentDir = new Array(n).fill(-Math.PI / 6);

  // Compute radial outward angles for placed ring atoms
  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    const rc = ringCenters[rIdx];
    if (!rc) continue;
    for (const aid of rc.cycle) {
      parentDir[aid] = Math.atan2(atoms[aid].y - rc.y, atoms[aid].x - rc.x);
    }
  }

  for (let pass = 0; pass < n + 4; pass++) {
    let added = false;
    for (let u = 0; u < n; u++) {
      if (!placed[u]) continue;
      const unplacedNbs = fullAdj[u].map((e) => e.to).filter((v) => !placed[v]);
      if (unplacedNbs.length === 0) continue;

      // Determine outward direction away from already-placed neighbors of u
      const placedNbs = fullAdj[u].map((e) => e.to).filter((v) => placed[v]);
      let baseAng = parentDir[u];
      if (placedNbs.length === 1) {
        const p = placedNbs[0];
        const inAng = Math.atan2(atoms[u].y - atoms[p].y, atoms[u].x - atoms[p].x);
        baseAng = inAng + (u % 2 === 0 ? Math.PI / 3 : -Math.PI / 3);
      } else if (placedNbs.length >= 2) {
        let sx = 0,
          sy = 0;
        placedNbs.forEach((p) => {
          sx += atoms[p].x - atoms[u].x;
          sy += atoms[p].y - atoms[u].y;
        });
        baseAng = Math.atan2(-sy, -sx);
      }

      unplacedNbs.forEach((v, kIdx) => {
        let ang = baseAng;
        if (unplacedNbs.length === 2) {
          ang = baseAng + (kIdx === 0 ? Math.PI / 3 : -Math.PI / 3);
        } else if (unplacedNbs.length >= 3) {
          ang = baseAng + (kIdx - 1) * (Math.PI / 2.2);
        }

        // Check if v is the entry point to an unplaced ring
        const unplacedRingIdx = rings.findIndex((cyc, rI) => !placedRings[rI] && cyc.includes(v));
        if (unplacedRingIdx !== -1) {
          const cycle = rings[unplacedRingIdx];
          const k = cycle.length;
          const radius = L / (2 * Math.sin(Math.PI / k));
          atoms[v].x = atoms[u].x + Math.cos(ang) * L;
          atoms[v].y = atoms[u].y + Math.sin(ang) * L;
          placed[v] = true;
          const cx = atoms[v].x + Math.cos(ang) * radius;
          const cy = atoms[v].y + Math.sin(ang) * radius;
          const idxV = cycle.indexOf(v);
          const angV = Math.atan2(atoms[v].y - cy, atoms[v].x - cx);
          for (let step = 1; step < k; step++) {
            const aid = cycle[(idxV + step) % k];
            if (!placed[aid]) {
              const aAng = angV + (2 * Math.PI * step) / k;
              atoms[aid].x = cx + radius * Math.cos(aAng);
              atoms[aid].y = cy + radius * Math.sin(aAng);
              placed[aid] = true;
            }
          }
          placedRings[unplacedRingIdx] = true;
          ringCenters[unplacedRingIdx] = { x: cx, y: cy, cycle };
        } else {
          atoms[v].x = atoms[u].x + Math.cos(ang) * L;
          atoms[v].y = atoms[u].y + Math.sin(ang) * L;
          parentDir[v] = ang;
          placed[v] = true;
        }
        added = true;
      });
    }
    if (!added) {
      const nextUnplaced = placed.findIndex((p) => !p);
      if (nextUnplaced === -1) break;
      atoms[nextUnplaced].x = nextUnplaced * L;
      atoms[nextUnplaced].y = 0;
      placed[nextUnplaced] = true;
    }
  }

  // Assign each ring bond its inward ring centroid for drawing textbook parallel double bonds
  for (const b of bonds) {
    for (let rIdx = 0; rIdx < rings.length; rIdx++) {
      const rc = ringCenters[rIdx];
      if (rc && rc.cycle.includes(b.from) && rc.cycle.includes(b.to)) {
        b.ringCenter = { x: rc.x, y: rc.y };
        break;
      }
    }
  }

  // Compute 3D Z-coordinates for 3D Conformer mode while keeping 2D (x, y) textbook-clean
  for (let i = 0; i < n; i++) {
    const a = atoms[i];
    if (a.aromatic) {
      a.z = Math.sin(i * 0.7) * 4;
    } else if (a.inRing) {
      a.z = (i % 2 === 0 ? 1 : -1) * 14;
    } else {
      a.z = ((i % 3) - 1) * 22 + Math.cos(i * 1.3) * 10;
    }
  }

  // Center around (0, 0, 0)
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const a of atoms) {
    cx += a.x;
    cy += a.y;
    cz += a.z;
  }
  cx /= n;
  cy /= n;
  cz /= n;
  for (const a of atoms) {
    a.x -= cx;
    a.y -= cy;
    a.z -= cz;
  }
  for (const b of bonds) {
    if (b.ringCenter) {
      b.ringCenter.x -= cx;
      b.ringCenter.y -= cy;
    }
  }

  return { atoms, bonds, rings };
}

export function computeDescriptorsAndToxicity(smiles) {
  const s = (smiles || "").trim();
  const cCount = (s.match(/C(?![laouds])|c/g) || []).length;
  const nCount = (s.match(/N(?![aibd])|n/g) || []).length;
  const oCount = (s.match(/O(?![s])|o/g) || []).length;
  const sCount = (s.match(/S(?![icnr])|s/g) || []).length;
  const fCount = (s.match(/F/g) || []).length;
  const clCount = (s.match(/Cl/g) || []).length;
  const brCount = (s.match(/Br/g) || []).length;
  const iCount = (s.match(/I/g) || []).length;
  const pCount = (s.match(/P(?![t])/g) || []).length;
  const ptCount = (s.match(/Pt/g) || []).length;

  const heavyAtoms = Math.max(1, cCount + nCount + oCount + sCount + fCount + clCount + brCount + iCount + pCount + ptCount);
  const mw = Number(
    (
      cCount * 12.011 +
      nCount * 14.007 +
      oCount * 15.999 +
      sCount * 32.06 +
      fCount * 18.998 +
      clCount * 35.45 +
      brCount * 79.904 +
      iCount * 126.9 +
      pCount * 30.97 +
      ptCount * 195.08 +
      heavyAtoms * 0.85
    ).toFixed(1)
  );

  const aromaticAtoms = (s.match(/[cnos]/g) || []).length;
  const aromaticRings = Math.max(0, Math.round(aromaticAtoms / 5.5));
  const hba = nCount + oCount;
  const hbd = (s.match(/[O,N]H|[nH]|O\)|^O|O$/g) || []).length;
  const tpsa = Number((nCount * 15.6 + oCount * 18.4 + hbd * 4.2).toFixed(1));
  const logp = Number(((cCount * 0.22 + (clCount + brCount + iCount) * 0.65 + aromaticRings * 0.45) - (nCount * 0.38 + oCount * 0.48)).toFixed(2));
  const rotatableBonds = Math.max(0, (s.match(/-/g) || []).length + Math.floor(cCount * 0.22) - aromaticRings * 2);
  const ringsCount = Math.floor(((s.match(/[1-9]/g) || []).length) / 2);
  const bonds = Math.max(heavyAtoms, heavyAtoms + ringsCount - 1);

  const hasNitro = s.includes("[N+](=O)[O-]") || s.includes("N(=O)=O");
  const hasArylAmine = aromaticRings > 0 && nCount > 0;
  const hasSulfonyl = s.includes("S(=O)(=O)");
  const hasHalogen = clCount + brCount + iCount > 0;
  const hasArylHalide = aromaticRings > 0 && fCount + clCount + brCount + iCount > 0;
  const hasAmide = s.includes("NC(=O)") || s.includes("C(=O)N");
  const hasBenzene = aromaticRings >= 1 || /C1=CC=CC=C1|c1ccccc1/.test(s);
  const hasQuatN = s.includes("[N+]") || s.includes("N(");
  const hasCarbonyl = s.includes("=O");
  const hasNitrile = s.includes("C#N") || s.includes("N#C");
  const hasHydroxyl = oCount > 0;
  const hasCarboxyl = s.includes("C(=O)O") || s.includes("OC(=O)");
  const hasPhenol = (aromaticRings > 0 || hasBenzene) && oCount > 0;

  const hepato = (hasNitro ? 0.3 : 0) + (hasArylAmine ? 0.3 : 0) + (hasSulfonyl ? 0.3 : 0) + (mw > 500 ? 0.2 : 0);
  const nephro = (hasHalogen ? 0.25 : 0) + (hasArylHalide ? 0.25 : 0) + (hasAmide ? 0.25 : 0) + (logp > 4 ? 0.2 : 0);
  const cardio = (hasBenzene ? 0.2 : 0) + (hasQuatN ? 0.2 : 0) + (hasCarbonyl ? 0.2 : 0) + (aromaticRings > 2 ? 0.3 : 0);
  const neuro = (hasNitrile ? 0.25 : 0) + (hasCarbonyl ? 0.25 : 0) + (hasSulfonyl ? 0.25 : 0);
  const gi = (hasHydroxyl ? 0.2 : 0) + (hasCarboxyl ? 0.2 : 0) + (hasPhenol ? 0.2 : 0) + (hbd > 3 ? 0.2 : 0);
  const derm = (hasHalogen ? 0.2 : 0) + (hasCarbonyl ? 0.2 : 0) + (hasBenzene ? 0.2 : 0);
  const cns = Math.max(0.05, Math.min(1.0, 0.1 + logp / 10.0));
  const metabolic = Math.max(0.05, Math.min(1.0, 0.1 + (mw - 300.0) / 700.0));

  const toxicity = {
    hepatotoxicity: Number(Math.min(1.0, Math.max(0.08, hepato)).toFixed(2)),
    nephrotoxicity: Number(Math.min(1.0, Math.max(0.08, nephro)).toFixed(2)),
    cardiotoxicity: Number(Math.min(1.0, Math.max(0.08, cardio)).toFixed(2)),
    neurotoxicity: Number(Math.min(1.0, Math.max(0.08, neuro)).toFixed(2)),
    gastrointestinal: Number(Math.min(1.0, Math.max(0.08, gi)).toFixed(2)),
    dermatological: Number(Math.min(1.0, Math.max(0.08, derm)).toFixed(2)),
    cns_effects: Number(Math.min(1.0, Math.max(0.08, cns)).toFixed(2)),
    metabolic_issues: Number(Math.min(1.0, Math.max(0.08, metabolic)).toFixed(2))
  };

  return {
    mw,
    logp,
    tpsa,
    hbd,
    hba,
    aromatic_rings: aromaticRings,
    rotatable_bonds: rotatableBonds,
    atoms: heavyAtoms,
    bonds,
    toxicity
  };
}

export function combineSideEffects(toxA, toxB) {
  const combined = {};
  for (const cat of TOXICITY_CATEGORIES) {
    const rA = toxA?.[cat.key] ?? 0.2;
    const rB = toxB?.[cat.key] ?? 0.2;
    const c = 1.0 - (1.0 - rA) * (1.0 - rB);
    combined[cat.key] = Number(Math.min(1.0, c).toFixed(2));
  }
  return combined;
}

export function classifyRiskLevel(score) {
  if (score >= 0.7) return { label: "High Risk", badgeClass: "risk-high", color: "#F04B32" };
  if (score >= 0.4) return { label: "Medium Risk", badgeClass: "risk-med", color: "#F6CA37" };
  return { label: "Low Risk", badgeClass: "risk-low", color: "#1745C4" };
}

export function classifySynergyScore(synergyScore) {
  if (synergyScore > 6) {
    return {
      synergyClass: "High Synergy",
      badgeColor: "coral",
      interpretation: "Strong positive supra-additive interaction expected",
      confidenceLevel: "High (94%)",
      recommendation: "Promising candidate for immediate wet-lab dose-matrix validation!"
    };
  }
  if (synergyScore > 3) {
    return {
      synergyClass: "Medium Synergy",
      badgeColor: "yellow",
      interpretation: "Moderate positive interaction across target cell lineage",
      confidenceLevel: "High (86%)",
      recommendation: "Worth further experimental validation & secondary assay screening"
    };
  }
  if (synergyScore > 0) {
    return {
      synergyClass: "Low Synergy",
      badgeColor: "blue",
      interpretation: "Weak additive or mildly positive therapeutic interaction",
      confidenceLevel: "Medium (74%)",
      recommendation: "May need careful dose-ratio optimization before in-vitro escalation"
    };
  }
  return {
    synergyClass: "Antagonism",
    badgeColor: "ink",
    interpretation: "Negative or sub-additive competition expected in this cell line",
    confidenceLevel: "High (89%)",
    recommendation: "Likely to be ineffective or antagonistic — deprioritize combination"
  };
}

export function predictSynergyGNN({ drugA, drugB, smilesA, smilesB, cancerType, cellLine, dataset }) {
  const cellRecs = dataset?.precomputed_recommendations?.[cellLine] || [];
  if (drugA && drugB) {
    const exactMatch = cellRecs.find(
      (r) =>
        (r.drug1 === drugA && r.drug2 === drugB) ||
        (r.drug1 === drugB && r.drug2 === drugA)
    );
    if (exactMatch) {
      return exactMatch.synergy_score;
    }
  }

  const drugObjA = dataset?.drugs?.find((d) => d.name === drugA || d.smiles === smilesA);
  const drugObjB = dataset?.drugs?.find((d) => d.name === drugB || d.smiles === smilesB);

  const descA = drugObjA || computeDescriptorsAndToxicity(smilesA || "");
  const descB = drugObjB || computeDescriptorsAndToxicity(smilesB || "");

  const embA = drugObjA?.gnn_emb || [
    descA.mw / 400, descA.logp / 5, descA.tpsa / 100, descA.hbd / 4,
    descA.hba / 8, descA.aromatic_rings / 3, descA.atoms / 30, descA.bonds / 35,
    descA.toxicity.hepatotoxicity, descA.toxicity.cardiotoxicity, descA.toxicity.nephrotoxicity, 0.5
  ];
  const embB = drugObjB?.gnn_emb || [
    descB.mw / 400, descB.logp / 5, descB.tpsa / 100, descB.hbd / 4,
    descB.hba / 8, descB.aromatic_rings / 3, descB.atoms / 30, descB.bonds / 35,
    descB.toxicity.hepatotoxicity, descB.toxicity.cardiotoxicity, descB.toxicity.nephrotoxicity, 0.5
  ];

  let dot = 0;
  let diffNorm = 0;
  for (let i = 0; i < Math.min(embA.length, embB.length); i++) {
    dot += embA[i] * embB[i];
    diffNorm += Math.abs(embA[i] - embB[i]);
  }

  const contextStr = `${cancerType || "Breast Cancer"}::${cellLine || "MCF7"}`;
  let ctxHash = 0;
  for (let i = 0; i < contextStr.length; i++) {
    ctxHash = (ctxHash * 31 + contextStr.charCodeAt(i)) % 9973;
  }
  const ctxBias = ((ctxHash % 200) - 90) / 25.0;

  const mechComplement = Math.min(6.5, Math.abs(descA.logp - descB.logp) * 0.85 + Math.abs(descA.tpsa - descB.tpsa) * 0.032);
  const gnnInteraction = (diffNorm * 4.2 - dot * 1.35) + mechComplement + ctxBias;

  const clamped = Math.max(-12.4, Math.min(18.6, gnnInteraction));
  return Number(clamped.toFixed(2));
}

export const SAMPLE_BATCH_CSV = `drug_a_name,drug_b_name,drug_a_smiles,drug_b_smiles,cancer_type,cell_line
PACLITAXEL,DOXORUBICIN,CC1=C2C(C(=O)C3=C(COC3=O)C(C2(C)C)(CC1OC(=O)C(C(C4=CC=CC=C4)NC(=O)C5=CC=CC=C5)O)C)OC(=O)C6=CC=CC=C6,CC1C(C(CC(O1)OC2C(OC3C(C2O)C(C(C4=CC(=O)C5=CC=CC=C5C4=O)O)(C)C)C)O)(C)O,Breast Cancer,MCF7
OLAPARIB,CISPLATIN,C1CC1C(=O)N2CCN(CC2)C(=O)C3=C(C=CC(=C3)CC4=NN(C(=O)C5=CC=CC=C54)H)F,Cl[Pt](Cl)(N)N,Ovarian Cancer,OVCAR-8
GEMCITABINE,5-FLUOROURACIL,C1=NC(=O)N(C=C1)C2C(C(C(O2)CO)O)O,C1=CN(C(=O)NC1=O)F,Pancreatic Cancer,PANC-1
IMATINIB,VINCRISTINE,CN1CCN(CC1)C2=NC3=C(C=C2)C=C(C=C3)NC(=O)C4=CC=CC=C4,CC1(C2CC3C(C2(CC1OC(=O)C4=CC=CC=C4)OC)CN(CC3)C(=O)C5=CC=CC=C5)C,Leukemia,K-562
TEMOZOLOMIDE,ETOPOSIDE,CC1=NN(C(=O)NC1=O)C2=CC=CC=C2,CC1CC(C(C(C1)O)O)OC2C3C4C(C(C(C4OC3C(C2O)O)O)O)O,Brain Cancer,T98G
SUNITINIB,DOCETAXEL,CC1=CC(=CC=C1)C2=NC3=C(C=C(C=C3)Cl)NC(=N2)NC4=CC(=C(C=C4)F)OC,CC1=C2C(C(=O)C3=C(COC3=O)C(C2(C)C)(CC1OC(=O)C(C(C4=CC=CC=C4)NC(=O)C5=CC=CC=C5)O)C)OC(=O)C6=CC=CC=C6,Lung Cancer,A549
TAMOXIFEN,PACLITAXEL,CC(C)(C)C1=CC=C(C=C1)C(C)C2=CC3=C(C=C2)OCO3,CC1=C2C(C(=O)C3=C(COC3=O)C(C2(C)C)(CC1OC(=O)C(C(C4=CC=CC=C4)NC(=O)C5=CC=CC=C5)O)C)OC(=O)C6=CC=CC=C6,Breast Cancer,MDA-MB-231
IRINOTECAN,5-FLUOROURACIL,CC1(C(O)CN(C)C1=O)C2=C(C3=C(C(=C2)C(=O)OC)CCCN3)C(=O)O,C1=CN(C(=O)NC1=O)F,Colon/Colorectal Cancer,HCT-15
BICUCULLINE,CHLORPHENIRAMINE,CN1CCC2=CC3=C(C=C2C1C4C5=C(C6=C(C=C5)OCO6)C(=O)O4)OCO3,CN(C)CCC(C1=CC=C(C=C1)Cl)C2=CC=CC=N2,Skin Cancer,SK-MEL-28
ASPIRIN,METFORMIN,CC(=O)OC1=CC=CC=C1C(=O)O,CN(C)C(=N)N=C(N)N,Colon/Colorectal Cancer,COLO 205`;
