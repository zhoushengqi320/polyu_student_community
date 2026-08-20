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

type HomeProductTourProps = {
  enabled: boolean;
};

function getTooltipStyle(rect: DOMRect): CSSProperties {
  const margin = 16;
  const width = Math.min(400, window.innerWidth - margin * 2);
  const left = Math.max(
    margin,
    Math.min(rect.left, window.innerWidth - width - margin),
  );
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeBelow = spaceBelow >= 180 || spaceBelow >= rect.top;

  if (placeBelow) {
    return {
      top: rect.bottom + margin,
      left,
      width,
    };
  }

  return {
    bottom: window.innerHeight - rect.top + margin,
    left,
    width,
  };
}

export function HomeProductTour({ enabled }: HomeProductTourProps) {
  const [active, setActive] = useState(enabled);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [spotlightReady, setSpotlightReady] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const stepTokenRef = useRef(0);

  const step = HOME_TOUR_STEPS[stepIndex];
  const isLast = stepIndex === HOME_TOUR_STEPS.length - 1;
  const wantsTarget = Boolean(step?.target);
  const isCenterStep = !wantsTarget || (spotlightReady && !targetRect);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActive(enabled);
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
      setTargetRect(null);
      return;
    }

    element.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "nearest",
    });

    const applyRect = () => {
      if (token !== stepTokenRef.current) {
        return;
      }
      setTargetRect(element.getBoundingClientRect());
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
    setIsCompleting(true);
    const result = await completeHomeTourAction();
    setIsCompleting(false);
    if (!result.error) {
      setActive(false);
    }
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
  const showPanel = spotlightReady || isCenterStep;

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
                disabled={isCompleting || !spotlightReady}
                className="min-w-[7.5rem]"
              >
                {isLast ? "Let's gooo" : "我知道了"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
