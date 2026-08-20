"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  approveProfileReviewAction,
  rejectProfileReviewAction,
} from "@/lib/admin/actions";
import { type AdminActionState } from "@/lib/admin/state";
import { type AdminProfileReviewItem } from "@/types/admin";
import { EmptyState } from "@/components/common/EmptyState";
import { TagBadge } from "@/components/common/TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTENT_RISK_LABELS } from "@/constants/moderation";
import { getStudentGradeLabel } from "@/constants/profileOptions";

const initialState: AdminActionState = {};

function riskBadgeClass(level: AdminProfileReviewItem["riskLevel"]) {
  if (level === "high") return "bg-destructive/10 text-destructive";
  if (level === "medium") return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}

function ReviewRow({ item }: { item: AdminProfileReviewItem }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveProfileReviewAction,
    initialState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectProfileReviewAction,
    initialState,
  );

  return (
    <tr className="border-b align-top">
      <td className="px-3 py-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
            {item.avatarUrl ? (
              <Image
                src={item.avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.nickname || "（未填昵称）"}</p>
              <TagBadge
                label={CONTENT_RISK_LABELS[item.riskLevel]}
                className={riskBadgeClass(item.riskLevel)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {item.grade ? getStudentGradeLabel(item.grade) : "—"}
              {item.major ? ` · ${item.major}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              最近更新：{new Date(item.updatedAt).toLocaleString("zh-HK")}
            </p>
            <p className="text-xs text-muted-foreground">ID: {item.id}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        <form action={approveAction} className="mb-4 space-y-2">
          <input type="hidden" name="userId" value={item.id} />
          <Input
            name="reason"
            placeholder="审核理由（必填，将写入操作记录）"
            className="h-8 text-sm"
            required
            maxLength={500}
          />
          <Button type="submit" size="sm" disabled={approvePending}>
            {approvePending ? "处理中..." : "通过审核"}
          </Button>
          {approveState.error ? (
            <p className="mt-1 text-xs text-destructive">{approveState.error}</p>
          ) : null}
          {approveState.success ? (
            <p className="mt-1 text-xs text-green-700">{approveState.success}</p>
          ) : null}
        </form>
        <form action={rejectAction} className="space-y-2">
          <input type="hidden" name="userId" value={item.id} />
          <Input
            name="reason"
            placeholder="驳回理由（必填，将通知用户并写入操作记录）"
            className="h-8 text-sm"
            required
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={rejectPending}
          >
            {rejectPending ? "处理中..." : "驳回并重置"}
          </Button>
          {rejectState.error ? (
            <p className="text-xs text-destructive">{rejectState.error}</p>
          ) : null}
          {rejectState.success ? (
            <p className="text-xs text-green-700">{rejectState.success}</p>
          ) : null}
        </form>
      </td>
    </tr>
  );
}

function ReviewSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: AdminProfileReviewItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left">
          <thead className="bg-muted/50 text-sm">
            <tr>
              <th className="px-3 py-2 font-medium">当前昵称与头像</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ReviewRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProfileReviewTable({
  items,
}: {
  items: AdminProfileReviewItem[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="暂无待审核资料"
        description="用户更新昵称或头像后会进入此队列；一次审核同时覆盖头像与昵称。"
      />
    );
  }

  const highItems = items.filter((item) => item.riskLevel === "high");
  const mediumItems = items.filter((item) => item.riskLevel === "medium");
  const otherItems = items.filter(
    (item) => item.riskLevel !== "high" && item.riskLevel !== "medium",
  );

  return (
    <div className="space-y-8">
      <ReviewSection
        title="高风险"
        description="优先处理；前台已展示最新资料，请确认无问题或驳回重置。"
        items={highItems}
      />
      <ReviewSection
        title="中风险"
        description="已公开展示，请确认无问题或驳回重置。"
        items={mediumItems}
      />
      <ReviewSection
        title="其他"
        description="其余待复核记录。"
        items={otherItems}
      />
    </div>
  );
}
