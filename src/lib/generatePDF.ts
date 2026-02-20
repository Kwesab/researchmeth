import jsPDF from "jspdf";

interface GeneratePDFOptions {
  assignment: any;
  papers: any[];
  params: any;
  diagramImages?: (string | null)[]; // base64 PNG data URLs for each diagram
  logoBase64?: string | null; // pre-loaded logo passed from caller
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

/** Convert an SVG string to a PNG base64 data URL via an off-screen canvas.
 *  Uses a data: URI (not blob URL) to avoid canvas taint from cross-origin resources.
 */
export async function svgToPngDataUrl(svgString: string, width = 900, height = 500): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      // Inline all external references by stripping font-face declarations that reference external URLs
      // and replacing with a safe embedded version to avoid canvas taint
      const cleanSvg = svgString
        .replace(/@font-face\s*\{[^}]*\}/g, "") // remove @font-face blocks
        .replace(/font-family:[^;"}]*/g, "font-family:sans-serif"); // fallback font

      // Use a data URI instead of blob URL — avoids CORS taint on canvas
      const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(cleanSvg);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(null); return; }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = encoded;
    } catch {
      resolve(null);
    }
  });
}

export async function generatePDF({ assignment, papers, params, diagramImages, logoBase64: providedLogo }: GeneratePDFOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginL = 30;
  const marginR = 30;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 28;
  };

  const checkY = (needed = 15) => {
    if (y + needed > pageH - 25) addPage();
  };

  const setFont = (style: "bold" | "normal" | "italic", size: number) => {
    doc.setFontSize(size);
    doc.setFont("times", style);
  };

  const centeredText = (text: string, yPos: number, size: number, style: "bold" | "normal" | "italic" = "normal") => {
    setFont(style, size);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach((line: string) => {
      doc.text(line, pageW / 2, yPos, { align: "center" });
      yPos += size * 0.45;
    });
    return yPos;
  };

  const writeBlock = (text: string, indent = 0, size = 11) => {
    setFont("normal", size);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(stringifyField(text) || "", contentW - indent);
    lines.forEach((line: string) => {
      checkY(6);
      doc.text(line, marginL + indent, y);
      y += size * 0.42;
    });
    y += 3;
  };

  const sectionTitle = (title: string) => {
    checkY(16);
    y += 6;
    setFont("bold", 12);
    doc.setTextColor(0, 0, 0);
    doc.text(title, marginL, y);
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, marginL + contentW, y);
    y += 7;
  };

  // ── COVER PAGE ───────────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // University name — top of page
  y = 20;
  setFont("bold", 12);
  doc.setTextColor(0, 0, 0);
  doc.text("TAKORADI TECHNICAL UNIVERSITY", pageW / 2, y, { align: "center" });
  y += 6;

  // Thin rule under name
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginL + 20, y, pageW - marginR - 20, y);
  y += 10;

  // Logo — centred, appropriately sized, rendered on white canvas to ensure clean background
  let logoBase64: string | null = providedLogo ?? null;
  const logoSize = 48;
  const logoX = (pageW - logoSize) / 2;
  if (logoBase64) {
    // Re-render logo on a white canvas to strip any transparent/dark background
    try {
      const whiteBgLogo = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = 4; // render at 4× for crispness
          canvas.width = 400 * scale;
          canvas.height = 400 * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(logoBase64!); return; }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(logoBase64!);
        img.src = logoBase64!;
      });
      doc.addImage(whiteBgLogo, "PNG", logoX, y, logoSize, logoSize);
    } catch {
      doc.addImage(logoBase64, "JPEG", logoX, y, logoSize, logoSize);
    }
    y += logoSize + 10;
  } else {
    y += 10;
  }

  // Faculty / Department
  setFont("normal", 11);
  doc.setTextColor(0, 0, 0);
  doc.text("FACULTY OF APPLIED SCIENCES", pageW / 2, y, { align: "center" });
  y += 6;
  doc.text("DEPARTMENT OF COMPUTER SCIENCE", pageW / 2, y, { align: "center" });
  y += 14;

  // Thin rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginL + 10, y, pageW - marginR - 10, y);
  y += 10;

  // Assignment label
  setFont("bold", 11);
  doc.text("RESEARCH METHODS ASSIGNMENT", pageW / 2, y, { align: "center" });
  y += 12;

  // Topic
  const topicText = params.topic || "Research Topic";
  setFont("normal", 11);
  const topicLines = doc.splitTextToSize(topicText.toUpperCase(), contentW - 10);
  topicLines.forEach((line: string) => {
    doc.text(line, pageW / 2, y, { align: "center" });
    y += 6;
  });
  y += 14;

  // BY
  setFont("italic", 11);
  doc.text("By", pageW / 2, y, { align: "center" });
  y += 8;

  // Student Name
  setFont("bold", 12);
  doc.text((params.studentName || "Student Name").toUpperCase(), pageW / 2, y, { align: "center" });
  y += 7;

  // Index Number
  if (params.indexNumber) {
    setFont("normal", 11);
    doc.text(params.indexNumber.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 7;
  }

  // Submission date
  if (params.submissionDate) {
    setFont("normal", 11);
    doc.text(params.submissionDate, pageW / 2, y, { align: "center" });
    y += 7;
  }

  y += 6;

  // Course / Lecturer
  if (params.courseName) {
    setFont("normal", 11);
    doc.text(params.courseName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6;
  }
  if (params.lecturer) {
    setFont("normal", 11);
    doc.text(`LECTURER: ${(params.lecturer).toUpperCase()}`, pageW / 2, y, { align: "center" });
    y += 6;
  }

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────
  addPage();

  setFont("bold", 13);
  doc.setTextColor(0, 0, 0);
  doc.text("TABLE OF CONTENTS", pageW / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  const tocItems: [string, string, boolean][] = [
    ["Abstract", "3", false],
    ["1. Introduction", "3", false],
    ["2. Literature Review", "4", false],
    ["   2.1 Overview of Selected Papers", "4", true],
    ["3. Proposed Research Method", "5", false],
    ["4. System Diagrams", "6", false],
    ["5. Implementation Plan", "7", false],
    ["6. Conclusion", "8", false],
    ["References (IEEE Format)", "9", false],
    ["Appendix: Source Paper URLs", "10", false],
  ];

  tocItems.forEach(([item, page, isIndent]) => {
    setFont(isIndent ? "normal" : "bold", 11);
    doc.setTextColor(0, 0, 0);
    const indent = isIndent ? 8 : 0;
    doc.text(item.trim(), marginL + indent, y);
    doc.text(page, pageW - marginR, y, { align: "right" });
    // Dotted line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    const textW = doc.getStringUnitWidth(item.trim()) * 11 * 0.352778 + indent;
    const dotStart = marginL + textW + 3;
    const dotEnd = pageW - marginR - 8;
    let dotX = dotStart;
    while (dotX < dotEnd) {
      doc.circle(dotX, y - 1, 0.3, "F");
      dotX += 2.5;
    }
    y += 8;
  });

  // ── CONTENT PAGES ─────────────────────────────────────────
  addPage();

  // Abstract
  sectionTitle("Abstract");
  writeBlock(assignment?.abstract || "", 0, 11);

  // Introduction
  sectionTitle("1. Introduction");
  writeBlock(assignment?.introduction || "", 0, 11);

  // Literature Review
  sectionTitle("2. Literature Review");
  writeBlock(assignment?.literatureReview || "", 0, 11);

  // Per-paper subsections
  papers?.forEach((p: any, i: number) => {
    checkY(20);
    setFont("bold", 11);
    doc.setTextColor(0, 0, 0);
    const paperHeader = doc.splitTextToSize(`[${i + 1}] ${p.title || "Untitled"}`, contentW);
    paperHeader.forEach((l: string) => {
      checkY(6);
      doc.text(l, marginL, y);
      y += 5.5;
    });
    setFont("italic", 10);
    doc.setTextColor(60, 60, 60);
    const authYear = `${p.authors?.join(", ") || ""} (${p.year || ""}) — ${p.venue || "IEEE"}`;
    const authLines = doc.splitTextToSize(authYear, contentW);
    authLines.forEach((l: string) => {
      checkY(5);
      doc.text(l, marginL + 4, y);
      y += 5;
    });
    y += 1;
    if (p.abstract) {
      doc.setTextColor(40, 40, 40);
      setFont("normal", 10);
      const abLines = doc.splitTextToSize(p.abstract.substring(0, 600) + "...", contentW - 4);
      abLines.slice(0, 7).forEach((l: string) => {
        checkY(5);
        doc.text(l, marginL + 4, y);
        y += 5;
      });
    }
    y += 5;
  });

  // Proposed Method
  sectionTitle("3. Proposed Research Method");
  writeBlock(assignment?.proposedMethod || "", 0, 11);

  // Diagrams section — embed actual PNG images
  sectionTitle("4. System Diagrams");
  if (assignment?.diagrams) {
    assignment.diagrams.forEach((d: any, i: number) => {
      checkY(20);
      setFont("bold", 11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Figure ${i + 1}: ${stringifyField(d.title) || ""}`, marginL, y);
      y += 6;

      const imgData = diagramImages?.[i];
      if (imgData) {
        // Embed the PNG image — constrain to content width
        const maxW = contentW;
        const maxH = 80; // mm
        checkY(maxH + 5);
        try {
          doc.addImage(imgData, "PNG", marginL, y, maxW, maxH);
          y += maxH + 6;
        } catch {
          // Fallback to code if image embed fails
          setFont("normal", 8);
          doc.setTextColor(80, 80, 80);
          const codeLines = doc.splitTextToSize(stringifyField(d.code) || "", contentW);
          codeLines.slice(0, 8).forEach((l: string) => {
            checkY(5);
            doc.text(l, marginL + 4, y);
            y += 4.5;
          });
          y += 4;
        }
      } else {
        // No image: show code as fallback
        setFont("normal", 9);
        doc.setTextColor(80, 80, 80);
        const codeLines = doc.splitTextToSize(stringifyField(d.code) || "", contentW);
        codeLines.slice(0, 10).forEach((l: string) => {
          checkY(5);
          doc.text(l, marginL + 4, y);
          y += 4.5;
        });
        y += 4;
      }
    });
  }

  // Implementation Plan
  sectionTitle("5. Implementation Plan");
  writeBlock(assignment?.implementationPlan || "", 0, 11);

  // Conclusion
  sectionTitle("6. Conclusion");
  writeBlock(assignment?.conclusion || "", 0, 11);

  // References
  sectionTitle("References (IEEE Format)");
  assignment?.references?.forEach((ref: string) => {
    checkY(8);
    setFont("normal", 10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(stringifyField(ref), contentW);
    lines.forEach((l: string) => {
      checkY(5);
      doc.text(l, marginL, y);
      y += 5;
    });
    y += 1;
  });

  // Appendix: URLs
  sectionTitle("Appendix: Source Paper URLs");
  writeBlock("The following are the five source papers referenced in this assignment, with direct access URLs:", 0, 11);
  y += 2;
  papers?.forEach((p: any, i: number) => {
    checkY(22);
    setFont("bold", 10);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(`[${i + 1}] ${p.title || ""}`, contentW);
    titleLines.forEach((l: string) => {
      checkY(6);
      doc.text(l, marginL, y);
      y += 5.5;
    });
    setFont("italic", 9);
    doc.setTextColor(60, 60, 60);
    if (p.authors) {
      doc.text(`Authors: ${p.authors.join(", ")}`, marginL + 4, y);
      y += 5;
    }
    if (p.venue || p.year) {
      doc.text(`Venue: ${p.venue || "IEEE"} (${p.year || ""})`, marginL + 4, y);
      y += 5;
    }
    if (p.url) {
      setFont("normal", 9);
      doc.setTextColor(0, 0, 180);
      const urlLines = doc.splitTextToSize(`URL: ${p.url}`, contentW - 4);
      urlLines.forEach((l: string) => {
        checkY(5);
        doc.text(l, marginL + 4, y);
        y += 5;
      });
    }
    y += 5;
  });

  // Page numbers on all pages except cover
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    // Simple footer line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 15, pageW - marginR, pageH - 15);
    setFont("normal", 9);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${params.studentName || ""}${params.indexNumber ? "  |  " + params.indexNumber : ""}`,
      marginL, pageH - 10
    );
    doc.text(`Page ${i - 1}`, pageW - marginR, pageH - 10, { align: "right" });
  }

  doc.save("ResearchAssignment.pdf");
}
