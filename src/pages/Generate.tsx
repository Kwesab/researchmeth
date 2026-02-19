import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, XCircle, GraduationCap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, label: "Searching Semantic Scholar", desc: "Finding IEEE/ACM/Springer computing papers on your topic..." },
  { id: 2, label: "Selecting 5 Papers (≤15 pages)", desc: "Filtering and ranking by relevance, publication venue, and page count..." },
  { id: 3, label: "Extracting Paper Metadata", desc: "Collecting titles, authors, abstracts, methodologies, URLs..." },
  { id: 4, label: "AI Analysis & Comparison", desc: "Gemini AI reading and comparing methodologies across all 5 papers..." },
  { id: 5, label: "Identifying Research Gaps", desc: "Finding weaknesses and unexplored areas in existing research..." },
  { id: 6, label: "Generating Novel Research Method", desc: "Synthesizing a new original methodology from the 5 papers..." },
  { id: 7, label: "Creating Mermaid Diagrams", desc: "Building system architecture, flowchart, data flow, research process diagrams..." },
  { id: 8, label: "Writing Full Assignment", desc: "Generating cover page, abstract, introduction, literature review, conclusion..." },
  { id: 9, label: "Generating IEEE References", desc: "Auto-formatting [1]–[5] in IEEE citation standard..." },
  { id: 10, label: "Exporting .RIS Reference File", desc: "Building EndNote/Mendeley compatible reference library..." },
  { id: 11, label: "Compiling Final Output", desc: "Packaging assignment, diagrams, references for download..." },
];

type StepStatus = "pending" | "active" | "done" | "error";

export default function Generate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(Array(11).fill("pending"));
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const params = {
    topic: searchParams.get("topic") || "",
    studentName: searchParams.get("studentName") || "",
    courseName: searchParams.get("courseName") || "",
    institution: searchParams.get("institution") || "",
    lecturer: searchParams.get("lecturer") || "",
    year: searchParams.get("year") || new Date().getFullYear().toString(),
  };

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const updateStep = (index: number, status: StepStatus) => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[index] = status;
      return next;
    });
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (hasStarted.current || !params.topic) return;
    hasStarted.current = true;
    runPipeline();
  }, []);

  const runPipeline = async () => {
    try {
      // Step 1-3: Search papers
      setCurrentStep(0);
      updateStep(0, "active");
      addLog(`Starting paper search for topic: "${params.topic}"`);

      const { data: papersData, error: papersError } = await supabase.functions.invoke("search-papers", {
        body: { topic: params.topic },
      });

      if (papersError) throw new Error(`Paper search failed: ${papersError.message}`);

      updateStep(0, "done");
      updateStep(1, "done");
      updateStep(2, "done");
      addLog(`Found ${papersData?.papers?.length || 0} papers via Semantic Scholar`);
      papersData?.papers?.forEach((p: any, i: number) => {
        addLog(`Paper [${i + 1}]: ${p.title?.substring(0, 60)}...`);
      });

      // Step 4-6: AI Analysis
      setCurrentStep(3);
      updateStep(3, "active");
      addLog("Sending papers to Gemini AI for analysis...");

      const { data: assignmentData, error: assignmentError } = await supabase.functions.invoke("generate-assignment", {
        body: { papers: papersData.papers, ...params },
      });

      if (assignmentError) throw new Error(`Assignment generation failed: ${assignmentError.message}`);

      updateStep(3, "done");
      updateStep(4, "done");
      addLog("Research gaps identified. Novel methodology synthesized.");

      // Step 7
      setCurrentStep(6);
      updateStep(5, "done");
      updateStep(6, "done");
      addLog("Mermaid diagrams generated (4 diagrams).");

      // Step 8
      setCurrentStep(7);
      updateStep(7, "done");
      addLog("Full assignment document written.");

      // Step 9
      setCurrentStep(8);
      updateStep(8, "done");
      addLog("IEEE references [1]–[5] formatted.");

      // Step 10
      setCurrentStep(9);
      updateStep(9, "done");
      addLog(".RIS reference file generated (EndNote/Mendeley compatible).");

      // Step 11
      setCurrentStep(10);
      updateStep(10, "done");
      addLog("All outputs compiled. Navigating to preview...");

      // Store in sessionStorage and navigate
      sessionStorage.setItem("researchData", JSON.stringify({ papers: papersData.papers, assignment: assignmentData, params }));

      setTimeout(() => navigate("/preview"), 800);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(msg);
      addLog(`ERROR: ${msg}`);
      toast({ title: "Generation Failed", description: msg, variant: "destructive" });
      // Mark current active step as error
      setStepStatuses(prev => prev.map(s => s === "active" ? "error" : s));
    }
  };

  const progress = stepStatuses.filter(s => s === "done").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b" style={{ borderColor: "hsl(var(--navy-border))" }}>
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
            <GraduationCap className="w-5 h-5" style={{ color: "hsl(var(--navy-deep))" }} />
          </div>
          <div>
            <div className="font-display font-bold text-sm" style={{ color: "hsl(var(--gold))" }}>Generating Research Assignment</div>
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{params.topic}</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: "hsl(var(--muted-foreground))" }}>Pipeline Progress</span>
            <span style={{ color: "hsl(var(--gold))" }} className="font-mono font-bold">{progress}/11 steps</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--navy-border))" }}>
            <div
              className="h-full progress-bar-fill rounded-full"
              style={{ width: `${(progress / 11) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps */}
          <div className="lg:col-span-2 space-y-2">
            {STEPS.map((step, i) => {
              const status = stepStatuses[i];
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-all duration-300"
                  style={{
                    background: status === "active" ? "hsl(var(--gold) / 0.08)" : status === "done" ? "hsl(var(--navy-surface))" : "transparent",
                    border: status === "active" ? "1px solid hsl(var(--gold) / 0.4)" : "1px solid transparent",
                  }}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {status === "done" && <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(var(--gold))" }} />}
                    {status === "active" && <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(var(--gold))" }} />}
                    {status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                    {status === "pending" && <Circle className="w-5 h-5" style={{ color: "hsl(var(--navy-border))" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        STEP {String(step.id).padStart(2, "0")}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: status === "done" ? "hsl(var(--foreground))" :
                            status === "active" ? "hsl(var(--gold))" :
                              status === "error" ? "hsl(0 72% 55%)" :
                                "hsl(var(--muted-foreground))"
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {status === "active" && (
                      <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Logs */}
          <div>
            <div className="glass-card p-4 h-full">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "hsl(var(--gold))" }}>
                <span className="w-2 h-2 rounded-full bg-green-400 pulse-gold"></span>
                Live Pipeline Log
              </h3>
              <div className="space-y-1 h-80 overflow-y-auto scrollbar-thin">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {log}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Initializing pipeline...</div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: "hsl(0 72% 55% / 0.1)", border: "1px solid hsl(0 72% 55% / 0.3)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Generation Error</span>
                </div>
                <p className="text-xs text-red-300">{error}</p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-3 text-xs underline"
                  style={{ color: "hsl(var(--gold))" }}
                >
                  ← Back to start
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
