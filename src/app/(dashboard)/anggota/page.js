import Link from "next/link";
import { getOrgMembers, getJabatanList } from "@/lib/queries";
import { getSession } from "@/app/actions/auth";
import { getCmsText, isAmbalanRegistrationEnabled } from "@/lib/cms";
import { UserPlus, Settings } from "lucide-react";
import OrgChartView from "./OrgChartView";
import OrgMemberAdmin from "./OrgMemberAdmin";

export default async function AnggotaPage() {
  const [members, jabatanList, session, orgSubtitle, seleksiOpen, orgTitle] =
    await Promise.all([
      getOrgMembers(),
      getJabatanList(),
      getSession(),
      getCmsText(
        "organization",
        "hero",
        "subtitle",
        "Pengurus aktif masa bakti 2026/2027 SMK Al Furqon Bantarkawung",
      ),
      isAmbalanRegistrationEnabled(),
      getCmsText("organization", "hero", "title", "Struktur Dewan Ambalan"),
    ]);

  const isAdmin = session?.role === "admin";

  const grouped = {};
  jabatanList.forEach((j) => {
    grouped[j.id] = { jabatan: j, members: [] };
  });
  members.forEach((m) => {
    const jid = m.jabatan?.id;
    if (jid && grouped[jid]) grouped[jid].members.push(m);
  });

  const groups = Object.values(grouped).filter((g) => g.members.length > 0);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-card via-background to-card border-b border-border py-10">
        <div className="max-w-6xl mx-auto px-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {orgTitle}
            </h1>
            <p className="text-muted-foreground">{orgSubtitle}</p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/jabatan"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Settings size={16} /> Kelola Jabatan
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {members.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-border">
            <p className="font-medium text-muted-foreground">
              Belum ada pengurus Dewan Ambalan.
            </p>
            {isAdmin && (
              <p className="text-sm mt-2 text-muted-foreground">
                Tambahkan anggota struktur di panel admin di bawah.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 overflow-hidden">
            <OrgChartView groups={groups} />
          </div>
        )}

        {isAdmin && (
          <OrgMemberAdmin jabatanList={jabatanList} initialMembers={members} />
        )}

        {seleksiOpen && (
          <div className="mt-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-center text-white shadow-lg">
            <UserPlus size={28} className="mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Ingin bergabung?</h3>
            <p className="text-primary-foreground/80 text-sm mb-4 max-w-md mx-auto">
              Terbuka bagi siswa yang aktif di kegiatan pramuka dan ingin
              membantu merencanakan program ambalan.
            </p>
            <Link
              href="/daftar-calon-dewan-ambalan"
              className="inline-flex items-center gap-2 bg-white hover:bg-muted text-primary font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <UserPlus size={16} />
              Form seleksi calon pengurus
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
