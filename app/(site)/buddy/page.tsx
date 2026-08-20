import { redirect } from "next/navigation";
import { buildForumUrl } from "@/constants/forum";

/** 找搭子已并入自由讨论区话题 */
export default function BuddyPage() {
  redirect(buildForumUrl({ topic: "找搭子" }));
}
