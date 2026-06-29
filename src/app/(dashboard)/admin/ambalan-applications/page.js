import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getAmbalanApplicantsAction } from "@/app/actions/ambalan-admin";
import ApplicantsManager from "./ApplicantsManager";

export default async function AdminAmbalanApplicationsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const applicants = await getAmbalanApplicantsAction();
  const listKey = applicants.map((a) => `${a.id}:${a.status}`).join("|");

  return (
    <ApplicantsManager
      key={listKey}
      applicants={applicants}
    />
  );
}
