type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    elements.push(
      <ul key={`list-${elements.length}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item) => (
          <li key={item}>{item}</li>
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

    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-2xl font-semibold">
          {trimmed.replace(/^#\s+/, "")}
        </h1>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold">
          {trimmed.replace(/^##\s+/, "")}
        </h2>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.replace(/^-\s+/, ""));
      continue;
    }

    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="leading-7">
        {trimmed}
      </p>,
    );
  }

  flushList();

  return <div className="space-y-4 text-sm md:text-base">{elements}</div>;
}
