import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  const normalizedContent = content.replace(/<br\s*\/?>/gi, "  \n").replace(/\n/g, "  \n");

  return (
    <div className={`assistant-markdown ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ node, ...props }) => <p className="m-0 mb-2.5 last:mb-0 break-words" {...props} />,
          h1: ({ node, ...props }) => (
            <h1 className="text-[1.35em] font-semibold mt-4 mb-2 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-[1.18em] font-semibold mt-4 mb-2 tracking-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-[1.05em] font-semibold mt-4 mb-2 tracking-tight" {...props} />
          ),
          h4: ({ node, ...props }) => <h4 className="text-[1em] font-semibold mt-3 mb-2" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-[0.95em] font-semibold mt-3 mb-2" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-[0.9em] font-semibold mt-3 mb-2" {...props} />,

          a: ({ node, ...props }) => (
            <a
              className="text-[var(--pv-primary-500)] underline hover:text-[var(--pv-primary-600)] active:text-[var(--pv-primary-700)]"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          ul: ({ node, ...props }) => <ul className="!my-0 ml-5 list-disc whitespace-normal" {...props} />,
          ol: ({ node, ...props }) => <ol className="!my-0 ml-5 list-decimal whitespace-normal" {...props} />,
          li: ({ node, ...props }) => <li className="!my-0 leading-[1.7]" {...props} />,

          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-[var(--pv-primary-50)] text-[var(--pv-primary-500)] px-1.5 py-0.5 rounded text-[0.88em] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-[0.85em]" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre
              className="bg-[var(--pv-neutral-grey-50)] border border-[var(--pv-neutral-grey-200)] rounded-lg p-3.5 my-2.5 overflow-x-auto text-sm leading-[1.5]"
              {...props}
            />
          ),

          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-[3px] border-[var(--pv-primary-500)] pl-3.5 my-2.5 text-[var(--pv-text-secondary-text)] italic"
              {...props}
            />
          ),

          hr: ({ node, ...props }) => (
            <hr className="border-none border-t border-[var(--pv-neutral-grey-200)] my-2" {...props} />
          ),

          table: ({ node, ...props }) => (
            <div className="my-2.5 w-full overflow-x-auto rounded-lg border border-pv-neutral-grey-200">
              <table className="w-full min-w-full m-0 border-none border-separate border-spacing-0" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr {...props} />,
          th: ({ node, ...props }) => (
            <th
              className="bg-pv-neutral-grey-50 text-pv-text-primary-text font-semibold text-[11px] uppercase tracking-wide text-left px-3.5 py-2.5 whitespace-nowrap border-b border-pv-neutral-grey-200 [&:not(:last-child)]:border-r"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="bg-white text-left px-3.5 py-2.5 text-[13px] whitespace-nowrap [&:not(:last-child)]:border-r border-pv-neutral-grey-200 [tr:not(:last-child)_&]:border-b"
              {...props}
            />
          ),

          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-[var(--pv-text-primary-text)]" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          del: ({ node, ...props }) => <del className="line-through text-[var(--pv-text-secondary-text)]" {...props} />,

          img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-lg my-2" loading="lazy" {...props} />,

          dl: ({ node, ...props }) => <dl className="my-2" {...props} />,
          dt: ({ node, ...props }) => <dt className="font-semibold mt-2" {...props} />,
          dd: ({ node, ...props }) => <dd className="ml-4 mb-1" {...props} />,

          sup: ({ node, ...props }) => <sup className="text-xs" {...props} />,
          sub: ({ node, ...props }) => <sub className="text-xs" {...props} />,
          abbr: ({ node, ...props }) => <abbr className="cursor-help border-b border-dotted" {...props} />,
          kbd: ({ node, ...props }) => (
            <kbd
              className="bg-[var(--pv-neutral-grey-100)] border border-[var(--pv-neutral-grey-300)] rounded px-1.5 py-0.5 text-xs font-mono"
              {...props}
            />
          ),
          mark: ({ node, ...props }) => <mark className="bg-[var(--pv-warning-background)] px-0.5 rounded" {...props} />
        }}
      >
        {normalizedContent}
      </Markdown>
    </div>
  );
}
