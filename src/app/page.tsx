"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
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
      { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
      { id: crypto.randomUUID(), toolId: '', plan: '', monthlySpend: '', seats: 1 },
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
        // Cache result locally so results page works without Supabase configured
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
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans" role="main">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-1.5 rounded-full text-sm font-medium">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Trusted by 100+ startups managing $1M+ in AI spend</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            Stop overpaying for <span className="text-blue-600">AI tools.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto">
            Audit your startup&apos;s AI subscriptions in 60 seconds. Get an instant, actionable breakdown of downgrade paths, redundancies, and alternatives.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8" aria-label="AI spend audit form" noValidate>

              {/* Global Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="team-size" className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Team Size
                  </label>
                  <input
                    id="team-size"
                    type="number"
                    min="1"
                    required
                    aria-required="true"
                    className="w-full border border-neutral-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value ? parseInt(e.target.value) : 1)}
                  />
                </div>
                <div>
                  <label htmlFor="use-case" className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    Primary Use Case
                  </label>
                  <select
                    id="use-case"
                    className="w-full border border-neutral-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    value={primaryUseCase}
                    onChange={(e) => setPrimaryUseCase(e.target.value)}
                  >
                    {USE_CASES.map(uc => (
                      <option key={uc} value={uc}>{uc.charAt(0).toUpperCase() + uc.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tools */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h2 className="text-lg font-bold">Your AI Subscriptions</h2>
                  {totalMonthly > 0 && (
                    <span className="text-sm text-neutral-500">
                      Total: <strong className="text-neutral-800">${totalMonthly.toLocaleString()}/mo</strong>
                    </span>
                  )}
                </div>

                {/* Header Row (desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1" aria-hidden="true">
                  <div className="col-span-3">Tool</div>
                  <div className="col-span-3">Plan</div>
                  <div className="col-span-2">Seats</div>
                  <div className="col-span-3">Monthly ($)</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-3" role="list" aria-label="Tool entries">
                  {tools.map((tool, idx) => {
                    const selectedToolDef = TOOLS.find(t => t.id === tool.toolId);
                    return (
                      <div
                        key={tool.id}
                        role="listitem"
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-neutral-50 md:bg-transparent p-4 md:p-1 rounded-xl border border-neutral-100 md:border-none"
                      >
                        {/* Tool */}
                        <div className="col-span-1 md:col-span-3">
                          <label htmlFor={`tool-${idx}`} className="md:sr-only text-xs font-semibold text-neutral-500 uppercase block mb-1">Tool</label>
                          <select
                            id={`tool-${idx}`}
                            required
                            aria-required="true"
                            className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
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
                          <label htmlFor={`plan-${idx}`} className="md:sr-only text-xs font-semibold text-neutral-500 uppercase block mb-1">Plan</label>
                          <select
                            id={`plan-${idx}`}
                            required
                            aria-required="true"
                            disabled={!tool.toolId}
                            className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-neutral-100"
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
                          <label htmlFor={`seats-${idx}`} className="md:sr-only text-xs font-semibold text-neutral-500 uppercase block mb-1">Seats</label>
                          <input
                            id={`seats-${idx}`}
                            type="number"
                            min="1"
                            required
                            aria-required="true"
                            className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                            value={tool.seats}
                            onChange={(e) => updateTool(tool.id, 'seats', e.target.value ? parseInt(e.target.value) : 1)}
                          />
                        </div>

                        {/* Monthly Spend */}
                        <div className="col-span-1 md:col-span-3">
                          <label htmlFor={`spend-${idx}`} className="md:sr-only text-xs font-semibold text-neutral-500 uppercase block mb-1">Monthly Spend ($)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400 text-sm" aria-hidden="true">$</span>
                            <input
                              id={`spend-${idx}`}
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              aria-required="true"
                              className="w-full pl-7 border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
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
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-10 w-10"
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
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  aria-label="Add another tool to the list"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Add another tool
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg transition-all"
                  aria-label="Run AI spend audit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" aria-hidden="true" />
                      Analyzing your stack…
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
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          No account required · Data never shared · Built by{' '}
          <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">
            Credex
          </a>
        </p>
      </div>
    </main>
  );
}
