import {
  COMMUNITY_RULES_ENCOURAGED,
  COMMUNITY_RULES_PROHIBITED,
  getCommunityRulesToc,
} from "@/constants/communityRules";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";

type CommunityRulesViewProps = {
  content: string;
};

export function CommunityRulesView({ content }: CommunityRulesViewProps) {
  const toc = getCommunityRulesToc(content);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3 border-t border-emerald-700/25 pt-4">
          <h2 className="text-base font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">
            鼓励分享
          </h2>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {COMMUNITY_RULES_ENCOURAGED.map((item) => (
              <li key={item} className="pl-3 border-l-2 border-emerald-700/30">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 border-t border-destructive/30 pt-4">
          <h2 className="text-base font-semibold tracking-tight text-destructive">
            明确禁止
          </h2>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {COMMUNITY_RULES_PROHIBITED.map((item) => (
              <li key={item} className="pl-3 border-l-2 border-destructive/35">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {toc.length > 0 ? (
        <nav
          aria-label="社区规则目录"
          className="space-y-2 border-y border-border/70 py-4"
        >
          <p className="text-sm font-semibold tracking-tight">目录</p>
          <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
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
