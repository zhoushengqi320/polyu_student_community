import { notFound } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { CommunityRulesView } from "@/components/legal/CommunityRulesView";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LEGAL_SLUGS, isLegalSlug } from "@/constants/legal";
import { getLegalDocument } from "@/lib/legal/getLegalDocument";

type LegalPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params;
  const document = await getLegalDocument(slug);

  if (!document) {
    return {
      title: "页面不存在",
    };
  }

  return {
    title: document.title,
    description: document.description,
  };
}

export default async function LegalDocumentPage({ params }: LegalPageProps) {
  const { slug } = await params;

  if (!isLegalSlug(slug)) {
    notFound();
  }

  const document = await getLegalDocument(slug);

  if (!document) {
    notFound();
  }

  return (
    <ModulePageShell title={document.title} description={document.description}>
      {document.slug === "community-rules" ? (
        <CommunityRulesView content={document.body} />
      ) : (
        <LegalDocumentView content={document.body} />
      )}
    </ModulePageShell>
  );
}
