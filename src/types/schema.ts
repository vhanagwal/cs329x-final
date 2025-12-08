import { z } from 'zod';

// ============================================
// Component Types & UI Schema
// ============================================

export const ComponentTypeSchema = z.enum([
  'layout-row',
  'layout-col',
  'layout-split',
  'widget-editor',
  'widget-outline',
  'widget-kanban',
  'widget-chat',
  'widget-mindmap',
  'widget-stats',
  'widget-research',
  'widget-timeline',
  'widget-critique', // NEW: for review/feedback
]);

export type ComponentType = z.infer<typeof ComponentTypeSchema>;

export const UIComponentSchema: z.ZodType<UIComponent> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: ComponentTypeSchema,
    title: z.string().optional(),
    flex: z.number().int().min(1).max(12).optional(),
    children: z.array(UIComponentSchema).optional(),
    props: z.record(z.string(), z.any()).optional(),
  })
);

export interface UIComponent {
  id: string;
  type: ComponentType;
  title?: string;
  flex?: number;
  children?: UIComponent[];
  props?: Record<string, unknown>;
}

export const UISpecificationSchema = z.object({
  layout: UIComponentSchema,
  theme: z.string().optional(),
  rationale: z.string().optional(),
  retrievedContext: z.object({
    personaTraits: z.array(z.string()).optional(),
    matchedPatterns: z.array(z.string()).optional(),
    behaviorInsights: z.array(z.string()).optional(),
  }).optional(),
});

export interface UISpecification {
  layout: UIComponent;
  theme?: string;
  rationale?: string;
  retrievedContext?: {
    personaTraits?: string[];
    matchedPatterns?: string[];
    behaviorInsights?: string[];
  };
}

// ============================================
// User Profiles & Personas
// ============================================

export type UserPersona = 'VisualWriter' | 'LinearWriter' | 'ResearchWriter';

export interface UserProfile {
  id: string;
  name: string;
  persona: UserPersona;
  preferences: {
    density: 'compact' | 'comfortable';
    showMinimap: boolean;
  };
}

export interface TaskGoal {
  description: string;
  intent: 'write' | 'brainstorm' | 'review' | 'research';
}

// ============================================
// Condition Types for A/B Comparison
// ============================================

export type InterfaceCondition = 'baseline-chat' | 'generic-genui' | 'personalized-genui';

export interface ConditionResult {
  condition: InterfaceCondition;
  specification: UISpecification;
  evaluation: EvaluationSummary;
}

// ============================================
// Evaluation Rubric (5-Factor)
// Based on NASA-TLX, Nielsen's Heuristics, SUS
// ============================================

/**
 * Detailed sub-criteria evaluation for each factor
 */
export interface SubCriteriaScores {
  score: number;
  details: Record<string, number>;
  justification: string;
}

/**
 * Five-factor evaluation with detailed sub-criteria
 */
export interface EvaluationResult {
  // NASA-TLX inspired
  cognitiveLoad: SubCriteriaScores & {
    details: {
      mentalDemand: number;
      temporalDemand: number;
      effort: number;
    };
  };
  
  // Nielsen's Heuristics
  clarity: SubCriteriaScores & {
    details: {
      visibility: number;
      recognition: number;
      consistency: number;
    };
  };
  
  efficiency: SubCriteriaScores & {
    details: {
      taskCompletion: number;
      flexibility: number;
      errorPrevention: number;
    };
  };
  
  // Personalization fit
  personalizationFit: SubCriteriaScores & {
    details: {
      personaAlignment: number;
      preferenceMatch: number;
      historyUtilization: number;
    };
  };
  
  // Aesthetic-usability
  aestheticAppeal: SubCriteriaScores & {
    details: {
      visualBalance: number;
      whitespace: number;
      coherence: number;
    };
  };
  
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// Simplified evaluation for quick display
export interface EvaluationSummary {
  cognitiveLoad: number;
  clarity: number;
  efficiency: number;
  personalizationFit: number;
  aestheticAppeal: number;
  overallScore: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  // Detailed breakdown (optional, for expanded view)
  detailed?: EvaluationResult;
}

// ============================================
// Experiment Statistics
// ============================================

export interface ExperimentStats {
  conditions: {
    condition: InterfaceCondition;
    mean: number;
    stdDev: number;
    n: number;
  }[];
  effectSizes: {
    comparison: string;
    cohensD: number;
    interpretation: 'negligible' | 'small' | 'medium' | 'large';
  }[];
  summary: string;
}

// ============================================
// Validation Helper
// ============================================

export function validateUISpecification(data: unknown): UISpecification | null {
  try {
    return UISpecificationSchema.parse(data);
  } catch (e) {
    console.error("UI Specification validation failed:", e);
    return null;
  }
}
