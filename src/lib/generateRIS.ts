export function generateRIS(papers: any[]): string {
  return papers.map((p, i) => {
    const authors = (p.authors || ["Unknown"]).map((a: string) => `AU  - ${a}`).join("\n");
    return `TY  - JOUR
TI  - ${p.title || "Untitled"}
${authors}
PY  - ${p.year || "2023"}
JO  - ${p.venue || "IEEE"}
AB  - ${(p.abstract || "").substring(0, 500)}
UR  - ${p.url || ""}
N1  - Reference [${i + 1}]
ER  - `;
  }).join("\n\n");
}
