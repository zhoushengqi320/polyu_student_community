import { getCommunityRulesToc } from "@/constants/communityRules";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";

type CommunityRulesViewProps = {
  content: string;
};

export function CommunityRulesView({ content }: CommunityRulesViewProps) {
  const toc = getCommunityRulesToc(content);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {toc.length > 0 ? (
        <nav
          aria-label="社区规则目录"
          className="rounded-lg border bg-muted/30 px-4 py-3"
        >
          <p className="mb-2 text-sm font-semibold tracking-tight">目录</p>
          <ol className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="underline-offset-2 hover:text-foreground hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <LegalDocumentView content={content} enableAnchors />
    </div>
  );
}
