import Link from "next/link";
import { getOrgMembers, getJabatanList } from "@/lib/queries";
import { getSession } from "@/app/actions/auth";
import { getCmsText, isAmbalanRegistrationEnabled } from "@/lib/cms";
import { UserPlus, Settings } from "lucide-react";
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
      <section className="bg-card border-b border-border py-8">
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
          <>
            {groups.map(({ jabatan, members: ms }) => (
              <section key={jabatan.id} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <h2 className="text-xl font-bold text-foreground">
                    {jabatan.nama}
                  </h2>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                    {ms.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {ms.map((m) => (
                    <div
                      key={m.id}
                      className="bg-card border border-border rounded-lg p-5 text-center hover:shadow-lg hover:border-primary/50 transition-all"
                    >
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl font-bold text-primary">
                          {m.nama
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-sm line-clamp-2">
                        {m.nama}
                      </h3>
                      <span className="inline-block mt-3 text-xs px-2.5 py-1 rounded-lg font-semibold bg-primary/10 text-primary">
                        {jabatan.nama}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {isAdmin && (
          <OrgMemberAdmin jabatanList={jabatanList} initialMembers={members} />
        )}

        {seleksiOpen && (
          <div className="mt-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg p-6 text-center text-white shadow-lg">
            <UserPlus size={28} className="mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Ingin bergabung?</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Terbuka bagi siswa yang aktif di kegiatan pramuka dan ingin
              membantu merencanakan program ambalan, termasuk peran pengurus dan
              dewan formal.
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
