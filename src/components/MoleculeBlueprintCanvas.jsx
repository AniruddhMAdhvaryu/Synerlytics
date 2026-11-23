import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { parseSmilesTo2DGraph } from "../utils/chemistryEngine";

// Smaller atom radii so all single, double, triple & aromatic bonds are long and crystal-clear
const ATOM_3D_STYLE = {
  C: { color: "#2D3748", highlight: "#CBD5E0", border: "#171717", radius: 5.4, name: "Carbon" },
  N: { color: "#1745C4", highlight: "#90CDF4", border: "#0B2265", radius: 6.4, name: "Nitrogen" },
  O: { color: "#F04B32", highlight: "#FEB2B2", border: "#8B1E0E", radius: 6.2, name: "Oxygen" },
  S: { color: "#F6CA37", highlight: "#FEFCBF", border: "#975A16", radius: 7.2, name: "Sulfur" },
  F: { color: "#E99BC4", highlight: "#FFF5F7", border: "#702459", radius: 6.0, name: "Fluorine" },
  Cl: { color: "#1F9D55", highlight: "#9AE6B4", border: "#104E2A", radius: 7.4, name: "Chlorine" },
  Br: { color: "#C05621", highlight: "#FBD38D", border: "#652B19", radius: 7.8, name: "Bromine" },
  I: { color: "#6B46C1", highlight: "#D6BCFA", border: "#322659", radius: 8.2, name: "Iodine" },
  P: { color: "#DD6B20", highlight: "#FBD38D", border: "#7B341E", radius: 7.0, name: "Phosphorus" },
  Pt: { color: "#00B5D8", highlight: "#C4F1F9", border: "#065666", radius: 8.4, name: "Platinum" }
};

