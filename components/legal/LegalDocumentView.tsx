import { type ReactNode } from "react";

type LegalDocumentViewProps = {
  content: string;
};

function isSectionHeading(line: string) {
  return /^\d+\.\s+\S/.test(line) && !/^\d+\.\d+/.test(line);
}

function isSubSectionHeading(line: string) {
  return /^\d+\.\d+(?:\.\d+)?\s+\S/.test(line);
}

function isBullet(line: string) {
  return /^[-•]\s+\S/.test(line);
}

export function LegalDocumentView({ content }: LegalDocumentViewProps) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let startedBody = false;

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="ml-4 list-disc space-y-1.5 border-l border-border/60 pl-5 text-[0.95em] leading-7 md:ml-6"
      >
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (!startedBody) {
      if (isSectionHeading(trimmed)) {
        startedBody = true;
      } else {
        flushList();
        elements.push(
          <p
            key={`lead-${elements.length}`}
            className="text-sm leading-7 text-muted-foreground md:text-base"
          >
            {trimmed}
          </p>,
        );
        continue;
      }
    }

    if (isBullet(trimmed)) {
      listItems.push(trimmed.replace(/^[-•]\s+/, ""));
      continue;
    }

    flushList();

    if (isSectionHeading(trimmed)) {
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="mt-8 border-b border-border/70 pb-2 text-lg font-semibold tracking-tight first:mt-2 md:text-xl"
        >
          {trimmed}
        </h2>,
      );
      continue;
    }

    if (isSubSectionHeading(trimmed)) {
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="mt-4 pl-0 text-sm font-semibold leading-7 tracking-tight md:pl-1 md:text-base"
        >
          {trimmed}
        </h3>,
      );
      continue;
    }

    elements.push(
      <p
        key={`p-${elements.length}`}
        className="pl-0 leading-7 text-foreground/90 md:pl-1"
      >
        {trimmed}
      </p>,
    );
  }

  flushList();

  return (
    <article className="mx-auto max-w-3xl space-y-1 text-sm md:text-base">
      {elements}
    </article>
  );
}
