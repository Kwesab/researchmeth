import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
  id: string;
}

/**
 * Sanitize Mermaid code to fix common AI-generated syntax errors.
 */
function sanitizeMermaidCode(code: string): string {
  if (!code) return code;

  return code
    // Strip citation refs ANYWHERE they appear: [1], [2],[3], [1,2,3], etc.
    .replace(/\[[\d,\s]+\]/g, "")
    // Remove parenthetical citations like (Smith et al., 2023)
    .replace(/\([^)]*\d{4}[^)]*\)/g, "")
    // Replace & which confuses some parsers
    .replace(/&/g, "and")
    // Replace unicode math symbols
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    // Normalize smart quotes
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Remove any stray backslash-n that isn't a real newline
    .replace(/\\n/g, "\n")
    // Strip trailing commas inside node labels before closing brackets
    .replace(/,(\s*[\]\)>])/g, "$1");
}


export default function MermaidDiagram({ code, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "#0a0e1a",
            primaryColor: "#c89b3c",
            primaryTextColor: "#e8eaf0",
            primaryBorderColor: "#c89b3c",
            lineColor: "#4a5568",
            secondaryColor: "#1a2035",
            tertiaryColor: "#0f1629",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
        });
        const cleanId = id.replace(/[^a-zA-Z0-9]/g, "_");
        // Sanitize: remove citation patterns like [1],[2] inside node labels
        // that break Mermaid's square bracket node syntax
        const safeCode = sanitizeMermaidCode(code);
        const { svg: rendered } = await mermaid.render(cleanId, safeCode);
        if (!cancelled) setSvg(rendered);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code, id]);

  if (error) {
    return (
      <div className="diagram-container p-4">
        <pre className="text-xs overflow-auto" style={{ color: "hsl(var(--muted-foreground))" }}>{code}</pre>
        <p className="text-xs text-red-400 mt-2">Diagram render error: {error}</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="diagram-container h-32 shimmer rounded-lg" />
    );
  }

  return (
    <div
      className="diagram-container overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
