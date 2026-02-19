import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    console.log(`Searching papers for: ${topic}`);

    // Search Semantic Scholar for computing papers
    const query = encodeURIComponent(`${topic} computing technology`);
    const fields = "title,authors,abstract,year,venue,externalIds,openAccessPdf,referenceCount,publicationTypes,publicationDate";
    const semanticUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&limit=20&fields=${fields}`;

    const response = await fetch(semanticUrl, {
      headers: { "User-Agent": "ResearchMethodsGenerator/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const searchData = await response.json();
    const allPapers = searchData.data || [];

    console.log(`Found ${allPapers.length} papers from Semantic Scholar`);

    // Filter and rank papers: prefer those with abstracts, good venues
    const preferredVenues = ["IEEE", "ACM", "Springer", "Elsevier", "USENIX", "NDSS", "CCS", "WWW", "ICSE", "SOSP"];
    
    const scored = allPapers
      .filter((p: any) => p.title && p.abstract && p.abstract.length > 100)
      .map((p: any) => {
        let score = 0;
        const venue = p.venue || "";
        if (preferredVenues.some(v => venue.toUpperCase().includes(v))) score += 10;
        if (p.year && p.year >= 2019) score += 5;
        if (p.openAccessPdf?.url) score += 3;
        if (p.abstract && p.abstract.length > 300) score += 2;
        // Prefer papers ≤15 pages (we estimate from reference count / paper type)
        // referenceCount can be a proxy; papers with refs 20-50 are typically 10-15 pages
        if (p.referenceCount && p.referenceCount >= 10 && p.referenceCount <= 60) score += 2;
        return { ...p, _score: score };
      })
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, 5);

    // Build clean paper objects
    const papers = scored.map((p: any) => ({
      title: p.title,
      authors: p.authors?.map((a: any) => a.name) || [],
      abstract: p.abstract || "",
      year: p.year || new Date().getFullYear(),
      venue: p.venue || "IEEE",
      url: p.openAccessPdf?.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
      semanticId: p.paperId,
      doi: p.externalIds?.DOI || null,
    }));

    // If we got less than 5, pad with fallback search
    if (papers.length < 5) {
      const fallbackQuery = encodeURIComponent(topic);
      const fallbackUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${fallbackQuery}&limit=10&fields=${fields}`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: { "User-Agent": "ResearchMethodsGenerator/1.0" },
      });
      if (fallbackResp.ok) {
        const fallbackData = await fallbackResp.json();
        const extra = (fallbackData.data || [])
          .filter((p: any) => p.title && p.abstract && !papers.find((ex: any) => ex.semanticId === p.paperId))
          .slice(0, 5 - papers.length)
          .map((p: any) => ({
            title: p.title,
            authors: p.authors?.map((a: any) => a.name) || [],
            abstract: p.abstract || "",
            year: p.year || new Date().getFullYear(),
            venue: p.venue || "IEEE",
            url: p.openAccessPdf?.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
            semanticId: p.paperId,
            doi: p.externalIds?.DOI || null,
          }));
        papers.push(...extra);
      }
    }

    console.log(`Returning ${papers.length} papers`);

    return new Response(JSON.stringify({ papers }), {
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
