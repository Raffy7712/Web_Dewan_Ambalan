import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error(
    "RESEND_API_KEY belum diset. Email tidak dapat dikirim tanpa kunci API Resend.",
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM?.trim() || "Dewan Ambalan <noreply@smkalfurqon.sch.id>";
const SITE_NAME = "Dewan Ambalan SMK Al Furqon Bantarkawung";

function escapeEmailHtml(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send OTP for password reset.
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit plain OTP
 * @param {string} displayName - user's display name
 */
export async function sendOtpEmail(to, otp, displayName) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[${SITE_NAME}] Kode OTP Reset Password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9;margin-bottom:8px">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${displayName}</strong>,</p>
        <p style="color:#555">Kami menerima permintaan reset password untuk akunmu. Gunakan kode OTP berikut:</p>

        <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:12px;
                    text-align:center;padding:24px;margin:24px 0">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#4c1d95">
            ${otp}
          </span>
        </div>

        <p style="color:#555">
          Kode ini berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapapun.
        </p>
        <p style="color:#555">
          Jika kamu tidak merasa meminta reset password, abaikan email ini — akunmu tetap aman.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">
          Dikirim oleh ${SITE_NAME}<br/>
          Gudep Brebes 02.165 / 02.166 · Bantarkawung, Brebes, Jawa Tengah
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Email error: ${error.message}`);
  return data;
}

/**
 * Notify all staff (admin + moderator) when a new comment is posted.
 * @param {Array<{email:string, display_name:string}>} staff
 * @param {{ postTitle:string, postSlug:string, authorName:string, content:string }} comment
 */
export async function sendNewCommentNotification(staff, comment) {
  const recipients = staff.map((s) => s.email).filter(Boolean);
  if (!recipients.length) return;

  const preview =
    comment.content.length > 120
      ? comment.content.slice(0, 120) + "..."
      : comment.content;

  await resend.emails
    .send({
      from: FROM,
      to: recipients,
      subject: `[${SITE_NAME}] Komentar baru pada "${comment.postTitle}"`,
      html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9;margin-bottom:4px">${SITE_NAME}</h2>
        <p style="color:#888;font-size:12px">Notifikasi Staff</p>
        <p style="color:#555">Ada komentar baru dari <strong>${comment.authorName}</strong> pada postingan:</p>
        <p style="color:#6d28d9;font-weight:bold">"${comment.postTitle}"</p>
        <blockquote style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0">
          <p style="margin:0;color:#374151">${preview}</p>
        </blockquote>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/berita/${comment.postSlug}"
           style="display:inline-block;background:#6d28d9;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
          Lihat Komentar
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME} · Notifikasi otomatis</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendNewCommentNotification:", e.message));
}

/**
 * Notify all users with email when a new post is published.
 * @param {Array<{email:string, display_name:string}>} users
 * @param {{ title:string, slug:string, description:string, category:string, authorName:string }} post
 */
export async function sendNewPostNotification(users, post) {
  const recipients = users.map((u) => u.email).filter(Boolean);
  if (!recipients.length) return;

  const categoryLabel =
    {
      pengumuman: "Pengumuman",
      kegiatan: "Kegiatan",
      prestasi: "Prestasi",
      galeri: "Album dokumentasi",
    }[post.category] ?? post.category;

  const safeTitle = escapeEmailHtml(post.title);
  const safeDesc = post.description
    ? escapeEmailHtml(post.description)
    : "";

  // Send in one batch (Resend supports multiple "to" addresses)
  await resend.emails
    .send({
      from: FROM,
      to: recipients,
      subject: `[${SITE_NAME}] Postingan baru: ${post.title}`,
      html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9;margin-bottom:4px">${SITE_NAME}</h2>
        <p style="color:#888;font-size:12px">Postingan Baru · ${escapeEmailHtml(categoryLabel)}</p>
        <h3 style="color:#111;margin:16px 0 8px">${safeTitle}</h3>
        ${safeDesc ? `<p style="color:#555">${safeDesc}</p>` : ""}
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/berita/${post.slug}"
           style="display:inline-block;background:#6d28d9;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">
          Baca Selengkapnya
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">
          ${SITE_NAME} · <a href="#" style="color:#aaa">Berhenti berlangganan</a>
        </p>
      </div>
    `,
    })
    .catch((e) => console.error("sendNewPostNotification:", e.message));
}

/**
 * Notify staff when ada pendaftaran baru calon pengurus ambalan.
 */
