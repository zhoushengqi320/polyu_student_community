"use client";

import Link from "next/link";
import { CommunityRulesDialog } from "@/components/legal/CommunityRulesDialog";
import { ROUTES } from "@/constants/routes";

type AuthLegalFooterProps = {
  prefix: string;
};

export function AuthLegalFooter({ prefix }: AuthLegalFooterProps) {
  return (
    <p className="text-center text-xs text-muted-foreground">
      {prefix}
      <CommunityRulesDialog
        triggerLabel="社区规则"
        triggerClassName="mx-1"
      />
      、
      <Link
        href={ROUTES.about.terms}
        target="_blank"
        rel="noreferrer"
        className="mx-1 underline underline-offset-2 hover:text-foreground"
      >
        使用条款
      </Link>
      与
      <Link
        href={ROUTES.about.privacy}
        target="_blank"
        rel="noreferrer"
        className="mx-1 underline underline-offset-2 hover:text-foreground"
      >
        私隐政策
      </Link>
      。
    </p>
  );
}
