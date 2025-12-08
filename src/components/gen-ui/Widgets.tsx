'use client';

import React, { useState, useCallback } from 'react';
import { Send, Plus, FileText, GripVertical, Clock, BookOpen, ExternalLink, Trash2, MessageCircle, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

// ============================================
// Rich Text Editor (Functional)
// ============================================
export const RichTextEditor = () => {
  const [content, setContent] = useState(
    "The impact of Generative AI on cognitive workflows is increasingly significant. " +
    "This paper explores how dynamically generated interfaces can reduce cognitive load..."
  );
  const [wordCount, setWordCount] = useState(0);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, []);

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Text Editor">
      <div className="flex gap-2 border-b border-gray-100 pb-2 mb-2" role="toolbar" aria-label="Formatting options">
        {['Bold', 'Italic', 'H1', 'H2', 'Quote'].map(btn => (
          <button 
            key={btn} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label={`Format ${btn}`}
          >
            {btn}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400" aria-live="polite">
          {wordCount} words
        </span>
      </div>
      <textarea 
        className="flex-1 w-full resize-none outline-none text-gray-800 leading-relaxed font-serif focus:ring-2 focus:ring-indigo-200 rounded p-2" 
        placeholder="Start writing..."
        value={content}
        onChange={handleChange}
        aria-label="Main editor content"
      />
    </div>
  );
};

// ============================================
// Outline View (Functional)
// ============================================
export const OutlineView = () => {
  const [items, setItems] = useState([
    { id: 1, title: 'Introduction', level: 0 },
    { id: 2, title: 'Problem Statement', level: 1 },
    { id: 3, title: 'Methodology', level: 0 },
    { id: 4, title: 'Data Collection', level: 1 },
    { id: 5, title: 'Results', level: 0 },
    { id: 6, title: 'Discussion', level: 0 },
  ]);
  const [newSection, setNewSection] = useState('');

  const addSection = () => {
    if (!newSection.trim()) return;
    setItems([...items, { id: Date.now(), title: newSection, level: 0 }]);
    setNewSection('');
  };

  return (
    <div className="space-y-1" role="navigation" aria-label="Document outline">
      <ul className="space-y-1">
        {items.map(item => (
          <li 
            key={item.id} 
            className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded cursor-pointer text-sm group"
            style={{ paddingLeft: `${item.level * 16 + 4}px` }}
            tabIndex={0}
            role="button"
            aria-label={`Navigate to ${item.title}`}
          >
            <FileText size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-gray-700 flex-1">{item.title}</span>
            <button 
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
              onClick={() => setItems(items.filter(i => i.id !== item.id))}
              aria-label={`Delete ${item.title}`}
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-indigo-500"
          placeholder="New section..."
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSection()}
          aria-label="New section name"
        />
        <button 
          onClick={addSection}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
          aria-label="Add section"
        >
          <Plus size={12} aria-hidden="true" /> Add
        </button>
      </div>
    </div>
  );
};

// ============================================
// Kanban Board (Functional with Drag State)
// ============================================
interface KanbanCard {
  id: number;
  text: string;
}

interface KanbanColumn {
  name: string;
  cards: KanbanCard[];
}

export const KanbanBoard = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { name: 'To Do', cards: [{ id: 1, text: 'Research related work' }, { id: 2, text: 'Draft abstract' }] },
    { name: 'In Progress', cards: [{ id: 3, text: 'Outline methodology' }] },
    { name: 'Done', cards: [{ id: 4, text: 'Define research question' }] },
  ]);
  const [newCard, setNewCard] = useState<{ [key: string]: string }>({});

  const addCard = (colName: string) => {
    const text = newCard[colName]?.trim();
    if (!text) return;
    setColumns(cols => cols.map(col => 
      col.name === colName 
        ? { ...col, cards: [...col.cards, { id: Date.now(), text }] }
        : col
    ));
    setNewCard({ ...newCard, [colName]: '' });
  };

  const moveCard = (cardId: number, fromCol: string, toCol: string) => {
    setColumns(cols => {
      const card = cols.find(c => c.name === fromCol)?.cards.find(c => c.id === cardId);
      if (!card) return cols;
      return cols.map(col => {
        if (col.name === fromCol) {
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        if (col.name === toCol) {
          return { ...col, cards: [...col.cards, card] };
        }
        return col;
      });
    });
  };

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-2" role="region" aria-label="Kanban board">
      {columns.map((col, colIdx) => (
        <div 
          key={col.name} 
          className="w-48 flex-shrink-0 bg-gray-50 rounded-lg p-2 flex flex-col"
          role="list"
          aria-label={`${col.name} column`}
        >
          <div className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
            {col.name}
            <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-xs">{col.cards.length}</span>
          </div>
          <div className="flex-1 space-y-2 min-h-[100px]">
            {col.cards.map(card => (
              <div 
                key={card.id} 
                className="bg-white p-2 rounded shadow-sm border border-gray-100 text-sm group cursor-move hover:shadow-md transition-shadow"
                role="listitem"
                draggable
              >
                <div className="flex items-start gap-1">
                  <GripVertical size={14} className="text-gray-300 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{card.text}</span>
                </div>
                {colIdx < columns.length - 1 && (
                  <button
                    className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100"
                    onClick={() => moveCard(card.id, col.name, columns[colIdx + 1].name)}
                    aria-label={`Move to ${columns[colIdx + 1].name}`}
                  >
                    → Move
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <input
              type="text"
              className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-indigo-500 mb-1"
              placeholder="Add card..."
              value={newCard[col.name] || ''}
              onChange={e => setNewCard({ ...newCard, [col.name]: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addCard(col.name)}
              aria-label={`Add card to ${col.name}`}
            />
            <button 
              onClick={() => addCard(col.name)}
              className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded flex justify-center py-1"
              aria-label={`Add card to ${col.name}`}
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// AI Chat (Functional)
// ============================================
export const AIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'How can I help you with your writing task?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(msgs => [...msgs, { role: 'user', text: userMsg }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(msgs => [...msgs, { 
        role: 'ai', 
        text: `I can help with that! Here are some suggestions for "${userMsg.slice(0, 30)}..."` 
      }]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full" role="region" aria-label="AI Chat Assistant">
      <div className="flex-1 overflow-y-auto space-y-3 p-1" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0" aria-hidden="true">
                AI
              </div>
            )}
            <div className={`p-2 rounded-lg text-sm max-w-[85%] ${
              msg.role === 'ai' 
                ? 'bg-gray-100 text-gray-700 rounded-tl-none' 
                : 'bg-indigo-600 text-white rounded-tr-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t pt-2 flex gap-2">
        <input 
          type="text" 
          className="flex-1 text-sm border rounded px-2 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          placeholder="Ask AI for help..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          aria-label="Chat message input"
        />
        <button 
          onClick={sendMessage}
          className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          aria-label="Send message"
        >
          <Send size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// Mind Map (Visual with Add Node)
// ============================================
export const MindMap = () => {
  const [nodes, setNodes] = useState([
    { id: 'center', label: 'Central Idea', x: 50, y: 50 },
    { id: 'n1', label: 'Theme A', x: 25, y: 30 },
    { id: 'n2', label: 'Theme B', x: 75, y: 70 },
  ]);
  const [newNode, setNewNode] = useState('');

  const addNode = () => {
    if (!newNode.trim()) return;
    const angle = Math.random() * Math.PI * 2;
    const radius = 25 + Math.random() * 15;
    setNodes([...nodes, {
      id: `n${Date.now()}`,
      label: newNode,
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    }]);
    setNewNode('');
  };

  return (
    <div className="h-full w-full flex flex-col" role="region" aria-label="Mind Map">
      <div className="flex-1 relative bg-gray-50 rounded border border-dashed border-gray-200 overflow-hidden">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {nodes.slice(1).map(node => (
            <line 
              key={node.id}
              x1="50%" y1="50%" 
              x2={`${node.x}%`} y2={`${node.y}%`} 
              stroke="#cbd5e1" 
              strokeWidth="2" 
            />
          ))}
        </svg>
        
        {/* Nodes */}
        {nodes.map((node, i) => (
          <div 
            key={node.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full shadow-sm text-sm cursor-pointer hover:shadow-md transition-shadow ${
              i === 0 
                ? 'bg-white border-2 border-indigo-400 font-medium' 
                : 'bg-white border border-gray-300'
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            tabIndex={0}
            role="button"
            aria-label={`Node: ${node.label}`}
          >
            {node.label}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-indigo-500"
          placeholder="Add node..."
          value={newNode}
          onChange={e => setNewNode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNode()}
          aria-label="New node label"
        />
        <button 
          onClick={addNode}
          className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          aria-label="Add node"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// Stats Widget
// ============================================
export const StatsWidget = () => {
  return (
    <div className="grid grid-cols-2 gap-2 h-full" role="region" aria-label="Writing Statistics">
      <div className="bg-blue-50 p-3 rounded flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-blue-600" aria-label="Word count">342</span>
        <span className="text-xs text-blue-400 uppercase">Words</span>
      </div>
      <div className="bg-green-50 p-3 rounded flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-green-600" aria-label="Time spent">12m</span>
        <span className="text-xs text-green-400 uppercase">Time</span>
      </div>
      <div className="bg-purple-50 p-3 rounded flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-purple-600" aria-label="Focus score">85%</span>
        <span className="text-xs text-purple-400 uppercase">Focus</span>
      </div>
      <div className="bg-amber-50 p-3 rounded flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-amber-600" aria-label="Progress">3/7</span>
        <span className="text-xs text-amber-400 uppercase">Sections</span>
      </div>
    </div>
  );
};

// ============================================
// Research Widget (NEW - for source tracking)
// ============================================
export const ResearchWidget = () => {
  const [sources, setSources] = useState([
    { id: 1, title: 'Chen et al. (2025)', type: 'paper', url: '#' },
    { id: 2, title: 'Lewis et al. (2020)', type: 'paper', url: '#' },
    { id: 3, title: 'Nielsen (2012)', type: 'guideline', url: '#' },
  ]);
  const [newSource, setNewSource] = useState('');

  const addSource = () => {
    if (!newSource.trim()) return;
    setSources([...sources, { id: Date.now(), title: newSource, type: 'paper', url: '#' }]);
    setNewSource('');
  };

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Research Sources">
      <div className="flex-1 overflow-y-auto space-y-2">
        {sources.map(src => (
          <div 
            key={src.id} 
            className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 group"
            role="listitem"
          >
            <BookOpen size={14} className="text-indigo-500 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-sm text-gray-700 truncate">{src.title}</span>
            <span className="text-xs text-gray-400 bg-gray-200 px-1.5 rounded">{src.type}</span>
            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600" aria-label={`Open ${src.title}`}>
              <ExternalLink size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-indigo-500"
          placeholder="Add source..."
          value={newSource}
          onChange={e => setNewSource(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSource()}
          aria-label="New source citation"
        />
        <button 
          onClick={addSource}
          className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          aria-label="Add source"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// Timeline Widget (for revision history)
// ============================================
export const TimelineWidget = () => {
  const events = [
    { id: 1, time: '2 min ago', action: 'Edited Introduction', type: 'edit' },
    { id: 2, time: '10 min ago', action: 'AI suggestion applied', type: 'ai' },
    { id: 3, time: '25 min ago', action: 'Added Methodology section', type: 'add' },
    { id: 4, time: '1 hour ago', action: 'Started draft', type: 'start' },
  ];

  return (
    <div className="h-full overflow-y-auto" role="region" aria-label="Revision Timeline">
      <div className="relative pl-4 border-l-2 border-gray-200 space-y-4">
        {events.map(evt => (
          <div key={evt.id} className="relative" role="listitem">
            <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-white border-2 border-indigo-400" aria-hidden="true" />
            <div className="ml-2">
              <p className="text-sm text-gray-700">{evt.action}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={10} aria-hidden="true" /> {evt.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Critique Widget (for AI-powered review/feedback)
// ============================================
export const CritiqueWidget = () => {
  const [critiques, setCritiques] = useState([
    { id: 1, type: 'suggestion', text: 'Consider strengthening the thesis statement', resolved: false },
    { id: 2, type: 'warning', text: 'Paragraph 3 may be too long for readability', resolved: false },
    { id: 3, type: 'positive', text: 'Strong use of evidence in the methodology section', resolved: true },
  ]);

  const toggleResolved = (id: number) => {
    setCritiques(critiques.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Lightbulb size={14} className="text-amber-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-orange-500" />;
      case 'positive': return <CheckCircle size={14} className="text-green-500" />;
      default: return <MessageCircle size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Writing Critique">
      <div className="flex-1 overflow-y-auto space-y-2">
        {critiques.map(critique => (
          <div 
            key={critique.id} 
            className={`flex items-start gap-2 p-2 rounded border transition-opacity ${
              critique.resolved 
                ? 'bg-gray-50 border-gray-100 opacity-60' 
                : 'bg-white border-gray-200 hover:border-indigo-200'
            }`}
            role="listitem"
          >
            <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
              {getIcon(critique.type)}
            </div>
            <p className={`flex-1 text-sm ${critique.resolved ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {critique.text}
            </p>
            <button
              onClick={() => toggleResolved(critique.id)}
              className={`p-1 rounded hover:bg-gray-100 ${critique.resolved ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
              aria-label={critique.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
            >
              <CheckCircle size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button 
          className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
          aria-label="Request AI critique"
        >
          <MessageCircle size={14} />
          Request New Critique
        </button>
      </div>
    </div>
  );
};
