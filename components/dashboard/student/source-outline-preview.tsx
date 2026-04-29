"use client";

type SourceOutlinePreviewProps = {
  outline: string | null;
  unavailableLabel: string;
  maxItems?: number;
  compact?: boolean;
};

type OutlineItem = {
  title: string;
  pageLabel: string | null;
};

function cleanOutlineLine(line: string) {
  return line
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function extractPageLabel(line: string) {
  const pageMatch =
    line.match(/\bpages?\s+(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?/i) ??
    line.match(/\bp\.\s*(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?/i);

  if (!pageMatch) {
    return null;
  }

  return pageMatch[2] ? `p.${pageMatch[1]}-${pageMatch[2]}` : `p.${pageMatch[1]}`;
}

function stripPageOnlyPrefix(line: string) {
  return line
    .replace(
      /^(?:pages?|p\.)\s+\d{1,3}(?:\s*[-\u2013]\s*\d{1,3})?\s*[:.-]\s*/i,
      "",
    )
    .trim();
}

function stripPageSuffix(line: string) {
  return line
    .replace(
      /\s*(?:[-:]\s*)?(?:\(|\[)?(?:pages?|p\.)\s+\d{1,3}(?:\s*[-\u2013]\s*\d{1,3})?(?:\)|\])?\s*$/i,
      "",
    )
    .trim();
}

function parseOutline(outline: string | null, maxItems: number) {
  if (!outline) {
    return [];
  }

  const seen = new Set<string>();
  const items: OutlineItem[] = [];

  for (const rawLine of outline.split("\n")) {
    const cleaned = cleanOutlineLine(rawLine);

    if (!cleaned) {
      continue;
    }

    const pageLabel = extractPageLabel(cleaned);
    const withoutPagePrefix = stripPageOnlyPrefix(cleaned);
    const title = stripPageSuffix(withoutPagePrefix);
    const isPageOnly = /^(?:pages?|p\.)\s+\d{1,3}(?:\s*[-\u2013]\s*\d{1,3})?$/i.test(
      cleaned,
    );

    if (isPageOnly || title.length < 3) {
      continue;
    }

    const key = `${title.toLocaleLowerCase()}|${pageLabel ?? ""}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      title: title.length > 150 ? `${title.slice(0, 147)}...` : title,
      pageLabel,
    });

    if (items.length >= maxItems) {
      break;
    }
  }

  return items;
}

export function SourceOutlinePreview({
  outline,
  unavailableLabel,
  maxItems = 8,
  compact = false,
}: SourceOutlinePreviewProps) {
  const items = parseOutline(outline, maxItems);

  if (items.length === 0) {
    return (
      <p className="text-sm leading-5 text-[color:var(--foreground)]">
        {unavailableLabel}
      </p>
    );
  }

  return (
    <ul className={`grid ${compact ? "gap-1" : "gap-1.5"}`}>
      {items.map((item) => (
        <li
          className="flex min-w-0 items-start justify-between gap-2 text-sm leading-5"
          key={`${item.title}-${item.pageLabel ?? "no-page"}`}
        >
          <span className="min-w-0 flex-1 text-[color:var(--foreground)]">
            {item.title}
          </span>
          {item.pageLabel ? (
            <span className="shrink-0 rounded-full border border-[color:var(--line)] px-1.5 py-0.5 text-[0.68rem] font-medium text-[color:var(--ink-soft)]">
              {item.pageLabel}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
