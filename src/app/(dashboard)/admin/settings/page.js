import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import {
  getRegistrationSetting,
  getAmbalanRegistrationSetting,
  getMasaBaktiSetting,
} from "@/lib/admin-queries";
import SettingsManager from "./SettingsManager";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const [registrationEnabled, ambalanRegistrationEnabled, masaBakti] =
    await Promise.all([
      getRegistrationSetting(),
      getAmbalanRegistrationSetting(),
      getMasaBaktiSetting(),
    ]);

  return (
    <SettingsManager
      initialRegistrationEnabled={registrationEnabled}
      initialAmbalanRegistrationEnabled={ambalanRegistrationEnabled}
      initialMasaBakti={masaBakti}
    />
  );
}
