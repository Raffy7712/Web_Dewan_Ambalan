import { notFound } from "next/navigation";
import { getPostForEdit } from "@/lib/admin-queries";
import AdminPostFormEdit from "@/app/(dashboard)/admin/posts/AdminPostFormEdit";

export const metadata = {
  title: "Edit Postingan",
};

export default async function EditPostPage({ params }) {
  const { id } = await params;
  const post = await getPostForEdit(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Edit Postingan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ubah isi, foto, atau video dari postingan &quot;{post.title}&quot;
        </p>
      </div>

      <AdminPostFormEdit initialPost={post} />
    </div>
  );
}
