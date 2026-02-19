import jsPDF from "jspdf";

interface GeneratePDFOptions {
  assignment: any;
  papers: any[];
  params: any;
}

export async function generatePDF({ assignment, papers, params }: GeneratePDFOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginL = 25;
  const marginR = 25;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkY = (needed = 15) => {
    if (y + needed > pageH - 20) addPage();
  };

  const setFont = (style: "bold" | "normal" | "italic", size: number) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  const writeLine = (text: string, indent = 0, lineHeight = 6) => {
    checkY(lineHeight + 2);
    doc.text(text, marginL + indent, y);
    y += lineHeight;
  };

  const writeBlock = (text: string, indent = 0, size = 10) => {
    setFont("normal", size);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text || "", contentW - indent);
    lines.forEach((line: string) => {
      checkY(6);
      doc.text(line, marginL + indent, y);
      y += 5.5;
    });
    y += 2;
  };

  const sectionTitle = (title: string) => {
    checkY(14);
    y += 4;
    setFont("bold", 13);
    doc.setTextColor(160, 110, 30);
    doc.text(title, marginL, y);
    y += 2;
    doc.setDrawColor(160, 110, 30);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, marginL + contentW, y);
    y += 6;
    doc.setTextColor(40, 40, 40);
  };

  // ── COVER PAGE ──────────────────────────────────────────
  doc.setFillColor(10, 14, 30);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(160, 110, 30);
  doc.rect(0, 0, pageW, 3, "F");
  doc.rect(0, pageH - 3, pageW, 3, "F");

  doc.setTextColor(160, 110, 30);
  setFont("bold", 11);
  doc.text("RESEARCH METHODS ASSIGNMENT", pageW / 2, 40, { align: "center" });

  doc.setTextColor(232, 234, 240);
  setFont("bold", 20);
  const titleLines = doc.splitTextToSize(params.topic || "Research Topic", 160);
  let coverY = 70;
  titleLines.forEach((line: string) => {
    doc.text(line, pageW / 2, coverY, { align: "center" });
    coverY += 12;
  });

  doc.setTextColor(180, 180, 200);
  setFont("italic", 11);
  doc.text("A Systematic Literature Review and Novel Research Methodology", pageW / 2, coverY + 8, { align: "center" });

  // Details box
  doc.setDrawColor(160, 110, 30);
  doc.setLineWidth(0.5);
  doc.roundedRect(55, 165, 100, 70, 3, 3, "S");

  setFont("normal", 10);
  doc.setTextColor(180, 180, 200);
  const details = [
    ["Student:", params.studentName || "N/A"],
    ["Course:", params.courseName || "N/A"],
    ["Institution:", params.institution || "N/A"],
    ["Lecturer:", params.lecturer || "N/A"],
    ["Year:", params.year || "N/A"],
  ];
  let detailY = 178;
  details.forEach(([label, val]) => {
    setFont("bold", 10);
    doc.setTextColor(160, 110, 30);
    doc.text(label, 62, detailY);
    setFont("normal", 10);
    doc.setTextColor(220, 220, 235);
    doc.text(val, 90, detailY);
    detailY += 9;
  });

  doc.setTextColor(120, 120, 140);
  setFont("normal", 8);
  doc.text("IEEE Format • AI-Generated • Semantic Scholar Sources", pageW / 2, 260, { align: "center" });

  // ── CONTENT PAGES ─────────────────────────────────────────
  addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // Abstract
  sectionTitle("Abstract");
  writeBlock(assignment?.abstract || "", 0, 10);

  // Introduction
  sectionTitle("1. Introduction");
  writeBlock(assignment?.introduction || "", 0, 10);

  // Literature Review
  sectionTitle("2. Literature Review");
  writeBlock(assignment?.literatureReview || "", 0, 10);

  // Per-paper subsections
  papers?.forEach((p: any, i: number) => {
    checkY(12);
    setFont("bold", 10);
    doc.setTextColor(80, 100, 160);
    doc.text(`[${i + 1}] ${p.title || "Untitled"}`, marginL, y);
    y += 5;
    setFont("normal", 9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${p.authors?.join(", ") || ""} (${p.year || ""})`, marginL + 4, y);
    y += 5;
    if (p.abstract) {
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(p.abstract.substring(0, 400) + "...", contentW - 4);
      lines.slice(0, 4).forEach((l: string) => { checkY(5); doc.text(l, marginL + 4, y); y += 4.5; });
    }
    y += 3;
  });

  // Proposed Method
  sectionTitle("3. Proposed Research Method");
  writeBlock(assignment?.proposedMethod || "", 0, 10);

  // Diagrams note
  sectionTitle("4. System Diagrams");
  writeBlock("See attached digital preview for interactive Mermaid diagrams: System Architecture, Methodology Flowchart, Data Flow Diagram, and Research Process Diagram.", 0, 10);
  if (assignment?.diagrams) {
    assignment.diagrams.forEach((d: any, i: number) => {
      checkY(10);
      setFont("bold", 10);
      doc.setTextColor(80, 100, 160);
      doc.text(`Figure ${i + 1}: ${d.title}`, marginL, y);
      y += 5;
      setFont("normal", 9);
      doc.setTextColor(100, 100, 100);
      const codeLines = doc.splitTextToSize(d.code || "", contentW);
      codeLines.slice(0, 8).forEach((l: string) => { checkY(5); doc.text(l, marginL + 4, y); y += 4.5; });
      y += 3;
    });
  }

  // Implementation Plan
  sectionTitle("5. Implementation Plan");
  writeBlock(assignment?.implementationPlan || "", 0, 10);

  // Conclusion
  sectionTitle("6. Conclusion");
  writeBlock(assignment?.conclusion || "", 0, 10);

  // References
  sectionTitle("References (IEEE Format)");
  assignment?.references?.forEach((ref: string, i: number) => {
    checkY(8);
    setFont("normal", 9);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(ref, contentW);
    lines.forEach((l: string) => { checkY(5); doc.text(l, marginL, y); y += 4.5; });
    y += 1;
  });

  // Appendix: URLs
  sectionTitle("Appendix: Source Paper URLs");
  papers?.forEach((p: any, i: number) => {
    checkY(14);
    setFont("bold", 9);
    doc.setTextColor(60, 80, 150);
    doc.text(`[${i + 1}] ${p.title || ""}`, marginL, y);
    y += 5;
    setFont("normal", 8);
    doc.setTextColor(100, 100, 100);
    if (p.url) {
      doc.setTextColor(30, 80, 180);
      doc.text(p.url, marginL + 4, y);
      y += 4;
    }
    if (p.authors) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Authors: ${p.authors.join(", ")}`, marginL + 4, y);
      y += 4;
    }
    y += 2;
  });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    setFont("normal", 8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageW / 2, pageH - 10, { align: "center" });
    doc.text("Research Methods Assignment • IEEE Format", marginL, pageH - 10);
  }

  doc.save("ResearchAssignment.pdf");
}
