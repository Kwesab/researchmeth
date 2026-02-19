import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Exponential backoff fetch — retries on 429 / 5xx up to maxRetries times */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);
    if (resp.status === 429 || resp.status >= 500) {
      if (attempt === maxRetries) return resp;
      const delay = Math.pow(2, attempt) * 500 + Math.random() * 300; // 500ms, 1s, 2s …
      console.log(`Rate limited (${resp.status}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return resp;
  }
  throw new Error("Max retries exceeded");
}

/** Search Semantic Scholar with retry */
async function searchSemanticScholar(query: string, limit = 20) {
  const fields = "title,authors,abstract,year,venue,externalIds,openAccessPdf,referenceCount,publicationTypes,publicationDate";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;
  const resp = await fetchWithRetry(url, {
    headers: { "User-Agent": "ResearchMethodsGenerator/1.0" },
  });
  if (!resp.ok) throw new Error(`Semantic Scholar API error: ${resp.status}`);
  const data = await resp.json();
  return data.data || [];
}

/** Fallback: OpenAlex — free, no rate limits, great coverage */
async function searchOpenAlex(query: string, limit = 10) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=has_abstract:true&per-page=${limit}&sort=cited_by_count:desc&mailto=research@lovable.dev`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OpenAlex API error: ${resp.status}`);
  const data = await resp.json();
  return (data.results || []).map((w: any) => ({
    title: w.display_name || w.title,
    authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
    abstract: w.abstract_inverted_index
      ? reconstructAbstract(w.abstract_inverted_index)
      : "",
    year: w.publication_year || new Date().getFullYear(),
    venue: w.primary_location?.source?.display_name || "IEEE",
    url: w.open_access?.oa_url || w.doi ? `https://doi.org/${w.doi?.replace("https://doi.org/", "")}` : w.id,
    semanticId: w.id,
    doi: w.doi || null,
  }));
}

/** OpenAlex stores abstracts as inverted index — reconstruct plain text */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.filter(Boolean).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Searching papers for: ${topic}`);

    const preferredVenues = ["IEEE", "ACM", "Springer", "Elsevier", "USENIX", "NDSS", "CCS", "WWW", "ICSE", "SOSP"];

    function scorePaper(p: any) {
      let score = 0;
      const venue = p.venue || "";
      if (preferredVenues.some(v => venue.toUpperCase().includes(v))) score += 10;
      if (p.year && p.year >= 2019) score += 5;
      if (p.url && p.url.startsWith("http")) score += 3;
      if (p.abstract && p.abstract.length > 300) score += 2;
      return score;
    }

    let papers: any[] = [];

    // --- Primary: Semantic Scholar (with retry) ---
    try {
      const ssRaw = await searchSemanticScholar(`${topic} computing technology`, 20);
      console.log(`Semantic Scholar returned ${ssRaw.length} results`);

      const ssPapers = ssRaw
        .filter((p: any) => p.title && p.abstract && p.abstract.length > 100)
        .map((p: any) => ({
          title: p.title,
          authors: p.authors?.map((a: any) => a.name) || [],
          abstract: p.abstract || "",
          year: p.year || new Date().getFullYear(),
          venue: p.venue || "IEEE",
          url: p.openAccessPdf?.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
          semanticId: p.paperId,
          doi: p.externalIds?.DOI || null,
          _score: scorePaper({
            venue: p.venue,
            year: p.year,
            url: p.openAccessPdf?.url,
            abstract: p.abstract,
          }),
        }))
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 5);

      papers = ssPapers;
    } catch (ssErr) {
      console.warn("Semantic Scholar failed:", ssErr.message);
    }

    // --- Fallback / top-up: OpenAlex ---
    if (papers.length < 5) {
      console.log(`Only ${papers.length} papers from Semantic Scholar, fetching from OpenAlex…`);
      try {
        const oaRaw = await searchOpenAlex(`${topic} computing`, 15);
        const existing = new Set(papers.map((p: any) => p.title?.toLowerCase()));

        const oaPapers = oaRaw
          .filter((p: any) => p.title && p.abstract && p.abstract.length > 100 && !existing.has(p.title?.toLowerCase()))
          .map((p: any) => ({ ...p, _score: scorePaper(p) }))
          .sort((a: any, b: any) => b._score - a._score)
          .slice(0, 5 - papers.length);

        papers.push(...oaPapers);
        console.log(`After OpenAlex top-up: ${papers.length} papers`);
      } catch (oaErr) {
        console.warn("OpenAlex also failed:", oaErr.message);
      }
    }

    // Strip internal scoring field
    const clean = papers.map(({ _score, ...rest }: any) => rest);

    console.log(`Returning ${clean.length} papers`);

    return new Response(JSON.stringify({ papers: clean }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("search-papers error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