export async function sendNewAmbalanApplicationNotification(staff, detail) {
  const recipients = staff.map((s) => s.email).filter(Boolean);
  if (!recipients.length) return;

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await resend.emails
    .send({
      from: FROM,
      to: recipients,
      subject: `[${SITE_NAME}] Pendaftaran seleksi calon pengurus — ${detail.fullName}`,
      html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#047857;margin-bottom:4px">${SITE_NAME}</h2>
        <p style="color:#888;font-size:12px">Notifikasi admin/moderator</p>
        <p style="color:#555">Ada pengajuan baru di form seleksi calon pengurus.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#374151">
          <tr><td style="padding:6px 0;font-weight:600">Nama</td><td>${escapeEmailHtml(detail.fullName)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600">Kelas</td><td>${escapeEmailHtml(detail.className)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600">WhatsApp</td><td>${escapeEmailHtml(detail.phone)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600">Periode</td><td>${escapeEmailHtml(detail.period)}</td></tr>
        </table>
        <p style="color:#555;font-size:13px"><strong>Motivasi:</strong><br/>${escapeEmailHtml(detail.motivationPreview)}</p>
        <a href="${base}/daftar-ambalan"
           style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">
          Buka portal
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME} · Notifikasi otomatis</p>
      </div>
    `,
    })
    .catch((e) =>
      console.error("sendNewAmbalanApplicationNotification:", e.message),
    );
}

function skipIfNoResend() {
  if (!process.env.RESEND_API_KEY) return true;
  return false;
}

/** Setelah reset password berhasil (peringatan keamanan). */
export async function sendPasswordChangedEmail(to, displayName) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Password akun diubah`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Password akun portal kamu baru saja diubah melalui fitur lupa password.</p>
        <p style="color:#b45309"><strong>Bukan kamu?</strong> Segera hubungi pembina/humas atau reset password lagi dari <a href="${base}/lupa-password">halaman lupa password</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendPasswordChangedEmail:", e.message));
}

/** User diblokir admin. */
export async function sendAccountBannedEmail(to, displayName, reason) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const r = reason ? `<p style="color:#555"><strong>Catatan admin:</strong> ${escapeEmailHtml(reason)}</p>` : "";
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Akun portal diblokir sementara`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#b91c1c">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Akses akunmu ke website Dewan Ambalan saat ini <strong>diblokir</strong>. Kamu tidak dapat login hingga admin mencabut blokir.</p>
        ${r}
        <p style="color:#555">Jika menurutmu ini kesalahan, hubungi pembina atau humas melalui kanal resmi sekolah.</p>
        <p style="color:#888;font-size:13px"><a href="${base}/home">Buka beranda portal</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendAccountBannedEmail:", e.message));
}

export async function sendAccountUnbannedEmail(to, displayName) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Blokir akun dicabut`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Blokir pada akun portalmu sudah <strong>dicabut</strong>. Kamu bisa login kembali.</p>
        <a href="${base}/login" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Login</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendAccountUnbannedEmail:", e.message));
}

/** Konfirmasi ke peserta: pendaftaran seleksi diterima sistem. */
export async function sendAmbalanReceivedEmail(to, displayName, period) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Pendaftaran seleksi diterima`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Pengajuan seleksi calon pengurus ambalan periode <strong>${escapeEmailHtml(period)}</strong> sudah kami terima.</p>
        <p style="color:#555">Tim akan menghubungi atau mengumumkan langkah selanjutnya sesuai jadwal humas.</p>
        <a href="${base}/daftar-ambalan" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Lihat status</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendAmbalanReceivedEmail:", e.message));
}

/** Staff: akun pengguna baru mendaftar (setelah verifikasi email). */
export async function sendStaffNewRegistrationNotification(staff, user) {
  if (skipIfNoResend()) return;
  const recipients = staff.map((s) => s.email).filter(Boolean);
  if (!recipients.length) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails
    .send({
      from: FROM,
      to: recipients,
      subject: `[${SITE_NAME}] Pengguna baru: ${escapeEmailHtml(user.username)}`,
      html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#888;font-size:12px">Notifikasi staff</p>
        <p style="color:#555">Akun baru berhasil mendaftar setelah verifikasi email.</p>
        <table style="font-size:14px;color:#374151;margin:12px 0">
          <tr><td style="padding:4px 8px 4px 0;font-weight:600">Nama</td><td>${escapeEmailHtml(user.display_name)}</td></tr>
          <tr><td style="padding:4px 8px 4px 0;font-weight:600">Username</td><td>${escapeEmailHtml(user.username)}</td></tr>
          <tr><td style="padding:4px 8px 4px 0;font-weight:600">Email</td><td>${escapeEmailHtml(user.email)}</td></tr>
        </table>
        <a href="${base}/admin/users" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">Buka daftar akun</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendStaffNewRegistrationNotification:", e.message));
}

/** Staff: laporan keuangan periode dipublikasikan ke publik. */
export async function sendStaffFinancePublishedNotification(staff, detail) {
  if (skipIfNoResend()) return;
  const recipients = staff.map((s) => s.email).filter(Boolean);
  if (!recipients.length) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await resend.emails
    .send({
      from: FROM,
      to: recipients,
      subject: `[${SITE_NAME}] Keuangan dipublikasikan — ${escapeEmailHtml(detail.periodLabel)}`,
      html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#888;font-size:12px">Notifikasi staff</p>
        <p style="color:#555">Laporan keuangan <strong>${escapeEmailHtml(detail.periodLabel)}</strong> sekarang <strong>terpublikasi</strong> di halaman transparansi.</p>
        <a href="${base}/keuangan" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Lihat /keuangan</a>
        <a href="${base}/admin/finance" style="display:inline-block;margin-left:8px;background:#334155;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Panel admin</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendStaffFinancePublishedNotification:", e.message));
}

export async function sendWelcomeEmail(to, displayName) {
  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `Selamat datang di ${SITE_NAME}!`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${displayName}</strong>, selamat bergabung!</p>
        <p style="color:#555">
          Akunmu berhasil dibuat. Kamu sekarang bisa login dan menikmati semua fitur
          portal Dewan Ambalan SMK Al Furqon Bantarkawung.
        </p>
        <p style="color:#555">
          <em>Satyaku Kudarmakan, Darmaku Kubaktikan.</em>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">
          ${SITE_NAME} · Gudep Brebes 02.165 / 02.166 · SMK Al Furqon
        </p>
      </div>
    `,
    })
    .catch((e) => console.error("sendWelcomeEmail:", e.message));
}

