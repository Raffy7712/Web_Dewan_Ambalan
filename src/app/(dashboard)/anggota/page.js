import Link from "next/link";
import { getAnggota, getJabatanList } from "@/lib/queries";
import { getSession } from "@/app/actions/auth";
import { getAllActiveAccountsForAdmin } from "@/lib/admin-queries";
import { getCmsText, isAmbalanRegistrationEnabled } from "@/lib/cms";
import { getAvatarUrl, getInitials } from "@/lib/avatar";
import { Users, UserPlus, Settings } from "lucide-react";
import AnggotaAdminPanel from "./AnggotaAdminPanel";

function Avatar({ name, url }) {
  const initials = getInitials(name);
  const avatarUrl = getAvatarUrl(url);

  return (
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
      {url ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl font-bold text-primary">
          {initials}
        </span>
      )}
    </div>
  );
}

export default async function AnggotaPage() {
  const [
    anggota,
    jabatanList,
    session,
    orgSubtitle,
    seleksiOpen,
    orgTitle,
    emptyNoMembers,
    emptyAdminHelp,
  ] = await Promise.all([
    getAnggota(),
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
    getCmsText(
      "organization",
      "empty",
      "no_members",
      "Belum ada pengurus Dewan Ambalan dengan jabatan terdaftar.",
    ),
    getCmsText(
      "organization",
      "empty",
      "admin_help",
      "Pergi ke Kelola Jabatan untuk menambah jabatan dan mengassign anggota.",
    ),
  ]);

  const isAdmin = session?.role === "admin";
  const allUsers = isAdmin ? await getAllActiveAccountsForAdmin() : [];

  // Group by jabatan
  const grouped = {};
  jabatanList.forEach((j) => {
    grouped[j.id] = { jabatan: j, members: [] };
  });
  anggota.forEach((a) => {
    const jid = a.jabatan?.id;
    if (jid && grouped[jid]) grouped[jid].members.push(a);
  });

  const groups = Object.values(grouped).filter((g) => g.members.length > 0);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-card border-b border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {orgTitle}
            </h1>
            <p className="text-muted-foreground">
              {orgSubtitle}
            </p>
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
        {/* Empty state */}
        {anggota.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-border">
            <Users size={48} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              {emptyNoMembers}
            </p>
            {isAdmin && (
              <p className="text-sm mt-2 text-muted-foreground">
                {emptyAdminHelp.split("Kelola Jabatan").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <Link
                        href="/admin/jabatan"
                        className="text-primary hover:underline"
                      >
                        Kelola Jabatan
                      </Link>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </p>
            )}
          </div>
        ) : (
          <>
            {groups.map(({ jabatan, members }) => (
              <section key={jabatan.id} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-primary rounded-full" />
                  <h2 className="text-xl font-bold text-foreground">
                    {jabatan.nama}
                  </h2>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                    {members.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {members.map((a) => (
                    <div
                      key={a.id}
                      className="bg-card border border-border rounded-lg p-5 text-center hover:shadow-lg hover:border-primary/50 transition-all"
                    >
                      <Avatar name={a.display_name} url={a.profile_picture_url} />
                      <h3 className="font-bold text-foreground text-sm line-clamp-2">
                        {a.display_name}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        @{a.username}
                      </p>
                      <span className="inline-block mt-3 text-xs px-2.5 py-1 rounded-lg font-semibold bg-primary/10 text-primary">
                        {jabatan.nama}
                      </span>
                      {a.bio && (
                        <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                          &quot;{a.bio}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Admin panel for assigning jabatan */}
        {isAdmin && (
          <AnggotaAdminPanel jabatanList={jabatanList} initialUsers={allUsers} />
        )}

        {seleksiOpen && (
          <div className="mt-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg p-6 text-center text-white shadow-lg">
            <UserPlus size={28} className="mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Ingin bergabung?</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Terbuka bagi siswa yang aktif di kegiatan pramuka dan ingin membantu merencanakan
              program ambalan, termasuk peran pengurus dan dewan formal.
            </p>
            <Link
              href="/daftar-ambalan"
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
