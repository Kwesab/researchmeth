/**
 * Generates a valid RIS file for import into EndNote, Mendeley, Zotero, etc.
 * Each field must start at column 0 with exactly "XX  - " (two spaces, hyphen, space).
 * The file must use CRLF line endings (\r\n) for maximum compatibility.
 */
export function generateRIS(papers: any[]): string {
  const CRLF = "\r\n";
  return papers.map((p) => {
    const lines: string[] = [];
    lines.push("TY  - JOUR");
    lines.push(`TI  - ${p.title || "Untitled"}`);
    (p.authors || ["Unknown Author"]).forEach((a: string) => {
      lines.push(`AU  - ${a}`);
    });
    if (p.year) lines.push(`PY  - ${p.year}`);
    if (p.venue) lines.push(`JO  - ${p.venue}`);
    if (p.venue) lines.push(`T2  - ${p.venue}`);
    if (p.abstract) lines.push(`AB  - ${p.abstract.substring(0, 1000).replace(/\r?\n/g, " ")}`);
    if (p.url) lines.push(`UR  - ${p.url}`);
    if (p.url) lines.push(`DO  - ${p.url}`);
    lines.push(`LA  - English`);
    lines.push(`DB  - IEEE/ACM/Springer`);
    lines.push("ER  - ");
    return lines.join(CRLF);
  }).join(CRLF + CRLF);
}

