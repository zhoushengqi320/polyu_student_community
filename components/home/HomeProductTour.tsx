"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { HOME_TOUR_STEPS } from "@/constants/homeTour";
import { completeHomeTourAction } from "@/lib/profile/homeTourActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const SPOTLIGHT_PADDING = 8;
const TOUR_Z_OVERLAY = 200;
const TOUR_Z_PANEL = 201;
const TOOLTIP_ESTIMATED_HEIGHT = 240;
const VIEWPORT_MARGIN = 16;

type HomeProductTourProps = {
  enabled: boolean;
};

function isRectMostlyVisible(rect: DOMRect): boolean {
  const visibleTop = Math.max(rect.top, VIEWPORT_MARGIN);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight - VIEWPORT_MARGIN);
  const visibleLeft = Math.max(rect.left, VIEWPORT_MARGIN);
  const visibleRight = Math.min(rect.right, window.innerWidth - VIEWPORT_MARGIN);

  if (visibleBottom <= visibleTop || visibleRight <= visibleLeft) {
    return false;
  }

  const visibleArea =
    (visibleBottom - visibleTop) * (visibleRight - visibleLeft);
  const totalArea = Math.max(rect.width, 1) * Math.max(rect.height, 1);

  return visibleArea / totalArea >= 0.35;
}

function getTooltipStyle(rect: DOMRect): CSSProperties {
  const width = Math.min(400, window.innerWidth - VIEWPORT_MARGIN * 2);
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeBelow =
    spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT || spaceBelow >= rect.top;

  if (placeBelow) {
    const top = Math.min(
      rect.bottom + VIEWPORT_MARGIN,
      window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - VIEWPORT_MARGIN,
    );
    return { top: Math.max(VIEWPORT_MARGIN, top), left, width };
  }

  const bottom = Math.min(
    window.innerHeight - rect.top + VIEWPORT_MARGIN,
    window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - VIEWPORT_MARGIN,
  );

  return {
    bottom: Math.max(VIEWPORT_MARGIN, bottom),
    left,
    width,
  };
}

function scrollTargetIntoView(element: HTMLElement) {
  const previousOverflow = document.body.style.overflow;
  // 引导会锁 body 滚动；先临时解锁，否则底部锚点 scrollIntoView 无效
  document.body.style.overflow = "";
  element.scrollIntoView({
    behavior: "auto",
    block: "center",
    inline: "nearest",
  });
  document.body.style.overflow = previousOverflow || "hidden";
}

export function HomeProductTour({ enabled }: HomeProductTourProps) {
  const [active, setActive] = useState(enabled);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [spotlightReady, setSpotlightReady] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const stepTokenRef = useRef(0);
  const dismissedRef = useRef(false);

  const step = HOME_TOUR_STEPS[stepIndex];
  const isLast = stepIndex === HOME_TOUR_STEPS.length - 1;
  const wantsTarget = Boolean(step?.target);
  const useCenterLayout =
    !wantsTarget || (spotlightReady && targetRect === null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (enabled && !dismissedRef.current) {
      setActive(true);
    }
    if (!enabled) {
      dismissedRef.current = false;
    }
  }, [enabled]);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }

    const token = ++stepTokenRef.current;
    setSpotlightReady(false);
    setTargetRect(null);

    if (!step?.target) {
      setSpotlightReady(true);
      return;
    }

    const element = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!element) {
      // 目标缺失时退回居中说明，避免黑屏锁死
      setSpotlightReady(true);
      return;
    }

    scrollTargetIntoView(element);

    const applyRect = () => {
      if (token !== stepTokenRef.current) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (!isRectMostlyVisible(rect)) {
        // 目标仍在视口外时改用居中弹窗，避免按钮被定位到屏幕外
        setTargetRect(null);
        setSpotlightReady(true);
        return;
      }

      setTargetRect(rect);
      setSpotlightReady(true);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(applyRect);
    });
  }, [active, stepIndex, step?.target]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  const finishTour = async () => {
    setFinishError(null);
    setIsCompleting(true);
    const result = await completeHomeTourAction();
    setIsCompleting(false);

    if (result.error) {
      setFinishError(result.error);
      return;
    }

    dismissedRef.current = true;
    setActive(false);
  };

  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void finishTour();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only bind while tour active
  }, [active]);

  const handleNext = async () => {
    setFinishError(null);
    if (isLast) {
      await finishTour();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  if (!mounted || !active || !step) {
    return null;
  }

  const showTargetSpotlight =
    wantsTarget && spotlightReady && targetRect !== null;
  const tooltipStyle =
    showTargetSpotlight && targetRect ? getTooltipStyle(targetRect) : undefined;
  const showPanel = spotlightReady || useCenterLayout;
  const nextDisabled = isCompleting || (wantsTarget && !spotlightReady);

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-tour-title"
      aria-describedby="home-tour-description"
    >
      <div className="absolute inset-0 pointer-events-auto" aria-hidden="true" />

      {showTargetSpotlight ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary/90"
          style={{
            top: targetRect!.top - SPOTLIGHT_PADDING,
            left: targetRect!.left - SPOTLIGHT_PADDING,
            width: targetRect!.width + SPOTLIGHT_PADDING * 2,
            height: targetRect!.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
            zIndex: TOUR_Z_OVERLAY,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-black/75" aria-hidden="true" />
      )}

      <div
        className={cn(
          "absolute",
          showTargetSpotlight
            ? "pointer-events-none"
            : "inset-0 flex items-center justify-center p-4",
        )}
        style={{ zIndex: TOUR_Z_PANEL }}
      >
        {showPanel ? (
          <div
            className={cn(
              "pointer-events-auto rounded-xl border border-border/80 bg-background p-6 shadow-2xl",
              showTargetSpotlight ? "fixed" : "w-full max-w-md",
            )}
            style={tooltipStyle}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {stepIndex + 1} / {HOME_TOUR_STEPS.length}
            </p>
            <h2
              id="home-tour-title"
              className="mt-2 text-lg font-semibold tracking-tight"
            >
              {step.title}
            </h2>
            <p
              id="home-tour-description"
              className="mt-2 text-sm leading-relaxed text-muted-foreground"
            >
              {step.description}
            </p>
            {finishError ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {finishError}
              </p>
            ) : null}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void finishTour()}
                disabled={isCompleting}
              >
                跳过
              </Button>
              <Button
                type="button"
                onClick={() => void handleNext()}
                disabled={nextDisabled}
                className="min-w-[7.5rem]"
              >
                {isCompleting && isLast
                  ? "保存中…"
                  : isLast
                    ? "Let's gooo"
                    : "我知道了"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
