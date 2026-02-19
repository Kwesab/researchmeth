import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
  id: string;
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
            fontFamily: "Inter, sans-serif",
          },
        });
        const cleanId = id.replace(/[^a-zA-Z0-9]/g, "_");
        const { svg: rendered } = await mermaid.render(cleanId, code);
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
