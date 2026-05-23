import { getSessionUser } from "@/lib/auth/session";
import { NavbarContent } from "@/components/layout/NavbarContent";

export async function Navbar() {
  const user = await getSessionUser();
  return <NavbarContent user={user} />;
}
