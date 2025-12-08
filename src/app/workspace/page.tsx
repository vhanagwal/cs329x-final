'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateInterface, evaluateInterface, generateAllConditions } from '@/services/llm';
import { calculateEffectSize } from '@/utils/stats';
import { DynamicRenderer } from '@/components/gen-ui/DynamicRenderer';
import { UISpecification, EvaluationSummary, UserPersona, InterfaceCondition, ConditionResult } from '@/types/schema';
import { ArrowLeft, RefreshCw, BarChart2, Lightbulb, X, ChevronDown, ChevronUp, Layers, MessageSquare, Sparkles, Zap, FlaskConical, TrendingUp, Info } from 'lucide-react';

// ============================================
// Comparison Mode Component
// ============================================

interface ComparisonViewProps {
  results: ConditionResult[];
  activeCondition: InterfaceCondition;
  onSelectCondition: (condition: InterfaceCondition) => void;
}

function ComparisonView({ results, activeCondition, onSelectCondition }: ComparisonViewProps) {
  const conditionLabels: Record<InterfaceCondition, { label: string; icon: React.ReactNode; desc: string }> = {
    'baseline-chat': { 
      label: 'Baseline Chat', 
      icon: <MessageSquare size={16} />, 
      desc: 'Traditional chat interface' 
    },
    'generic-genui': { 
      label: 'Generic GenUI', 
      icon: <Layers size={16} />, 
      desc: 'Generated UI (no personalization)' 
    },
    'personalized-genui': { 
      label: 'Personalized GenUI', 
      icon: <Sparkles size={16} />, 
      desc: 'Generated UI + RAG personalization' 
    },
  };

  return (
    <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
      {results.map(({ condition, evaluation }) => {
        const config = conditionLabels[condition];
        const isActive = condition === activeCondition;
        
        return (
          <button
            key={condition}
            onClick={() => onSelectCondition(condition)}
            className={`flex-1 p-3 rounded-lg transition-all ${
              isActive 
                ? 'bg-white shadow-md border-2 border-indigo-400' 
                : 'bg-white/50 border border-transparent hover:bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{config.icon}</span>
              <span className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-600'}`}>
                {config.label}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">{config.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Score</span>
              <span className={`text-lg font-bold ${
                evaluation.overallScore >= 70 ? 'text-green-600' :
                evaluation.overallScore >= 50 ? 'text-amber-600' : 'text-red-500'
              }`}>
                {Math.round(evaluation.overallScore)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Effect Size Statistics Panel
// ============================================

interface StatsPanel {
  results: ConditionResult[];
}

function ExperimentStats({ results }: StatsPanel) {
  const baseline = results.find(r => r.condition === 'baseline-chat')!;
  const generic = results.find(r => r.condition === 'generic-genui')!;
  const personalized = results.find(r => r.condition === 'personalized-genui')!;

  // Calculate effect sizes (simulated with single data point - in real study would have multiple)
  const baselineVsPersonalized = {
    difference: personalized.evaluation.overallScore - baseline.evaluation.overallScore,
    improvement: ((personalized.evaluation.overallScore - baseline.evaluation.overallScore) / baseline.evaluation.overallScore * 100).toFixed(1),
  };

  const genericVsPersonalized = {
    difference: personalized.evaluation.overallScore - generic.evaluation.overallScore,
    improvement: ((personalized.evaluation.overallScore - generic.evaluation.overallScore) / generic.evaluation.overallScore * 100).toFixed(1),
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
      <div className="flex items-center gap-2 mb-3 text-indigo-700">
        <TrendingUp size={18} />
        <span className="font-semibold text-sm">Experiment Summary</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        {results.map(({ condition, evaluation }) => (
          <div key={condition} className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              {condition === 'baseline-chat' ? 'Baseline' : 
               condition === 'generic-genui' ? 'Generic' : 'Personalized'}
            </p>
            <p className="text-2xl font-bold text-gray-800">{Math.round(evaluation.overallScore)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <span className="text-gray-600">Personalized vs Baseline:</span>
          <span className={`font-bold ${Number(baselineVsPersonalized.improvement) > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {Number(baselineVsPersonalized.improvement) > 0 ? '+' : ''}{baselineVsPersonalized.improvement}%
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <span className="text-gray-600">Personalized vs Generic:</span>
          <span className={`font-bold ${Number(genericVsPersonalized.improvement) > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {Number(genericVsPersonalized.improvement) > 0 ? '+' : ''}{genericVsPersonalized.improvement}%
          </span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Note: Single-run comparison. Full study requires N≥30 for statistical power.
      </p>
    </div>
  );
}

// ============================================
// Enhanced Evaluation Panel
// ============================================

interface EvalPanelProps {
  evaluation: EvaluationSummary;
  showDetailed: boolean;
  onToggleDetailed: () => void;
}

function EnhancedEvalPanel({ evaluation, showDetailed, onToggleDetailed }: EvalPanelProps) {
  const factors = [
    { 
      key: 'cognitiveLoad', 
      label: 'Cognitive Load', 
      score: 100 - evaluation.cognitiveLoad,
      rawScore: evaluation.cognitiveLoad,
      invert: true,
      source: 'NASA-TLX',
      desc: 'Mental effort required (inverted: higher = less load)',
      subCriteria: ['mentalDemand', 'temporalDemand', 'effort']
    },
    { 
      key: 'clarity', 
      label: 'Clarity', 
      score: evaluation.clarity,
      source: 'Nielsen Heuristics',
      desc: 'Visibility, recognition, consistency',
      subCriteria: ['visibility', 'recognition', 'consistency']
    },
    { 
      key: 'efficiency', 
      label: 'Efficiency', 
      score: evaluation.efficiency,
      source: 'Nielsen Heuristics',
      desc: 'Task completion, flexibility, error prevention',
      subCriteria: ['taskCompletion', 'flexibility', 'errorPrevention']
    },
    { 
      key: 'personalizationFit', 
      label: 'Personalization', 
      score: evaluation.personalizationFit,
      source: 'User Modeling',
      desc: 'Fit to cognitive style and preferences',
      subCriteria: ['personaAlignment', 'preferenceMatch', 'historyUtilization']
    },
    { 
      key: 'aestheticAppeal', 
      label: 'Aesthetics', 
      score: evaluation.aestheticAppeal,
      source: 'Hartmann et al.',
      desc: 'Visual balance, whitespace, coherence',
      subCriteria: ['visualBalance', 'whitespace', 'coherence']
    },
  ];

  return (
    <div className="p-4">
      {/* Factor Grid */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        {factors.map(factor => {
          const barColor = factor.score >= 70 ? 'bg-green-500' : factor.score >= 50 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={factor.key} className="text-center group">
              <div className="text-xs text-gray-500 mb-1">{factor.label}</div>
              <div className="text-2xl font-bold text-gray-800">{Math.round(factor.score)}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${factor.score}%` }} />
              </div>
              <div className="text-[9px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {factor.source}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Sub-criteria (if expanded) */}
      {showDetailed && evaluation.detailed && (
        <div className="grid grid-cols-5 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          {factors.map(factor => {
            const detailed = evaluation.detailed?.[factor.key as keyof typeof evaluation.detailed];
            if (!detailed || typeof detailed !== 'object') return null;
            
            return (
              <div key={`${factor.key}-detail`} className="text-xs space-y-1">
                {factor.subCriteria.map(sub => {
                  const value = (detailed as { details?: Record<string, number> })?.details?.[sub];
                  if (typeof value !== 'number') return null;
                  return (
                    <div key={sub} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{sub.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium">{Math.round(value)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle Details Button */}
      <button 
        onClick={onToggleDetailed}
        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-3"
      >
        {showDetailed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showDetailed ? 'Hide' : 'Show'} Sub-criteria
      </button>
      
      {/* Feedback Section */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Feedback:</strong> {evaluation.feedback}
        </p>
        <div className="flex gap-4 text-xs">
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="flex-1">
              <strong className="text-green-600 block mb-1">Strengths</strong>
              <ul className="text-gray-600 space-y-0.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.improvements && evaluation.improvements.length > 0 && (
            <div className="flex-1">
              <strong className="text-amber-600 block mb-1">Improvements</strong>
              <ul className="text-gray-600 space-y-0.5">
                {evaluation.improvements.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Enhanced "Why This UI" Panel
// ============================================

interface RationaleProps {
  spec: UISpecification;
  onClose: () => void;
}

function RationalePanel({ spec, onClose }: RationaleProps) {
  return (
    <div className="absolute top-4 left-4 max-w-md bg-white rounded-xl shadow-2xl border border-indigo-100 overflow-hidden z-20">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Lightbulb size={18} />
          <span className="font-semibold">Why This Layout?</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Main Rationale */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {spec.rationale}
        </p>
        
        {/* Retrieved Context */}
        {spec.retrievedContext && (
          <div className="space-y-3">
            {spec.retrievedContext.personaTraits && spec.retrievedContext.personaTraits.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                  Retrieved Persona Traits
                </p>
                <div className="flex flex-wrap gap-1">
                  {spec.retrievedContext.personaTraits.slice(0, 4).map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {spec.retrievedContext.matchedPatterns && spec.retrievedContext.matchedPatterns.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
                  Matched UI Patterns (RICO-inspired)
                </p>
                <div className="flex flex-wrap gap-1">
                  {spec.retrievedContext.matchedPatterns.map((pattern, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {spec.retrievedContext.behaviorInsights && spec.retrievedContext.behaviorInsights.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                  Behavior Insights (ScholaWrite-inspired)
                </p>
                <p className="text-xs text-gray-600 italic">
                  {spec.retrievedContext.behaviorInsights[0]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Workspace Content
// ============================================

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const persona = (searchParams.get('persona') as UserPersona) || 'VisualWriter';
  const goal = searchParams.get('goal') || '';
  const intent = (searchParams.get('intent') as 'write' | 'brainstorm' | 'review' | 'research') || 'write';
  const isComparisonMode = searchParams.get('comparison') === 'true';

  // State
  const [spec, setSpec] = useState<UISpecification | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ConditionResult[] | null>(null);
  const [activeCondition, setActiveCondition] = useState<InterfaceCondition>('personalized-genui');
  const [loading, setLoading] = useState(true);
  const [showEvalPanel, setShowEvalPanel] = useState(true);
  const [showRationale, setShowRationale] = useState(true);
  const [showDetailedEval, setShowDetailedEval] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    async function load() {
      if (!goal) return;
      setLoading(true);
      try {
        const taskGoal = { description: goal, intent };
        const userProfile = { 
          id: 'u1', 
          name: 'User', 
          persona, 
          preferences: { density: 'comfortable' as const, showMinimap: true } 
        };

        if (isComparisonMode) {
          // Generate all three conditions
          const results = await generateAllConditions(taskGoal, userProfile);
          setComparisonResults(results);
          
          // Set initial view to personalized
          const personalizedResult = results.find(r => r.condition === 'personalized-genui');
          if (personalizedResult) {
            setSpec(personalizedResult.specification);
            setEvaluation(personalizedResult.evaluation);
          }
          setShowStats(true);
        } else {
          // Single personalized generation
          const ui = await generateInterface(taskGoal, userProfile, 'personalized-genui');
          setSpec(ui);

          const evalResult = await evaluateInterface(ui, taskGoal, userProfile, 'personalized-genui');
          setEvaluation(evalResult);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [persona, goal, intent, isComparisonMode]);

  // Handle condition switch in comparison mode
  const handleConditionChange = (condition: InterfaceCondition) => {
    setActiveCondition(condition);
    const result = comparisonResults?.find(r => r.condition === condition);
    if (result) {
      setSpec(result.specification);
      setEvaluation(result.evaluation);
    }
  };

  if (loading || !spec) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-300/20 border-t-indigo-500 rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
        </div>
        <div className="text-center">
          <p className="text-indigo-200 font-semibold text-xl mb-2">
            {isComparisonMode ? 'Running Experiment...' : 'Generating Adaptive Workspace...'}
          </p>
          <div className="text-sm text-indigo-300/60 space-y-1 max-w-md">
            <p className="animate-pulse">→ Retrieving {persona} cognitive profile...</p>
            <p className="animate-pulse" style={{ animationDelay: '0.2s' }}>→ Matching UI patterns (RICO-inspired)...</p>
            <p className="animate-pulse" style={{ animationDelay: '0.4s' }}>→ Analyzing behavior traces (ScholaWrite)...</p>
            {isComparisonMode && (
              <>
                <p className="animate-pulse" style={{ animationDelay: '0.6s' }}>→ Generating baseline condition...</p>
                <p className="animate-pulse" style={{ animationDelay: '0.8s' }}>→ Generating generic GenUI...</p>
                <p className="animate-pulse" style={{ animationDelay: '1s' }}>→ Generating personalized GenUI...</p>
              </>
            )}
            <p className="animate-pulse" style={{ animationDelay: isComparisonMode ? '1.2s' : '0.6s' }}>→ Running LLM-as-Judge evaluation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b flex items-center justify-between px-4 py-2 shadow-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')} 
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              {isComparisonMode && <FlaskConical size={14} className="text-amber-500" />}
              {isComparisonMode ? 'Experiment Mode' : 'Generative Workspace'}
            </h1>
            <p className="text-xs text-gray-500 truncate max-w-sm">{goal}</p>
          </div>
          <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs rounded-full font-medium">
            {persona}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {evaluation && (
            <div className="hidden lg:flex items-center gap-3 text-xs">
              <ScoreChip label="Load" value={100 - evaluation.cognitiveLoad} />
              <ScoreChip label="Clarity" value={evaluation.clarity} />
              <ScoreChip label="Efficiency" value={evaluation.efficiency} />
              <ScoreChip label="Fit" value={evaluation.personalizationFit} />
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="font-bold text-indigo-600 text-base">{Math.round(evaluation.overallScore)}</span>
                <span className="text-gray-400 text-[10px]">Overall</span>
              </div>
            </div>
          )}
          
          {isComparisonMode && (
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-amber-100 text-amber-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Experiment Statistics"
              aria-label="Toggle experiment statistics"
            >
              <TrendingUp size={18} />
            </button>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" 
            title="Regenerate"
            aria-label="Regenerate workspace"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Comparison Mode Selector */}
      {isComparisonMode && comparisonResults && (
        <div className="px-4 py-2 bg-white border-b">
          <ComparisonView 
            results={comparisonResults} 
            activeCondition={activeCondition}
            onSelectCondition={handleConditionChange}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full p-2">
          <DynamicRenderer component={spec.layout} />
        </div>
        
        {/* "Why This UI" Rationale Card */}
        {spec.rationale && showRationale && (
          <RationalePanel spec={spec} onClose={() => setShowRationale(false)} />
        )}

        {/* Experiment Stats Panel */}
        {isComparisonMode && showStats && comparisonResults && (
          <div className="absolute top-4 right-4 w-80 z-20">
            <ExperimentStats results={comparisonResults} />
          </div>
        )}
      </main>

      {/* Evaluation Panel (Collapsible) */}
      {evaluation && (
        <div className={`bg-white border-t shadow-lg z-10 transition-all flex-shrink-0 ${showEvalPanel ? '' : 'h-10'}`}>
          <button 
            onClick={() => setShowEvalPanel(!showEvalPanel)}
            className="w-full h-10 flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-50"
            aria-expanded={showEvalPanel}
            aria-label="Toggle evaluation panel"
          >
            <BarChart2 size={16} />
            <span>5-Factor Evaluation (NASA-TLX + Nielsen + SUS)</span>
            {showEvalPanel ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          
          {showEvalPanel && (
            <EnhancedEvalPanel 
              evaluation={evaluation} 
              showDetailed={showDetailedEval}
              onToggleDetailed={() => setShowDetailedEval(!showDetailedEval)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function ScoreChip({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-green-600' : value >= 50 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold ${color}`}>{Math.round(value)}</span>
      <span className="text-gray-400 text-[10px]">{label}</span>
    </div>
  );
}

// ============================================
// Export
// ============================================

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950">
        <div className="w-16 h-16 border-4 border-indigo-300/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
