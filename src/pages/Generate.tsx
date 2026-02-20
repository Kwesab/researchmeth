import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, XCircle, GraduationCap, AlertCircle, Search, Cpu, GitBranch, RotateCcw, Info, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, label: "Searching Semantic Scholar", desc: "Finding IEEE/ACM/Springer computing papers on your topic...", phase: 0 },
  { id: 2, label: "Selecting 5 Papers (≤15 pages)", desc: "Filtering and ranking by relevance, venue, and page count...", phase: 0 },
  { id: 3, label: "Extracting Paper Metadata", desc: "Collecting titles, authors, abstracts, methodologies, URLs...", phase: 0 },
  { id: 4, label: "Paper Analysis & Comparison", desc: "Comparing methodologies across all 5 papers...", phase: 1 },
  { id: 5, label: "Identifying Research Gaps", desc: "Finding weaknesses and unexplored areas in existing research...", phase: 1 },
  { id: 6, label: "Generating Novel Research Method", desc: "Synthesizing a new original methodology from the 5 papers...", phase: 1 },
  { id: 7, label: "Creating Mermaid Diagrams", desc: "Building system architecture, flowchart, data flow, research process diagrams...", phase: 2 },
  { id: 8, label: "Writing Full Assignment", desc: "Generating cover page, abstract, introduction, literature review, conclusion...", phase: 1 },
  { id: 9, label: "Generating IEEE References", desc: "Auto-formatting [1]–[5] in IEEE citation standard...", phase: 1 },
  { id: 10, label: "Exporting .RIS Reference File", desc: "Building EndNote/Mendeley compatible reference library...", phase: 1 },
  { id: 11, label: "Compiling Final Output", desc: "Packaging assignment, diagrams, references for download...", phase: 2 },
];

const PHASE_LABELS = ["Search", "Generate", "Render"];

type StepStatus = "pending" | "active" | "done" | "error";

// High-level phases shown prominently at the top
const PHASES = [
  { id: 0, label: "Searching Papers", icon: Search, desc: "Querying Semantic Scholar & OpenAlex for relevant papers..." },
  { id: 1, label: "Generating Assignment", icon: Cpu, desc: "AI is analysing papers and writing the full assignment..." },
  { id: 2, label: "Rendering Diagrams", icon: GitBranch, desc: "Building Mermaid system diagrams and compiling output..." },
];

