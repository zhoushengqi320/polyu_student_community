"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteState = { error?: string };

type DeleteContentButtonProps = {
  action: (
    prevState: DeleteState,
    formData: FormData,
  ) => Promise<DeleteState>;
  title: string;
  description: string;
  label?: string;
};

export function DeleteContentButton({
  action,
  title,
  description,
  label = "删除",
}: DeleteContentButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
