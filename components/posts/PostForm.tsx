"use client";

import { useActionState } from "react";
import { FORUM_CATEGORIES } from "@/constants/categories";
import { createPostAction, type PostFormState } from "@/lib/forum/actions";
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

const initialState: PostFormState = {};

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>发布帖子</CardTitle>
        <CardDescription>分享你的学习经验、校园生活或求助问题</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">分类</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue="general"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {FORUM_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.categoryId ? (
              <p className="text-sm text-destructive">{state.fieldErrors.categoryId}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              name="title"
              placeholder="输入帖子标题"
              maxLength={120}
              required
            />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              id="content"
              name="content"
              rows={8}
              placeholder="写下你想分享的内容..."
              required
              className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {state.fieldErrors?.content ? (
              <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "发布中..." : "发布帖子"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
