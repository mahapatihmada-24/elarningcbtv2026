import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Pre-process content: if content has \frac{a}{b} not enclosed in $, auto-wrap it for convenience
  let processedContent = content;
  if (processedContent.includes('\\frac') && !processedContent.includes('$')) {
    processedContent = processedContent.replace(/\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => `$${m}$`);
  }

  // Split by inline math ($...$, \(...\)) and display math ($$...$$, \[...\])
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^\$\n]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let keyIndex = 0;

  while ((match = regex.exec(processedContent)) !== null) {
    // Text before math
    if (match.index > lastIndex) {
      const textPart = processedContent.substring(lastIndex, match.index);
      parts.push(renderFormattedText(textPart, `text-${keyIndex++}`));
    }

    const rawFormula = match[0];
    const isDisplay =
      (rawFormula.startsWith('$$') && rawFormula.endsWith('$$')) ||
      (rawFormula.startsWith('\\[') && rawFormula.endsWith('\\]'));

    let mathCode = '';
    if (rawFormula.startsWith('$$') && rawFormula.endsWith('$$')) {
      mathCode = rawFormula.slice(2, -2).trim();
    } else if (rawFormula.startsWith('\\[') && rawFormula.endsWith('\\]')) {
      mathCode = rawFormula.slice(2, -2).trim();
    } else if (rawFormula.startsWith('\\(') && rawFormula.endsWith('\\)')) {
      mathCode = rawFormula.slice(2, -2).trim();
    } else if (rawFormula.startsWith('$') && rawFormula.endsWith('$')) {
      mathCode = rawFormula.slice(1, -1).trim();
    }

    try {
      const html = katex.renderToString(mathCode, {
        displayMode: isDisplay,
        throwOnError: false,
      });
      parts.push(
        <span
          key={`math-${keyIndex++}`}
          className={isDisplay ? 'my-2 block overflow-x-auto text-center' : 'inline-block px-1'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      parts.push(<code key={`err-${keyIndex++}`}>{rawFormula}</code>);
    }

    lastIndex = regex.lastIndex;
  }

  // Remainder
  if (lastIndex < content.length) {
    const textPart = content.substring(lastIndex);
    parts.push(renderFormattedText(textPart, `text-${keyIndex++}`));
  }

  return <div className={`leading-relaxed ${className}`}>{parts}</div>;
};

export function formatPreservedHtml(raw: string): string {
  if (!raw) return '';

  // 1. Convert markdown images ![alt](url) to responsive centered HTML figure
  let res = raw.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div class="my-4 text-center block"><img src="$2" alt="$1" class="max-h-80 mx-auto rounded-xl shadow-sm border border-slate-200 object-contain" /><p class="text-xs text-slate-500 mt-1.5 italic font-medium">$1</p></div>'
  );

  // 2. Normalize line endings
  res = res.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Auto-link plain URLs not inside href/src attributes
  res = res.replace(/(href=["']|src=["'])?((?:https?:\/\/)[^\s<"']+)/g, (match, prefix, url) => {
    if (prefix) return match;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-semibold text-indigo-600 underline hover:text-indigo-800 break-all px-1 py-0.5 rounded hover:bg-indigo-50">${url}</a>`;
  });

  // 4. Block tags where newlines should not produce extraneous <br />
  const blockTags = 'div|p|table|thead|tbody|tfoot|tr|th|td|ul|ol|li|h[1-6]|blockquote|pre|hr|section|article|header|footer|figure|figcaption';

  // Strip newlines directly attached to block tags
  res = res.replace(new RegExp(`(<(?:\\/)?(?:${blockTags})[^>]*>)\\s*\\n+`, 'gi'), '$1');
  res = res.replace(new RegExp(`\\n+\\s*(<(?:\\/)?(?:${blockTags})[^>]*>)`, 'gi'), '$1');

  // 5. Convert 2 or more newlines (paragraph break) into clean paragraph spacer
  res = res.replace(/\n\s*\n+/g, '<span class="block h-3.5 sm:h-4"></span>');

  // 6. Convert remaining single newlines into <br />
  res = res.replace(/\n/g, '<br />');

  return res;
}

function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  const formattedHtml = formatPreservedHtml(text);
  return (
    <span
      key={keyPrefix}
      className="materi-text-block inline leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
