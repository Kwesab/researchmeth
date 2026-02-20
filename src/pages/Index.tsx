import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, FileText, Search, Brain, Download, ChevronRight, Sparkles, GraduationCap, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const features = [
  { icon: Search, label: "Paper Discovery", desc: "Searches Semantic Scholar for 5 relevant IEEE/ACM computing papers (≤15 pages)" },
  { icon: Brain, label: "Paper Analysis", desc: "Compares and synthesizes methodologies across the 5 papers" },
  { icon: FileText, label: "Assignment Output", desc: "Cover page, abstract, literature review, methodology, diagrams, references" },
  { icon: Download, label: "PDF + Reference Export", desc: "Downloads assignment PDF, .RIS file, EndNote screenshot, and paper URLs" },
];

const PIPELINE_PHASES = [
  { label: "Search", startNum: 1, steps: ["Search Semantic Scholar", "Select 5 Papers", "Extract Metadata"], icon: Search },
  { label: "Generate", startNum: 4, steps: ["Paper Analysis", "Research Gaps", "Novel Method", "Write Assignment", "IEEE Refs", "Export .RIS"], icon: Brain },
  { label: "Render", startNum: 10, steps: ["Mermaid Diagrams", "Compile Output"], icon: FileText },
];

export default function Index() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    topic: "",
    studentName: "",
    indexNumber: "",
    courseName: "",
    institution: "",
    lecturer: "",
    year: new Date().getFullYear().toString(),
    submissionDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  });

  const topicInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { topicInputRef.current?.focus(); }, []);

  const topicEmpty = !form.topic.trim();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicEmpty) return;
    const params = new URLSearchParams(form as Record<string, string>);
    navigate(`/generate?${params.toString()}`);
  };

  return (
    <div className="min-h-screen animate-in">
      {/* Header */}
      <header className="border-b backdrop-blur-sm" style={{ borderColor: "hsl(var(--navy-border))", background: "hsl(var(--background) / 0.8)" }}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity" aria-label="Research Methods - Home">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--gradient-gold)", boxShadow: "0 4px 14px hsl(43 85% 58% / 0.35)" }}>
              <GraduationCap className="w-5 h-5" style={{ color: "hsl(var(--navy-deep))" }} />
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "hsl(var(--gold))" }}>Research Methods</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Assignment Generator</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="badge-ieee">IEEE Format</span>
            <span className="badge-ieee">Gemini</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-16 md:pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full mb-8 text-sm font-medium shadow-lg fade-in-up"
          style={{ background: "hsl(var(--gold) / 0.12)", color: "hsl(var(--gold))", border: "1px solid hsl(var(--gold) / 0.35)", boxShadow: "0 0 30px hsl(43 85% 58% / 0.15)" }}>
          <Sparkles className="w-4 h-4" />
          11-Step Research Pipeline
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
          Research Methods
          <br />
          <span className="hero-gradient-text">Assignment Generator</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          Enter your topic. We find 5 papers, analyze methodologies, and generate
          a full assignment with IEEE references, diagrams, and PDF export.
        </p>
        <p className="text-sm mb-12" style={{ color: "hsl(var(--muted-foreground))" }}>
          Papers sourced from IEEE, ACM, Springer & Elsevier • ≤15 pages each • IEEE [1]–[5] format
        </p>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto glass-card p-6 md:p-8 gold-border border text-left fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5" style={{ color: "hsl(var(--gold))" }} />
            <h2 className="font-display text-xl font-semibold" style={{ color: "hsl(var(--gold))" }}>
              Assignment Details
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>
                Research Topic <span style={{ color: "hsl(var(--gold))" }}>*</span>
              </Label>
              <Input
                ref={topicInputRef}
                required
                placeholder='e.g. "Blockchain Technology in Healthcare Security"'
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="h-12 text-base input-focus transition-all duration-200"
                style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
              />
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Must be a computing/technology topic for IEEE paper discovery
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Student Name <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
                <Input
                  placeholder="Your full name"
                  value={form.studentName}
                  onChange={e => setForm({ ...form, studentName: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>
                  Index / Student No. <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. BC/ICT/22/148"
                  value={form.indexNumber}
                  onChange={e => setForm({ ...form, indexNumber: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Course Name <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
                <Input
                  placeholder="e.g. Research Methodology"
                  value={form.courseName}
                  onChange={e => setForm({ ...form, courseName: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Institution <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
                <Input
                  placeholder="e.g. Takoradi Technical University"
                  value={form.institution}
                  onChange={e => setForm({ ...form, institution: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Lecturer Name <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
                <Input
                  placeholder="Supervisor / Lecturer"
                  value={form.lecturer}
                  onChange={e => setForm({ ...form, lecturer: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Year <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
                <Input
                  placeholder="2025"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  className="input-focus transition-all duration-200"
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Submission Date <span className="text-[10px] font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span></Label>
              <Input
                placeholder={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                value={form.submissionDate}
                onChange={e => setForm({ ...form, submissionDate: e.target.value })}
                className="input-focus transition-all duration-200"
                style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
              />
            </div>
            <div className="mt-4 space-y-1">
              <Button
                type="submit"
                disabled={topicEmpty}
                className="w-full h-14 text-base font-semibold flex items-center justify-center gap-2 rounded-xl btn-gold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                <Sparkles className="w-5 h-5" />
                Generate Assignment
                <ChevronRight className="w-5 h-5" />
              </Button>
              {topicEmpty && <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>Enter a research topic above to continue</p>}
            </div>
          </form>
        </div>
      </section>

      {/* Pipeline - Visual Flow */}
      <section className="container mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl font-bold text-center mb-10" style={{ color: "hsl(var(--foreground))" }}>
          11-Step Pipeline
        </h2>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-4 justify-center">
            {PIPELINE_PHASES.map((phase, phaseIdx) => (
              <React.Fragment key={phase.label}>
                <div className="flex-1 glass-card p-5 rounded-2xl transition-all duration-300 group">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors" style={{ background: "hsl(var(--gold) / 0.15)" }}>
                      <phase.icon className="w-4 h-4" style={{ color: "hsl(var(--gold))" }} />
                    </div>
                    <span className="font-display font-semibold text-sm" style={{ color: "hsl(var(--gold))" }}>
                      {phase.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ background: "hsl(var(--gold) / 0.2)", color: "hsl(var(--gold))" }}>
                      {phase.steps.length} steps
                    </span>
                  </div>
                  <div className="space-y-2">
                    {phase.steps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 group-hover:bg-white/[0.02]"
                        style={{ background: "hsl(var(--navy-surface) / 0.6)", border: "1px solid hsl(var(--navy-border))", color: "hsl(var(--foreground) / 0.9)" }}
                      >
                        <span className="font-mono text-[10px] font-bold flex-shrink-0" style={{ color: "hsl(var(--gold))" }}>
                          {String(phase.startNum + stepIdx).padStart(2, "0")}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
                {phaseIdx < PIPELINE_PHASES.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center flex-shrink-0 px-2">
                    <ArrowRight className="w-6 h-6" style={{ color: "hsl(var(--gold) / 0.5)" }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "hsl(var(--navy-surface))", border: "1px solid hsl(var(--navy-border))" }}>
              <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--gold))" }}>11</span>
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>steps total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card p-5 fade-in-up group cursor-default transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200" style={{ background: "hsl(var(--gold) / 0.12)" }}>
                <f.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" style={{ color: "hsl(var(--gold))" }} />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{f.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center" style={{ borderColor: "hsl(var(--navy-border))" }}>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Research Methods Assignment Generator • IEEE Format
        </p>
      </footer>
    </div>
  );
}
