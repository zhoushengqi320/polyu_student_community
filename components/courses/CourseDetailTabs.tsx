"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CourseDetailTabId = "overview" | "assessment" | "reviews";

type CourseDetailTab = {
  id: CourseDetailTabId;
  label: string;
  content: ReactNode;
};

type CourseDetailTabsProps = {
  tabs: CourseDetailTab[];
};

export function CourseDetailTabs({ tabs }: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CourseDetailTabId>(tabs[0]?.id ?? "overview");

  return (
    <div className="space-y-4">
      <div
        className="flex gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-1"
        role="tablist"
        aria-label="Course detail sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`course-tab-panel-${tab.id}`}
              id={`course-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "min-w-max rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`course-tab-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`course-tab-${tab.id}`}
          hidden={tab.id !== activeTab}
        >
          {tab.id === activeTab ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