export default function MoleculeBlueprintCanvas({
  smiles,
  title,
  theme = "blueprint",
  height = 280,
  showMeta = true,
  initialMode = "2d",
  hideControls = false
}) {
  const canvasRef = useRef(null);
  const [renderMode, setRenderMode] = useState(initialMode); // "2d" (2D Organic) | "3d-ball" | "3d-cpk"
  const [zoom, setZoom] = useState(1.08);
  const [autoSpin, setAutoSpin] = useState(true);
  const [hoveredAtom, setHoveredAtom] = useState(null);

  useEffect(() => {
    setRenderMode(initialMode);
  }, [initialMode]);

  const rotRef = useRef({ rx: 0.36, ry: 0.52, panX: 0, panY: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const projectedAtomsRef = useRef([]);

  const graph = useMemo(() => parseSmilesTo2DGraph(smiles), [smiles]);

  // Compute molecule 2D/3D bounding box for generous auto-fitting
  const boundsInfo = useMemo(() => {
    if (!graph || graph.atoms.length === 0) return { spanX: 120, spanY: 120, maxR: 80 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity,
      maxR = 40;
    for (const a of graph.atoms) {
      if (a.x < minX) minX = a.x;
      if (a.x > maxX) maxX = a.x;
      if (a.y < minY) minY = a.y;
      if (a.y > maxY) maxY = a.y;
      const r = Math.hypot(a.x, a.y, a.z || 0);
      if (r > maxR) maxR = r;
    }
    return {
      spanX: Math.max(70, maxX - minX + 56),
      spanY: Math.max(60, maxY - minY + 56),
      maxR: maxR * 1.18
    };
  }, [graph]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graph) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 340;
    const h = rect.height || 220;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const isBlueprint = theme === "blueprint";
    const bgHex = isBlueprint ? "#1745C4" : "#FAF4EB";
    const strokeHex = isBlueprint ? "#FFFFFF" : "#171717";

    // 1. Background Fill
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);

    // 2. Crisp Organic Blueprint Graph-Paper Grid
    ctx.strokeStyle = isBlueprint ? "rgba(255, 255, 255, 0.20)" : "rgba(23, 23, 23, 0.08)";
    ctx.lineWidth = 1;
    const gridSize = 18;
    ctx.beginPath();
    for (let gx = 0; gx < w; gx += gridSize) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
    }
    for (let gy = 0; gy < h; gy += gridSize) {
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
    }
    ctx.stroke();

    const cx = w / 2 + rotRef.current.panX;
    const cy = h / 2 + rotRef.current.panY;

    // Fit nicely inside viewport
    const fit2D = Math.min((w * 0.84) / boundsInfo.spanX, (h * 0.78) / boundsInfo.spanY);
    const fit3D = (Math.min(w, h) * 0.44) / boundsInfo.maxR;
    const scale = (renderMode === "2d" ? fit2D : fit3D) * zoom;

    // ========================================================================
    // MODE A: 2D ORGANIC SKELETAL LINE FORMULA (Exact Match to Attached Image)
    // ========================================================================
    if (renderMode === "2d") {
      const pts = graph.atoms.map((a) => ({
        ...a,
        sx: cx + a.x * scale,
        sy: cy + a.y * scale,
        r: 7 * Math.sqrt(zoom),
        style: ATOM_3D_STYLE[a.symbol] || ATOM_3D_STYLE.C
      }));
      projectedAtomsRef.current = pts;

      const lineW = Math.max(1.8, Math.min(3.2, 2.35 * Math.sqrt(zoom)));
      const offsetSep = Math.max(3.6, Math.min(6.4, 4.6 * Math.sqrt(zoom)));

      ctx.strokeStyle = strokeHex;
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw all skeletal bonds with vertex-to-vertex crispness
      for (const b of graph.bonds) {
        const a1 = pts[b.from];
        const a2 = pts[b.to];
        if (!a1 || !a2) continue;

        const dx = a2.sx - a1.sx;
        const dy = a2.sy - a1.sy;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        let nx = -uy;
        let ny = ux;

        // If this bond belongs to a ring, orient normal (nx, ny) strictly INWARD toward the ring center
        if (b.ringCenter) {
          const rcx = cx + b.ringCenter.x * scale;
          const rcy = cy + b.ringCenter.y * scale;
          const mx = (a1.sx + a2.sx) * 0.5;
          const my = (a1.sy + a2.sy) * 0.5;
          const toCenterDot = (rcx - mx) * nx + (rcy - my) * ny;
          if (toCenterDot < 0) {
            nx = -nx;
            ny = -ny;
          }
        }

        const isDouble = b.order === 2 || (b.isAromaticRingBond && b.kekuleDouble);
        const isUnassignedArom = b.order === 1.5 && !b.isAromaticRingBond;

        if (isDouble && b.ringCenter) {
          // Textbook ring double bond: main outer edge on ring polygon + shorter inner parallel line
          ctx.beginPath();
          ctx.moveTo(a1.sx, a1.sy);
          ctx.lineTo(a2.sx, a2.sy);
          ctx.stroke();

          const insetEnd = Math.min(len * 0.2, 6.5 * Math.sqrt(zoom));
          ctx.beginPath();
          ctx.moveTo(a1.sx + ux * insetEnd + nx * offsetSep, a1.sy + uy * insetEnd + ny * offsetSep);
          ctx.lineTo(a2.sx - ux * insetEnd + nx * offsetSep, a2.sy - uy * insetEnd + ny * offsetSep);
          ctx.stroke();
        } else if (isDouble) {
          // Exterior double bond (e.g., =O, =N, C=C): two symmetric parallel lines
          const half = offsetSep * 0.48;
          ctx.beginPath();
          ctx.moveTo(a1.sx + nx * half, a1.sy + ny * half);
          ctx.lineTo(a2.sx + nx * half, a2.sy + ny * half);
          ctx.moveTo(a1.sx - nx * half, a1.sy - ny * half);
          ctx.lineTo(a2.sx - nx * half, a2.sy - ny * half);
          ctx.stroke();
        } else if (b.order === 3) {
          ctx.beginPath();
          ctx.moveTo(a1.sx, a1.sy);
          ctx.lineTo(a2.sx, a2.sy);
          ctx.moveTo(a1.sx + nx * offsetSep * 0.75, a1.sy + ny * offsetSep * 0.75);
          ctx.lineTo(a2.sx + nx * offsetSep * 0.75, a2.sy + ny * offsetSep * 0.75);
          ctx.moveTo(a1.sx - nx * offsetSep * 0.75, a1.sy - ny * offsetSep * 0.75);
          ctx.lineTo(a2.sx - nx * offsetSep * 0.75, a2.sy - ny * offsetSep * 0.75);
          ctx.stroke();
        } else if (isUnassignedArom) {
          ctx.beginPath();
          ctx.moveTo(a1.sx, a1.sy);
          ctx.lineTo(a2.sx, a2.sy);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(a1.sx + nx * offsetSep * 0.75, a1.sy + ny * offsetSep * 0.75);
          ctx.lineTo(a2.sx + nx * offsetSep * 0.75, a2.sy + ny * offsetSep * 0.75);
          ctx.stroke();
          ctx.restore();
        } else {
          // Single bond
          ctx.beginPath();
          ctx.moveTo(a1.sx, a1.sy);
          ctx.lineTo(a2.sx, a2.sy);
          ctx.stroke();
        }
      }

      // Draw Heteroatom Organic Labels (N, O, HO, OH, NH, F, Cl, Br, S, P, Pt) — NO dots on Carbon vertices
      const fontSize = Math.max(11, Math.min(18, 13.8 * Math.sqrt(zoom)));
      ctx.font = `700 ${fontSize.toFixed(1)}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const p of pts) {
        const isHovered = hoveredAtom && hoveredAtom.id === p.id;
        if (p.symbol === "C" && !isHovered) {
          continue; // Pure skeletal carbon vertex
        }

        // Format textbook functional group label (e.g. terminal single-bonded O -> "HO" on left or "OH" on right)
        let label = p.symbol;
        if (p.symbol === "O" && p.degree === 1) {
          // Check if double-bonded carbonyl (=O) or single-bonded hydroxyl (-OH)
          const attachedBond = graph.bonds.find((b) => b.from === p.id || b.to === p.id);
          if (attachedBond && attachedBond.order === 1) {
            const otherId = attachedBond.from === p.id ? attachedBond.to : attachedBond.from;
            const other = pts[otherId];
            label = other && p.sx < other.sx - 2 ? "HO" : "OH";
          }
        } else if (p.symbol === "N" && p.degree === 1) {
          const attachedBond = graph.bonds.find((b) => b.from === p.id || b.to === p.id);
          if (attachedBond && attachedBond.order === 1) {
            const otherId = attachedBond.from === p.id ? attachedBond.to : attachedBond.from;
            const other = pts[otherId];
            label = other && p.sx < other.sx - 2 ? "H₂N" : "NH₂";
          }
        }

        // Clear background box/circle behind heteroatom letter so bonds stop cleanly before the letter
        const textWidth = ctx.measureText(label).width;
        const maskR = Math.max(fontSize * 0.62, textWidth * 0.56);
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, maskR, 0, Math.PI * 2);
        ctx.fillStyle = bgHex;
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = "#F6CA37";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Color heteroatoms in blueprint chalk-white or paper color-coding
        let textColor = strokeHex;
        if (!isBlueprint) {
          if (p.symbol === "N") textColor = "#1745C4";
          else if (p.symbol === "O") textColor = "#F04B32";
          else if (p.symbol === "Cl" || p.symbol === "F") textColor = "#0E6B3A";
          else if (p.symbol === "S") textColor = "#B38600";
        }
        ctx.fillStyle = isHovered ? "#F6CA37" : textColor;
        ctx.fillText(label, p.sx, p.sy + 0.5);
        ctx.restore();
      }

      ctx.restore();
      return;
    }

    // ========================================================================
    // MODE B: 3D BALL-AND-STICK (WITH SMALL ATOMS & CLEAR BONDS) & 3D CPK
    // ========================================================================
    const rx = rotRef.current.rx;
    const ry = rotRef.current.ry;
    const cosX = Math.cos(rx),
      sinX = Math.sin(rx);
    const cosY = Math.cos(ry),
      sinY = Math.sin(ry);
    const fov = 440;

    const projected = graph.atoms.map((a) => {
      const x0 = a.x * scale;
      const y0 = a.y * scale;
      const z0 = (a.z || 0) * scale;

      const x1 = x0 * cosY - z0 * sinY;
      const z1 = x0 * sinY + z0 * cosY;
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      const persp = fov / Math.max(120, fov - z2);
      const sx = cx + x1 * persp;
      const sy = cy + y2 * persp;

      const st = ATOM_3D_STYLE[a.symbol] || ATOM_3D_STYLE.C;
      // Smaller atoms in 3d-ball mode so all bonds are long and unobstructed
      const modeMultiplier = renderMode === "3d-cpk" ? 3.2 : 1.0;
      const r = Math.max(3.6, st.radius * modeMultiplier * Math.sqrt(zoom) * persp);

      return {
        ...a,
        sx,
        sy,
        sz: z2,
        persp,
        r,
        style: st
      };
    });

    projectedAtomsRef.current = projected;

    const primitives = [];

    if (renderMode !== "3d-cpk") {
      for (const b of graph.bonds) {
        const a1 = projected[b.from];
        const a2 = projected[b.to];
        if (!a1 || !a2) continue;
        primitives.push({
          type: "bond",
          z: (a1.sz + a2.sz) * 0.5 - 2,
          a1,
          a2,
          order: b.order,
          kekuleDouble: b.kekuleDouble
        });
      }
    }

    for (const p of projected) {
      primitives.push({
        type: "atom",
        z: p.sz,
        atom: p
      });
    }

    primitives.sort((u, v) => u.z - v.z);

    for (const item of primitives) {
      if (item.type === "bond") {
        const { a1, a2, order, kekuleDouble } = item;
        const dx = a2.sx - a1.sx;
        const dy = a2.sy - a1.sy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 3.4 * Math.sqrt(zoom);
        const ny = (dx / len) * 3.4 * Math.sqrt(zoom);

        const depthFactor = Math.max(0.5, Math.min(1.15, (item.z + 150) / 250));
        const bondWidth = Math.max(1.6, 2.8 * Math.sqrt(zoom) * ((a1.persp + a2.persp) * 0.5));

        const draw3DCylinder = (x1, y1, x2, y2, width, dashed = false) => {
          ctx.save();
          if (dashed) ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = isBlueprint
            ? `rgba(255, 255, 255, ${0.92 * depthFactor})`
            : `rgba(23, 23, 23, ${0.92 * depthFactor})`;
          ctx.lineWidth = width;
          ctx.lineCap = "round";
          ctx.stroke();

          if (!dashed) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isBlueprint
              ? "rgba(246, 202, 55, 0.42)"
              : "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = Math.max(0.7, width * 0.32);
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.restore();
        };

        if (order === 2 || kekuleDouble) {
          draw3DCylinder(a1.sx + nx, a1.sy + ny, a2.sx + nx, a2.sy + ny, bondWidth * 0.72);
          draw3DCylinder(a1.sx - nx, a1.sy - ny, a2.sx - nx, a2.sy - ny, bondWidth * 0.72);
        } else if (order === 3) {
          draw3DCylinder(a1.sx, a1.sy, a2.sx, a2.sy, bondWidth * 0.65);
          draw3DCylinder(a1.sx + nx * 1.35, a1.sy + ny * 1.35, a2.sx + nx * 1.35, a2.sy + ny * 1.35, bondWidth * 0.6);
          draw3DCylinder(a1.sx - nx * 1.35, a1.sy - ny * 1.35, a2.sx - nx * 1.35, a2.sy - ny * 1.35, bondWidth * 0.6);
        } else if (order === 1.5) {
          draw3DCylinder(a1.sx, a1.sy, a2.sx, a2.sy, bondWidth * 0.85);
          draw3DCylinder(a1.sx + nx, a1.sy + ny, a2.sx + nx, a2.sy + ny, bondWidth * 0.55, true);
        } else {
          draw3DCylinder(a1.sx, a1.sy, a2.sx, a2.sy, bondWidth);
        }
      } else if (item.type === "atom") {
        const p = item.atom;
        const isHovered = hoveredAtom && hoveredAtom.id === p.id;
        const isHetero = p.symbol !== "C";

        ctx.save();
        const r = isHovered ? p.r * 1.35 : p.r;

        // 3D Sphere Shadow
        ctx.beginPath();
        ctx.arc(p.sx + 1.5, p.sy + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(12, 12, 18, 0.26)";
        ctx.fill();

        const grad = ctx.createRadialGradient(
          p.sx - r * 0.35,
          p.sy - r * 0.35,
          r * 0.1,
          p.sx,
          p.sy,
          r
        );
        const baseColor = p.symbol === "C" && isBlueprint ? "#3867D6" : p.style.color;
        grad.addColorStop(0, p.style.highlight);
        grad.addColorStop(0.55, baseColor);
        grad.addColorStop(1, p.style.border);

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = isHovered ? 2.2 : 1.1;
        ctx.strokeStyle = isHovered ? "#F6CA37" : isBlueprint ? "#FFFFFF" : "#171717";
        ctx.stroke();

        if (isHetero || isHovered || renderMode === "3d-cpk") {
          ctx.fillStyle = p.symbol === "S" || p.symbol === "F" ? "#171717" : "#FFFFFF";
          ctx.font = `700 ${Math.max(8, Math.min(12, r * 1.05)).toFixed(1)}px 'Space Grotesk', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.symbol, p.sx, p.sy + 0.5);
        }

        ctx.restore();
      }
    }

    ctx.restore();
  }, [graph, theme, zoom, renderMode, boundsInfo, hoveredAtom]);

  useEffect(() => {
    let animId;
    const tick = () => {
      if (autoSpin && renderMode !== "2d" && !dragRef.current.active) {
        rotRef.current.ry += 0.011;
        rotRef.current.rx = 0.36 + Math.sin(rotRef.current.ry * 0.6) * 0.16;
      }
      drawScene();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoSpin, renderMode, drawScene]);

  const handlePointerDown = (e) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      if (renderMode === "2d") {
        rotRef.current.panX += dx;
        rotRef.current.panY += dy;
      } else {
        rotRef.current.ry += dx * 0.012;
        rotRef.current.rx = Math.max(-1.45, Math.min(1.45, rotRef.current.rx + dy * 0.012));
      }
      drawScene();
      return;
    }

    const atoms = projectedAtomsRef.current;
    let found = null;
    for (let i = atoms.length - 1; i >= 0; i--) {
      const a = atoms[i];
      if (Math.hypot(mx - a.sx, my - a.sy) <= Math.max(9, a.r + 4)) {
        found = a;
        break;
      }
    }
    setHoveredAtom(found);
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.14 : -0.14;
      setZoom((prev) => Number(Math.max(0.5, Math.min(3.5, prev + delta)).toFixed(2)));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const isBlueprint = theme === "blueprint";

  if (!graph) {
    return (
      <div
        className={`mol-canvas-wrap ${isBlueprint ? "mol-theme-blueprint" : "mol-theme-paper"}`}
        style={{ height }}
      >
        <div className="mol-invalid-msg">
          <span>⚠️ Invalid SMILES Structure</span>
          <small>Check balanced parentheses &amp; ring numbers</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mol-canvas-wrap mol-3d-interactive ${
        isBlueprint ? "mol-theme-blueprint" : "mol-theme-paper"
      }`}
      style={{ height }}
    >
      {/* Top Header with Title & Mode Switcher */}
      <div className="mol-canvas-header">
        <span className="mol-canvas-title" title={title}>
          {title ? (title.length > 26 ? title.slice(0, 26) + "…" : title) : "Organic Structure"}
        </span>

        {!hideControls && (
          <div className="mol-3d-mode-pills">
            <button
              type="button"
              onClick={() => setRenderMode("2d")}
              className={`mol-pill-btn ${renderMode === "2d" ? "active" : ""}`}
              title="2D Organic Skeletal Blueprint"
            >
              2D Organic
            </button>
            <button
              type="button"
              onClick={() => setRenderMode("3d-ball")}
              className={`mol-pill-btn ${renderMode === "3d-ball" ? "active" : ""}`}
              title="3D Ball & Stick Model (Small Atoms, Clear Bonds)"
            >
              3D Ball
            </button>
            <button
              type="button"
              onClick={() => setRenderMode("3d-cpk")}
              className={`mol-pill-btn ${renderMode === "3d-cpk" ? "active" : ""}`}
              title="3D Space-Filling CPK Model"
            >
              3D CPK
            </button>
          </div>
        )}
      </div>

      {/* Interactive Canvas Stage */}
      <div className="mol-3d-stage-box">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="mol-3d-canvas"
        />

        {hoveredAtom && (
          <div className="mol-atom-tooltip">
            <strong>
              Atom #{hoveredAtom.id + 1}: {hoveredAtom.style.name} ({hoveredAtom.symbol})
            </strong>
            <span>
              Coords: ({hoveredAtom.x.toFixed(0)}, {hoveredAtom.y.toFixed(0)},{" "}
              {(hoveredAtom.z || 0).toFixed(0)}) •{" "}
              {hoveredAtom.aromatic ? "Aromatic Ring" : `${hoveredAtom.degree} Bond(s)`}
            </span>
          </div>
        )}

        {!hideControls && (
          <div className="mol-3d-controls-bar">
            <div className="mol-ctrl-group">
              <button
                type="button"
                className="mol-ctrl-btn"
                onClick={() => setZoom((z) => Number(Math.min(3.5, z + 0.22).toFixed(2)))}
                title="Zoom In (+)"
              >
                ＋
              </button>
              <span className="mol-zoom-readout">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="mol-ctrl-btn"
                onClick={() => setZoom((z) => Number(Math.max(0.5, z - 0.22).toFixed(2)))}
                title="Zoom Out (-)"
              >
                －
              </button>
              <button
                type="button"
                className="mol-ctrl-btn"
                onClick={() => {
                  setZoom(1.08);
                  rotRef.current = { rx: 0.36, ry: 0.52, panX: 0, panY: 0 };
                }}
                title="Reset View"
              >
                Reset
              </button>
            </div>

            <div className="mol-ctrl-group">
              {renderMode !== "2d" && (
                <button
                  type="button"
                  className={`mol-ctrl-btn ${autoSpin ? "spin-active" : ""}`}
                  onClick={() => setAutoSpin(!autoSpin)}
                  title="Toggle 3D Auto-Rotation"
                >
                  {autoSpin ? "⟳ 3D Spin" : "⏸ Paused"}
                </button>
              )}
              {showMeta && (
                <span className="mol-meta-chip">
                  {graph.atoms.length}A • {graph.bonds.length}B
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
