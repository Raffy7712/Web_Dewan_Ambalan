"use client";

import { useMemo } from "react";

const ROLE_LABELS = {
  Pradana: "Ketua",
  "Pemangku Adat": "Wakil Ketua",
  Kerani: "Sekretaris",
  "Juru Uang": "Bendahara",
};

const CHAIN_W = 170;
const STAFF_W = 140;
const COL_GAP = 24;
const VR_GAP = 36;
const ROW_GAP = 40;
const PAD = 40;

function cardHeight(members, hasRole) {
  const header = hasRole ? 50 : 38;
  const empty = !members || members.length === 0;
  const body = empty ? 20 : members.length * 22 + 6;
  return header + body + 12;
}

function buildChart(groups) {
  if (!groups?.length) return null;
  const [pembina, pradana, pemangku, ...staff] = groups;
  if (!pembina) return null;

  const chunk = (arr, size) => {
    const res = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
  };
  const staffRows = chunk(staff, 4);

  const chain = [pembina, pradana, pemangku].filter(Boolean);
  const chainH = chain.reduce(
    (sum, g) => sum + cardHeight(g.members, !!ROLE_LABELS[g.jabatan.nama]),
    0,
  );
  const rowHeights = staffRows.map((r) =>
    Math.max(
      ...r.map((g) => cardHeight(g.members, !!ROLE_LABELS[g.jabatan.nama])),
    ),
  );
  const totalStaffH =
    rowHeights.reduce((a, b) => a + b, 0) + (staffRows.length - 1) * ROW_GAP;

  const maxStaffCells = Math.max(...staffRows.map((r) => r.length), 0);
  const totalW = Math.max(
    CHAIN_W + PAD * 2,
    maxStaffCells * STAFF_W + (maxStaffCells - 1) * COL_GAP + PAD * 2,
    600,
  );
  const cx = totalW / 2;

  const chainCards = [];
  let cy = PAD + 10;
  chain.forEach((g) => {
    const h = cardHeight(g.members, !!ROLE_LABELS[g.jabatan.nama]);
    chainCards.push({
      key: g.jabatan.id,
      x: cx - CHAIN_W / 2,
      y: cy,
      w: CHAIN_W,
      h,
      isChain: true,
      title: g.jabatan.nama,
      role: ROLE_LABELS[g.jabatan.nama] || "",
      members: g.members || [],
    });
    cy += h + VR_GAP;
  });

  const staffNodesByRow = [];
  let staffY = cy - VR_GAP + VR_GAP + 10;
  staffRows.forEach((row, ri) => {
    const rh = rowHeights[ri];
    const rowW = row.length * STAFF_W + (row.length - 1) * COL_GAP;
    const rowCx = cx - rowW / 2;
    const cards = row.map((g, ci) => ({
      key: g.jabatan.id,
      x: rowCx + ci * (STAFF_W + COL_GAP),
      y: staffY,
      w: STAFF_W,
      h: rh,
      isChain: false,
      title: g.jabatan.nama,
      role: ROLE_LABELS[g.jabatan.nama] || "",
      members: g.members || [],
    }));
    staffNodesByRow.push(cards);
    staffY += rh + ROW_GAP;
  });

  const staffNodes = staffNodesByRow.flat();
  const totalH = staffY - ROW_GAP + PAD + 10;

  // ── SVG path lines ──
  const lines = [];

  // Vertical chain connectors
  for (let i = 0; i < chainCards.length - 1; i++) {
    const from = chainCards[i];
    const to = chainCards[i + 1];
    lines.push(
      `M ${cx} ${from.y + from.h} V ${to.y}`,
    );
  }

  // Branch: last chain → horizontal bar → staff rows
  if (staffNodes.length > 0 && chainCards.length > 0) {
    const last = chainCards[chainCards.length - 1];
    const branchY = last.y + last.h + 10;

    // vertical drop from last chain card
    lines.push(`M ${cx} ${last.y + last.h} V ${branchY}`);

    // horizontal bar covering all staff
    const firstStaff = staffNodes[0];
    const lastStaff = staffNodes[staffNodes.length - 1];
    const hBarY = branchY;
    const hBarX1 = firstStaff.x + firstStaff.w / 2;
    const hBarX2 = lastStaff.x + lastStaff.w / 2;

    if (hBarX1 !== hBarX2) {
      // don't draw a zero-width line
      const mid = (hBarX1 + hBarX2) / 2;
      lines.push(
        `M ${hBarX1} ${hBarY} Q ${mid} ${hBarY - 6}, ${mid} ${hBarY}`,
      );
      lines.push(
        `M ${mid} ${hBarY} Q ${mid + (hBarX2 - hBarX1) * 0.2} ${hBarY + 6}, ${hBarX2} ${hBarY}`,
      );
    }

    // vertical drops from horizontal bar to each staff card
    staffNodes.forEach((n) => {
      const staffCx = n.x + n.w / 2;
      if (staffCx !== hBarX1 && staffCx !== hBarX2) {
        lines.push(`M ${staffCx} ${branchY} V ${n.y}`);
      }
      if (staffCx === hBarX1 || staffCx === hBarX2) {
        lines.push(`M ${staffCx} ${branchY} V ${n.y}`);
      }
    });

    // Special case: only 1 staff card → simple vertical line
    if (staffNodes.length === 1) {
      const n = staffNodes[0];
      lines.push(`M ${cx} ${last.y + last.h} V ${n.y + n.h / 2}`);
    }
  }

  return { nodes: [...chainCards, ...staffNodes], lines, svgW: totalW, svgH: totalH };
}

function NodeCard({ n }) {
  const { title, role, members } = n;
  const isEmpty = !members || members.length === 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        padding: "8px 10px",
        textAlign: "center",
        boxShadow: "0 1px 4px hsl(var(--border) / .3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isEmpty ? "center" : "flex-start",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "hsl(var(--foreground))",
        }}
      >
        {title}
      </div>
      {role && (
        <div
          style={{
            fontSize: 9,
            color: "hsl(var(--muted-foreground))",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {role}
        </div>
      )}
      {isEmpty ? (
        <div
          style={{
            fontSize: 9,
            color: "hsl(var(--muted-foreground))",
            fontStyle: "italic",
            marginTop: 4,
          }}
        >
          (kosong)
        </div>
      ) : (
        <div
          style={{
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          {members.map((m) => (
            <span
              key={m.id}
              style={{
                fontSize: 9,
                background: "hsl(var(--muted))",
                color: "hsl(var(--foreground))",
                borderRadius: 6,
                padding: "1px 8px",
                fontWeight: 500,
                display: "block",
              }}
            >
              {m.nama}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartView({ groups }) {
  const chart = useMemo(() => buildChart(groups), [groups]);

  if (!chart) return null;

  return (
    <div className="w-full overflow-x-auto py-4">
      <svg
        width={chart.svgW}
        height={chart.svgH}
        viewBox={`0 0 ${chart.svgW} ${chart.svgH}`}
        className="mx-auto"
        style={{ display: "block" }}
      >
        {chart.lines.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {chart.nodes.map((n) => (
          <foreignObject
            key={n.key}
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
          >
            <NodeCard n={n} />
          </foreignObject>
        ))}
      </svg>
    </div>
  );
}
