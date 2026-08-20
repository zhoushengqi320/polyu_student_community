"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
const SCROLL_SETTLE_MS = 380;

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const step = HOME_TOUR_STEPS[stepIndex];
  const isLast = stepIndex === HOME_TOUR_STEPS.length - 1;
  const isCenterStep = !step?.target;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActive(enabled);
  }, [enabled]);

  const measureTarget = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!element) {
      setTargetRect(null);
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    const updateRect = () => setTargetRect(element.getBoundingClientRect());

    const timer = window.setTimeout(updateRect, SCROLL_SETTLE_MS);
    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step?.target]);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    return measureTarget();
  }, [active, stepIndex, measureTarget]);

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

  const handleNext = async () => {
    if (isLast) {
      setIsCompleting(true);
      const result = await completeHomeTourAction();
      setIsCompleting(false);
      if (!result.error) {
        setActive(false);
      }
      return;
    }

    setStepIndex((current) => current + 1);
  };

  if (!mounted || !active || !step) {
    return null;
  }

  const tooltipStyle =
    !isCenterStep && targetRect ? getTooltipStyle(targetRect) : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-tour-title"
      aria-describedby="home-tour-description"
    >
      <div className="absolute inset-0 pointer-events-auto" aria-hidden="true" />

      {isCenterStep ? (
        <div
          className="absolute inset-0 bg-black/75 transition-opacity duration-300"
          aria-hidden="true"
        />
      ) : targetRect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary/90 transition-all duration-300 ease-out"
          style={{
            top: targetRect.top - SPOTLIGHT_PADDING,
            left: targetRect.left - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
            zIndex: TOUR_Z_OVERLAY,
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-black/75"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "absolute",
          isCenterStep
            ? "inset-0 flex items-center justify-center p-4"
            : "pointer-events-none",
        )}
        style={{ zIndex: TOUR_Z_PANEL }}
      >
        <div
          className={cn(
            "pointer-events-auto rounded-xl border border-border/80 bg-background p-6 shadow-2xl",
            isCenterStep ? "w-full max-w-md" : "fixed",
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
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={handleNext}
              disabled={isCompleting}
              className="min-w-[7.5rem]"
            >
              {isLast ? "Let's gooo" : "我知道了"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
