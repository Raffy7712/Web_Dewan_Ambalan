"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  saveOrgMemberAction,
  deleteOrgMemberAction,
  reorderOrgMemberDragAction,
} from "@/app/actions/admin";
import { Plus, Trash2, Check, X, Pencil, GripVertical, Users } from "lucide-react";

function InlineName({ member, onSaved }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(member.nama);
  const inputRef = useRef(null);

  useEffect(() => {
    if (edit) inputRef.current?.focus();
  }, [edit]);

  async function handleSave() {
    const trimmed = val.trim();
    if (!trimmed || trimmed === member.nama) {
      setEdit(false);
      setVal(member.nama);
      return;
    }
    const fd = new FormData();
    fd.set("id", member.id);
    fd.set("nama", trimmed);
    const res = await saveOrgMemberAction(null, fd);
    if (res?.success) {
      setEdit(false);
      onSaved();
    } else {
      setVal(member.nama);
      setEdit(false);
    }
  }

  if (edit) {
    return (
      <div className="flex items-center gap-1 flex-1">
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setVal(member.nama);
              setEdit(false);
            }
          }}
          className="flex-1 border border-primary/50 bg-background text-foreground rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-0.5 text-green-600 hover:text-green-500"
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          onClick={() => {
            setVal(member.nama);
            setEdit(false);
          }}
          className="p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <span
      className="flex-1 text-sm text-foreground cursor-pointer hover:text-primary group/name truncate"
      onClick={() => setEdit(true)}
      title="Klik untuk edit"
    >
      {member.nama}
      <Pencil
        size={11}
        className="inline ml-1.5 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity"
      />
    </span>
  );
}

function SortableMember({ member, onDelete, onSaved }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted/50 group"
    >
      <button
        type="button"
        className="p-0.5 rounded text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} />
      </button>
      <InlineName member={member} onSaved={onSaved} />
      <button
        type="button"
        onClick={() => onDelete(member.id)}
        className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function OrgMemberAdmin({ jabatanList, initialMembers }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers ?? []);
  const [adding, setAdding] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = {};
  jabatanList.forEach((j) => {
    grouped[j.id] = {
      jabatan: j,
      members: members.filter((m) => m.jabatan?.id === j.id),
    };
  });

  async function handleSave(formData) {
    const res = await saveOrgMemberAction(null, formData);
    if (res?.success) router.refresh();
    return res;
  }

  async function handleDelete(id) {
    if (!confirm("Hapus anggota ini?")) return;
    const fd = new FormData();
    fd.set("id", id);
    const res = await deleteOrgMemberAction(null, fd);
    if (res?.success) router.refresh();
  }

  async function handleDragEnd(jabatan_id, event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ms = grouped[jabatan_id]?.members ?? [];
    const oldIdx = ms.findIndex((m) => m.id === active.id);
    const newIdx = ms.findIndex((m) => m.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = [...ms];
    reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, ms[oldIdx]);

    const fd = new FormData();
    fd.set("items", JSON.stringify(reordered.map((m) => ({ id: m.id }))));
    const res = await reorderOrgMemberDragAction(null, fd);
    if (res?.success) router.refresh();
  }

  return (
    <div className="mt-10 bg-card border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users size={18} className="text-primary" />
        <h3 className="font-bold text-foreground text-lg">
          Kelola Anggota Struktur
        </h3>
        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">
          Admin
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {jabatanList.map((j) => {
          const ms = grouped[j.id]?.members ?? [];
          return (
            <div
              key={j.id}
              className="border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5 border-b border-border">
                <h4 className="font-semibold text-foreground text-sm">
                  {j.nama}
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                    ({ms.length})
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setAdding((p) => ({ ...p, [j.id]: !p[j.id] }))
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {adding[j.id] ? null : <Plus size={13} />}
                  {adding[j.id] ? "Tutup" : "Tambah"}
                </button>
              </div>

              {adding[j.id] && (
                <form
                  action={async (fd) => {
                    const res = await handleSave(fd);
                    if (res?.success)
                      setAdding((p) => ({ ...p, [j.id]: false }));
                  }}
                  className="flex gap-2 px-4 pt-3 pb-2 bg-muted/20"
                >
                  <input type="hidden" name="jabatan_id" value={j.id} />
                  <input
                    type="text"
                    name="nama"
                    required
                    placeholder="Nama anggota"
                    className="flex-1 border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </form>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(j.id, e)}
              >
                <SortableContext
                  items={ms.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="px-2 py-1.5 space-y-0.5">
                    {ms.map((m) => (
                      <SortableMember
                        key={m.id}
                        member={m}
                        onDelete={handleDelete}
                        onSaved={() => router.refresh()}
                      />
                    ))}
                    {ms.length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-2 py-2">
                        Belum ada anggota.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          );
        })}
      </div>
    </div>
  );
}
