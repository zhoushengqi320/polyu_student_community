import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** 找搭子已并入自由讨论区话题 */
export default function BuddyDetailPage() {
  redirect(ROUTES.forum.list);
}
