"use client";

import { useActionState, useState } from "react";
import {
  createFeedbackPostAction,
  type FeedbackFormState,
} from "@/lib/feedback/actions";
import {
  FormImageAttachments,
  type FormImageUploadItem,
} from "@/components/common/FormImageAttachments";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: FeedbackFormState = {};

export function FeedbackPostForm() {
  const [state, formAction, pending] = useActionState(
    createFeedbackPostAction,
    initialState,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploads, setUploads] = useState<FormImageUploadItem[]>([]);

  return (
    <>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>提交问题反馈</CardTitle>
          <CardDescription>
            请简明描述遇到的问题或建议，我们会在反馈下方回复。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                name="title"
                maxLength={100}
                placeholder="例如：无法上传头像"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              {state.fieldErrors?.title ? (
                <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">问题描述</Label>
              <textarea
                id="content"
                name="content"
                rows={8}
                maxLength={5000}
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="请说明发生了什么、在哪个页面、期望如何改进…"
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {state.fieldErrors?.content ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.content}
                </p>
              ) : null}
            </div>
            <FormImageAttachments
              module="feedback"
              uploads={uploads}
              onChange={setUploads}
              disabled={pending}
            />
            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "提交中..." : "提交反馈"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <PendingOverlay active={pending} label="提交中…" />
    </>
  );
}
