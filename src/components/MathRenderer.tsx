import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  images?: string[];
  onViewImage?: (url: string, title?: string) => void;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  images = [],
  onViewImage,
}) => {
  if (!content) return null;

  // Pre-process content: if content has \frac{a}{b} not enclosed in $, auto-wrap it for convenience
  let processedContent = content;
  if (processedContent.includes('\\frac') && !processedContent.includes('$')) {
    processedContent = processedContent.replace(/\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => `$${m}$`);
  }

  // Split by inline math ($...$, \(...\)), display math ($$...$$, \[...\]), and inline image tokens ([Gambar 1], [Gambar], etc.)
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^\$\n]+?\$|\[(?:Gambar|Gbr)\s*\d*\])/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;
  let autoImgCount = 0;

  while ((match = regex.exec(processedContent)) !== null) {
    // Text before token
    if (match.index > lastIndex) {
      const textPart = processedContent.substring(lastIndex, match.index);
      parts.push(renderFormattedText(textPart, `text-${keyIndex++}`));
    }

    const token = match[0];

    // Check if it is an inline image token: [Gambar 1], [Gbr 2], [Gambar], etc.
    const imgTagMatch = token.match(/^\[(?:Gambar|Gbr)\s*(\d*)\]$/i);
    if (imgTagMatch) {
      let imgIdx = imgTagMatch[1] ? parseInt(imgTagMatch[1], 10) - 1 : autoImgCount++;
      if (imgIdx < 0) imgIdx = 0;
      const targetImgUrl = images && images[imgIdx] ? images[imgIdx] : null;

      if (targetImgUrl) {
        parts.push(
          <div key={`inline-img-${keyIndex++}`} className="my-3 block text-left">
            <div className="inline-block max-w-full rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
              <img
                src={targetImgUrl}
                alt={`Gambar ${imgIdx + 1}`}
                className="max-h-72 sm:max-h-80 max-w-full rounded-xl object-contain cursor-pointer hover:opacity-95 transition"
                onClick={() => onViewImage && onViewImage(targetImgUrl, `Gambar ${imgIdx + 1}`)}
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                <span className="font-bold text-slate-700">Gambar {imgIdx + 1}</span>
                {onViewImage && (
                  <button
                    type="button"
                    onClick={() => onViewImage(targetImgUrl, `Gambar ${imgIdx + 1}`)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                  >
                    Perbesar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      } else {
        // Fallback badge if image is not yet uploaded/available
        parts.push(
          <span
            key={`img-badge-${keyIndex++}`}
            className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-sans"
          >
            📷 Gambar {imgIdx + 1}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
      continue;
    }

    const rawFormula = token;
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
  if (lastIndex < processedContent.length) {
    const textPart = processedContent.substring(lastIndex);
    parts.push(renderFormattedText(textPart, `text-${keyIndex++}`));
  }

  return <div className={`leading-relaxed ${className}`}>{parts}</div>;
};

export function formatPreservedHtml(raw: string): string {
  if (!raw) return '';

  let res = raw;

  // 1. Normalize line endings first
  res = res.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Convert markdown images ![alt](url) to responsive centered HTML figure
  res = res.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div class="my-4 text-center block"><img src="$2" alt="$1" class="max-h-80 mx-auto rounded-xl shadow-sm border border-slate-200 object-contain" /><p class="text-xs text-slate-500 mt-1.5 italic font-medium">$1</p></div>'
  );

  // 2b. Format [Gambar X] references into a prominent visual reference badge
  res = res.replace(
    /\[Gambar\s+(\d+)\]/gi,
    '<span class="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-sans">📷 Gambar $1</span>'
  );

  // 3. Stimulus Titles: [judul]...[/judul] or [title]...[/title]
  res = res.replace(/\[(?:judul|title)\]([\s\S]*?)\[\/(?:judul|title)\]/gi, (_, inner) => {
    return `<div class="text-center my-2.5 font-bold text-base sm:text-lg text-slate-900 tracking-wide">${inner.trim()}</div>`;
  });

  // 4. Centered text blocks: [center]...[/center] or <center>...</center>
  res = res.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, (_, inner) => {
    return `<div class="text-center my-1.5 w-full">${inner}</div>`;
  });
  res = res.replace(/<center>([\s\S]*?)<\/center>/gi, (_, inner) => {
    return `<div class="text-center my-1.5 w-full">${inner}</div>`;
  });

  // 5. Font Colors: [color=blue]...[/color], [color=#0284c7]...[/color], [warna=red]...[/warna], <font color="...">...</font>
  const colorMap: Record<string, string> = {
    biru: '#0284c7',
    blue: '#0284c7',
    merah: '#dc2626',
    red: '#dc2626',
    hijau: '#16a34a',
    green: '#16a34a',
    kuning: '#ca8a04',
    yellow: '#ca8a04',
    ungu: '#9333ea',
    purple: '#9333ea',
    oranye: '#ea580c',
    orange: '#ea580c',
    abu: '#64748b',
    gray: '#64748b',
    grey: '#64748b',
    hitam: '#0f172a',
    black: '#0f172a',
  };

  res = res.replace(/\[(?:color|warna)=([#a-zA-Z0-9]+)\]([\s\S]*?)\[\/(?:color|warna)\]/gi, (_, col, inner) => {
    const normalized = col.toLowerCase();
    const finalColor = colorMap[normalized] || (col.startsWith('#') ? col : `#${col}`);
    const safeColor = finalColor.replace(/[^#a-zA-Z0-9]/g, '');
    return `<span style="color: ${safeColor}; font-weight: inherit;">${inner}</span>`;
  });

  res = res.replace(/<font\s+color=["']?([#a-zA-Z0-9]+)["']?>([\s\S]*?)<\/font>/gi, (_, col, inner) => {
    const normalized = col.toLowerCase();
    const finalColor = colorMap[normalized] || (col.startsWith('#') ? col : `#${col}`);
    const safeColor = finalColor.replace(/[^#a-zA-Z0-9]/g, '');
    return `<span style="color: ${safeColor}; font-weight: inherit;">${inner}</span>`;
  });

  // 6. Explicit formatting tags: [b], [i], [u], [s]
  res = res.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  res = res.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
  res = res.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u class="underline underline-offset-2">$1</u>');
  res = res.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s class="line-through text-slate-400">$1</s>');

  // 7. Markdown Formatting:
  // Bold + Italic: ***text***, **_text_**, _**text**_
  res = res.replace(/\*\*\*([^*\n\r]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  res = res.replace(/\*\*\_([^_\n\r]+)\_\*\*/g, '<strong><em>$1</em></strong>');
  res = res.replace(/\_\*\*([^*\n\r]+)\*\*\_/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  res = res.replace(/\*\*([^*\n\r]+)\*\*/g, '<strong>$1</strong>');

  // Underline: __text__
  res = res.replace(/__([^_]+)__/g, '<u class="underline underline-offset-2">$1</u>');

  // Italic: *text* and _text_
  res = res.replace(/(^|[^\w*])\*([^*\n\r]+)\*([^\w*]|$)/g, '$1<em>$2</em>$3');
  res = res.replace(/(^|[^\w_])_([^_\n\r]+)_([^\w_]|$)/g, '$1<em>$2</em>$3');

  // 8. Auto-link plain URLs not inside href/src attributes
  res = res.replace(/(href=["']|src=["'])?((?:https?:\/\/)[^\s<"']+)/g, (match, prefix, url) => {
    if (prefix) return match;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-semibold text-indigo-600 underline hover:text-indigo-800 break-all px-1 py-0.5 rounded hover:bg-indigo-50">${url}</a>`;
  });

  // 9. Block tags where newlines should not produce extraneous <br />
  const blockTags = 'div|p|table|thead|tbody|tfoot|tr|th|td|ul|ol|li|h[1-6]|blockquote|pre|hr|section|article|header|footer|figure|figcaption';

  // Strip newlines directly attached to block tags
  res = res.replace(new RegExp(`(<(?:\\/)?(?:${blockTags})[^>]*>)\\s*\\n+`, 'gi'), '$1');
  res = res.replace(new RegExp(`\\n+\\s*(<(?:\\/)?(?:${blockTags})[^>]*>)`, 'gi'), '$1');

  // 10. Convert 2 or more newlines (paragraph break) into clean paragraph spacer
  res = res.replace(/\n\s*\n+/g, '<span class="block h-3.5 sm:h-4"></span>');

  // 11. Convert remaining single newlines into <br />
  res = res.replace(/\n/g, '<br />');

  return res;
}

function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  const formattedHtml = formatPreservedHtml(text);
  const hasBlock = /<(?:div|center|table|h[1-6]|p|blockquote|ul|ol)/i.test(formattedHtml);
  return hasBlock ? (
    <div
      key={keyPrefix}
      className="materi-text-block leading-relaxed my-0.5"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  ) : (
    <span
      key={keyPrefix}
      className="materi-text-block inline leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
