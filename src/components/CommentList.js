"use client";
import { useState, useOptimistic, useTransition } from "react";
import { deleteCommentAction, togglePinAction, toggleSpamAction } from "@/app/actions/admin";
import { getAvatarUrl } from "@/lib/avatar";
import { User, Trash2, Pin, PinOff, ShieldAlert, ShieldCheck } from "lucide-react";

const STAFF_ROLES = ["admin", "moderator"];

function formatTanggal(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ url, name, size = "sm" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-5 h-5 text-[9px]";
  const initials = name?.[0]?.toUpperCase() ?? "?";
  const avatarUrl = getAvatarUrl(url);

  return (
    <div className={`${dim} rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {url ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <User size={size === "sm" ? 14 : 11} className="text-purple-600 dark:text-purple-400" />
      )}
    </div>
  );
}

function StaffActions({ comment, isStaff, onDelete, onTogglePin, onToggleSpam }) {
  const [pending, startTransition] = useTransition();

  if (!isStaff) return null;

  return (
    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
      {/* Pin */}
      <button
        title={comment.is_pinned ? "Lepas pin" : "Sematkan"}
        onClick={() => startTransition(() => onTogglePin(comment.id, comment.is_pinned))}
        disabled={pending}
        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40"
      >
        {comment.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>

      {/* Spam toggle */}
      <button
        title={comment.is_spam ? "Tandai tidak spam" : "Tandai spam"}
        onClick={() => startTransition(() => onToggleSpam(comment.id, comment.is_spam))}
        disabled={pending}
        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-40"
      >
        {comment.is_spam ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
      </button>

      {/* Delete */}
      <button
        title="Hapus komentar"
        onClick={() => {
          if (!confirm("Hapus komentar ini beserta balasannya?")) return;
          startTransition(() => onDelete(comment.id));
        }}
        disabled={pending}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function CommentList({ initialComments, session }) {
  const isStaff = session && STAFF_ROLES.includes(session.role);

  const [comments, setComments] = useState(initialComments ?? []);

  function handleDelete(id) {
    const fd = new FormData();
    fd.set("comment_id", id);
    deleteCommentAction(null, fd).then((res) => {
      if (res?.success) {
        setComments((prev) =>
          prev.filter((c) => c.id !== id)
        );
      }
    });
  }

  function handleTogglePin(id, currentPin) {
    const fd = new FormData();
    fd.set("comment_id", id);
    fd.set("is_pinned", String(currentPin));
    togglePinAction(null, fd).then((res) => {
      if (res?.success) {
        setComments((prev) =>
          prev.map((c) => c.id === id ? { ...c, is_pinned: !currentPin } : c)
        );
      }
    });
  }

  function handleToggleSpam(id, currentSpam) {
    const fd = new FormData();
    fd.set("comment_id", id);
    fd.set("is_spam", String(currentSpam));
    toggleSpamAction(null, fd).then((res) => {
      if (res?.success) {
        setComments((prev) =>
          prev.filter((c) => c.id !== id) // remove from view when marked spam
        );
      }
    });
  }

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-[#150f2d] border border-purple-100 dark:border-purple-900/40 rounded-xl p-6 text-center text-gray-400 dark:text-purple-500 text-sm">
        Belum ada komentar. Jadilah yang pertama!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className={`bg-white dark:bg-[#150f2d] border rounded-xl p-4 transition-colors ${
            c.is_pinned
              ? "border-amber-300 dark:border-amber-700/60"
              : "border-purple-100 dark:border-purple-900/40"
          }`}
        >
          {/* Pinned badge */}
          {c.is_pinned && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase mb-2">
              <Pin size={11} /> Disematkan
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar url={c.author?.profile_picture_url} name={c.author?.display_name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-purple-300 truncate">
                {c.author?.display_name ?? "Anonim"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-purple-500">
                {formatTanggal(c.created_at)}
              </p>
            </div>
            <StaffActions
              comment={c}
              isStaff={isStaff}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onToggleSpam={handleToggleSpam}
            />
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 dark:text-purple-200 leading-relaxed">
            {c.content}
          </p>

          {/* Replies */}
          {c.replies?.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800 flex flex-col gap-2">
              {c.replies.map((r) => (
                <div key={r.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar url={r.author?.profile_picture_url} name={r.author?.display_name} size="xs" />
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-purple-300">
                      {r.author?.display_name ?? "Anonim"}
                    </p>
                    {isStaff && (
                      <button
                        title="Hapus balasan"
                        onClick={() => {
                          if (!confirm("Hapus balasan ini?")) return;
                          handleDelete(r.id);
                        }}
                        className="ml-auto p-1 rounded text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-purple-300">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
