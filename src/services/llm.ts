'use server';

import OpenAI from 'openai';
import { 
  UISpecification, 
  UserProfile, 
  TaskGoal, 
  EvaluationSummary,
  InterfaceCondition,
  ConditionResult,
  validateUISpecification 
} from '@/types/schema';
import exemplars from '@/data/prompt_exemplars.json';
import personas from '@/data/personas.json';
import patterns from '@/data/ui_patterns.json';
import traces from '@/data/writing_traces.json';
import rubric from '@/data/evaluation_rubric.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // Bypass Netlify AI Gateway
});

// ============================================
// Types for JSON data
// ============================================

interface PersonaData {
  id: string;
  name: string;
  cognitiveStyle: string;
  description: string;
  preferences: {
    density: string;
    showMinimap: boolean;
    layoutStyle: string;
    primaryTools: string[];
  };
  historySnippets: string[];
  typicalWorkflows: string[];
  cognitiveTraits: {
    workingMemorySupport: string;
    preferredExternalization: string;
    taskSwitchingCost: string;
  };
}

interface ExemplarData {
  id: string;
  task: string;
  intent: string;
  personaHint: string;
  layoutHint: string;
  expectedComponents: string[];
  rationale: string;
}

interface PatternData {
  id: string;
  name: string;
  description: string;
  personaFit?: string[];
  intentFit?: string[];
  components: string[];
  cognitiveRationale: string;
}

interface TraceData {
  id: string;
  task: string;
  personaHint: string;
  intent: string;
  patterns: string[];
  cognitiveInsight: string;
}

// ============================================
// Retrieval Functions (RAG)
// ============================================

function pickPersonaContext(personaId: string): PersonaData | undefined {
  return (personas as PersonaData[]).find(p => p.name === personaId || p.id === personaId);
}

function retrieveExemplars(goal: TaskGoal, persona: string): ExemplarData[] {
  const lower = goal.description.toLowerCase();
  const intentMatch = (exemplars as ExemplarData[]).filter(ex => ex.intent === goal.intent);
  const keywordMatch = (exemplars as ExemplarData[]).filter(ex => 
    lower.includes(ex.task.split(' ')[0].toLowerCase()) || 
    ex.personaHint === persona
  );
  const combined = [...intentMatch, ...keywordMatch];
  const unique = combined.filter((ex, i) => combined.findIndex(e => e.id === ex.id) === i);
  return unique.slice(0, 3);
}

function retrievePatterns(persona: string, intent: string): PatternData[] {
  const personaPatterns = (patterns as PatternData[]).filter(p => 
    p.personaFit?.includes(persona) || 
    p.intentFit?.includes(intent)
  );
  if (personaPatterns.length > 0) return personaPatterns.slice(0, 2);
  
  if (persona === 'VisualWriter') {
    return (patterns as PatternData[]).filter(p => p.id.includes('mindmap') || p.id.includes('kanban'));
  }
  if (persona === 'ResearchWriter') {
    return (patterns as PatternData[]).filter(p => p.id.includes('research') || p.id.includes('synthesis'));
  }
  return (patterns as PatternData[]).filter(p => p.id.includes('sidebar') || p.id.includes('editor'));
}

function retrieveTraceSnippet(persona: string, intent: string): TraceData {
  const match = (traces as TraceData[]).find(t => t.personaHint === persona || t.intent === intent);
  return match || (traces as TraceData[])[0];
}

// ============================================
// Fallback Layouts
// ============================================

const FALLBACK_LAYOUTS: Record<InterfaceCondition, UISpecification> = {
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
    rationale: 'Fallback personalized layout due to generation error.'
  }
};

// ============================================
// Interface Generation
// ============================================

