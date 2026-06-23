"use client";

function NameBadge({ nama }) {
  return (
    <span className="block text-[11px] leading-tight bg-primary/10 text-primary rounded-md px-2 py-0.5 font-medium">
      {nama}
    </span>
  );
}

function NodeCard({ jabatan, members }) {
  const isEmpty = !members?.length;
  return (
    <div
      className={`bg-card border rounded-xl px-4 py-2.5 text-center shadow-sm transition-shadow ${
        isEmpty
          ? "border-dashed border-muted-foreground/30"
          : "border-border hover:shadow-md"
      }`}
    >
      <h3 className="font-bold text-foreground text-[11px] uppercase tracking-widest mb-1.5">
        {jabatan.nama}
      </h3>
      {isEmpty ? (
        <span className="text-[10px] text-muted-foreground italic">
          (kosong)
        </span>
      ) : (
        <div className="space-y-0.5">
          {members.map((m) => (
            <NameBadge key={m.id} nama={m.nama} />
          ))}
        </div>
      )}
    </div>
  );
}

function VLine({ height = "h-6" }) {
  return (
    <div className={`flex justify-center ${height}`}>
      <div className="w-0.5 bg-border h-full min-h-0" />
    </div>
  );
}

function BranchBar({ childCount }) {
  if (childCount <= 0) return null;
  if (childCount === 1) return <VLine height="h-6" />;

  const gapPx = childCount > 6 ? 4 : 6;
  const nodeWidth = childCount > 6 ? 130 : 140;
  const totalWidth = childCount * nodeWidth + (childCount - 1) * gapPx;

  return (
    <div className="relative flex justify-center h-8 w-full" style={{ minWidth: totalWidth }}>
      <div className="w-0.5 bg-border absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2" />
      <div className="h-0.5 bg-border absolute top-1/2 left-[5%] right-[5%]" />
    </div>
  );
}

function StaffRow({ groups }) {
  if (!groups?.length) return null;

  const isMany = groups.length > 6;
  const gap = isMany ? "gap-3" : "gap-4";

  return (
    <div className={`flex justify-center items-start ${gap}`}>
      {groups.map((g) => {
        const topLine = groups.length > 1;
        return (
          <div key={g.jabatan.id} className="flex flex-col items-center">
            {topLine && (
              <div className="flex justify-center h-6">
                <div className="w-0.5 bg-border h-full" />
              </div>
            )}
            <NodeCard jabatan={g.jabatan} members={g.members} />
          </div>
        );
      })}
    </div>
  );
}

export default function OrgChartView({ groups }) {
  if (!groups?.length) return null;

  const pembina = groups[0];
  const pradana = groups[1];
  const pemangkuAdat = groups[2];
  const staff = groups.slice(3);

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="flex flex-col items-center min-w-max px-6 mx-auto">
        {pembina && (
          <NodeCard jabatan={pembina.jabatan} members={pembina.members} />
        )}
        {pradana && (
          <>
            <VLine />
            <NodeCard jabatan={pradana.jabatan} members={pradana.members} />
          </>
        )}
        {pemangkuAdat && (
          <>
            <VLine />
            <NodeCard jabatan={pemangkuAdat.jabatan} members={pemangkuAdat.members} />
          </>
        )}
        {staff.length > 0 && (
          <>
            <BranchBar childCount={staff.length} />
            <StaffRow groups={staff} />
          </>
        )}
      </div>
    </div>
  );
}
