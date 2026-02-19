import jsPDF from "jspdf";

interface GeneratePDFOptions {
  assignment: any;
  papers: any[];
  params: any;
}

// Load image as base64 from URL
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const stringifyField = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join("\n");
  if (typeof val === "object") {
    return Object.values(val)
      .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
      .join("\n\n");
  }
  return String(val);
};

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

  const writeBlock = (text: string, indent = 0, size = 10) => {
    setFont("normal", size);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(stringifyField(text) || "", contentW - indent);
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
    doc.setTextColor(10, 60, 120);
    doc.text(title, marginL, y);
    y += 2;
    doc.setDrawColor(10, 60, 120);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, marginL + contentW, y);
    y += 6;
    doc.setTextColor(40, 40, 40);
  };

  // ── COVER PAGE (matches TTU academic format) ─────────────────────────
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // Top border bar (university color - dark blue/maroon)
  doc.setFillColor(10, 40, 100);
  doc.rect(0, 0, pageW, 5, "F");
  doc.rect(0, pageH - 5, pageW, 5, "F");

  // Try to load & embed the university logo
  let logoBase64: string | null = null;
  try {
    // Try loading from the assets path
    const logoModule = await import("@/assets/university-logo.jpg");
    const res = await fetch(logoModule.default);
    const blob = await res.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    logoBase64 = null;
  }

  const logoSize = 35;
  const logoX = (pageW - logoSize) / 2;
  if (logoBase64) {
    doc.addImage(logoBase64, "JPEG", logoX, 12, logoSize, logoSize);
  } else {
    // Placeholder circle if logo fails
    doc.setDrawColor(10, 40, 100);
    doc.setLineWidth(1);
    doc.circle(pageW / 2, 29, logoSize / 2, "S");
    setFont("bold", 7);
    doc.setTextColor(10, 40, 100);
    doc.text("UNIVERSITY", pageW / 2, 29, { align: "center" });
    doc.text("LOGO", pageW / 2, 33, { align: "center" });
  }

  // University name
  setFont("bold", 14);
  doc.setTextColor(10, 40, 100);
  const institutionName = params.institution || "TAKORADI TECHNICAL UNIVERSITY";
  doc.text(institutionName.toUpperCase(), pageW / 2, 55, { align: "center" });

  // Motto (italic, smaller)
  setFont("italic", 8);
  doc.setTextColor(80, 80, 80);
  doc.text("NSA MA MPUNTU ADWEN, AKOMANA", pageW / 2, 62, { align: "center" });

  // Horizontal line
  doc.setDrawColor(10, 40, 100);
  doc.setLineWidth(0.8);
  doc.line(marginL, 66, pageW - marginR, 66);

  // Faculty & Dept (if provided, else defaults)
  setFont("bold", 11);
  doc.setTextColor(10, 40, 100);
  doc.text("FACULTY OF APPLIED SCIENCES", pageW / 2, 74, { align: "center" });
  setFont("bold", 10);
  doc.setTextColor(30, 30, 30);
  doc.text("DEPARTMENT OF COMPUTER SCIENCE", pageW / 2, 81, { align: "center" });

  // Report title box
  doc.setFillColor(240, 245, 255);
  doc.setDrawColor(10, 40, 100);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginL, 90, contentW, 22, 2, 2, "FD");

  setFont("bold", 13);
  doc.setTextColor(10, 40, 100);
  doc.text("RESEARCH METHODS ASSIGNMENT", pageW / 2, 100, { align: "center" });
  setFont("italic", 9);
  doc.setTextColor(60, 60, 80);
  doc.text("A Systematic Literature Review and Novel Research Methodology", pageW / 2, 108, { align: "center" });

  // Research topic
  setFont("bold", 12);
  doc.setTextColor(20, 20, 60);
  const topicLines = doc.splitTextToSize(params.topic || "Research Topic", contentW - 10);
  let topicY = 122;
  setFont("normal", 9);
  doc.setTextColor(100, 100, 100);
  doc.text("ON THE TOPIC:", pageW / 2, topicY - 4, { align: "center" });
  setFont("bold", 13);
  doc.setTextColor(10, 40, 100);
  topicLines.forEach((line: string) => {
    doc.text(line, pageW / 2, topicY, { align: "center" });
    topicY += 8;
  });

  // Decorative separator
  topicY += 4;
  doc.setDrawColor(10, 40, 100);
  doc.setLineWidth(0.3);
  doc.line(marginL + 20, topicY, pageW - marginR - 20, topicY);
  topicY += 6;

  // "BY" label
  setFont("bold", 10);
  doc.setTextColor(40, 40, 40);
  doc.text("BY", pageW / 2, topicY, { align: "center" });
  topicY += 8;

  // Student info box
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(10, 40, 100);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginL + 15, topicY - 4, contentW - 30, 62, 2, 2, "FD");

  const infoItemsRaw: [string, string][] = [
    ["NAME:", params.studentName || "Student Name"],
    ["INDEX NO:", params.indexNumber || ""],
    ["COURSE:", params.courseName || "Research Methodology"],
    ["LECTURER:", params.lecturer || "Supervisor / Lecturer"],
    ["YEAR:", params.year || new Date().getFullYear().toString()],
    ["DATE:", params.submissionDate || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
  ];
  const infoItems: [string, string][] = infoItemsRaw.filter(([, val]) => val !== "") as [string, string][];

  let infoY = topicY + 7;
  const labelX = marginL + 22;
  const valueX = marginL + 55;

  infoItems.forEach(([label, value]) => {
    setFont("bold", 9);
    doc.setTextColor(10, 40, 100);
    doc.text(label, labelX, infoY);
    setFont("normal", 9);
    doc.setTextColor(30, 30, 30);
    const valLines = doc.splitTextToSize(value, contentW - 55);
    valLines.forEach((vl: string, vi: number) => {
      doc.text(vl, valueX, infoY + vi * 5);
    });
    infoY += 9;
  });

  // Footer note
  setFont("italic", 8);
  doc.setTextColor(120, 120, 140);
  doc.text("IEEE Format  •  AI-Generated Research  •  Semantic Scholar Sources", pageW / 2, pageH - 14, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, pageW / 2, pageH - 9, { align: "center" });

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────
  addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  setFont("bold", 14);
  doc.setTextColor(10, 40, 100);
  doc.text("TABLE OF CONTENTS", pageW / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(10, 40, 100);
  doc.setLineWidth(0.8);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  const tocItems = [
    ["Abstract", "3"],
    ["1. Introduction", "3"],
    ["2. Literature Review", "4"],
    ["   2.1 Overview of Selected Papers", "4"],
    ["3. Proposed Research Method", "5"],
    ["4. System Diagrams", "6"],
    ["5. Implementation Plan", "7"],
    ["6. Conclusion", "8"],
    ["References (IEEE Format)", "9"],
    ["Appendix: Source Paper URLs", "10"],
  ];

  tocItems.forEach(([item, page]) => {
    setFont(item.startsWith("   ") ? "normal" : "bold", 10);
    doc.setTextColor(30, 30, 30);
    const indent = item.startsWith("   ") ? 8 : 0;
    doc.text(item.trim(), marginL + indent, y);
    doc.text(page, pageW - marginR, y, { align: "right" });
    // Dotted line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    const textW = doc.getStringUnitWidth(item.trim()) * 10 * 0.352778;
    const dotStart = marginL + indent + textW + 3;
    const dotEnd = pageW - marginR - 8;
    let dotX = dotStart;
    while (dotX < dotEnd) {
      doc.circle(dotX, y - 1, 0.3, "F");
      dotX += 2;
    }
    y += 7;
  });

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
    checkY(20);
    setFont("bold", 10);
    doc.setTextColor(10, 60, 140);
    const paperHeader = doc.splitTextToSize(`[${i + 1}] ${p.title || "Untitled"}`, contentW);
    paperHeader.forEach((l: string) => {
      checkY(6);
      doc.text(l, marginL, y);
      y += 5;
    });
    setFont("italic", 9);
    doc.setTextColor(80, 80, 80);
    const authYear = `${p.authors?.join(", ") || ""} (${p.year || ""}) — ${p.venue || "IEEE"}`;
    const authLines = doc.splitTextToSize(authYear, contentW);
    authLines.forEach((l: string) => {
      checkY(5);
      doc.text(l, marginL + 4, y);
      y += 4.5;
    });
    y += 1;
    if (p.abstract) {
      doc.setTextColor(50, 50, 50);
      setFont("normal", 9);
      const abLines = doc.splitTextToSize(p.abstract.substring(0, 500) + "...", contentW - 4);
      abLines.slice(0, 6).forEach((l: string) => {
        checkY(5);
        doc.text(l, marginL + 4, y);
        y += 4.5;
      });
    }
    y += 4;
  });

  // Proposed Method
  sectionTitle("3. Proposed Research Method");
  writeBlock(assignment?.proposedMethod || "", 0, 10);

  // Diagrams note
  sectionTitle("4. System Diagrams");
  writeBlock(
    "The following diagrams illustrate the proposed research methodology. View the interactive digital preview for full Mermaid.js rendered diagrams.",
    0, 10
  );
  if (assignment?.diagrams) {
    assignment.diagrams.forEach((d: any, i: number) => {
      checkY(12);
      setFont("bold", 10);
      doc.setTextColor(10, 60, 140);
      doc.text(`Figure ${i + 1}: ${d.title || ""}`, marginL, y);
      y += 5;
      setFont("normal", 9);
      doc.setTextColor(100, 100, 100);
      const codeLines = doc.splitTextToSize(stringifyField(d.code) || "", contentW);
      codeLines.slice(0, 10).forEach((l: string) => {
        checkY(5);
        doc.text(l, marginL + 4, y);
        y += 4.5;
      });
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
  assignment?.references?.forEach((ref: string) => {
    checkY(8);
    setFont("normal", 9);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(stringifyField(ref), contentW);
    lines.forEach((l: string) => {
      checkY(5);
      doc.text(l, marginL, y);
      y += 4.5;
    });
    y += 1;
  });

  // Appendix: URLs
  sectionTitle("Appendix: Source Paper URLs");
  writeBlock("The following are the five source papers referenced in this assignment, with direct access URLs:", 0, 10);
  y += 2;
  papers?.forEach((p: any, i: number) => {
    checkY(20);
    setFont("bold", 9);
    doc.setTextColor(10, 40, 100);
    const titleLines = doc.splitTextToSize(`[${i + 1}] ${p.title || ""}`, contentW);
    titleLines.forEach((l: string) => {
      checkY(6);
      doc.text(l, marginL, y);
      y += 5;
    });
    setFont("italic", 8);
    doc.setTextColor(80, 80, 80);
    if (p.authors) {
      doc.text(`Authors: ${p.authors.join(", ")}`, marginL + 4, y);
      y += 4;
    }
    if (p.venue || p.year) {
      doc.text(`Venue: ${p.venue || "IEEE"} (${p.year || ""})`, marginL + 4, y);
      y += 4;
    }
    if (p.url) {
      setFont("normal", 8);
      doc.setTextColor(0, 70, 180);
      const urlLines = doc.splitTextToSize(`URL: ${p.url}`, contentW - 4);
      urlLines.forEach((l: string) => {
        checkY(5);
        doc.text(l, marginL + 4, y);
        y += 4;
      });
    }
    y += 4;
  });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    // Header bar
    doc.setFillColor(10, 40, 100);
    doc.rect(0, 0, pageW, 8, "F");
    setFont("normal", 7);
    doc.setTextColor(220, 230, 255);
    doc.text(
      `${params.institution || "TAKORADI TECHNICAL UNIVERSITY"} — Research Methods Assignment`,
      marginL, 5.5
    );
    doc.text(`${params.studentName || ""}${params.indexNumber ? " | " + params.indexNumber : ""}`, pageW - marginR, 5.5, { align: "right" });

    // Footer
    doc.setDrawColor(10, 40, 100);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 12, pageW - marginR, pageH - 12);
    setFont("normal", 8);
    doc.setTextColor(80, 80, 100);
    doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageW / 2, pageH - 8, { align: "center" });
    doc.text("IEEE Format", marginL, pageH - 8);
    doc.text(params.year || "", pageW - marginR, pageH - 8, { align: "right" });
  }

  doc.save("ResearchAssignment.pdf");
}
