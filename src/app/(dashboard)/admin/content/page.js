import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { CMS_PAGES } from "@/lib/cms-bindings";
import { getCmsEntriesByPage } from "@/lib/cms";
import ContentManager from "./ContentManager";

export default async function AdminContentPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const { page } = await searchParams;
  const selectedPage = CMS_PAGES.find((p) => p.key === page)?.key ?? "landing";
  const entries = await getCmsEntriesByPage(selectedPage);

  return (
    <ContentManager
      key={selectedPage}
      selectedPage={selectedPage}
      pages={CMS_PAGES}
      initialEntries={entries}
    />
  );
}