export default function Generate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(Array(11).fill("pending"));
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: "info" | "success" | "error" }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const params = {
    topic: searchParams.get("topic") || "",
    studentName: searchParams.get("studentName") || "",
    courseName: searchParams.get("courseName") || "",
    institution: searchParams.get("institution") || "",
    lecturer: searchParams.get("lecturer") || "",
    year: searchParams.get("year") || new Date().getFullYear().toString(),
  };

  const addLog = (msg: string, type: "info" | "success" | "error" = "info") =>
    setLogs(prev => [...prev, { msg, type }]);

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
    if (stepStatuses.some(s => s === "active")) {
      activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [stepStatuses, currentStep]);

  // Warn before leaving during generation
  useEffect(() => {
    const hasActive = stepStatuses.some(s => s === "active");
    const handler = (e: BeforeUnloadEvent) => {
      if (hasActive) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [stepStatuses]);

  useEffect(() => {
    if (hasStarted.current || !params.topic) return;
    hasStarted.current = true;
    runPipeline();
  }, []);

  const runPipeline = async () => {
    try {
      // ── Phase 0: Searching Papers ──────────────────────────────────
      setCurrentPhase(0);
      setCurrentStep(0);
      updateStep(0, "active");
      addLog(`Starting paper search for topic: "${params.topic}"`, "info");

      const { data: papersData, error: papersError } = await supabase.functions.invoke("search-papers", {
        body: { topic: params.topic },
      });

      if (papersError) throw new Error(`Paper search failed: ${papersError.message}`);

      updateStep(0, "done");
      updateStep(1, "done");
      updateStep(2, "done");
      addLog(`Found ${papersData?.papers?.length || 0} papers via Semantic Scholar`, "success");
      papersData?.papers?.forEach((p: any, i: number) => {
        addLog(`Paper ${i + 1}: ${p.title?.substring(0, 60)}...`, "info");
      });

      // ── Phase 1: Generating Assignment ────────────────────────────
      setCurrentPhase(1);
      setCurrentStep(3);
      updateStep(3, "active");
      addLog("Sending papers for analysis...", "info");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-assignment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ papers: papersData.papers, ...params }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const errMsg = body?.error || res.statusText || `HTTP ${res.status}`;
        throw new Error(errMsg);
      }
      const assignmentData = body;

      updateStep(3, "done");
      updateStep(4, "done");
      updateStep(5, "done");
      addLog("Research gaps identified. Novel methodology synthesized.", "success");

      // Step 8
      setCurrentStep(7);
      updateStep(7, "done");
      addLog("Full assignment document written.", "success");

      // Step 9
      setCurrentStep(8);
      updateStep(8, "done");
      addLog("IEEE references [1]–[5] formatted.", "success");

      // Step 10
      setCurrentStep(9);
      updateStep(9, "done");
      addLog(".RIS reference file generated (EndNote/Mendeley compatible).", "success");

      // ── Phase 2: Rendering Diagrams ───────────────────────────────
      setCurrentPhase(2);
      setCurrentStep(6);
      updateStep(6, "active");
      addLog("Rendering Mermaid diagrams...", "info");
      await new Promise(r => setTimeout(r, 600));
      updateStep(6, "done");
      addLog("Mermaid diagrams generated.", "success");

      // Step 11
      setCurrentStep(10);
      updateStep(10, "done");
      addLog("All outputs compiled. Navigating to preview...", "success");

      // Store in sessionStorage and navigate
      sessionStorage.setItem("researchData", JSON.stringify({ papers: papersData.papers, assignment: assignmentData, params }));

      setCurrentPhase(3); // all done
      setTimeout(() => navigate("/preview"), 800);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(msg);
      addLog(msg, "error");
      toast({ title: "Generation Failed", description: msg, variant: "destructive" });
      setStepStatuses(prev => prev.map(s => s === "active" ? "error" : s));
    }
  };

  const progress = stepStatuses.filter(s => s === "done").length;

  return (
    <div className="min-h-screen animate-in">
      {/* Header */}
      <header className="border-b backdrop-blur-sm" style={{ borderColor: "hsl(var(--navy-border))", background: "hsl(var(--background) / 0.9)" }}>
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

        {/* ── Phase Banner ── */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isActive = currentPhase === idx;
            const isDone = currentPhase > idx;
            const isError = error && currentPhase === idx;
            return (
              <div
                key={phase.id}
                className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 border"
                style={{
                  background: isActive ? "hsl(var(--gold) / 0.08)" : isDone ? "hsl(var(--navy-surface))" : "hsl(var(--navy-surface) / 0.5)",
                  borderColor: isActive ? "hsl(var(--gold) / 0.5)" : isDone ? "hsl(var(--gold) / 0.2)" : "hsl(var(--navy-border))",
                }}
              >
                <div className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--gold))" }} />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" style={{ color: "hsl(var(--gold))" }} />
                  ) : isError ? (
                    <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                  ) : (
                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--navy-border))" }} />
                  )}
                  <span
                    className="font-semibold text-sm"
                    style={{
                      color: isActive
                        ? "hsl(var(--gold))"
                        : isDone
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {phase.label}
                  </span>
                </div>
                {isActive && (
                  <p className="text-xs leading-snug" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {phase.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center text-sm mb-2.5">
            <span style={{ color: "hsl(var(--muted-foreground))" }}>Pipeline Progress</span>
            <span className="flex items-center gap-2">
              <span style={{ color: "hsl(var(--gold))" }} className="font-mono font-bold tabular-nums">{progress}/11</span>
              {progress < 11 && !error && (
                <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>~2 min</span>
              )}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--navy-border))", boxShadow: "inset 0 2px 4px hsl(0 0% 0% / 0.3)" }}>
            <div
              className="h-full progress-bar-fill rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(progress / 11) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps - Clean Card List */}
          <div className="lg:col-span-2 space-y-3">
            {STEPS.map((step, i) => {
              const status = stepStatuses[i];
              const isPhaseStart = i === 0 || STEPS[i - 1]?.phase !== step.phase;
              return (
                <div
                  key={step.id}
                  ref={status === "active" ? activeStepRef : null}
                  className={`pipeline-step-card flex items-center gap-4 p-4 border ${
                    status === "active" ? "active" : ""
                  } ${status === "done" ? "done" : ""} ${status === "error" ? "error" : ""}`}
                  style={{
                    background: status === "pending" ? "hsl(var(--navy-surface) / 0.5)" : undefined,
                  }}
                >
                  {/* Step number / status */}
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-colors"
                    style={{
                      background: status === "done" ? "hsl(var(--gold) / 0.2)" : status === "active" ? "hsl(var(--gold) / 0.2)" : status === "error" ? "hsl(0 72% 55% / 0.2)" : "hsl(var(--navy-surface))",
                      color: status === "done" ? "hsl(var(--gold))" : status === "active" ? "hsl(var(--gold))" : status === "error" ? "hsl(0 72% 55%)" : "hsl(var(--muted-foreground))",
                      border: status === "done" ? "2px solid hsl(var(--gold) / 0.5)" : status === "active" ? "2px solid hsl(var(--gold))" : status === "error" ? "2px solid hsl(0 72% 55% / 0.5)" : "1px solid hsl(var(--navy-border))",
                    }}
                  >
                    {status === "done" && <CheckCircle2 className="w-5 h-5" />}
                    {status === "active" && <Loader2 className="w-5 h-5 animate-spin" />}
                    {status === "error" && <XCircle className="w-5 h-5" />}
                    {status === "pending" && String(step.id).padStart(2, "0")}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {isPhaseStart && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                          style={{ background: "hsl(var(--gold) / 0.12)", color: "hsl(var(--gold))" }}
                        >
                          {PHASE_LABELS[step.phase]}
                        </span>
                      )}
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Step {String(step.id).padStart(2, "0")}
                      </span>
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: status === "done" ? "hsl(var(--foreground))" :
                          status === "active" ? "hsl(var(--gold))" :
                            status === "error" ? "hsl(0 72% 55%)" :
                              "hsl(var(--muted-foreground))"
                      }}
                    >
                      {step.label}
                    </div>
                    {status === "active" && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Feed */}
          <div className="lg:sticky lg:top-24">
            <div className="glass-card p-5 h-full min-h-[320px]">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--gold))" }}>
                <Sparkles className="w-4 h-4" />
                Activity
              </h3>
              <div
                className="space-y-3 h-72 overflow-y-auto scrollbar-thin pr-1"
                role="log"
                aria-live="polite"
                aria-label="Pipeline activity log"
              >
                {logs.map((log, i) => {
                  const Icon = log.type === "success" ? CheckCircle2 : log.type === "error" ? XCircle : Info;
                  const iconColor = log.type === "success" ? "hsl(var(--gold))" : log.type === "error" ? "hsl(0 72% 55%)" : "hsl(var(--blue-glow))";
                  const textColor = log.type === "success" ? "hsl(var(--foreground))" : log.type === "error" ? "hsl(0 72% 65%)" : "hsl(var(--muted-foreground))";
                  return (
                    <div
                      key={i}
                      className="flex gap-3 items-start py-2 px-3 rounded-lg transition-colors"
                      style={{ background: log.type === "error" ? "hsl(0 72% 55% / 0.06)" : "hsl(var(--navy-surface) / 0.4)" }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
                      <p className="text-sm leading-relaxed flex-1 min-w-0" style={{ color: textColor }}>
                        {log.msg}
                      </p>
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <div className="flex gap-3 items-center py-4 px-3 rounded-lg" style={{ background: "hsl(var(--navy-surface) / 0.3)", color: "hsl(var(--muted-foreground))" }}>
                    <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: "hsl(var(--gold))" }} />
                    <p className="text-sm">Starting pipeline...</p>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-5 rounded-xl" style={{ background: "hsl(0 72% 55% / 0.08)", border: "1px solid hsl(0 72% 55% / 0.35)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-400">Generation Error</span>
                </div>
                <p className="text-sm text-red-200/90 mb-4 leading-relaxed">{error}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="text-xs"
                    style={{ borderColor: "hsl(var(--gold) / 0.5)", color: "hsl(var(--gold))" }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Try Again
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    ← Back to start
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
