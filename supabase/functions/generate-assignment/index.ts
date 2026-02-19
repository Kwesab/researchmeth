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

    const systemPrompt = `You are an expert research methodology professor and academic writer with deep expertise in computing, technology, and IEEE-standard research writing. 
You produce comprehensive, scholarly, and detailed research assignments following strict academic conventions.
Your writing is authoritative, analytical, and original. You never plagiarize.
Always write in formal academic English. Follow IEEE citation format strictly.`;

    const userPrompt = `You are generating a complete, detailed research methods assignment on the topic: "${topic}"

Based on these 5 scientific computing papers found from Semantic Scholar:

${paperSummaries}

Generate a COMPLETE and DETAILED research assignment. Return ONLY a valid JSON object with this EXACT structure:

{
  "abstract": "A comprehensive 300-word academic abstract summarizing the entire assignment including purpose, methodology of the 5 papers, your proposed novel method, and expected contributions.",
  
  "introduction": "A detailed 600-800 word introduction that: (1) Opens with a broad, engaging story/narrative about the general topic area (e.g., the history and evolution of ${topic}), (2) Gradually narrows to the specific problem being addressed, (3) Explains why this topic matters in today's computing landscape, (4) States the research objectives clearly, (5) Outlines the structure of the assignment. Must feel like expert academic storytelling.",
  
  "literatureReview": "A comprehensive 800-1000 word literature review with: (1) Overview of the research landscape, (2) Detailed analysis of each of the 5 papers - what methodology each used, what they found, their contributions, (3) Comparison of approaches across the papers, (4) Identification of strengths and weaknesses of each study, (5) Clear identification of 3-4 research gaps that remain unaddressed. Reference papers as [1], [2], [3], [4], [5] throughout.",
  
  "proposedMethod": "A detailed 700-900 word description of your ORIGINAL proposed research method that: (1) Synthesizes ideas from all 5 papers into a novel approach, (2) Explains the theoretical framework, (3) Describes the research design (experimental, qualitative, mixed-methods, etc.), (4) Details the data collection strategy, (5) Explains the analysis approach, (6) Justifies how this method addresses the gaps identified in the literature. This must be genuinely original and creative.",
  
  "implementationPlan": "A structured 400-500 word implementation plan with: (1) Phase 1 - Literature consolidation and framework design (weeks 1-4), (2) Phase 2 - Data collection and system setup (weeks 5-10), (3) Phase 3 - Experimentation and analysis (weeks 11-16), (4) Phase 4 - Evaluation and validation (weeks 17-20), (5) Phase 5 - Write-up and dissemination (weeks 21-24). Include specific tasks, deliverables, and success metrics for each phase.",
  
  "conclusion": "A strong 300-400 word conclusion that: (1) Summarizes the key findings from the literature review, (2) Highlights the novelty of the proposed research method, (3) States the expected contributions to the field of ${topic}, (4) Discusses limitations and future work, (5) Ends with a compelling call to action for the research community.",
  
   "diagrams": [
    {
      "title": "System Architecture Diagram",
      "code": "graph TD\n    A[Research Input] --> B[Data Collection Module]\n    B --> C[Literature Database]\n    B --> D[Empirical Dataset]\n    C --> E[Analysis Engine]\n    D --> E\n    E --> F[ML Processing Layer]\n    E --> G[Statistical Analysis]\n    F --> H[Validation Module]\n    G --> H\n    H --> I[Results and Insights]\n    I --> J[Publication Output]\n    style A fill:#c89b3c,color:#000\n    style I fill:#4a7cbf,color:#fff\n    style J fill:#2a5a3a,color:#fff"
    },
    {
      "title": "Research Methodology Flowchart",
      "code": "flowchart LR\n    A([Start]) --> B[Define Research Problem]\n    B --> C[Literature Search]\n    C --> D{Papers Found?}\n    D -->|Yes| E[Select 5 Papers]\n    D -->|No| C\n    E --> F[Extract Methodologies]\n    F --> G[Identify Research Gaps]\n    G --> H[Propose Novel Method]\n    H --> I[Design Experiments]\n    I --> J[Collect Data]\n    J --> K[Analyze Results]\n    K --> L{Validate Hypothesis?}\n    L -->|Yes| M[Write Paper]\n    L -->|No| I\n    M --> N([Publish])\n    style A fill:#c89b3c,color:#000\n    style N fill:#2a5a3a,color:#fff"
    },
    {
      "title": "Data Flow Diagram",
      "code": "graph LR\n    A[Scholar APIs] -->|Paper Metadata| B((Data Ingestion))\n    B --> C[Paper Store]\n    C -->|Full Text| D((AI Analysis))\n    D -->|Methodology| E[Analysis Results]\n    D -->|Gaps| F[Gap Registry]\n    E --> G((Synthesis Engine))\n    F --> G\n    G -->|Novel Method| H[Proposed Method]\n    H --> I((Report Generator))\n    I -->|PDF| J[Final Assignment]\n    I -->|RIS| K[Reference File]\n    style B fill:#c89b3c,color:#000\n    style D fill:#4a7cbf,color:#fff\n    style G fill:#7a4abf,color:#fff\n    style I fill:#2a5a3a,color:#fff"
    },
    {
      "title": "Research Process Timeline",
      "code": "gantt\n    title Research Process Timeline\n    dateFormat  YYYY-MM-DD\n    section Literature Review\n    Paper Discovery           :done, l1, 2024-01-01, 14d\n    Deep Analysis             :done, l2, after l1, 14d\n    Gap Identification        :active, l3, after l2, 7d\n    section Methodology Design\n    Framework Development     :m1, after l3, 21d\n    Protocol Design           :m2, after m1, 14d\n    section Implementation\n    Data Collection           :i1, after m2, 42d\n    Experimentation           :i2, after i1, 42d\n    section Validation\n    Statistical Analysis      :v1, after i2, 21d\n    Peer Review               :v2, after v1, 14d\n    section Dissemination\n    Paper Writing             :d1, after v2, 28d\n    Submission                :milestone, d2, after d1, 0d"
    }
  ],
  
  "references": [
    "[1] ${papers[0]?.authors?.[0] || 'A. Author'}, \\"${papers[0]?.title?.substring(0, 60) || 'Title'}...,\\" ${papers[0]?.venue || 'IEEE Transactions'}, ${papers[0]?.year || '2023'}. [Online]. Available: ${papers[0]?.url || 'https://doi.org/xxx'}",
    "[2] ${papers[1]?.authors?.[0] || 'B. Author'}, \\"${papers[1]?.title?.substring(0, 60) || 'Title'}...,\\" ${papers[1]?.venue || 'ACM Computing'}, ${papers[1]?.year || '2022'}. [Online]. Available: ${papers[1]?.url || 'https://doi.org/xxx'}",
    "[3] ${papers[2]?.authors?.[0] || 'C. Author'}, \\"${papers[2]?.title?.substring(0, 60) || 'Title'}...,\\" ${papers[2]?.venue || 'Springer'}, ${papers[2]?.year || '2022'}. [Online]. Available: ${papers[2]?.url || 'https://doi.org/xxx'}",
    "[4] ${papers[3]?.authors?.[0] || 'D. Author'}, \\"${papers[3]?.title?.substring(0, 60) || 'Title'}...,\\" ${papers[3]?.venue || 'Elsevier'}, ${papers[3]?.year || '2021'}. [Online]. Available: ${papers[3]?.url || 'https://doi.org/xxx'}",
    "[5] ${papers[4]?.authors?.[0] || 'E. Author'}, \\"${papers[4]?.title?.substring(0, 60) || 'Title'}...,\\" ${papers[4]?.venue || 'IEEE Access'}, ${papers[4]?.year || '2021'}. [Online]. Available: ${papers[4]?.url || 'https://doi.org/xxx'}"
  ]
}

IMPORTANT INSTRUCTIONS:
- Write every section in FULL DETAIL. Do not be brief. This is a complete academic assignment.
- The introduction MUST start with a broad engaging story/narrative before narrowing to specifics.
- Literature review MUST reference papers as [1], [2], [3], [4], [5].
- Proposed method MUST be genuinely novel, synthesizing from all papers.
- References MUST be in IEEE format: [N] FirstInitial. LastName, "Title," Venue, year.
- Diagrams MUST be valid Mermaid.js code. Keep them syntactically correct.
- Return ONLY the JSON object, no markdown code blocks, no extra text.`;

    console.log("Calling Lovable AI for assignment generation...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits required. Please add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
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
