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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStudentGradeLabel } from "@/constants/profileOptions";

const initialState: AdminActionState = {};

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
          <div className="space-y-1">
            <p className="font-medium">{item.nickname || "（未填昵称）"}</p>
            <p className="text-xs text-muted-foreground">
              {item.grade ? getStudentGradeLabel(item.grade) : "—"}
              {item.major ? ` · ${item.major}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">ID: {item.id}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        <form action={approveAction} className="mb-2">
          <input type="hidden" name="userId" value={item.id} />
          <Button type="submit" size="sm" disabled={approvePending}>
            {approvePending ? "处理中..." : "通过"}
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
            placeholder="驳回理由（可选）"
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={rejectPending}
          >
            {rejectPending ? "处理中..." : "驳回"}
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

export function ProfileReviewTable({
  items,
}: {
  items: AdminProfileReviewItem[];
}) {
  if (items.length === 0) {
    return <EmptyState title="暂无待审核资料" description="用户提交昵称或头像后会出现在这里。" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-left">
        <thead className="bg-muted/50 text-sm">
          <tr>
            <th className="px-3 py-2 font-medium">待审资料</th>
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
  );
}
