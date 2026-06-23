"use client";

function MemberPill({ nama }) {
  return (
    <span className="block text-[11px] leading-tight bg-primary/10 text-primary rounded-md px-2.5 py-0.5 font-medium">
      {nama}
    </span>
  );
}

function NodeCard({ jabatan, members }) {
  const isEmpty = !members?.length;
  return (
    <div
      className={`bg-card border rounded-lg px-4 py-2.5 text-center shadow-sm ${
        isEmpty
          ? "border-dashed border-muted-foreground/30"
          : "border-border"
      }`}
    >
      <div className="font-bold text-foreground text-[11px] uppercase tracking-widest mb-1">
        {jabatan.nama}
      </div>
      {isEmpty ? (
        <span className="text-[10px] text-muted-foreground italic">(kosong)</span>
      ) : (
        <div className="space-y-0.5">
          {members.map((m) => (
            <MemberPill key={m.id} nama={m.nama} />
          ))}
        </div>
      )}
    </div>
  );
}

function VLine({ single = false }) {
  if (single) {
    return (
      <div className="flex justify-center h-6">
        <div className="w-[2px] bg-border h-full" />
      </div>
    );
  }
  return (
    <div className="flex justify-center h-6">
      <div className="w-[2px] bg-border h-full" />
    </div>
  );
}

function HBar({ colSpan }) {
  if (colSpan <= 1) return <VLine single />;
  return (
    <div className="relative h-7" style={{ gridColumn: `1 / span ${colSpan}` }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-border" />
      <div className="absolute top-1/2 left-[5%] right-[5%] h-[2px] bg-border" />
      <div className="absolute bottom-0 left-[5%] right-[5%] h-[2px] bg-border" />
    </div>
  );
}

export default function OrgChartView({ groups }) {
  if (!groups?.length) return null;

  const [pembina, pradana, pemangku, ...staff] = groups;
  if (!pembina) return null;

  const chain = [pembina, pradana, pemangku].filter(Boolean);

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex flex-col items-center gap-0 min-w-max px-4">
        {/* ── Chain: Pembina → Pradana → Pemangku Adat ── */}
        {chain.map((g, i) => (
          <div key={g.jabatan.id} className="flex flex-col items-center">
            <NodeCard jabatan={g.jabatan} members={g.members} />
            {i < chain.length - 1 && <VLine single />}
          </div>
        ))}

        {/* ── Branch bar + Staff row ── */}
        {staff.length > 0 && (
          <>
            {staff.length === 1 ? (
              <VLine single />
            ) : (
              <div className="relative h-7 w-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-border" />
                <div className="absolute top-1/2 left-[3%] right-[3%] h-[2px] bg-border" />
              </div>
            )}
            <div className="flex justify-center gap-3 items-start">
              {staff.map((g) => (
                <div key={g.jabatan.id} className="flex flex-col items-center">
                  {staff.length > 1 && (
                    <div className="h-6 w-[2px] bg-border" />
                  )}
                  <NodeCard jabatan={g.jabatan} members={g.members} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
