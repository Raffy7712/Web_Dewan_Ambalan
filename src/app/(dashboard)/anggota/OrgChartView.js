"use client";

const ROLE_LABELS = {
  Pradana: "Ketua",
  "Pemangku Adat": "Wakil Ketua",
  Kerani: "Sekretaris",
  "Juru Uang": "Bendahara",
};

function MemberPill({ nama }) {
  return (
    <span className="block text-[11px] leading-tight bg-primary/10 text-primary rounded-md px-2.5 py-0.5 font-medium">
      {nama}
    </span>
  );
}

function ChainCard({ jabatan, members }) {
  const role = ROLE_LABELS[jabatan.nama];
  const isEmpty = !members?.length;
  return (
    <div className="bg-card border-2 border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 text-center shadow-md min-w-[180px]">
      <div className="font-bold text-foreground text-xs uppercase tracking-widest">
        {jabatan.nama}
      </div>
      {role && (
        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
          {role}
        </div>
      )}
      {isEmpty ? (
        <span className="text-[10px] text-muted-foreground italic mt-1 block">
          (kosong)
        </span>
      ) : (
        <div className="space-y-0.5 mt-1.5">
          {members.map((m) => (
            <MemberPill key={m.id} nama={m.nama} />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffCard({ jabatan, members }) {
  const role = ROLE_LABELS[jabatan.nama];
  const isEmpty = !members?.length;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-center shadow-sm min-w-[120px]">
      <div className="font-bold text-foreground text-[10px] uppercase tracking-widest">
        {jabatan.nama}
      </div>
      {role && (
        <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
          {role}
        </div>
      )}
      {isEmpty ? (
        <span className="text-[9px] text-muted-foreground italic mt-1 block">
          (kosong)
        </span>
      ) : (
        <div className="space-y-0.5 mt-1">
          {members.map((m) => (
            <span
              key={m.id}
              className="block text-[10px] bg-primary/10 text-primary rounded px-2 py-0.5 font-medium"
            >
              {m.nama}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VLine() {
  return (
    <div className="flex justify-center h-5">
      <div className="w-[2px] bg-border h-full" />
    </div>
  );
}

export default function OrgChartView({ groups }) {
  if (!groups?.length) return null;

  const [pembina, pradana, pemangku, ...staff] = groups;
  if (!pembina) return null;

  const splitAt = Math.ceil(staff.length / 2);
  const staffRow1 = staff.slice(0, splitAt);
  const staffRow2 = staff.slice(splitAt);

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex flex-col items-center gap-0 min-w-max px-4">
        {/* Pembina */}
        <ChainCard jabatan={pembina.jabatan} members={pembina.members} />
        <VLine />
        {/* Pradana */}
        <ChainCard jabatan={pradana.jabatan} members={pradana.members} />
        <VLine />
        {/* Pemangku Adat */}
        {pemangku && (
          <>
            <ChainCard jabatan={pemangku.jabatan} members={pemangku.members} />
            <VLine />
          </>
        )}

        {/* Staff rows */}
        {staff.length > 0 && (
          <>
            {staff.length === 1 ? (
              <>
                <VLine />
                {staff.map((g) => (
                  <StaffCard key={g.jabatan.id} jabatan={g.jabatan} members={g.members} />
                ))}
              </>
            ) : (
              <>
                {/* Semicircle branch bar */}
                <div className="relative h-10 w-full">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-1/2 bg-border/60 rounded-full" />
                  <div className="absolute top-1/2 left-[4%] right-[4%] h-[3px] bg-border/60 rounded-full" />
                </div>
                {/* Row 1 */}
                <div className="flex justify-center gap-3 md:gap-4 items-start">
                  {staffRow1.map((g) => (
                    <div key={g.jabatan.id} className="flex flex-col items-center">
                      <div className="h-5 w-[2px] bg-border/60" />
                      <StaffCard jabatan={g.jabatan} members={g.members} />
                    </div>
                  ))}
                </div>
                {/* Row 2 */}
                {staffRow2.length > 0 && (
                  <>
                    <div className="flex justify-center gap-3 md:gap-4 items-start mt-4">
                      {staffRow2.map((g) => (
                        <div key={g.jabatan.id} className="flex flex-col items-center">
                          <div className="h-5 w-[2px] bg-border/60" />
                          <StaffCard jabatan={g.jabatan} members={g.members} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
