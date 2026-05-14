"use client";

import { setRolePermissionAction } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const ROLES = ["admin", "moderator", "user"];

export default function PermissionsManager({ keys, matrix }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isAllowed = (role, permissionKey) => {
    const match = matrix.find(
      (item) => item.role === role && item.permission_key === permissionKey,
    );
    return !!match?.allowed;
  };

  const update = (role, permissionKey, allowed) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("role", role);
      fd.set("permission_key", permissionKey);
      fd.set("allowed", String(allowed));
      await setRolePermissionAction(null, fd);
      router.refresh();
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Role Permissions</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Permission granular untuk kontrol akses modul admin.
      </p>
      <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300">Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="text-left px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.key} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{key.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{key.key}</p>
                </td>
                {ROLES.map((role) => {
                  const allowed = isAllowed(role, key.key);
                  return (
                    <td key={`${role}-${key.key}`} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => update(role, key.key, !allowed)}
                        disabled={pending}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          allowed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {allowed ? "Allowed" : "Denied"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
