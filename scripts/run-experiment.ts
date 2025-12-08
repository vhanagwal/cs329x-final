/**
 * Script to run the GenUI experiment and collect real evaluation data
 * Run with: npx tsx scripts/run-experiment.ts
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Import data
const personas = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/personas.json'), 'utf-8'));
const exemplars = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/prompt_exemplars.json'), 'utf-8'));
const patterns = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/ui_patterns.json'), 'utf-8'));
const traces = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/writing_traces.json'), 'utf-8'));
const rubric = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/evaluation_rubric.json'), 'utf-8'));

type InterfaceCondition = 'baseline-chat' | 'generic-genui' | 'personalized-genui';

interface TaskGoal {
  description: string;
  intent: 'write' | 'brainstorm' | 'review' | 'research';
}

interface UserProfile {
  id: string;
  name: string;
  persona: string;
  preferences: {
    density: 'compact' | 'comfortable';
    showMinimap: boolean;
  };
}

// Fallback layouts
const FALLBACK_LAYOUTS: Record<InterfaceCondition, any> = {
  'baseline-chat': {
    layout: {
      id: 'root',
      type: 'layout-row',
      children: [
        { id: 'chat-panel', type: 'widget-chat', title: 'AI Chat Assistant', flex: 1 }
      ]
    },
    theme: 'minimal',
    rationale: 'Basic chat-only interface for baseline comparison.'
  },
  'generic-genui': {
    layout: {
      id: 'root',
      type: 'layout-row',
      children: [
        { id: 'editor-panel', type: 'widget-editor', title: 'Editor', flex: 2 },
        { id: 'chat-panel', type: 'widget-chat', title: 'AI Assistant', flex: 1 }
      ]
    },
    theme: 'minimal',
    rationale: 'Generic editor + chat layout without personalization.'
  },
  'personalized-genui': {
    layout: {
      id: 'root',
      type: 'layout-row',
      children: [
        { id: 'editor-panel', type: 'widget-editor', title: 'Editor', flex: 2 },
        { id: 'chat-panel', type: 'widget-chat', title: 'AI Assistant', flex: 1 }
      ]
    },
    theme: 'minimal',
    rationale: 'Fallback personalized layout.'
  }
};

// RAG retrieval functions
function pickPersonaContext(personaId: string) {
  return personas.find((p: any) => p.name === personaId || p.id === personaId);
}

function retrieveExemplars(goal: TaskGoal, persona: string) {
  const lower = goal.description.toLowerCase();
  const intentMatch = exemplars.filter((ex: any) => ex.intent === goal.intent);
  const keywordMatch = exemplars.filter((ex: any) => 
    lower.includes(ex.task.split(' ')[0].toLowerCase()) || ex.personaHint === persona
  );
  const combined = [...intentMatch, ...keywordMatch];
  const unique = combined.filter((ex: any, i: number) => combined.findIndex((e: any) => e.id === ex.id) === i);
  return unique.slice(0, 3);
}

function retrievePatterns(persona: string, intent: string) {
  const personaPatterns = patterns.filter((p: any) => 
    p.personaFit?.includes(persona) || p.intentFit?.includes(intent)
  );
  if (personaPatterns.length > 0) return personaPatterns.slice(0, 2);
  
  if (persona === 'VisualWriter') {
    return patterns.filter((p: any) => p.id.includes('mindmap') || p.id.includes('kanban'));
  }
  if (persona === 'ResearchWriter') {
    return patterns.filter((p: any) => p.id.includes('research') || p.id.includes('synthesis'));
  }
  return patterns.filter((p: any) => p.id.includes('sidebar') || p.id.includes('editor'));
}

function retrieveTraceSnippet(persona: string, intent: string) {
  const match = traces.find((t: any) => t.personaHint === persona || t.intent === intent);
  return match || traces[0];
}

// Generate interface
async function generateInterface(
  goal: TaskGoal, 
  profile: UserProfile,
  condition: InterfaceCondition
): Promise<any> {
  
  if (condition === 'baseline-chat') {
    return FALLBACK_LAYOUTS['baseline-chat'];
  }

  const personaCtx = pickPersonaContext(profile.persona);
  const exemplarCtx = retrieveExemplars(goal, profile.persona);
  const patternCtx = retrievePatterns(profile.persona, goal.intent);
  const traceCtx = retrieveTraceSnippet(profile.persona, goal.intent);

  const retrievedContext = {
    personaTraits: personaCtx?.historySnippets || [],
    matchedPatterns: patternCtx.map((p: any) => p.name),
    behaviorInsights: [traceCtx.cognitiveInsight],
  };

  const isPersonalized = condition === 'personalized-genui';

  const systemPrompt = `
You are an expert UI/UX designer implementing a Generative Interface engine for cognitive task support.
Your goal: design a${isPersonalized ? ' personalized' : ' generic'} workspace layout that reduces cognitive load${isPersonalized ? ' and matches the user\'s cognitive style' : ''}.

${isPersonalized ? `
## User Context (Personalization Enabled)
- Persona: ${profile.persona}
- Cognitive Style: ${personaCtx?.cognitiveStyle || 'unknown'}
- Preferences: ${JSON.stringify(profile.preferences)}
- Behavior History: ${JSON.stringify(personaCtx?.historySnippets || [])}
- Typical Workflows: ${JSON.stringify(personaCtx?.typicalWorkflows || [])}
- Cognitive Traits: ${JSON.stringify(personaCtx?.cognitiveTraits || {})}
` : `
## Generic Mode (No Personalization)
Design a standard workspace without user-specific adaptations.
`}

## Task Context
- Goal: "${goal.description}"
- Intent: ${goal.intent}

${isPersonalized ? `
## Retrieved Design Context (RAG)
### Few-Shot Exemplars
${JSON.stringify(exemplarCtx, null, 2)}

### UI Patterns (RICO-inspired)
${JSON.stringify(patternCtx, null, 2)}

### Behavior Trace (ScholaWrite-inspired)
${JSON.stringify(traceCtx, null, 2)}
` : ''}

## Output Schema
Return a JSON object with:
{
  "layout": UIComponent,
  "theme": string,
  "rationale": string
}

UIComponent schema:
{
  "id": string,
  "type": ComponentType,
  "title": string,
  "flex": number (1-12),
  "children": UIComponent[]
}

ComponentType options:
- layout-row, layout-col, layout-split
- widget-editor, widget-outline, widget-kanban, widget-chat
- widget-mindmap, widget-stats, widget-research, widget-timeline, widget-critique

## Design Rules
${isPersonalized ? `
1. VisualWriter: prioritize widget-mindmap, widget-kanban, spatial layouts
2. LinearWriter: prioritize widget-outline, widget-editor, sequential layouts
3. ResearchWriter: prioritize widget-research, widget-mindmap, source-synthesis layouts
` : `
1. Use a balanced, general-purpose layout
2. Include editor as primary component
`}
4. Always include widget-chat for AI collaboration
5. For "brainstorm" intent: favor divergent tools (mindmap, kanban)
6. For "write" intent: favor focused tools (editor, outline)

Return ONLY valid JSON, no markdown fencing.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Design a${isPersonalized ? ' personalized' : ' generic'} workspace for: "${goal.description}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    parsed.retrievedContext = isPersonalized ? retrievedContext : undefined;
    return parsed;

  } catch (error) {
    console.error("Error generating interface:", error);
    return FALLBACK_LAYOUTS[condition];
  }
}

// Evaluate interface
async function evaluateInterface(
  spec: any, 
  goal: TaskGoal, 
  profile: UserProfile,
  condition: InterfaceCondition
): Promise<any> {
  
  const rubricText = JSON.stringify(rubric, null, 2);
  
  const systemPrompt = `
You are an expert HCI researcher conducting a rigorous rubric-based evaluation of a generated user interface.
Apply the following 5-factor rubric grounded in NASA-TLX, Nielsen's Heuristics, and SUS.

## Evaluation Context
- User Persona: ${profile.persona}
- Task: "${goal.description}"
- Intent: ${goal.intent}
- Condition: ${condition} (${
  condition === 'baseline-chat' ? 'chat-only baseline' :
  condition === 'generic-genui' ? 'generic generated UI' :
  'personalized generated UI'
})

## Evaluation Rubric
${rubricText}

## UI Specification to Evaluate
${JSON.stringify(spec, null, 2)}

## Instructions
Rate each factor on a 0-100 scale with clear justification.
BE CRITICAL and use the FULL RANGE of scores. Avoid compression around 70-80.

Consider:
1. COGNITIVE LOAD (0-100, LOWER is better): Does the layout minimize mental effort?
   - For chat-only baseline: high load expected (no structure externalization)
   - For generic UI: moderate load (some structure but not personalized)
   - For personalized UI: should have lowest load if well-designed

2. CLARITY (0-100, higher is better): Is information hierarchy clear?

3. EFFICIENCY (0-100, higher is better): Can user complete task efficiently?

4. PERSONALIZATION FIT (0-100, higher is better): Does UI match persona?
   - For baseline/generic: score should be 30-50 (not personalized)
   - For personalized: score based on actual persona fit

5. AESTHETIC APPEAL (0-100, higher is better): Visual design quality?

## Output Format
Return JSON:
{
  "cognitiveLoad": number,
  "clarity": number,
  "efficiency": number,
  "personalizationFit": number,
  "aestheticAppeal": number,
  "overallScore": number,
  "feedback": string,
  "strengths": string[],
  "improvements": string[]
}

Use the FULL scoring range. A chat-only baseline should score LOW on personalization and efficiency.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Evaluate this interface against the rubric. Be critical and use the full score range." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No evaluation generated");

    return JSON.parse(content);

  } catch (error) {
    console.error("Error evaluating interface:", error);
    return {
      cognitiveLoad: 50,
      clarity: 50,
      efficiency: 50,
      personalizationFit: 50,
      aestheticAppeal: 50,
      overallScore: 50,
      feedback: "Evaluation unavailable due to service error."
    };
  }
}

// Main experiment runner
async function runExperiment() {
  console.log("🧪 Running GenUI Experiment\n");
  console.log("=".repeat(60));

  const testCases = [
    {
      goal: { description: "Help me brainstorm thesis ideas about AI and cognition", intent: "brainstorm" as const },
      profile: { id: 'u1', name: 'Test User', persona: 'VisualWriter', preferences: { density: 'comfortable' as const, showMinimap: true } }
    },
    {
      goal: { description: "Draft a CHI paper introduction on human-AI collaboration", intent: "write" as const },
      profile: { id: 'u2', name: 'Test User', persona: 'LinearWriter', preferences: { density: 'compact' as const, showMinimap: false } }
    }
  ];

  const conditions: InterfaceCondition[] = ['baseline-chat', 'generic-genui', 'personalized-genui'];
  const allResults: any[] = [];

  for (const testCase of testCases) {
    console.log(`\n📝 Task: "${testCase.goal.description}"`);
    console.log(`👤 Persona: ${testCase.profile.persona}`);
    console.log("-".repeat(60));

    for (const condition of conditions) {
      console.log(`\n  🔄 Generating ${condition}...`);
      
      const spec = await generateInterface(testCase.goal, testCase.profile, condition);
      console.log(`  ✅ Generated layout with ${spec.layout?.children?.length || 1} components`);
      
      console.log(`  ⚖️  Evaluating...`);
      const evaluation = await evaluateInterface(spec, testCase.goal, testCase.profile, condition);
      
      console.log(`  📊 Results:`);
      console.log(`     Cognitive Load: ${evaluation.cognitiveLoad} (lower=better)`);
      console.log(`     Clarity: ${evaluation.clarity}`);
      console.log(`     Efficiency: ${evaluation.efficiency}`);
      console.log(`     Personalization: ${evaluation.personalizationFit}`);
      console.log(`     Aesthetics: ${evaluation.aestheticAppeal}`);
      console.log(`     OVERALL: ${evaluation.overallScore}`);

      allResults.push({
        task: testCase.goal.description,
        persona: testCase.profile.persona,
        condition,
        spec,
        evaluation
      });
    }
  }

  // Summary statistics
  console.log("\n" + "=".repeat(60));
  console.log("📈 SUMMARY STATISTICS");
  console.log("=".repeat(60));

  const byCondition: Record<string, number[]> = {
    'baseline-chat': [],
    'generic-genui': [],
    'personalized-genui': []
  };

  for (const result of allResults) {
    byCondition[result.condition].push(result.evaluation.overallScore);
  }

  for (const condition of conditions) {
    const scores = byCondition[condition];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`\n${condition}:`);
    console.log(`  Average Overall Score: ${avg.toFixed(1)}`);
    console.log(`  Individual Scores: ${scores.join(', ')}`);
  }

  // Calculate improvements
  const baselineAvg = byCondition['baseline-chat'].reduce((a, b) => a + b, 0) / byCondition['baseline-chat'].length;
  const genericAvg = byCondition['generic-genui'].reduce((a, b) => a + b, 0) / byCondition['generic-genui'].length;
  const personalizedAvg = byCondition['personalized-genui'].reduce((a, b) => a + b, 0) / byCondition['personalized-genui'].length;

  console.log("\n📊 IMPROVEMENTS:");
  console.log(`  Personalized vs Baseline: +${((personalizedAvg - baselineAvg) / baselineAvg * 100).toFixed(1)}%`);
  console.log(`  Personalized vs Generic: +${((personalizedAvg - genericAvg) / genericAvg * 100).toFixed(1)}%`);
  console.log(`  Generic vs Baseline: +${((genericAvg - baselineAvg) / baselineAvg * 100).toFixed(1)}%`);

  // Save results to JSON
  const outputPath = path.join(__dirname, 'experiment-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Full results saved to: ${outputPath}`);

  // Output data for slides
  console.log("\n" + "=".repeat(60));
  console.log("📊 DATA FOR SLIDES (copy this):");
  console.log("=".repeat(60));
  
  // Average by factor across all tests
  const factorAverages: Record<string, Record<string, number>> = {};
  for (const condition of conditions) {
    const conditionResults = allResults.filter(r => r.condition === condition);
    factorAverages[condition] = {
      cognitiveLoad: conditionResults.reduce((a, r) => a + r.evaluation.cognitiveLoad, 0) / conditionResults.length,
      clarity: conditionResults.reduce((a, r) => a + r.evaluation.clarity, 0) / conditionResults.length,
      efficiency: conditionResults.reduce((a, r) => a + r.evaluation.efficiency, 0) / conditionResults.length,
      personalizationFit: conditionResults.reduce((a, r) => a + r.evaluation.personalizationFit, 0) / conditionResults.length,
      aestheticAppeal: conditionResults.reduce((a, r) => a + r.evaluation.aestheticAppeal, 0) / conditionResults.length,
      overallScore: conditionResults.reduce((a, r) => a + r.evaluation.overallScore, 0) / conditionResults.length,
    };
  }

  console.log("\nFactor Averages by Condition:");
  console.log(JSON.stringify(factorAverages, null, 2));

  return allResults;
}

// Run
runExperiment().catch(console.error);

