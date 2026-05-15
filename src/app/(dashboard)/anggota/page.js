import Link from "next/link";
import { getAnggota, getJabatanList } from "@/lib/queries";
import { getSession } from "@/app/actions/auth";
import { getAllActiveAccountsForAdmin } from "@/lib/admin-queries";
import { getCmsText, isAmbalanRegistrationEnabled } from "@/lib/cms";
import { getAvatarUrl, getInitials } from "@/lib/avatar";
import { Users, UserPlus, Settings, FileSpreadsheet } from "lucide-react";
import AnggotaAdminPanel from "./AnggotaAdminPanel";

function Avatar({ name, url }) {
  const initials = getInitials(name);
  const avatarUrl = getAvatarUrl(url);

  return (
    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3 overflow-hidden">
      {url ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {orgTitle}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {orgSubtitle}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/members/export"
                className="flex items-center gap-2 bg-[var(--surface-app)] border border-[var(--border-primary)] hover:border-emerald-500 text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <FileSpreadsheet size={16} /> Export Excel
              </a>
              <Link
                href="/admin/jabatan"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Settings size={16} /> Kelola Jabatan
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Empty state */}
        {anggota.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Users size={48} className="mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">
              {emptyNoMembers}
            </p>
            {isAdmin && (
              <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
                {emptyAdminHelp.split("Kelola Jabatan").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <Link
                        href="/admin/jabatan"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
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
                  <div className="w-1 h-8 bg-emerald-600 rounded-full" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {jabatan.nama}
                  </h2>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full">
                    {members.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {members.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                    >
                      <Avatar name={a.display_name} url={a.profile_picture_url} />
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                        {a.display_name}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        @{a.username}
                      </p>
                      <span className="inline-block mt-3 text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        {jabatan.nama}
                      </span>
                      {a.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic line-clamp-2">
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
          <div className="mt-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-6 text-center text-white shadow-lg">
            <UserPlus size={28} className="mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Ingin bergabung?</h3>
            <p className="text-emerald-100 text-sm mb-4">
              Terbuka bagi siswa yang aktif di kegiatan pramuka dan ingin membantu merencanakan
              program ambalan, termasuk peran pengurus dan dewan formal.
            </p>
            <Link
              href="/daftar-ambalan"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-emerald-700 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
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
