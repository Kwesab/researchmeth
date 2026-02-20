import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Exponential backoff fetch — retries on 429 / 5xx up to maxRetries times */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 4): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);
    if (resp.status === 429 || resp.status >= 500) {
      if (attempt === maxRetries) return resp;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500; // 1s, 2s, 4s, 8s
      console.log(`Google API rate limited (${resp.status}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await resp.text(); // consume body to avoid resource leak
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return resp;
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { papers, topic, studentName, courseName, institution, lecturer, year } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!papers || papers.length === 0) throw new Error("No papers provided");

    // Prepare paper summaries for AI
    const paperSummaries = papers.map((p: any, i: number) => `
PAPER [${i + 1}]:
Title: ${p.title}
Authors: ${p.authors?.join(", ")}
Year: ${p.year}
Venue: ${p.venue}
Abstract: ${p.abstract?.substring(0, 600)}
URL: ${p.url}
`).join("\n---\n");

    const systemPrompt = `You are an expert research methodology professor and academic writer with decades of experience publishing in IEEE, ACM, and Springer journals. 
You write in a deeply human, intellectually engaging academic style — thoughtful, nuanced, and occasionally personal in perspective.
Your prose flows naturally with varied sentence structures, disciplined hedging, minor imperfections that reflect genuine scholarly thought, and the occasional rhetorical question or transitional reflection.
You NEVER use bullet points, markdown bold (**text**), asterisks, headers in prose, or numbered lists inside paragraph text. Every section is pure flowing prose paragraphs only.
You never write in a formulaic pattern. Each paragraph is organically connected to the next.
Write in formal academic English. Follow IEEE citation format strictly. Never plagiarize.`;

    const userPrompt = `Generate a complete, polished, LONG research methods assignment on the topic: "${topic}"

Based on these 5 scientific computing papers:

${paperSummaries}

WRITING STYLE RULES — CRITICAL:
- Write ALL prose in natural, flowing academic English. Paragraphs only — no bullet points, no numbered lists inside text, no headers inside sections.
- DO NOT use markdown formatting of any kind: no **bold**, no *italic*, no ## headers, no asterisks whatsoever inside prose text.
- Vary sentence length and structure. Include hedged language ("it is worth noting", "one might argue", "this raises the question of"), transitional phrases, and genuine scholarly commentary.
- The text must read as if written by a human expert. Avoid repetitive phrasing, mechanical structure, or AI-sounding patterns like "Firstly... Secondly... Thirdly...".
- Where a gap or limitation is described, complete the full thought naturally — never cut off mid-sentence.
- Write continuous paragraphs with natural breaks. No orphaned sentence fragments.
- TARGET TOTAL LENGTH: The combined word count of all sections must be at least 4,500 words, targeting a 13–15 page printed document.

DIAGRAMS RULE: Only include diagrams if the topic genuinely benefits from a visual representation (e.g., system architectures, process flows, pipelines). For purely theoretical or literature-survey topics, include at most 1 simple diagram or an empty array []. Quality over quantity — never pad with redundant diagrams.

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks around the JSON):

{
  "abstract": "350-420 word abstract written as two cohesive paragraphs. First paragraph: research context, what the 5 papers address, key gaps found. Second paragraph: the proposed method, expected contribution, and significance to the field.",

  "introduction": "900-1100 word introduction written as flowing prose paragraphs. Open with a broad, intellectually engaging narrative about the historical or social context of ${topic} — not a definition, but a story of how this domain emerged and why it matters. Then explore the current landscape in depth: industry trends, real-world challenges, policy implications. Gradually narrow to the specific problem. Explain the research significance in concrete terms. State the objectives of the assignment and describe its structure in a closing paragraph. Avoid any list-style formatting.",

  "literatureReview": "1300-1600 word literature review written as continuous prose paragraphs. Begin with a broad survey of the research landscape and theoretical underpinnings of ${topic}. Then naturally weave through each paper [1]-[5] in flowing prose — discuss their methodology, experimental design, key findings, contributions, and limitations organically. Do not treat each paper as a separate numbered item. Group papers thematically where appropriate. Compare and contrast approaches. Identify 4-5 concrete research gaps, explaining each gap in full, complete sentences. End with a rich synthesising paragraph about what the field still needs and how the gaps connect to each other.",

  "proposedMethod": "1000-1200 word description of an original proposed research method written as flowing prose paragraphs. Section 1: theoretical grounding and motivation (why this method). Section 2: research design and paradigm (qualitative/quantitative/mixed, justification). Section 3: data collection approach (sources, instruments, sampling strategy). Section 4: analytical techniques and tools. Section 5: ethical considerations and limitations. Section 6: how this method directly and innovatively addresses the gaps found. Draw on ideas from all 5 papers without explicitly saying 'as stated in [1]' repeatedly — integrate ideas naturally. The method must be genuinely novel and convincingly justified.",

  "implementationPlan": "600-750 word implementation plan written as prose paragraphs (not a bullet list). Describe six phases with approximate timeframes woven into the prose: (1) initial framework and literature synthesis (weeks 1-4), (2) data collection and environment setup (weeks 5-10), (3) system development and prototyping (weeks 11-14), (4) experimentation and analysis (weeks 15-18), (5) evaluation and validation (weeks 19-21), (6) writing, peer review, and dissemination (weeks 22-24). For each phase describe specific tasks, team roles where applicable, deliverables, and success indicators naturally within the paragraphs. Close with a paragraph on risk management and contingency planning.",

  "conclusion": "450-550 word conclusion written as flowing prose. Open by reflecting on the journey of the assignment. Summarise the key findings from the literature review — not as a list but as a synthesised narrative. Highlight what makes the proposed method novel and why it represents a meaningful contribution to ${topic}. Discuss limitations honestly and at length. Propose two or three specific directions for future work, explained as full paragraphs. Close with a genuinely considered forward-looking statement about the long-term impact of this research area.",

  "diagrams": [
    // Only include 1-2 diagrams if the topic has clear system/process components worth visualising. Use an empty array [] for purely theoretical topics.
    // Each diagram object: { "title": "...", "code": "valid Mermaid.js v11 syntax" }
    // MERMAID RULES:
    //   - NEVER place [1][2] citation brackets inside node label text — it breaks the parser.
    //   - NEVER use & inside labels — write "and".
    //   - Keep node labels short and free of special characters.
    //   - Only use: graph TD, flowchart LR, gantt (no other diagram types).
  ],

  "references": [
    "[1] ${papers[0]?.authors?.[0] || 'A. Author'}, \\"${papers[0]?.title?.substring(0, 55) || 'Title'}...,\\" ${papers[0]?.venue || 'IEEE Transactions'}, ${papers[0]?.year || '2023'}. [Online]. Available: ${papers[0]?.url || 'https://doi.org/xxx'}",
    "[2] ${papers[1]?.authors?.[0] || 'B. Author'}, \\"${papers[1]?.title?.substring(0, 55) || 'Title'}...,\\" ${papers[1]?.venue || 'ACM Computing'}, ${papers[1]?.year || '2022'}. [Online]. Available: ${papers[1]?.url || 'https://doi.org/xxx'}",
    "[3] ${papers[2]?.authors?.[0] || 'C. Author'}, \\"${papers[2]?.title?.substring(0, 55) || 'Title'}...,\\" ${papers[2]?.venue || 'Springer'}, ${papers[2]?.year || '2022'}. [Online]. Available: ${papers[2]?.url || 'https://doi.org/xxx'}",
    "[4] ${papers[3]?.authors?.[0] || 'D. Author'}, \\"${papers[3]?.title?.substring(0, 55) || 'Title'}...,\\" ${papers[3]?.venue || 'Elsevier'}, ${papers[3]?.year || '2021'}. [Online]. Available: ${papers[3]?.url || 'https://doi.org/xxx'}",
    "[5] ${papers[4]?.authors?.[0] || 'E. Author'}, \\"${papers[4]?.title?.substring(0, 55) || 'Title'}...,\\" ${papers[4]?.venue || 'IEEE Access'}, ${papers[4]?.year || '2021'}. [Online]. Available: ${papers[4]?.url || 'https://doi.org/xxx'}"
  ]
}

FINAL CHECKS before returning:
- Strip ALL ** asterisks, markdown bold, markdown headers from every prose field.
- Every sentence in every section must be complete — no trailing fragments like "there is a need for research that not only builds integrated systems but also evaluates them holistic".
- The diagrams array must contain ONLY valid Mermaid code with no citation brackets inside node labels.
- Return ONLY the raw JSON object. No markdown code fences. No extra commentary.`;

    console.log("Calling Lovable AI Gateway for assignment generation...");

    const aiResponse = await fetchWithRetry(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, parsing JSON...");

    // Parse JSON - strip markdown code blocks if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let assignment;
    try {
      assignment = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Try to extract JSON from the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assignment = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Strip any residual markdown bold/italic from prose fields
    const proseFields = ["abstract", "introduction", "literatureReview", "proposedMethod", "implementationPlan", "conclusion"];
    for (const field of proseFields) {
      if (typeof assignment[field] === "string") {
        assignment[field] = assignment[field]
          .replace(/\*\*([^*]+)\*\*/g, "$1")   // **bold** → plain
          .replace(/\*([^*]+)\*/g, "$1")         // *italic* → plain
          .replace(/#+\s+/g, "")                 // ## headings → nothing
          .replace(/_{2,}([^_]+)_{2,}/g, "$1")  // __bold__ → plain
          .trim();
      }
    }

    // Ensure references are properly formatted
    if (!assignment.references || assignment.references.length < 5) {
      assignment.references = papers.map((p: any, i: number) => {
        const firstAuthor = p.authors?.[0] || "Unknown Author";
        const nameParts = firstAuthor.split(" ");
        const lastName = nameParts[nameParts.length - 1] || firstAuthor;
        const initials = nameParts.slice(0, -1).map((n: string) => n[0] + ".").join(" ");
        const authorFmt = initials ? `${initials} ${lastName}` : lastName;
        return `[${i + 1}] ${authorFmt}, "${p.title}," ${p.venue || "IEEE"}, ${p.year || "2023"}. [Online]. Available: ${p.url}`;
      });
    }

    console.log("Assignment generated successfully");
    return new Response(JSON.stringify(assignment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-assignment error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
