"use client";
import { useState, useActionState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addJabatanAction,
  deleteJabatanAction,
  reorderJabatanDragAction,
} from "@/app/actions/admin";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  GripVertical,
} from "lucide-react";

function SortableItem({ jabatan, onDelete, deleting, delMsg }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: jabatan.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-4 sm:px-5 py-3.5"
    >
      <button
        type="button"
        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        title="Seret untuk mengubah urutan"
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{jabatan.nama}</p>
        <p className="text-xs text-muted-foreground">
          Urutan tampil: {jabatan.urutan}
        </p>
      </div>
      {delMsg[jabatan.id] && (
        <p className="text-xs text-red-500">{delMsg[jabatan.id]}</p>
      )}
      <button
        type="button"
        onClick={() => onDelete(jabatan)}
        disabled={deleting[jabatan.id]}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-40"
        title="Hapus jabatan"
      >
        {deleting[jabatan.id] ? (
          <span className="w-4 h-4 border-2 border-gray-300 border-t-red-400 rounded-full animate-spin inline-block" />
        ) : (
          <Trash2 size={15} />
        )}
      </button>
    </li>
  );
}

export default function JabatanManager({ initialJabatan }) {
  const router = useRouter();
  const [items, setItems] = useState(initialJabatan ?? []);
  const [addState, addAction, addPending] = useActionState(
    addJabatanAction,
    null,
  );
  const [deleting, setDeleting] = useState({});
  const [delMsg, setDelMsg] = useState({});
  const [dragState, dragAction, dragPending] = useActionState(
    reorderJabatanDragAction,
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (addState?.success) router.refresh();
  }, [addState?.success, router]);

  useEffect(() => {
    setItems(initialJabatan ?? []);
  }, [initialJabatan]);

  async function handleDelete(jabatan) {
    if (
      !confirm(
        `Hapus jabatan "${jabatan.nama}"?\nSemua anggota dengan jabatan ini akan kehilangan jabatannya.`,
      )
    )
      return;
    setDeleting((p) => ({ ...p, [jabatan.id]: true }));
    const fd = new FormData();
    fd.set("jabatan_id", jabatan.id);
    const res = await deleteJabatanAction(null, fd);
    setDeleting((p) => ({ ...p, [jabatan.id]: false }));
    if (res?.success) {
      router.refresh();
    } else {
      setDelMsg((p) => ({ ...p, [jabatan.id]: res?.error }));
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const fd = new FormData();
    fd.set("items", JSON.stringify(reordered.map((i) => ({ id: i.id }))));
    dragAction(fd);
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-muted border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">
            Daftar Jabatan ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Belum ada jabatan. Tambahkan di bawah.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-border">
                {items.map((j) => (
                  <SortableItem
                    key={j.id}
                    jabatan={j}
                    onDelete={handleDelete}
                    deleting={deleting}
                    delMsg={delMsg}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
          <Plus size={16} className="text-primary" />
          Tambah Jabatan Baru
        </h2>

        {addState?.error && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={14} /> {addState.error}
          </div>
        )}
        {typeof addState?.success === "string" && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl text-green-700 dark:text-green-300 text-sm">
            <CheckCircle size={14} /> {addState.success}
          </div>
        )}

        <form action={addAction} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="nama"
            required
            placeholder="Nama jabatan (mis: Sekretaris Putra)"
            className="flex-1 border border-border bg-background text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition"
          />
          <button
            type="submit"
            disabled={addPending}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            {addPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Tambah
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-3">
          Seret (drag) untuk mengubah urutan tampilan di halaman struktur.
        </p>
      </div>
    </div>
  );
}
