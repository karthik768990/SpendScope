"use client";

import { useState, useEffect } from 'react';
import { auditTools, AuditInput, AuditResult, ToolEntry } from '@/lib/auditEngine';
import { Button } from '@/components/ui/button';
import { Check, Copy, ArrowRight, TrendingDown, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export interface AuditData {
  tools: { entries: ToolEntry[]; teamSize: number; primaryUseCase: AuditInput['primaryUseCase'] };
  id: string;
  summary: string;
  savings_monthly: number;
  savings_annual: number;
}

export default function AuditResultClient({ initialAudit, slug }: { initialAudit: AuditData | null; slug: string }) {
  const [audit, setAudit] = useState<AuditData | null>(initialAudit);
  const [loading, setLoading] = useState(!initialAudit);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State to track toggled optimizations (toolId -> boolean)
  const [toggledOptimizations, setToggledOptimizations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialAudit) {
      initializeToggles(initialAudit);
      return;
    }

    const cached = localStorage.getItem(`audit_${slug}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const data = {
          id: slug,
          tools: parsed.tools,
          summary: parsed.summary,
          savings_monthly: parsed.result?.totalMonthlySavings ?? 0,
          savings_annual: parsed.result?.totalAnnualSavings ?? 0,
        };
        setAudit(data);
        initializeToggles(data);
      } catch (e) {
        console.error("Failed to parse cached audit:", e);
      }
    }
    setLoading(false);
  }, [initialAudit, slug]);

  const initializeToggles = (data: AuditData) => {
    const auditInput: AuditInput = {
      tools: data.tools?.entries ?? [],
      teamSize: data.tools?.teamSize ?? 10,
      primaryUseCase: data.tools?.primaryUseCase ?? 'mixed',
    };
    const initialResult = auditTools(auditInput);
    const initialToggles: Record<string, boolean> = {};
    initialResult.items.forEach(item => {
      if (item.recommendedAction !== 'optimal') {
        initialToggles[item.toolId] = true;
      }
    });
    setToggledOptimizations(initialToggles);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-medium">Generating Spend Analysis…</p>
        </div>
      </main>
    );
  }

  if (!audit) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100" role="main">
        <div className="text-center space-y-4 max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Audit report not found</h1>
          <p className="text-slate-400">This temporary shareable audit report may have expired or is invalid.</p>
          <a href="/" className="inline-flex items-center text-indigo-400 underline hover:text-indigo-300">Run a new audit →</a>
        </div>
      </main>
    );
  }

  // Reconstruct the audit input
  const auditInput: AuditInput = {
    tools: audit.tools?.entries ?? [],
    teamSize: audit.tools?.teamSize ?? 10,
    primaryUseCase: audit.tools?.primaryUseCase ?? 'mixed',
  };
  const baseResult: AuditResult = auditTools(auditInput);

  // Compute interactive totals based on toggles
  let totalMonthlySavings = 0;
  const activeItems = baseResult.items.map(item => {
    const isApplied = toggledOptimizations[item.toolId] !== false; // default true if not unchecked
    if (item.recommendedAction !== 'optimal' && isApplied) {
      totalMonthlySavings += item.potentialMonthlySavings;
      return item;
    } else if (item.recommendedAction !== 'optimal' && !isApplied) {
      // Revert recommendation to optimal (i.e. keep original spend)
      return {
        ...item,
        recommendedAction: 'optimal' as const,
        potentialMonthlySavings: 0,
        recommendation: 'Plan details kept unchanged.',
        reasoning: 'You chose not to apply this recommendation.',
      };
    }
    return item;
  });

  const totalAnnualSavings = totalMonthlySavings * 12;

  // Calculate Stack Health Score
  // Deduct 15 for consolidate, 10 for switch, 5 for downgrade.
  let originalHealth = 100;
  baseResult.items.forEach(item => {
    if (item.recommendedAction === 'consolidate') originalHealth -= 15;
    else if (item.recommendedAction === 'switch') originalHealth -= 10;
    else if (item.recommendedAction === 'downgrade') originalHealth -= 5;
  });

  // Applied optimizations restore health
  let currentHealth = originalHealth;
  baseResult.items.forEach(item => {
    const isApplied = toggledOptimizations[item.toolId] !== false;
    if (item.recommendedAction !== 'optimal' && isApplied) {
      if (item.recommendedAction === 'consolidate') currentHealth += 15;
      else if (item.recommendedAction === 'switch') currentHealth += 10;
      else if (item.recommendedAction === 'downgrade') currentHealth += 5;
    }
  });
  const finalHealthScore = Math.min(100, Math.max(30, currentHealth));

  // Compute spend chart stats
  const originalSpend = baseResult.items.reduce((sum, i) => sum + i.currentSpend, 0);
  const optimizedSpend = Math.max(0, originalSpend - totalMonthlySavings);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionBadge = (action: string) => {
    switch (action) {
      case 'downgrade':
        return { label: 'DOWNGRADE', classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', icon: <TrendingDown className="w-3.5 h-3.5 mr-1" /> };
      case 'consolidate':
        return { label: 'CONSOLIDATE', classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: <AlertCircle className="w-3.5 h-3.5 mr-1" /> };
      case 'switch':
        return { label: 'SWITCH', classes: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', icon: <ArrowRight className="w-3.5 h-3.5 mr-1" /> };
      default:
        return { label: 'OPTIMAL', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> };
    }
  };

  const toggleOptimization = (toolId: string) => {
    setToggledOptimizations(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 relative overflow-hidden" role="main">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-10 relative">

        {/* Hero Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            SpendScope Intelligence Report
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
            You could save{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ${totalMonthlySavings.toLocaleString('en-US')}/mo
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium">
            That&apos;s a total reduction of{' '}
            <span className="text-emerald-400 font-bold">${totalAnnualSavings.toLocaleString('en-US')}/year</span>
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score Gauge */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Stack Health</h3>
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="url(#healthGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - finalHealthScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{finalHealthScore}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Score</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">Calculated based on redundancy density, plan mismatches, and cost overkill.</p>
          </div>

          {/* Dynamic SVG Spend Chart */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Spend Visualizer</h3>
            
            <div className="flex items-end justify-around h-36 pt-4 border-b border-slate-800/60">
              {/* Current Spend Bar */}
              <div className="flex flex-col items-center w-1/3 group">
                <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">${originalSpend.toLocaleString('en-US')}/mo</span>
                <div 
                  className="w-10 bg-slate-800 rounded-t-xl transition-all duration-500" 
                  style={{ height: `${originalSpend > 0 ? 90 : 10}px` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">Current</span>
              </div>

              {/* Optimized Spend Bar */}
              <div className="flex flex-col items-center w-1/3 group">
                <span className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">${optimizedSpend.toLocaleString('en-US')}/mo</span>
                <div 
                  className="w-10 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl shadow-lg shadow-emerald-500/10 transition-all duration-500" 
                  style={{ height: `${originalSpend > 0 ? Math.max(10, (optimizedSpend / originalSpend) * 90) : 10}px` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-2">Optimized</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">Uncheck recommendations below to see the interactive spend comparison recalculate in real-time.</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            SpendScope Audit Analysis
          </h2>
          <p className="text-slate-300 leading-relaxed text-base font-normal">{audit.summary}</p>
        </div>

        {/* Interactive Action Optimizer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Actionable Stack Optimizations</h2>
            <span className="text-xs font-medium text-indigo-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Live calculator active
            </span>
          </div>

          <div className="space-y-4">
            {activeItems.map((item, idx) => {
              const badge = actionBadge(item.recommendedAction);
              const isRecommendation = item.recommendedAction !== 'optimal';
              const isChecked = toggledOptimizations[item.toolId] !== false;

              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl p-5 md:p-6 transition-all duration-300 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                    !isRecommendation 
                      ? 'bg-slate-950/40 border-slate-900/60 opacity-60' 
                      : isChecked 
                      ? 'bg-slate-900 border-indigo-500/30 shadow-md shadow-indigo-500/5' 
                      : 'bg-slate-900/40 border-slate-800/80 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Custom Toggle Switch for optimizations */}
                    {isRecommendation && (
                      <div className="pt-1 flex items-center">
                        <input
                          id={`toggle-${item.toolId}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOptimization(item.toolId)}
                          className="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-800 rounded focus:ring-emerald-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                          aria-label={`Toggle optimization for ${item.toolName}`}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-base leading-none">{item.toolName}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${badge.classes}`}>
                          {badge.icon}{badge.label}
                        </span>
                        {!isRecommendation && (
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plan Well-Sized</span>
                        )}
                      </div>
                      <p className="text-slate-200 font-semibold text-sm">{item.recommendation}</p>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-xl font-normal">{item.reasoning}</p>
                    </div>
                  </div>

                  {/* Pricing/Savings Indicator */}
                  <div className="flex md:flex-col items-baseline md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t border-slate-800/60 md:border-none">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Current spend: ${item.currentSpend.toLocaleString('en-US')}/mo</span>
                    {item.potentialMonthlySavings > 0 && isChecked && (
                      <span className="text-emerald-400 font-extrabold text-sm md:text-base mt-1">
                        Save ${item.potentialMonthlySavings.toLocaleString('en-US')}/mo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SaaS Trust & Consult CTA */}
        {totalMonthlySavings > 200 ? (
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/20 p-8 rounded-3xl text-center space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold text-white">Unlock enterprise subscription management</h3>
            <p className="text-slate-300 max-w-xl mx-auto text-sm font-normal">
              Get volume discount plans, consolidated enterprise SaaS billing, and smart contract negotiations. Save up to 40% on your entire software stack without upfront commitments.
            </p>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-8 py-5 rounded-xl shadow-lg transform hover:scale-[1.01] transition-all"
              onClick={() => setShowModal(true)}
              aria-label="Book a free consultation"
            >
              Book a free spend strategy session <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-3xl text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" aria-hidden="true" />
            <h3 className="text-xl font-bold text-white">Your stack is extremely cost-efficient!</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm font-normal">
              Excellent job sizing subscriptions. We can notify you when new plan optimizations, API updates, or alternative tools release.
            </p>
            <Button
              variant="outline"
              className="bg-slate-950 border-slate-800 text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 rounded-xl"
              onClick={() => setShowModal(true)}
              aria-label="Sign up for notifications"
            >
              Get updates & notifications <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Share + Report CTA */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
            onClick={copyUrl}
            aria-label={copied ? 'URL copied to clipboard' : 'Copy shareable URL'}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {copied ? 'Link Copied!' : 'Share this audit'}
          </Button>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
            onClick={() => setShowModal(true)}
            aria-label="Get full audit report by email"
          >
            Get full email report
          </Button>
        </div>

        {/* Lead Capture Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Get your full audit report"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold text-white mb-1">Get Your Full Report</h3>
              <p className="text-slate-400 mb-6 text-sm">
                We&apos;ll send the customized stack breakdown and recommended migration instructions to your inbox.
              </p>

              {submitted ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-white">Report sent! Check your inbox.</p>
                  {isMock && (
                    <p className="text-xs text-amber-400 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left leading-normal font-normal">
                      <strong>Local Mode:</strong> Resend is not configured. The email contents have been logged to the server terminal console.
                    </p>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    if (fd.get('website')) return; // Honeypot check

                    setSubmitting(true);
                    try {
                      const response = await fetch('/api/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          auditId: audit.id,
                          email: fd.get('email'),
                          company: fd.get('company'),
                          role: fd.get('role'),
                          teamSize: auditInput.teamSize,
                          slug,
                        }),
                      });
                      const data = await response.json();
                      if (data.mockSent) {
                        setIsMock(true);
                      }
                      setSubmitted(true);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div>
                    <label htmlFor="modal-email" className="block text-sm font-medium text-slate-300 mb-1">
                      Work Email <span aria-hidden="true" className="text-rose-500">*</span>
                    </label>
                    <input
                      id="modal-email"
                      type="email"
                      name="email"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="you@startup.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-company" className="block text-sm font-medium text-slate-300 mb-1">
                      Company
                    </label>
                    <input
                      id="modal-company"
                      type="text"
                      name="company"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-role" className="block text-sm font-medium text-slate-300 mb-1">
                      Your Role
                    </label>
                    <input
                      id="modal-role"
                      type="text"
                      name="role"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                      placeholder="CTO / Tech Lead"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3"
                    disabled={submitting}
                    aria-label="Submit lead form"
                  >
                    {submitting ? 'Sending…' : 'Send me the report'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
