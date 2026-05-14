"use client";
import Link from "next/link";
import { useActionState } from "react";
import { submitCommentAction } from "@/app/actions/comment";
import {
  Send,
  LogIn,
  CheckCircle,
  AlertCircle,
  MessageSquarePlus,
} from "lucide-react";

export default function CommentForm({
  postId,
  postTitle = "",
  postSlug = "",
  session,
}) {
  const [state, formAction, pending] = useActionState(
    submitCommentAction,
    null,
  );

  /* ── Not logged in ── */
  if (!session) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-6 text-center">
        <MessageSquarePlus
          size={28}
          className="mx-auto mb-2 text-purple-400 dark:text-purple-500"
        />
        <p className="text-gray-700 dark:text-purple-200 font-semibold text-sm mb-1">
          Ingin ikut berkomentar?
        </p>
        <p className="text-gray-500 dark:text-purple-400 text-xs mb-4">
          Login terlebih dahulu untuk menulis komentar di postingan ini.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-purple-800 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
        >
          <LogIn size={15} />
          Login untuk Berkomentar
        </Link>
      </div>
    );
  }

  /* ── Logged in ── */
  return (
    <div className="bg-white dark:bg-[#150f2d] border border-purple-100 dark:border-purple-900/40 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-700 dark:text-purple-200 text-sm mb-4 flex items-center gap-2">
        <MessageSquarePlus size={16} />
        Tulis Komentar
      </h3>

      {/* Feedback */}
      {state?.success && (
        <div className="mb-3 flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl text-green-700 dark:text-green-300 text-sm">
          <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="mb-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="post_id" value={postId} />
        <input type="hidden" name="post_title" value={postTitle} />
        <input type="hidden" name="post_slug" value={postSlug} />

        {/* Author info (read-only) */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-purple-400">
          <div className="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-[10px]">
            {session.display_name?.[0]?.toUpperCase() ?? "A"}
          </div>
          Berkomentar sebagai{" "}
          <span className="font-semibold text-gray-700 dark:text-purple-300">
            {session.display_name}
          </span>
        </div>

        <textarea
          name="content"
          required
          rows={3}
          maxLength={1000}
          placeholder="Tulis komentar kamu di sini..."
          className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none placeholder-gray-400 dark:placeholder-purple-600"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="flex-shrink-0 flex items-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
          >
            {pending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {pending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}
