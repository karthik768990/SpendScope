"use client";

import { useState } from 'react';
import { auditTools, AuditInput, AuditResult, ToolEntry } from '@/lib/auditEngine';
import { Button } from '@/components/ui/button';
import { Check, Copy, ArrowRight, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuditData {
  tools: { entries: ToolEntry[]; teamSize: number; primaryUseCase: AuditInput['primaryUseCase'] };
  id: string;
  summary: string;
  savings_monthly: number;
  savings_annual: number;
}

export default function AuditResultClient({ audit, slug }: { audit: AuditData; slug: string }) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reconstruct the audit input from stored data (real teamSize & use case)
  const auditInput: AuditInput = {
    tools: audit.tools?.entries ?? [],
    teamSize: audit.tools?.teamSize ?? 10,
    primaryUseCase: audit.tools?.primaryUseCase ?? 'mixed',
  };
  const result: AuditResult = auditTools(auditInput);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionBadge = (action: string) => {
    switch (action) {
      case 'downgrade':
        return { label: 'DOWNGRADE', classes: 'bg-blue-100 text-blue-700', icon: <TrendingDown className="w-3 h-3 mr-1" /> };
      case 'consolidate':
        return { label: 'CONSOLIDATE', classes: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="w-3 h-3 mr-1" /> };
      case 'switch':
        return { label: 'SWITCH', classes: 'bg-purple-100 text-purple-700', icon: <ArrowRight className="w-3 h-3 mr-1" /> };
      default:
        return { label: 'OPTIMAL', classes: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 py-16 px-4" role="main">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-widest">Your AI Spend Audit</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight">
            You could save{' '}
            <span className="text-green-600">${result.totalMonthlySavings.toLocaleString()}/mo</span>
          </h1>
          <p className="text-2xl text-neutral-500 font-medium">
            That&apos;s{' '}
            <span className="text-green-500 font-bold">${result.totalAnnualSavings.toLocaleString()}/year</span>
          </p>
        </div>

        {/* AI Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-base font-bold text-neutral-500 uppercase tracking-wider mb-3">
            AI-Powered Audit Summary
          </h2>
          <p className="text-neutral-700 leading-relaxed text-lg">{audit.summary}</p>
        </div>

        {/* Per-Tool Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-lg font-bold">Tool-by-Tool Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Tool audit breakdown">
              <thead>
                <tr className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="p-4 border-b" scope="col">Tool</th>
                  <th className="p-4 border-b" scope="col">Current</th>
                  <th className="p-4 border-b" scope="col">Action</th>
                  <th className="p-4 border-b" scope="col">Savings</th>
                  <th className="p-4 border-b w-2/5" scope="col">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.items.map((item, i) => {
                  const badge = actionBadge(item.recommendedAction);
                  return (
                    <tr key={i} className="text-sm hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-semibold text-neutral-800">{item.toolName}</td>
                      <td className="p-4 text-neutral-600">${item.currentSpend.toLocaleString()}/mo</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${badge.classes}`}>
                          {badge.icon}{badge.label}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-green-600">
                        {item.potentialMonthlySavings > 0
                          ? `$${item.potentialMonthlySavings.toLocaleString()}/mo`
                          : '—'}
                      </td>
                      <td className="p-4 text-neutral-500 text-xs leading-relaxed">{item.reasoning}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Block */}
        {result.savingsTier === 'high' ? (
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-2xl text-center space-y-4 text-white shadow-lg">
            <h3 className="text-2xl font-bold">Capture even more savings with Credex AI credits</h3>
            <p className="text-green-100 max-w-xl mx-auto">
              Get bulk-discounted credits for Anthropic, OpenAI, and more. Our team negotiates on your behalf — no upfront commitment.
            </p>
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50 font-bold text-base px-8"
              onClick={() => setShowModal(true)}
              aria-label="Book a free consultation with Credex"
            >
              Book a free consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-blue-500 mx-auto" aria-hidden="true" />
            <h3 className="text-xl font-bold text-blue-900">You&apos;re spending efficiently.</h3>
            <p className="text-blue-700">
              We&apos;ll notify you when new optimizations become available for your stack.
            </p>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => setShowModal(true)}
              aria-label="Sign up to be notified of new optimizations"
            >
              Get notified <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Share + Report CTA */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={copyUrl}
            aria-label={copied ? 'URL copied to clipboard' : 'Copy shareable URL'}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-600" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {copied ? 'Link Copied!' : 'Share this audit'}
          </Button>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => setShowModal(true)}
            aria-label="Get full audit report by email"
          >
            Get my full report
          </Button>
        </div>

        {/* Lead Capture Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Get your full audit report"
          >
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md relative shadow-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 text-xl font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold mb-1">Get Your Full Report</h3>
              <p className="text-neutral-500 mb-6 text-sm">
                We&apos;ll email you the complete breakdown and what to do next.
              </p>

              {submitted ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-neutral-800">Report sent! Check your inbox.</p>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    // Honeypot check
                    if (fd.get('website')) return;

                    setSubmitting(true);
                    try {
                      await fetch('/api/leads', {
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
                      setSubmitted(true);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Honeypot — hidden from real users */}
                  <input
                    type="text"
                    name="website"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div>
                    <label htmlFor="modal-email" className="block text-sm font-medium text-neutral-700 mb-1">
                      Work Email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="modal-email"
                      type="email"
                      name="email"
                      required
                      className="w-full border border-neutral-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="you@startup.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-company" className="block text-sm font-medium text-neutral-700 mb-1">
                      Company
                    </label>
                    <input
                      id="modal-company"
                      type="text"
                      name="company"
                      className="w-full border border-neutral-300 rounded-lg p-2.5"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-role" className="block text-sm font-medium text-neutral-700 mb-1">
                      Your Role
                    </label>
                    <input
                      id="modal-role"
                      type="text"
                      name="role"
                      className="w-full border border-neutral-300 rounded-lg p-2.5"
                      placeholder="CTO / Eng Manager"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    disabled={submitting}
                    aria-label="Submit to get full report by email"
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
