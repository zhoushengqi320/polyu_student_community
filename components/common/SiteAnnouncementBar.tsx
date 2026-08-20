"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_IMPORTANCE,
  HOME_ANNOUNCEMENT_MAX_HEIGHT,
} from "@/constants/announcements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { type SiteAnnouncement } from "@/types/announcement";

type SiteAnnouncementBarProps = {
  announcements: SiteAnnouncement[];
};

const IMPORTANCE_STYLES = {
  normal: {
    container: "border-primary/25 bg-primary/5 hover:bg-primary/10",
    badge: "bg-primary/10 text-primary",
    icon: "text-primary",
    title: "text-foreground",
    link: "text-primary hover:text-primary/80",
  },
  important: {
    container: "border-destructive/40 bg-destructive/5 hover:bg-destructive/10",
    badge: "bg-destructive/10 text-destructive",
    icon: "text-destructive",
    title: "text-destructive",
    link: "text-destructive hover:text-destructive/80",
  },
} as const;

export function SiteAnnouncementBar({ announcements }: SiteAnnouncementBarProps) {
  const [activeAnnouncement, setActiveAnnouncement] =
    useState<SiteAnnouncement | null>(null);

  if (announcements.length === 0) {
    return null;
  }

  const activeStyles = activeAnnouncement
    ? IMPORTANCE_STYLES[activeAnnouncement.importance] ?? IMPORTANCE_STYLES.normal
    : null;

  return (
    <>
      <div
        aria-label="平台公告"
        className={cn(
          "max-w-2xl space-y-2 overflow-y-auto overscroll-y-contain pr-1",
          HOME_ANNOUNCEMENT_MAX_HEIGHT,
        )}
      >
        {announcements.map((announcement) => {
          const styles =
            IMPORTANCE_STYLES[announcement.importance] ?? IMPORTANCE_STYLES.normal;
          const categoryLabel =
            ANNOUNCEMENT_CATEGORIES[announcement.category] ?? "平台通知";

          return (
            <button
              key={announcement.id}
              type="button"
              onClick={() => setActiveAnnouncement(announcement)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-left transition-colors md:px-4 md:py-3",
                styles.container,
              )}
            >
              <div className="flex items-start gap-3">
                <Megaphone className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        styles.badge,
                      )}
                    >
                      {categoryLabel}
                    </span>
                    {announcement.importance === "important" ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                        {ANNOUNCEMENT_IMPORTANCE.important}
                      </span>
                    ) : null}
                    {announcement.isPinned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Pin className="h-3 w-3" />
                        置顶
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold leading-snug md:text-[15px]",
                      styles.title,
                    )}
                  >
                    {announcement.title}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={Boolean(activeAnnouncement)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAnnouncement(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {activeAnnouncement && activeStyles ? (
            <>
              <DialogHeader>
                <DialogTitle className={activeStyles.title}>
                  {activeAnnouncement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                      activeStyles.badge,
                    )}
                  >
                    {ANNOUNCEMENT_CATEGORIES[activeAnnouncement.category] ?? "平台通知"}
                  </span>
                  {activeAnnouncement.importance === "important" ? (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      {ANNOUNCEMENT_IMPORTANCE.important}
                    </span>
                  ) : null}
                  {activeAnnouncement.isPinned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Pin className="h-3 w-3" />
                      置顶
                    </span>
                  ) : null}
                </div>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {activeAnnouncement.body}
                </p>
                {activeAnnouncement.linkUrl ? (
                  <Link
                    href={activeAnnouncement.linkUrl}
                    className={cn(
                      "inline-flex font-medium underline-offset-4 hover:underline",
                      activeStyles.link,
                    )}
                    target={
                      activeAnnouncement.linkUrl.startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      activeAnnouncement.linkUrl.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {activeAnnouncement.linkLabel ?? "查看详情"}
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
