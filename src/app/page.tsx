'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Layout, List, BookMarked, Edit3, Search, RefreshCw, Brain, FlaskConical, Info } from 'lucide-react';
import { UserPersona } from '@/types/schema';

type TaskIntent = 'write' | 'brainstorm' | 'review' | 'research';

interface PersonaConfig {
  id: UserPersona;
  label: string;
  icon: React.ReactNode;
  description: string;
  traits: string[];
  color: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'VisualWriter',
    label: 'Visual Thinker',
    icon: <Layout size={22} />,
    description: 'Spatial organization, mind maps, kanban boards',
    traits: ['Branches ideas before drafting', 'Visual connections between concepts', 'Divergent exploration first'],
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'LinearWriter',
    label: 'Linear Thinker',
    icon: <List size={22} />,
    description: 'Hierarchical outlines, sequential drafting',
    traits: ['Outline-first approach', 'Section-by-section progression', 'Deep focus preferred'],
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'ResearchWriter',
    label: 'Research-Focused',
    icon: <BookMarked size={22} />,
    description: 'Source management, thematic synthesis',
    traits: ['Heavy citation management', 'Cross-references frequently', 'Builds thematic clusters'],
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function Home() {
  const router = useRouter();
  const [persona, setPersona] = useState<UserPersona>('VisualWriter');
  const [intent, setIntent] = useState<TaskIntent>('write');
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleGenerate = () => {
    if (!goal) return;
    setIsLoading(true);
    setTimeout(() => {
      const params = new URLSearchParams({
        persona,
        goal,
        intent,
        comparison: comparisonMode.toString(),
      });
      router.push(`/workspace?${params.toString()}`);
    }, 400);
  };

  const intentOptions: { id: TaskIntent; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'write', label: 'Write', icon: <Edit3 size={18} />, desc: 'Draft content' },
    { id: 'brainstorm', label: 'Brainstorm', icon: <Brain size={18} />, desc: 'Generate ideas' },
    { id: 'review', label: 'Review', icon: <RefreshCw size={18} />, desc: 'Edit & revise' },
    { id: 'research', label: 'Research', icon: <Search size={18} />, desc: 'Explore sources' },
  ];

  const selectedPersona = PERSONAS.find(p => p.id === persona)!;

  return (
    <main className="min-h-screen bg-[#0B0D11] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTEgMWgzOHYzOEgxVjF6IiBmaWxsPSIjMWExYTFhIiBmaWxsLW9wYWNpdHk9Ii4zIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      
      <div className="relative max-w-3xl w-full z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-6 rotate-3 hover:rotate-0 transition-transform">
            <Sparkles size={38} />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200 mb-3 tracking-tight">
            GenUI Engine
          </h1>
          <p className="text-indigo-200/60 text-lg font-light">
            AI-generated workspaces adapted to your cognitive style
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 space-y-8 shadow-2xl">
          
          {/* Persona Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-indigo-200 uppercase tracking-wider">
                Cognitive Style
              </label>
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="text-indigo-400 hover:text-indigo-300 p-1"
                aria-label="Show info about cognitive styles"
              >
                <Info size={16} />
              </button>
            </div>
            
            {showInfo && (
              <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-200/80">
                <p className="mb-2"><strong>Based on cognitive style research (Riding & Cheema, 1991):</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Visual Thinkers</strong> prefer spatial externalization and non-linear exploration</li>
                  <li><strong>Linear Thinkers</strong> prefer hierarchical structures and sequential progression</li>
                  <li><strong>Research-Focused</strong> need source tracking linked to thematic organization</li>
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              {PERSONAS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${
                    persona === p.id 
                      ? 'border-transparent bg-gradient-to-br ' + p.color + ' shadow-lg scale-[1.02]' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className={`flex flex-col items-center text-center gap-2 relative z-10`}>
                    <div className={`p-2.5 rounded-xl ${
                      persona === p.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <span className="text-white">{p.icon}</span>
                    </div>
                    <span className={`font-bold text-sm ${persona === p.id ? 'text-white' : 'text-white/80'}`}>
                      {p.label}
                    </span>
                    <span className={`text-xs leading-tight ${persona === p.id ? 'text-white/80' : 'text-white/40'}`}>
                      {p.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Selected Persona Traits */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedPersona.traits.map((trait, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 text-xs rounded-full bg-white/5 text-indigo-200/70 border border-white/5"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Task Intent */}
          <div>
            <label className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-4 block">
              Task Intent
            </label>
            <div className="grid grid-cols-4 gap-2">
              {intentOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIntent(opt.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    intent === opt.id
                      ? 'border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20'
                      : 'border-white/10 hover:border-white/20 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {opt.icon}
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-[10px] opacity-60">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Input */}
          <div>
            <label className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-4 block">
              Describe Your Task
            </label>
            <textarea 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="E.g., Draft a CHI paper introduction on human-AI collaboration..."
              className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[120px] resize-none font-light leading-relaxed"
            />
          </div>

          {/* Comparison Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FlaskConical size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Experiment Mode</p>
                <p className="text-xs text-amber-200/60">Compare baseline chat vs. generic vs. personalized GenUI</p>
              </div>
            </div>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                comparisonMode ? 'bg-amber-500' : 'bg-white/10'
              }`}
              role="switch"
              aria-checked={comparisonMode}
              aria-label="Toggle comparison mode"
            >
              <span 
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  comparisonMode ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGenerate}
            disabled={!goal || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              !goal || isLoading
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Workspace...
              </>
            ) : (
              <>
                {comparisonMode ? 'Run Experiment' : 'Generate Workspace'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-white/30 text-xs">
            Powered by GPT-4o • Evaluation based on NASA-TLX, Nielsen&apos;s Heuristics, and SUS
          </p>
          <p className="text-white/20 text-[10px]">
            CS 329X Final Project • Generative Interfaces for Personalized AI Collaboration
          </p>
        </div>
      </div>
    </main>
  );
}
