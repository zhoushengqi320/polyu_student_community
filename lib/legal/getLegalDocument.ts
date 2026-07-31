import fs from "node:fs/promises";
import path from "node:path";
import {
  getLegalDocumentMeta,
  isLegalSlug,
  type LegalSlug,
} from "@/constants/legal";

const LEGAL_CONTENT_ROOT = path.join(process.cwd(), "content", "legal");

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  description: string;
  body: string;
};

export async function getLegalDocument(
  slug: string,
): Promise<LegalDocument | null> {
  if (!isLegalSlug(slug)) {
    return null;
  }

  const meta = getLegalDocumentMeta(slug);
  const filePath = path.normalize(path.join(LEGAL_CONTENT_ROOT, meta.file));
  const isInsideLegalRoot =
    filePath === LEGAL_CONTENT_ROOT ||
    filePath.startsWith(`${LEGAL_CONTENT_ROOT}${path.sep}`);

  if (!isInsideLegalRoot || path.extname(filePath) !== ".txt") {
    return null;
  }

  try {
    const body = await fs.readFile(filePath, "utf8");
    return {
      slug,
      title: meta.title,
      description: meta.description,
      body: body.trim(),
    };
  } catch {
    return null;
  }
}
