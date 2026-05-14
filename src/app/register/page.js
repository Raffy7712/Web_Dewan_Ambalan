import RegisterClient from "./RegisterClient";
import { isRegistrationEnabled } from "@/lib/cms";

export default async function RegisterPage({ searchParams }) {
  const registrationEnabled = await isRegistrationEnabled();
  const sp = await searchParams;
  const nextPath = typeof sp?.next === "string" ? sp.next : "";
  return (
    <RegisterClient
      registrationEnabled={registrationEnabled}
      nextPath={nextPath}
    />
  );
}
