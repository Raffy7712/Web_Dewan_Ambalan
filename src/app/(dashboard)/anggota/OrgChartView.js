"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

const Tree = dynamic(() => import("react-d3-tree"), { ssr: false });

const ROLE_LABELS = {
  Pradana: "Ketua",
  "Pemangku Adat": "Wakil Ketua",
  Kerani: "Sekretaris",
  "Juru Uang": "Bendahara",
};

function buildTree(groups) {
  if (!groups?.length) return null;
  const [pembina, pradana, pemangku, ...staff] = groups;

  const mkNode = (g, children) => ({
    name: g.jabatan.nama,
    attributes: {
      role: ROLE_LABELS[g.jabatan.nama] || "",
      members: JSON.stringify(g.members || []),
      isEmpty: !g.members?.length,
    },
    children: children?.length ? children : undefined,
  });

  const staffNodes = staff.map((g) => mkNode(g));
  const paNode = pemangku ? mkNode(pemangku, staffNodes) : null;
  const prNode = pradana
    ? mkNode(pradana, paNode ? [paNode] : staffNodes)
    : null;

  return mkNode(pembina, prNode ? [prNode] : paNode ? [paNode] : null);
}

function NodeCard({ nodeDatum }) {
  const a = nodeDatum.attributes || {};
  const members = a.members ? JSON.parse(a.members) : [];
  const isEmpty = a.isEmpty === true || a.isEmpty === "true";
  const role = a.role || "";
  const hasChildren = !!(nodeDatum.children && nodeDatum.children.length > 0);
  const isChain = hasChildren;

  const cardW = isChain ? 170 : 140;
  const lineH = 20;
  const headerH = role ? 48 : 36;
  const bodyH = isEmpty ? 20 : members.length * lineH + 4;
  const h = headerH + bodyH + 12;

  return (
    <foreignObject
      width={cardW}
      height={h}
      x={-cardW / 2}
      y={-h / 2}
      style={{ overflow: "visible" }}
    >
      <div
        style={{
          background: "hsl(var(--card))",
          border: isChain
            ? "2px solid hsl(var(--primary))"
            : "1px solid hsl(var(--border))",
          borderRadius: 12,
          padding: "8px 10px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: isChain ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          }}
        >
          {nodeDatum.name}
        </div>
        {role && (
          <div
            style={{
              fontSize: 9,
              color: isChain
                ? "hsl(var(--primary) / .7)"
                : "hsl(var(--muted-foreground))",
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
              gap: 1,
            }}
          >
            {members.map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: 9,
                  background: "hsl(var(--primary) / .1)",
                  color: "hsl(var(--primary))",
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
    </foreignObject>
  );
}

export default function OrgChartView({ groups }) {
  const data = useMemo(() => buildTree(groups), [groups]);

  if (!data) return null;

  return (
    <div className="w-full h-[520px]">
      <Tree
        data={data}
        orientation="vertical"
        pathFunc="step"
        translate={{ x: 300, y: 60 }}
        nodeSize={{ x: 240, y: 130 }}
        separation={{ siblings: 0.8, nonSiblings: 1.2 }}
        renderCustomNodeElement={(rd3tProps) => (
          <NodeCard nodeDatum={rd3tProps.nodeDatum} />
        )}
        styles={{
          links: {
            stroke: "hsl(var(--border))",
            strokeWidth: 2,
          },
        }}
      />
    </div>
  );
}
