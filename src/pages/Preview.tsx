import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, FileText, Download, BookOpen, ExternalLink,
  ChevronDown, ChevronUp, Sparkles, Copy, Check, ArrowLeft, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MermaidDiagram from "@/components/MermaidDiagram";
import EndnoteScreenshot from "@/components/EndnoteScreenshot";
import { generatePDF, svgToPngDataUrl } from "@/lib/generatePDF";
import { generateRIS } from "@/lib/generateRIS";
import universityLogo from "@/assets/university-logo.jpg";

export default function Preview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const assignmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("researchData");
    if (!stored) { navigate("/"); return; }
    setData(JSON.parse(stored));
  }, []);

  if (!data) return null;

  const { papers, assignment, params } = data;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyRef = async () => {
    const refs = assignment?.references?.join("\n") || "";
    await navigator.clipboard.writeText(refs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Pre-load logo: use the static import URL and read as base64 via FileReader
      let logoBase64: string | null = null;
      try {
        const res = await fetch(universityLogo);
        const blob = await res.blob();
        logoBase64 = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch {
        logoBase64 = null;
      }

      // Render each Mermaid diagram to SVG, then convert to PNG for embedding
      let diagramImages: (string | null)[] = [];
      if (assignment?.diagrams?.length) {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        // Sanitize helper — mirrors MermaidDiagram component
        const sanitize = (code: string) => code
          .replace(/\[[\d,\s]+\]/g, "")
          .replace(/\([^)]*\d{4}[^)]*\)/g, "")
          .replace(/&/g, "and")
          .replace(/≤/g, "<=")
          .replace(/≥/g, ">=")
          .replace(/≠/g, "!=")
          .replace(/[\u2019\u2018]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/,(\s*[\]\)>])/g, "$1");

        diagramImages = await Promise.all(
          assignment.diagrams.map(async (d: any, i: number) => {
            try {
              const rawCode = typeof d.code === "string" ? d.code : JSON.stringify(d.code);
              const code = sanitize(rawCode);
              // Use a unique id per render to avoid mermaid caching conflicts
              const id = `pdf_diag_${i}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
              const { svg } = await mermaid.render(id, code);
              // High-res PNG for crisp PDF embedding
              return await svgToPngDataUrl(svg, 1400, 700);
            } catch {
              return null;
            }
          })
        );
      }
      await generatePDF({ assignment, papers, params, diagramImages, logoBase64 });
      toast({ title: "PDF Downloaded", description: "ResearchAssignment.pdf saved to your downloads." });
    } catch (e: any) {
      toast({ title: "PDF Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadRIS = () => {
    const ris = generateRIS(papers);
    const blob = new Blob([ris], { type: "application/x-research-info-systems" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "references.ris";
    a.click();
    toast({ title: "RIS Downloaded", description: "references.ris — open in EndNote or Mendeley." });
  };

  const handleDownloadBibTeX = () => {
    const bib = papers.map((p: any, i: number) => `@article{ref${i + 1},
  title={${p.title}},
  author={${p.authors?.join(" and ") || "Unknown"}},
  year={${p.year || "2023"}},
  journal={${p.venue || "IEEE"}},
  url={${p.url || ""}},
}`).join("\n\n");
    const blob = new Blob([bib], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "references.bib";
    a.click();
    toast({ title: "BibTeX Downloaded", description: "references.bib saved." });
  };

  const stringifyContent = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      // Handle {title, plan} or {title, content} or any object by joining values
      return Object.values(val)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join("\n\n");
    }
    return String(val);
  };

  const sections = [
    { key: "abstract", label: "Abstract", content: stringifyContent(assignment?.abstract) },
    { key: "introduction", label: "1. Introduction", content: stringifyContent(assignment?.introduction) },
    { key: "literature", label: "2. Literature Review", content: stringifyContent(assignment?.literatureReview) },
    { key: "methodology", label: "3. Proposed Research Method", content: stringifyContent(assignment?.proposedMethod) },
    { key: "implementation", label: "4. Implementation Plan", content: stringifyContent(assignment?.implementationPlan) },
    { key: "conclusion", label: "5. Conclusion", content: stringifyContent(assignment?.conclusion) },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ borderColor: "hsl(var(--navy-border))", background: "hsl(var(--background))" }}>
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-4" style={{ background: "hsl(var(--border))" }} />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" style={{ color: "hsl(var(--gold))" }} />
              <span className="font-display font-semibold text-sm" style={{ color: "hsl(var(--gold))" }}>
                Research Assignment Preview
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRIS}
              className="text-xs"
              style={{ borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
            >
              <Download className="w-3 h-3 mr-1" /> .RIS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBibTeX}
              className="text-xs"
              style={{ borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
            >
              <Download className="w-3 h-3 mr-1" /> .BibTeX
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="text-xs font-semibold"
              style={{ background: "var(--gradient-gold)", color: "hsl(var(--navy-deep))" }}
            >
              <Download className="w-3 h-3 mr-1" />
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Assignment */}
          <div className="lg:col-span-2 space-y-4" ref={assignmentRef}>
            {/* Cover Page */}
            <div className="glass-card p-8 text-center gold-border border">
              <div className="mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--gold))" }} />
                <div className="text-xs font-mono mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>RESEARCH METHODS ASSIGNMENT</div>
                <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
                  {params.topic}
                </h1>
                <div className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                  A Systematic Literature Review and Novel Research Methodology
                </div>
              </div>
              <div className="text-left max-w-xs mx-auto space-y-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {params.studentName && <div><strong style={{ color: "hsl(var(--foreground))" }}>Student:</strong> {params.studentName}</div>}
                {params.courseName && <div><strong style={{ color: "hsl(var(--foreground))" }}>Course:</strong> {params.courseName}</div>}
                {params.institution && <div><strong style={{ color: "hsl(var(--foreground))" }}>Institution:</strong> {params.institution}</div>}
                {params.lecturer && <div><strong style={{ color: "hsl(var(--foreground))" }}>Lecturer:</strong> {params.lecturer}</div>}
                <div><strong style={{ color: "hsl(var(--foreground))" }}>Year:</strong> {params.year}</div>
              </div>
            </div>

            {/* Assignment Sections */}
            {sections.map(({ key, label, content }) => (
              <div key={key} className="glass-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => toggleSection(key)}
                >
                  <span className="font-display font-semibold" style={{ color: "hsl(var(--gold))" }}>{label}</span>
                  {expandedSections[key]
                    ? <ChevronUp className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  }
                </button>
                {(expandedSections[key] || key === "abstract") && (
                  <div className="px-5 pb-5">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                      {content || "Content will appear here..."}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Diagrams */}
            <div className="glass-card p-5">
              <h2 className="font-display text-lg font-bold mb-4" style={{ color: "hsl(var(--gold))" }}>
                6. System Diagrams
              </h2>
              <div className="space-y-6">
                {assignment?.diagrams?.map((diagram: any, i: number) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--blue-glow))" }}>
                      {diagram.title}
                    </h3>
                    <MermaidDiagram code={diagram.code} id={`diagram-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* References */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold" style={{ color: "hsl(var(--gold))" }}>References (IEEE Format)</h2>
                <button onClick={handleCopyRef} className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy all"}
                </button>
              </div>
              <div className="space-y-2">
                {assignment?.references?.map((ref: string, i: number) => (
                  <div key={i} className="ref-item">{ref}</div>
                ))}
              </div>
            </div>

            {/* Appendix: Paper URLs */}
            <div className="glass-card p-5">
              <h2 className="font-display text-lg font-bold mb-4" style={{ color: "hsl(var(--gold))" }}>
                Appendix: Source Papers & URLs
              </h2>
              <div className="space-y-4">
                {papers?.map((paper: any, i: number) => (
                  <div key={i} className="paper-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--gold))" }}>[{i + 1}]</span>
                          <span className="badge-ieee">{paper.venue || "IEEE"}</span>
                          {paper.year && <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{paper.year}</span>}
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>{paper.title}</p>
                        <p className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {paper.authors?.join(", ")}
                        </p>
                        {paper.url ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={paper.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs hover:underline"
                              style={{ color: "hsl(var(--blue-glow))" }}>
                              <Link2 className="w-3 h-3" />
                              {paper.url.length > 55 ? paper.url.substring(0, 55) + "..." : paper.url}
                            </a>
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded font-semibold hover:opacity-80 transition-opacity"
                              style={{ background: "var(--gradient-gold)", color: "hsl(var(--navy-deep))" }}
                            >
                              <ExternalLink className="w-3 h-3" /> Open / Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                            No direct URL available — search by title on Semantic Scholar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
          {/* Papers summary */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "hsl(var(--gold))" }}>
                <BookOpen className="w-4 h-4" /> 5 Source Papers
              </h3>
              <div className="space-y-3">
                {papers?.map((paper: any, i: number) => (
                  <div key={i} className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--gold) / 0.4)" }}>
                    <div className="text-xs font-mono font-bold mb-0.5" style={{ color: "hsl(var(--gold))" }}>[{i + 1}]</div>
                    <p className="text-xs font-medium leading-tight mb-1" style={{ color: "hsl(var(--foreground))" }}>
                      {paper.title?.substring(0, 80)}{paper.title?.length > 80 ? "..." : ""}
                    </p>
                    <p className="text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {paper.authors?.[0]}{paper.authors?.length > 1 ? ` et al.` : ""} • {paper.year}
                    </p>
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium hover:opacity-80 transition-opacity"
                        style={{ background: "hsl(var(--blue-glow) / 0.15)", color: "hsl(var(--blue-glow))", border: "1px solid hsl(var(--blue-glow) / 0.3)" }}
                      >
                        <ExternalLink className="w-3 h-3" /> Open Paper
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Downloads */}
            <div className="glass-card p-4">
              <h3 className="font-semibold text-sm mb-3" style={{ color: "hsl(var(--gold))" }}>Downloads</h3>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start text-sm h-10"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  style={{ background: "var(--gradient-gold)", color: "hsl(var(--navy-deep))" }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  ResearchAssignment.pdf
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm h-10"
                  onClick={handleDownloadRIS}
                  style={{ borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  references.ris
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm h-10"
                  onClick={handleDownloadBibTeX}
                  style={{ borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  references.bib
                </Button>
              </div>
            </div>

            {/* EndNote Screenshot */}
            <EndnoteScreenshot papers={papers} />
          </div>
        </div>
      </div>
    </div>
  );
}
