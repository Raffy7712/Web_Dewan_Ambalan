'use client';

import { useActionState, useEffect, useState } from 'react';
import { Edit2, Lock, Mail, Briefcase, Calendar, LogOut } from 'lucide-react';
import { updateProfileAction, logoutAction } from '@/app/actions/auth';
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
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Profil Saya</h1>
          <p className="text-primary-foreground mt-1">Kelola informasi akun Anda</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden mb-6">
          {/* Header Background */}
          <div className="h-24 bg-gradient-to-r from-primary to-primary/80" />
          
          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-6">
              {account.profile_picture_url ? (
                <img
                  src={getAvatarUrl(account.profile_picture_url)}
                  alt={account.display_name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white dark:border-background shadow-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white dark:border-background shadow-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <img src="/default-avatar.svg" alt="default" className="w-16 h-16 opacity-60" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{account.display_name}</h1>
                <p className="text-muted-foreground">@{account.username}</p>
              </div>
            </div>

            {/* Bio */}
            {account.bio && (
              <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
                <p className="text-muted-foreground italic">{account.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
<Mail size={16} className="text-primary" />
                   <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                </div>
                <p className="text-foreground font-medium break-all">{account.email}</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Role</p>
                </div>
                <p className="text-foreground font-medium capitalize">{account.role}</p>
              </div>

              {account.jabatan && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Jabatan</p>
                  </div>
                  <p className="text-foreground font-medium">{account.jabatan.nama}</p>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Bergabung</p>
                </div>
                <p className="text-foreground font-medium">{formatDate(account.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <Edit2 size={18} />
            Edit Profil
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-center gap-2 bg-muted-foreground hover:bg-muted-foreground/80 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <Lock size={18} />
            Ubah Password
          </button>
          <form action={logoutAction} className="sm:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 dark:hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>

        {/* Edit Profil Modal */}
        {editMode && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-1">Edit Profil</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Hanya nama yang dapat diubah dari halaman ini.
              </p>
              {updateState?.error && (
                <p className="text-sm text-red-500 mb-3">{updateState.error}</p>
              )}
              {updateState?.success && (
                <p className="text-sm text-primary mb-3">{updateState.success}</p>
              )}
              <form action={updateAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nama
                  </label>
                  <input
                    name="display_name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={80}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setDisplayName(account.display_name ?? '');
                    }}
                    className="flex-1 bg-muted hover:opacity-90 text-foreground py-2 rounded-lg font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
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
            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Ubah Password</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Password Lama</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan password lama"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Password Baru</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan password baru"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    placeholder="Konfirmasi password baru"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-semibold transition-colors"
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