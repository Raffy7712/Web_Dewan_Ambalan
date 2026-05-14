'use client';

import { useActionState, useEffect, useState } from 'react';
import { Edit2, Lock, Mail, Briefcase, Calendar } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/auth';
import { getAvatarUrl } from '@/lib/avatar';
import { useRouter } from 'next/navigation';

export default function ProfilClient({ account }) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [displayName, setDisplayName] = useState(account.display_name ?? '');
  const [updateState, updateAction, updatePending] = useActionState(updateProfileAction, null);

  useEffect(() => {
    if (updateState?.success) {
      router.refresh();
    }
  }, [updateState, router]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-[var(--surface-app)] text-[var(--text-primary)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Profil Saya</h1>
          <p className="text-emerald-100 mt-1">Kelola informasi akun Anda</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-[var(--surface-elevated)] rounded-lg shadow-lg border border-[var(--border-primary)] overflow-hidden mb-6">
          {/* Header Background */}
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          
          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-6">
              {account.profile_picture_url ? (
                <img
                  src={getAvatarUrl(account.profile_picture_url)}
                  alt={account.display_name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white dark:border-slate-900 shadow-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white dark:border-slate-900 shadow-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <img src="/default-avatar.svg" alt="default" className="w-16 h-16 opacity-60" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{account.display_name}</h1>
                <p className="text-[var(--text-secondary)]">@{account.username}</p>
              </div>
            </div>

            {/* Bio */}
            {account.bio && (
              <div className="mb-6 p-4 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-primary)]">
                <p className="text-[var(--text-secondary)] italic">{account.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Email</p>
                </div>
                <p className="text-[var(--text-primary)] font-medium break-all">{account.email}</p>
              </div>
              
              <div className="p-4 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Role</p>
                </div>
                <p className="text-[var(--text-primary)] font-medium capitalize">{account.role}</p>
              </div>

              {account.jabatan && (
                <div className="p-4 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Jabatan</p>
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">{account.jabatan.nama}</p>
                </div>
              )}

              <div className="p-4 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Bergabung</p>
                </div>
                <p className="text-[var(--text-primary)] font-medium">{formatDate(account.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button 
            onClick={() => setEditMode(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <Edit2 size={18} />
            Edit Profil
          </button>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <Lock size={18} />
            Ubah Password
          </button>
        </div>

        {/* Edit Profil Modal */}
        {editMode && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface-elevated)] rounded-lg max-w-md w-full p-6 border border-[var(--border-primary)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Edit Profil</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Hanya nama yang dapat diubah dari halaman ini.
              </p>
              {updateState?.error && (
                <p className="text-sm text-red-500 mb-3">{updateState.error}</p>
              )}
              {updateState?.success && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">{updateState.success}</p>
              )}
              <form action={updateAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Nama
                  </label>
                  <input
                    name="display_name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={80}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setDisplayName(account.display_name ?? '');
                    }}
                    className="flex-1 bg-[var(--surface-muted)] hover:opacity-90 text-[var(--text-primary)] py-2 rounded-lg font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
                  >
                    {updatePending ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ubah Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ubah Password</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password Lama</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan password lama"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan password baru"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    placeholder="Konfirmasi password baru"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}