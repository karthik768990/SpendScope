"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, ShieldCheck, Loader2, Sparkles, Terminal, BookOpen, Database, Shuffle } from "lucide-react";
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

const USE_CASES = ['coding', 'writing', 'data', 'research', 'mixed'] as const;

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
  const [teamSize, setTeamSize] = useState<number>(10);
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('spendscope_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tools && parsed.tools.length > 0) {
          setTools(parsed.tools);
          setPrimaryUseCase(parsed.primaryUseCase || 'mixed');
          setTeamSize(parsed.teamSize || 10);
        } else {
          setDefaultTools();
        }
      } catch {
        setDefaultTools();
      }
    } else {
      setDefaultTools();
    }
    setMounted(true);
  }, []);

  const setDefaultTools = () => {
    setTools([
      { id: crypto.randomUUID(), toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 200, seats: 5 },
      { id: crypto.randomUUID(), toolId: 'github_copilot', plan: 'Enterprise ($39/mo)', monthlySpend: 195, seats: 5 },
    ]);
  };

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('spendscope_form', JSON.stringify({ tools, primaryUseCase, teamSize }));
    }
  }, [tools, primaryUseCase, teamSize, mounted]);

  const addTool = () => {
    setTools([...tools, { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 }]);
  };

  const removeTool = (id: string) => {
    setTools(tools.filter(t => t.id !== id));
  };

  const updateTool = (id: string, field: keyof ToolEntry, value: string | number) => {
    setTools(tools.map(t => {
      if (t.id !== id) return t;
      const newTool = { ...t, [field]: value };
      // Auto-populate spend from plan price × seats
      if ((field === 'toolId' || field === 'plan' || field === 'seats') && newTool.toolId && newTool.plan && typeof newTool.seats === 'number') {
        const match = newTool.plan.match(/\$(\d+(\.\d+)?)\/mo/);
        if (match) {
          newTool.monthlySpend = parseFloat(match[1]) * newTool.seats;
        } else if (newTool.plan.toLowerCase().includes('free')) {
          newTool.monthlySpend = 0;
        }
      }
      return newTool;
    }));
  };

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'engineering':
        setTools([
          { id: crypto.randomUUID(), toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 400, seats: 10 },
          { id: crypto.randomUUID(), toolId: 'github_copilot', plan: 'Enterprise ($39/mo)', monthlySpend: 390, seats: 10 },
          { id: crypto.randomUUID(), toolId: 'anthropic_api', plan: 'Pay-as-you-go', monthlySpend: 250, seats: 1 },
        ]);
        setPrimaryUseCase('coding');
        setTeamSize(10);
        break;
      case 'marketing':
        setTools([
          { id: crypto.randomUUID(), toolId: 'claude', plan: 'Max ($100/mo)', monthlySpend: 300, seats: 3 },
          { id: crypto.randomUUID(), toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 100, seats: 5 },
        ]);
        setPrimaryUseCase('writing');
        setTeamSize(5);
        break;
      case 'data':
        setTools([
          { id: crypto.randomUUID(), toolId: 'chatgpt', plan: 'Team ($30/mo/user)', monthlySpend: 240, seats: 8 },
          { id: crypto.randomUUID(), toolId: 'openai_api', plan: 'Pay-as-you-go', monthlySpend: 300, seats: 1 },
          { id: crypto.randomUUID(), toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 160, seats: 8 },
        ]);
        setPrimaryUseCase('data');
        setTeamSize(8);
        break;
      case 'mixed':
        setTools([
          { id: crypto.randomUUID(), toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 200, seats: 10 },
          { id: crypto.randomUUID(), toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 200, seats: 10 },
          { id: crypto.randomUUID(), toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
        ]);
        setPrimaryUseCase('mixed');
        setTeamSize(12);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools, primaryUseCase, teamSize }),
      });
      const data = await response.json();
      if (data.slug) {
        // Cache result locally
        localStorage.setItem(
          `audit_${data.slug}`,
          JSON.stringify({
            slug: data.slug,
            result: data.result,
            summary: data.summary,
            tools: {
              entries: tools,
              teamSize,
              primaryUseCase,
            },
          })
        );
        window.location.href = `/audit/${data.slug}`;
      } else {
        setError('Could not generate your audit. Please try again.');
      }
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const totalMonthly = tools.reduce((sum, t) => sum + (typeof t.monthlySpend === 'number' ? t.monthlySpend : 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden" role="main">
      {/* Visual background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">

        {/* Hero */}
        <div className="text-center mb-14 space-y-4">

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Stop overpaying for <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AI tools.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Audit your startup&apos;s AI subscriptions in 60 seconds. Get an instant, actionable breakdown of downgrade paths, redundancies, and alternatives.
          </p>
        </div>

        {/* Stack Presets Bar */}
        <div className="mb-8 text-center space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Or choose a pre-configured stack preset:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset('engineering')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Dev Stack
            </button>
            <button
              type="button"
              onClick={() => applyPreset('marketing')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-pink-400" /> Writing Stack
            </button>
            <button
              type="button"
              onClick={() => applyPreset('data')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all shadow-sm"
            >
              <Database className="w-3.5 h-3.5 mr-1.5 text-yellow-400" /> Data Stack
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mixed')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Mixed Stack
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8" aria-label="AI spend audit form" noValidate>

            {/* Global Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="team-size" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Team Size
                </label>
                <input
                  id="team-size"
                  type="number"
                  min="1"
                  required
                  aria-required="true"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-white transition-all outline-none"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value ? parseInt(e.target.value) : 1)}
                />
              </div>
              <div>
                <label htmlFor="use-case" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Primary Use Case
                </label>
                <select
                  id="use-case"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-white transition-all outline-none"
                  value={primaryUseCase}
                  onChange={(e) => setPrimaryUseCase(e.target.value)}
                >
                  {USE_CASES.map(uc => (
                    <option key={uc} value={uc} className="bg-slate-950">{uc.charAt(0).toUpperCase() + uc.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Your AI Subscriptions
                </h2>
                {totalMonthly > 0 && (
                  <span className="text-sm text-slate-400">
                    Total Spend: <strong className="text-emerald-400 text-base">${totalMonthly.toLocaleString('en-US')}/mo</strong>
                  </span>
                )}
              </div>

              {/* Header Row (desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1" aria-hidden="true">
                <div className="col-span-3">Tool</div>
                <div className="col-span-3">Plan</div>
                <div className="col-span-2">Seats</div>
                <div className="col-span-3">Monthly Spend ($)</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3.5" role="list" aria-label="Tool entries">
                {tools.map((tool, idx) => {
                  const selectedToolDef = TOOLS.find(t => t.id === tool.toolId);
                  return (
                    <div
                      key={tool.id}
                      role="listitem"
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/40 md:bg-transparent p-4 md:p-1.5 rounded-2xl border border-slate-800/50 md:border-none hover:bg-slate-900/40 transition-colors duration-200"
                    >
                      {/* Tool */}
                      <div className="col-span-1 md:col-span-3">
                        <label htmlFor={`tool-${idx}`} className="md:sr-only text-xs font-semibold text-slate-500 uppercase block mb-1">Tool</label>
                        <select
                          id={`tool-${idx}`}
                          required
                          aria-required="true"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 text-white outline-none"
                          value={tool.toolId}
                          onChange={(e) => updateTool(tool.id, 'toolId', e.target.value)}
                        >
                          <option value="" disabled>Select tool…</option>
                          {TOOLS.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Plan */}
                      <div className="col-span-1 md:col-span-3">
                        <label htmlFor={`plan-${idx}`} className="md:sr-only text-xs font-semibold text-slate-500 uppercase block mb-1">Plan</label>
                        <select
                          id={`plan-${idx}`}
                          required
                          aria-required="true"
                          disabled={!tool.toolId}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 text-white outline-none disabled:opacity-30 disabled:bg-slate-950"
                          value={tool.plan}
                          onChange={(e) => updateTool(tool.id, 'plan', e.target.value)}
                        >
                          <option value="" disabled>Select plan…</option>
                          {selectedToolDef?.plans.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Seats */}
                      <div className="col-span-1 md:col-span-2">
                        <label htmlFor={`seats-${idx}`} className="md:sr-only text-xs font-semibold text-slate-500 uppercase block mb-1">Seats</label>
                        <input
                          id={`seats-${idx}`}
                          type="number"
                          min="1"
                          required
                          aria-required="true"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 text-white outline-none"
                          value={tool.seats}
                          onChange={(e) => updateTool(tool.id, 'seats', e.target.value ? parseInt(e.target.value) : 1)}
                        />
                      </div>

                      {/* Monthly Spend */}
                      <div className="col-span-1 md:col-span-3">
                        <label htmlFor={`spend-${idx}`} className="md:sr-only text-xs font-semibold text-slate-500 uppercase block mb-1">Monthly Spend ($)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-sm" aria-hidden="true">$</span>
                          <input
                            id={`spend-${idx}`}
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            aria-required="true"
                            className="w-full pl-8 bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 text-white outline-none"
                            value={tool.monthlySpend}
                            onChange={(e) => updateTool(tool.id, 'monthlySpend', e.target.value ? parseFloat(e.target.value) : 0)}
                          />
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 w-10 rounded-xl transition-all"
                          onClick={() => removeTool(tool.id)}
                          aria-label={`Remove ${selectedToolDef?.name ?? 'tool'} from list`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addTool}
                className="bg-slate-950/60 border-slate-800 text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 rounded-xl transition-all px-5"
                aria-label="Add another tool to the list"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Add another tool
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-6 border-t border-slate-800/80 flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.01]"
                aria-label="Run AI spend audit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" aria-hidden="true" />
                    Analyzing stack & redundancies…
                  </>
                ) : (
                  <>
                    Run My Audit <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>

          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-8">
          No account required · Secure data processing · Built by{' '}
          <a href="#" className="underline hover:text-slate-400">
            SpendScope
          </a>
        </p>
      </div>
    </main>
  );
}
