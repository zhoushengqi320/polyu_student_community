"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { TagBadge } from "@/components/common/TagBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ARCHIVE_APPEAL_STATUS_LABELS,
  type ArchiveAppealStatus,
} from "@/constants/moderation";
import { CONTENT_STATUS_LABELS, type ContentStatus } from "@/constants/contentStatus";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPE_LABELS } from "@/constants/admin";
import {
  requestArchiveAppealAction,
  type ArchiveAppealActionState,
} from "@/lib/moderation/actions";
import { type ProfileWorkItem } from "@/lib/db/profileWorks";
import { formatDate, formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";

type ProfileWorksSectionProps = {
  works: ProfileWorkItem[];
};

type WorksFilter = "all" | "restricted";

const appealInitialState: ArchiveAppealActionState = {};

function AppealForm({ work }: { work: ProfileWorkItem }) {
  const [state, formAction, pending] = useActionState(
    requestArchiveAppealAction,
    appealInitialState,
  );

  if (!work.archive?.canAppeal) {
    return null;
  }

  return (
    <form action={formAction} className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      <input type="hidden" name="targetType" value={work.targetType} />
      <input type="hidden" name="targetId" value={work.id} />
      <p className="text-xs text-muted-foreground">
        申诉截止：{formatDate(work.archive.appealDeadline)}。提交后将进行审核，通过后会恢复展示。
      </p>
      <textarea
        name="appealNote"
        required
        minLength={5}
        maxLength={1000}
        rows={3}
        placeholder="请说明申诉理由（至少 5 字）…"
        className="flex min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "提交中…" : "提交申诉"}
        </Button>
        {state.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-xs text-green-600">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}

function WorkRow({ work }: { work: ProfileWorkItem }) {
  const statusLabel =
    CONTENT_STATUS_LABELS[work.status as ContentStatus] ?? work.status;
  const typeLabel = TARGET_TYPE_LABELS[work.targetType] ?? "内容";
  const appealStatus = work.archive?.appealStatus as
    | ArchiveAppealStatus
    | undefined;

  const href =
    work.targetType === "post" && !work.isRestricted
      ? ROUTES.forum.detail(work.id)
      : null;

  const body = (
    <div className="space-y-2 rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{work.title}</p>
          {work.excerpt ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {work.excerpt}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TagBadge label={typeLabel} />
            {work.isRestricted ? (
              <TagBadge label="封禁中" className="bg-amber-100 text-amber-900" />
            ) : (
              <TagBadge label={statusLabel} />
            )}
            {appealStatus ? (
              <TagBadge
                label={ARCHIVE_APPEAL_STATUS_LABELS[appealStatus]}
                className={
                  appealStatus === "pending"
                    ? "bg-blue-100 text-blue-800"
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(work.createdAt)}
        </p>
      </div>
      <AppealForm work={work} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false} className="block transition-colors hover:bg-muted/20">
        {body}
      </Link>
    );
  }

  return body;
}

export function ProfileWorksSection({ works }: ProfileWorksSectionProps) {
  const [filter, setFilter] = useState<WorksFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "restricted") {
      return works.filter((item) => item.isRestricted);
    }
    return works;
  }, [filter, works]);

  const restrictedCount = works.filter((item) => item.isRestricted).length;

  return (
    <Card id="works" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>我的作品</CardTitle>
        <CardDescription>
          仅自己可见。封禁中的内容可在申诉期内提交理由，审核通过后可恢复展示。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: `全部（${works.length}）` },
              {
                id: "restricted" as const,
                label: `封禁中（${restrictedCount}）`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filter === "restricted" ? "没有封禁中的作品" : "还没有作品"}
            description={
              filter === "restricted"
                ? "被隐藏或封存的帖子会显示在这里。"
                : "去自由讨论区发帖后会显示在这里。"
            }
            action={
              filter === "all" ? (
                <Link
                  href={ROUTES.forum.new}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  去发帖
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((work) => (
              <WorkRow key={`${work.targetType}:${work.id}`} work={work} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