/** Notifikasi ketika peran akun user diubah. */
export async function sendAccountRoleChangedEmail(to, displayName, newRole) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const roleLabel = {
    admin: "Admin",
    moderator: "Moderator",
    user: "Anggota",
  }[newRole] ?? newRole;

  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Perubahan peran akun`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Peran akun portalmu telah diubah menjadi <strong>${roleLabel}</strong> oleh admin.</p>
        <p style="color:#888;font-size:13px">Jika kamu tidak mengerti perubahan ini, silakan hubungi pembina atau humas melalui kanal resmi sekolah.</p>
        <a href="${base}/profil" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Lihat profil</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendAccountRoleChangedEmail:", e.message));
}

/** Notifikasi ketika ada login dari perangkat/IP baru. */
export async function sendNewDeviceLoginEmail(to, displayName, deviceName, ipAddress) {
  if (skipIfNoResend()) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  
  // Format IP for display (mask last octet)
  const ipParts = ipAddress.split(".");
  const maskedIp = ipParts.length === 4 
    ? `${ipParts.slice(0, 3).join(".")}.***`
    : ipAddress;

  await resend.emails
    .send({
      from: FROM,
      to,
      subject: `[${SITE_NAME}] Login dari perangkat baru`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#047857">${SITE_NAME}</h2>
        <p style="color:#555">Halo <strong>${escapeEmailHtml(displayName)}</strong>,</p>
        <p style="color:#555">Akunmu baru saja login dari <strong>perangkat baru</strong>:</p>
        
        <div style="background:#f0fdf4;border-left:4px solid #059669;padding:12px;margin:12px 0;border-radius:4px">
          <p style="color:#155e75;margin:4px 0;font-size:13px">
            <strong>Perangkat:</strong> ${escapeEmailHtml(deviceName)}
          </p>
          <p style="color:#155e75;margin:4px 0;font-size:13px">
            <strong>Alamat IP:</strong> ${maskedIp}
          </p>
          <p style="color:#155e75;margin:4px 0;font-size:13px">
            <strong>Waktu:</strong> ${new Date().toLocaleString("id-ID")}
          </p>
        </div>

        <p style="color:#555"><strong>Bukan kamu?</strong> Segera lakukan:</p>
        <ol style="color:#555;margin-left:20px">
          <li>Reset password dari <a href="${base}/lupa-password">halaman lupa password</a></li>
          <li>Hubungi pembina atau humas jika terus terjadi login mencurigakan</li>
        </ol>

        <p style="color:#888;font-size:12px;font-style:italic">
          Jika ini adalah login normal kamu, tidak perlu melakukan tindakan apapun. Kami akan mempercayai perangkat ini untuk login berikutnya.
        </p>
        
        <a href="${base}/profil" style="display:inline-block;background:#047857;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;margin-top:12px">Kelola perangkat terpercaya</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">${SITE_NAME}</p>
      </div>
    `,
    })
    .catch((e) => console.error("sendNewDeviceLoginEmail:", e.message));
}
