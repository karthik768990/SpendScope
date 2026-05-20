"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { id: 'cursor', name: 'Cursor', plans: ['Hobby (Free)', 'Pro ($20/mo)', 'Business ($40/mo)', 'Enterprise'] },
  { id: 'github_copilot', name: 'GitHub Copilot', plans: ['Individual ($10/mo)', 'Business ($19/mo)', 'Enterprise ($39/mo)'] },
  { id: 'claude', name: 'Claude (Anthropic)', plans: ['Free', 'Pro ($20/mo)', 'Max ($100/mo)', 'Team ($30/mo/user)', 'Enterprise', 'API Direct'] },
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)', plans: ['Free', 'Plus ($20/mo)', 'Team ($30/mo/user)', 'Enterprise', 'API Direct'] },
  { id: 'anthropic_api', name: 'Anthropic API', plans: ['Pay-as-you-go'] },
  { id: 'openai_api', name: 'OpenAI API', plans: ['Pay-as-you-go'] },
  { id: 'gemini', name: 'Gemini (Google)', plans: ['Free', 'Advanced ($19.99/mo)', 'API / Vertex AI'] },
  { id: 'windsurf', name: 'Windsurf (Codeium)', plans: ['Free', 'Pro ($15/mo)', 'Teams ($35/mo/user)'] },
];

const USE_CASES = ['coding', 'writing', 'data', 'research', 'mixed'];

interface ToolEntry {
  id: string;
  toolId: string;
  plan: string;
  monthlySpend: number | '';
  seats: number | '';
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [primaryUseCase, setPrimaryUseCase] = useState<string>('mixed');
  const [tools, setTools] = useState<ToolEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('spendscope_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tools && parsed.tools.length > 0) {
          setTools(parsed.tools);
          setPrimaryUseCase(parsed.primaryUseCase || 'mixed');
        } else {
          setTools([
            { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
            { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
          ]);
        }
      } catch (e) {
        // init defaults
      }
    } else {
      setTools([
        { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
        { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
      ]);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('spendscope_form', JSON.stringify({ tools, primaryUseCase }));
    }
  }, [tools, primaryUseCase, mounted]);

  const addTool = () => {
    setTools([...tools, { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 }]);
  };

  const removeTool = (id: string) => {
    setTools(tools.filter(t => t.id !== id));
  };

  const updateTool = (id: string, field: keyof ToolEntry, value: any) => {
    setTools(tools.map(t => {
      if (t.id === id) {
        const newTool = { ...t, [field]: value };
        
        // Pre-populate spend if tool and plan are selected, and seats are valid
        if ((field === 'toolId' || field === 'plan' || field === 'seats') && newTool.toolId && newTool.plan && typeof newTool.seats === 'number') {
           const match = newTool.plan.match(/\$(\d+(\.\d+)?)\/mo/);
           if (match) {
             const price = parseFloat(match[1]);
             newTool.monthlySpend = price * newTool.seats;
           } else if (newTool.plan.toLowerCase().includes('free')) {
             newTool.monthlySpend = 0;
           }
        }
        return newTool;
      }
      return t;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Audit logic integration goes here
    alert("Audit functionality coming soon!");
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-200">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Trusted by 100+ startups managing $1M+ in AI spend</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            Stop overpaying for <span className="text-blue-600">AI tools.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
            Audit your startup's AI subscriptions in 60 seconds and save up to 40% immediately. Get an instant, actionable breakdown of downgrade paths and alternatives.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Global Settings */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Primary Use Case</label>
                <select 
                  className="w-full md:w-64 border-neutral-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                  value={primaryUseCase}
                  onChange={(e) => setPrimaryUseCase(e.target.value)}
                >
                  {USE_CASES.map(uc => (
                    <option key={uc} value={uc}>{uc.charAt(0).toUpperCase() + uc.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Tools List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold">Your Subscriptions</h2>
                </div>
                
                {/* Desktop Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">
                  <div className="col-span-3">Tool</div>
                  <div className="col-span-3">Plan</div>
                  <div className="col-span-2">Seats</div>
                  <div className="col-span-3">Monthly Spend ($)</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-4 md:space-y-2">
                  {tools.map((tool, index) => {
                    const selectedToolDef = TOOLS.find(t => t.id === tool.toolId);
                    return (
                      <div key={tool.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-neutral-50 md:bg-transparent p-4 md:p-2 rounded-lg border border-neutral-100 md:border-none">
                        
                        {/* Tool Selector */}
                        <div className="col-span-1 md:col-span-3">
                          <label className="md:hidden text-xs font-semibold text-neutral-500 uppercase mb-1 block">Tool</label>
                          <select 
                            required
                            className="w-full border-neutral-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            value={tool.toolId}
                            onChange={(e) => updateTool(tool.id, 'toolId', e.target.value)}
                          >
                            <option value="" disabled>Select tool...</option>
                            {TOOLS.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Plan Dropdown */}
                        <div className="col-span-1 md:col-span-3">
                          <label className="md:hidden text-xs font-semibold text-neutral-500 uppercase mb-1 block">Plan</label>
                          <select 
                            required
                            disabled={!tool.toolId}
                            className="w-full border-neutral-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border disabled:opacity-50 disabled:bg-neutral-100"
                            value={tool.plan}
                            onChange={(e) => updateTool(tool.id, 'plan', e.target.value)}
                          >
                            <option value="" disabled>Select plan...</option>
                            {selectedToolDef?.plans.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        {/* Seats */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="md:hidden text-xs font-semibold text-neutral-500 uppercase mb-1 block">Seats</label>
                          <input 
                            type="number" 
                            min="1"
                            required
                            className="w-full border-neutral-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            value={tool.seats}
                            onChange={(e) => updateTool(tool.id, 'seats', e.target.value ? parseInt(e.target.value) : '')}
                          />
                        </div>

                        {/* Monthly Spend */}
                        <div className="col-span-1 md:col-span-3">
                          <label className="md:hidden text-xs font-semibold text-neutral-500 uppercase mb-1 block">Monthly Spend ($)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-neutral-500 sm:text-sm">$</span>
                            </div>
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              required
                              className="w-full pl-7 border-neutral-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                              value={tool.monthlySpend}
                              onChange={(e) => updateTool(tool.id, 'monthlySpend', e.target.value ? parseFloat(e.target.value) : '')}
                            />
                          </div>
                        </div>

                        {/* Remove Action */}
                        <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                            onClick={() => removeTool(tool.id)}
                            title="Remove Tool"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Tool Button */}
                <div>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={addTool}
                    className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add another tool
                  </Button>
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-6 border-t border-neutral-100 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Run My Audit <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
