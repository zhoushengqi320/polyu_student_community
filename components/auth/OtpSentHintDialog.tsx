"use client";

import { OTP_SPAM_HINT } from "@/constants/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OtpSentHintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** 发送验证码成功后的提示小窗（不在表单上常驻展示） */
export function OtpSentHintDialog({
  open,
  onOpenChange,
}: OtpSentHintDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base leading-6 font-medium">
            {OTP_SPAM_HINT}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
