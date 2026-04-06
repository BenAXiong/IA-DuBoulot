"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

type StudentMessageContentProps = {
  content: string;
};

function normalizeMarkdown(content: string) {
  return content.replace(/\n/g, "  \n");
}

export function StudentMessageContent({
  content,
}: StudentMessageContentProps) {
  return (
    <div className="student-markdown">
      <ReactMarkdown
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkMath]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc pl-6 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal pl-6 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[color:var(--foreground)]">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2 text-[0.92em] leading-6">
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-1.5 py-0.5 text-[0.92em]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <div className="mb-4 last:mb-0">{children}</div>,
          a: ({ children, href }) => (
            <a
              className="underline decoration-[color:var(--line-strong)] underline-offset-4 transition hover:text-[color:var(--ink-soft)]"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-[color:var(--line-strong)] pl-4 text-[color:var(--ink-soft)] last:mb-0">
              {children}
            </blockquote>
          ),
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