export async function generateInterface(
  goal: TaskGoal, 
  profile: UserProfile,
  condition: InterfaceCondition = 'personalized-genui'
): Promise<UISpecification> {
  
  // Baseline chat: return simple chat-only interface
  if (condition === 'baseline-chat') {
    return FALLBACK_LAYOUTS['baseline-chat'];
  }

  const personaCtx = pickPersonaContext(profile.persona);
  const exemplarCtx = retrieveExemplars(goal, profile.persona);
  const patternCtx = retrievePatterns(profile.persona, goal.intent);
  const traceCtx = retrieveTraceSnippet(profile.persona, goal.intent);

  // Build retrieval context for explainability
  const retrievedContext = {
    personaTraits: personaCtx?.historySnippets || [],
    matchedPatterns: patternCtx.map(p => p.name),
    behaviorInsights: [traceCtx.cognitiveInsight],
  };

  // For generic GenUI, strip personalization context
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
  "rationale": string,
  "retrievedContext": {
    "personaTraits": string[],
    "matchedPatterns": string[],
    "behaviorInsights": string[]
  }
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
- widget-editor (rich text)
- widget-outline (hierarchical structure)
- widget-kanban (task board)
- widget-chat (AI assistant)
- widget-mindmap (visual nodes)
- widget-stats (metrics/progress)
- widget-research (sources/citations)
- widget-timeline (revision history)
- widget-critique (feedback/review)

## Design Rules (Nielsen + Cognitive Load Theory)
${isPersonalized ? `
1. VisualWriter: prioritize widget-mindmap, widget-kanban, spatial layouts
2. LinearWriter: prioritize widget-outline, widget-editor, sequential layouts
3. ResearchWriter: prioritize widget-research, widget-mindmap, source-synthesis layouts
4. Match density preference (compact vs comfortable)
` : `
1. Use a balanced, general-purpose layout
2. Include editor as primary component
`}
5. Always include widget-chat for AI collaboration
6. For "brainstorm" intent: favor divergent tools (mindmap, kanban)
7. For "write" intent: favor focused tools (editor, outline)
8. For "review" intent: include stats, timeline, critique
9. For "research" intent: include research widget, mindmap

## Rationale Requirements
Write 2-3 sentences explaining:
1. WHY this layout for this ${isPersonalized ? 'user\'s cognitive style' : 'task'}
2. WHICH cognitive load principles guided the design
3. ${isPersonalized ? 'HOW retrieved context influenced decisions' : 'What general usability principles were applied'}

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
    const validated = validateUISpecification(parsed);
    
    if (!validated) {
      console.warn("Generated UI failed validation, using fallback");
      return FALLBACK_LAYOUTS[condition];
    }

    // Inject retrieved context for explainability
    validated.retrievedContext = isPersonalized ? retrievedContext : undefined;
    
    return validated;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error generating interface:", errorMessage, error);
    const fallback = FALLBACK_LAYOUTS[condition];
    fallback.rationale = `Fallback layout used: ${errorMessage.includes('API key') ? 'OpenAI API key not configured' : 'generation error'}. ${fallback.rationale}`;
    return fallback;
  }
}

// ============================================
// Generate All Conditions for Comparison
// ============================================

export async function generateAllConditions(
  goal: TaskGoal,
  profile: UserProfile
): Promise<ConditionResult[]> {
  const conditions: InterfaceCondition[] = ['baseline-chat', 'generic-genui', 'personalized-genui'];
  
  const results = await Promise.all(
    conditions.map(async (condition) => {
      const specification = await generateInterface(goal, profile, condition);
      const evaluation = await evaluateInterface(specification, goal, profile, condition);
      return { condition, specification, evaluation };
    })
  );
  
  return results;
}

// ============================================
// LLM-as-Judge Evaluation (5-Factor Rubric)
// Based on NASA-TLX, Nielsen's Heuristics, SUS
// ============================================

export async function evaluateInterface(
  spec: UISpecification, 
  goal: TaskGoal, 
  profile: UserProfile,
  condition: InterfaceCondition = 'personalized-genui'
): Promise<EvaluationSummary> {
  
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

## Sub-criteria Details
For each factor, also provide sub-criteria scores (0-100):

cognitiveLoad:
- mentalDemand: How much thinking/deciding required?
- temporalDemand: How rushed/pressured does the interface feel?
- effort: How hard to accomplish tasks?

clarity:
- visibility: Is system status visible?
- recognition: Recognition over recall?
- consistency: Consistent patterns?

efficiency:
- taskCompletion: Minimum steps to complete?
- flexibility: Supports shortcuts?
- errorPrevention: Prevents mistakes?

personalizationFit:
- personaAlignment: Matches cognitive style?
- preferenceMatch: Honors preferences?
- historyUtilization: Uses known patterns?

aestheticAppeal:
- visualBalance: Proportional layout?
- whitespace: Appropriate spacing?
- coherence: Unified visual language?

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
  "improvements": string[],
  "detailed": {
    "cognitiveLoad": { "score": number, "details": { "mentalDemand": number, "temporalDemand": number, "effort": number }, "justification": string },
    "clarity": { "score": number, "details": { "visibility": number, "recognition": number, "consistency": number }, "justification": string },
    "efficiency": { "score": number, "details": { "taskCompletion": number, "flexibility": number, "errorPrevention": number }, "justification": string },
    "personalizationFit": { "score": number, "details": { "personaAlignment": number, "preferenceMatch": number, "historyUtilization": number }, "justification": string },
    "aestheticAppeal": { "score": number, "details": { "visualBalance": number, "whitespace": number, "coherence": number }, "justification": string }
  }
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

    return JSON.parse(content) as EvaluationSummary;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error evaluating interface:", errorMessage, error);
    return {
      cognitiveLoad: 50,
      clarity: 50,
      efficiency: 50,
      personalizationFit: 50,
      aestheticAppeal: 50,
      overallScore: 50,
      feedback: `Evaluation unavailable: ${errorMessage.includes('API key') ? 'API key not configured' : 'service error'}`
    };
  }
}

