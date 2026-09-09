import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils/cn';

interface MarkdownProps {
  children: string;
  className?: string;
}

// Dark-theme prose, pinned to the redesign type scale:
// headings → title role, paragraphs/lists → body, code → mono on bg-elevated.
const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h3 className="text-lg font-extrabold text-text-primary mt-[18px] first:mt-0 mb-[7px]">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="text-lg font-extrabold text-text-primary mt-[18px] first:mt-0 mb-[7px]">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-lg font-extrabold text-text-primary mt-[18px] first:mt-0 mb-[7px]">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="text-sm font-bold uppercase tracking-[0.06em] text-text-tertiary mt-[18px] first:mt-0 mb-[7px]">
      {children}
    </h5>
  ),
  p: ({ children }) => (
    <p className="text-sm text-text-secondary leading-[1.65] max-w-[68ch] mb-2">{children}</p>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-[3px]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-[3px]">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-text-secondary leading-[1.6]">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-blue underline">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-bold text-text-primary">{children}</strong>,
  code: ({ children, className: cls }) => {
    // fenced block → has a language- className; inline → doesn't
    const isBlock = /language-/.test(cls ?? '');
    if (isBlock) {
      return <code className="font-mono text-[0.8125rem] text-text-secondary">{children}</code>;
    }
    return (
      <code className="font-mono text-[0.8125rem] bg-bg-elevated px-1.5 py-px rounded text-[#22D3EE]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-bg-elevated rounded-lg p-3 overflow-x-auto mb-2 text-sm">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border-subtle pl-3 text-text-tertiary italic mb-2">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-default px-[11px] py-[5px] bg-bg-elevated text-text-tertiary text-xs font-semibold uppercase tracking-[0.06em] text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border-default px-[11px] py-[5px] text-text-secondary">{children}</td>
  ),
  hr: () => <hr className="border-border-default my-4" />,
};

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn('break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
