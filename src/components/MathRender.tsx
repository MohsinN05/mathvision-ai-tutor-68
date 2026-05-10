import { useMemo } from "react";
import katex from "katex";

interface Props {
  tex: string;
  display?: boolean;
  className?: string;
}

export function MathRender({ tex, display = false, className }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch {
      return `<code>${tex}</code>`;
    }
  }, [tex, display]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
