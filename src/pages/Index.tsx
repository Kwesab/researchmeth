import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Search, Brain, Download, ChevronRight, Sparkles, GraduationCap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const features = [
  { icon: Search, label: "Auto Paper Discovery", desc: "Searches Semantic Scholar for 5 relevant IEEE/ACM computing papers (≤15 pages)" },
  { icon: Brain, label: "AI Analysis & Synthesis", desc: "Gemini AI reads, compares, and synthesizes methodologies from all 5 papers" },
  { icon: FileText, label: "Full Assignment Generation", desc: "Generates cover page, abstract, literature review, methodology, diagrams, references" },
  { icon: Download, label: "PDF + Reference Export", desc: "Downloads assignment PDF, .RIS file, EndNote screenshot, and paper URLs" },
];

const steps = [
  "Search Google Scholar", "Select 5 Computing Papers", "Download Paper Metadata",
  "AI Analysis of Papers", "Generate New Research Method", "Create Mermaid Diagrams",
  "Write Full Assignment", "Generate IEEE References", "Export .RIS File",
  "EndNote Screenshot", "Build Final PDF",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) return;
    const params = new URLSearchParams(form as Record<string, string>);
    navigate(`/generate?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b" style={{ borderColor: "hsl(var(--navy-border))" }}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <GraduationCap className="w-5 h-5" style={{ color: "hsl(var(--navy-deep))" }} />
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "hsl(var(--gold))" }}>Research Methods</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Auto Generator</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-ieee">IEEE Format</span>
            <span className="badge-ieee">AI Powered</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
          style={{ background: "hsl(var(--gold) / 0.1)", color: "hsl(var(--gold))", border: "1px solid hsl(var(--gold) / 0.3)" }}>
          <Sparkles className="w-4 h-4" />
          Fully Automatic • 11-Step AI Research Pipeline
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Research Methods
          <br />
          <span className="hero-gradient-text">Auto Generator</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          Enter your research topic. Our AI automatically finds 5 scientific computing papers,
          analyzes their methodologies, and generates a complete research assignment
          with IEEE references, diagrams, and downloadable PDF.
        </p>
        <p className="text-sm mb-12" style={{ color: "hsl(var(--muted-foreground))" }}>
          Papers sourced from IEEE, ACM, Springer & Elsevier • ≤15 pages each • IEEE [1]–[5] format
        </p>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto glass-card p-8 gold-border border text-left">
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
                required
                placeholder='e.g. "Blockchain Technology in Healthcare Security"'
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                className="h-12 text-base"
                style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
              />
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Must be a computing/technology topic for IEEE paper discovery
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Student Name</Label>
                <Input
                  placeholder="Your full name"
                  value={form.studentName}
                  onChange={e => setForm({ ...form, studentName: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>
                  Index / Student Number
                </Label>
                <Input
                  placeholder="e.g. BC/ICT/22/148"
                  value={form.indexNumber}
                  onChange={e => setForm({ ...form, indexNumber: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Course Name</Label>
                <Input
                  placeholder="e.g. Research Methodology"
                  value={form.courseName}
                  onChange={e => setForm({ ...form, courseName: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Institution</Label>
                <Input
                  placeholder="e.g. Takoradi Technical University"
                  value={form.institution}
                  onChange={e => setForm({ ...form, institution: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Lecturer Name</Label>
                <Input
                  placeholder="Supervisor / Lecturer"
                  value={form.lecturer}
                  onChange={e => setForm({ ...form, lecturer: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Year</Label>
                <Input
                  placeholder="2025"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>Submission Date</Label>
              <Input
                placeholder={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                value={form.submissionDate}
                onChange={e => setForm({ ...form, submissionDate: e.target.value })}
                style={{ background: "hsl(var(--navy-surface))", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--foreground))" }}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold mt-2 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-gold)", color: "hsl(var(--navy-deep))" }}
            >
              <Sparkles className="w-5 h-5" />
              Generate Full Research Assignment
              <ChevronRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </section>

      {/* Pipeline Steps */}
      <section className="container mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: "hsl(var(--foreground))" }}>
          11-Step Automated Pipeline
        </h2>
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "hsl(var(--navy-surface))", border: "1px solid hsl(var(--navy-border))", color: "hsl(var(--muted-foreground))" }}
            >
              <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--gold))" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-5 fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "hsl(var(--gold) / 0.1)" }}>
                <f.icon className="w-5 h-5" style={{ color: "hsl(var(--gold))" }} />
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "hsl(var(--foreground))" }}>{f.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center" style={{ borderColor: "hsl(var(--navy-border))" }}>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Research Methods Auto Generator • IEEE Format • AI-Powered Academic Tool
        </p>
      </footer>
    </div>
  );
}
