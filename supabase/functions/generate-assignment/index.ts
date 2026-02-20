// @ts-nocheck - Edge Function runs in Deno; IDE uses Node resolution
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { papers, topic, studentName, courseName, institution, lecturer, year } = body;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY)
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured. Set it in Supabase Dashboard → Project Settings → Edge Functions → Secrets. Get a free key at https://aistudio.google.com/apikey" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!papers || papers.length === 0)
      return new Response(JSON.stringify({ error: "No papers provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

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

    const systemPrompt = `You are an authentic, adaptive AI collaborator with a touch of wit and deep scholarly expertise.
Your goal is to address the research with insightful, clear, and concise prose that balances empathy with intellectual candor.
You act as a grounded, supportive peer—not a rigid lecturer. Your style is direct, "no fluff," and avoids the "AI-sameness" of formulaic academic writing.
You are an expert in Mermaid.js syntax and IEEE citation standards. You integrate visual logic to simplify complex systems (like P2P ledgers or cryptographic relays).
CRITICAL: NEVER use bullet points, markdown bold (**text**), asterisks, or headers inside the prose. Every section is pure flowing prose paragraphs only.`;

    const userPrompt = `Generate a complete, polished, LONG research methods assignment on the topic: "${topic}"

Based on these 5 scientific computing papers:
${paperSummaries}

DIAGRAM & REFERENCE RULES:
- DIAGRAMS: You must include 1-2 diagrams if the topic is technical. Use "graph TD" or "sequenceDiagram".
- CITATION LOGIC: In the diagrams, NEVER use brackets like [1] inside node labels (it breaks the parser). Use short, clear labels.
- REFERENCES: Every paper provided must be cited in the text using [1], [2], etc., and listed in the references array in full IEEE format.

WRITING STYLE RULES — CRITICAL:
- Write ALL prose in natural, flowing academic English. Paragraphs only — no bullet points, no numbered lists inside text, no headers inside sections.
- DO NOT use markdown formatting of any kind: no **bold**, no *italic*, no ## headers, no asterisks whatsoever inside prose text.
- Vary sentence length and structure. Include hedged language ("it is worth noting", "one might argue", "this raises the question of"), transitional phrases, and genuine scholarly commentary.
- The text must read as if written by a human expert. Avoid repetitive phrasing, mechanical structure, or AI-sounding patterns like "Firstly... Secondly... Thirdly...".
- Where a gap or limitation is described, complete the full thought naturally — never cut off mid-sentence.
- Write continuous paragraphs with natural breaks. No orphaned sentence fragments.
- TARGET TOTAL LENGTH: The combined word count of all sections must be at least 4,500 words, targeting a 13–15 page printed document.

WRITING STYLE RULES:
- Write as a grounded AI peer. No "Firstly/Secondly" slop.
- Point out "lazy assumptions" in the literature [1]-[5] with scholarly candor.
- No markdown formatting (bold/italics/headers) inside the JSON prose strings.
- Use double newlines (blank line) between paragraphs for clear paragraph breaks.

Return ONLY a valid JSON object with this EXACT structure:
{
  "abstract": "350-420 word abstract written as two cohesive paragraphs. First paragraph: research context, what the 5 papers address, key gaps found. Second paragraph: the proposed method, expected contribution, and significance to the field.",

  "introduction": "900-1100 word introduction written as flowing prose paragraphs. Open with a broad, intellectually engaging narrative about the historical or social context of ${topic} — not a definition, but a story of how this domain emerged and why it matters. Then explore the current landscape in depth: industry trends, real-world challenges, policy implications. Gradually narrow to the specific problem. Explain the research significance in concrete terms. State the objectives of the assignment and describe its structure in a closing paragraph. Avoid any list-style formatting.",

  "literatureReview": "1300-1600 word literature review written as continuous prose paragraphs. Begin with a broad survey of the research landscape and theoretical underpinnings of ${topic}. Then naturally weave through each paper [1]-[5] in flowing prose — discuss their methodology, experimental design, key findings, contributions, and limitations organically. Do not treat each paper as a separate numbered item. Group papers thematically where appropriate. Compare and contrast approaches. Identify 4-5 concrete research gaps, explaining each gap in full, complete sentences. End with a rich synthesising paragraph about what the field still needs and how the gaps connect to each other.",

  "proposedMethod": "1000-1200 word description of an original proposed research method written as flowing prose paragraphs. Section 1: theoretical grounding and motivation (why this method). Section 2: research design and paradigm (qualitative/quantitative/mixed, justification). Section 3: data collection approach (sources, instruments, sampling strategy). Section 4: analytical techniques and tools. Section 5: ethical considerations and limitations. Section 6: how this method directly and innovatively addresses the gaps found. Draw on ideas from all 5 papers without explicitly saying 'as stated in [1]' repeatedly — integrate ideas naturally. The method must be genuinely novel and convincingly justified.",

  "implementationPlan": "600-750 word implementation plan written as prose paragraphs (not a bullet list). Describe six phases with approximate timeframes woven into the prose: (1) initial framework and literature synthesis (weeks 1-4), (2) data collection and environment setup (weeks 5-10), (3) system development and prototyping (weeks 11-14), (4) experimentation and analysis (weeks 15-18), (5) evaluation and validation (weeks 19-21), (6) writing, peer review, and dissemination (weeks 22-24). For each phase describe specific tasks, team roles where applicable, deliverables, and success indicators naturally within the paragraphs. Close with a paragraph on risk management and contingency planning.",

  "conclusion": "450-550 word conclusion written as flowing prose. Open by reflecting on the journey of the assignment. Summarise the key findings from the literature review — not as a list but as a synthesised narrative. Highlight what makes the proposed method novel and why it represents a meaningful contribution to ${topic}. Discuss limitations honestly and at length. Propose two or three specific directions for future work, explained as full paragraphs. Close with a genuinely considered forward-looking statement about the long-term impact of this research area.",

  "diagrams": [
    { "title": "System Architecture", "code": "graph TD\\nA[User]-->B[Relay]" }
  ],
  "references": [
    "[1] A. Author, \\"Full Title,\\" Venue, Year. [Online]. Available: URL"
  ]
}`;

    console.log("Calling Google Gemini API for assignment generation...");

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      let errMsg = `Gemini API error ${aiResponse.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
      } catch {
        errMsg = errText || errMsg;
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: aiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawContent) {
      const reason = aiData.candidates?.[0]?.finishReason || "no content";
      return new Response(JSON.stringify({ error: `Gemini returned empty response (${reason}). Try again.` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
