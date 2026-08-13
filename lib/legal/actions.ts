"use server";

import { getLegalDocument } from "@/lib/legal/getLegalDocument";

export async function getCommunityRulesContentAction(): Promise<{
  title: string;
  body: string;
} | null> {
  const document = await getLegalDocument("community-rules");
  if (!document) {
    return null;
  }
  return {
    title: document.title,
    body: document.body,
  };
}
