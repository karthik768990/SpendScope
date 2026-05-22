"use client";

import { useState } from 'react';
import { auditTools, AuditInput, AuditResult, ToolEntry } from '@/lib/auditEngine';
import { Button } from '@/components/ui/button';
import { Check, Copy, ArrowRight } from 'lucide-react';

export default function AuditResultClient({ audit, slug }: { audit: { tools: ToolEntry[], id: string, summary: string }; slug: string }) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Re-run audit engine for detailed items
  const mockInput: AuditInput = { tools: audit.tools, teamSize: 10, primaryUseCase: 'mixed' };
  const result: AuditResult = auditTools(mockInput); // Or ideally we use the exact team size/use case saved

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-neutral-50 py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight">
            You could save <span className="text-green-600">${result.totalMonthlySavings}/mo</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-green-600">${result.totalAnnualSavings}/year</span>
          </h1>
        </div>

        {/* AI Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold mb-3">AI Audit Summary</h2>
          <p className="text-neutral-700 leading-relaxed">{audit.summary}</p>
        </div>

        {/* Per-Tool Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-sm text-neutral-500 uppercase tracking-wider">
                  <th className="p-4 border-b">Tool</th>
                  <th className="p-4 border-b">Current</th>
                  <th className="p-4 border-b">Action</th>
                  <th className="p-4 border-b">Savings</th>
                  <th className="p-4 border-b w-1/3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.items.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="p-4 font-medium">{item.toolName}</td>
                    <td className="p-4">${item.currentSpend}/mo</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        item.recommendedAction === 'optimal' ? 'bg-neutral-100 text-neutral-700' :
                        item.recommendedAction === 'downgrade' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {item.recommendedAction.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-green-600">${item.potentialMonthlySavings}/mo</td>
                    <td className="p-4 text-neutral-600">{item.reasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action Block */}
        {result.savingsTier === 'high' ? (
          <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center space-y-4">
            <h3 className="text-2xl font-bold text-green-900">Capture even more savings with Credex AI credits</h3>
            <p className="text-green-800 max-w-xl mx-auto">Get bulk-discounted credits for Anthropic, OpenAI, and more. Our experts handle the negotiation.</p>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => setShowModal(true)}>
              Book a free consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-blue-900">You&apos;re spending well.</h3>
            <p className="text-blue-800">We&apos;ll notify you when new optimizations apply.</p>
            <Button variant="outline" className="border-blue-300 text-blue-800" onClick={() => setShowModal(true)}>
              Get notified <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button variant="outline" size="lg" onClick={copyUrl}>
            {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Share URL'}
          </Button>
          <Button size="lg" onClick={() => setShowModal(true)}>
            Get my full report
          </Button>
        </div>

        {/* Lead Capture Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              >✕</button>
              <h3 className="text-2xl font-bold mb-2">Get Your Full Report</h3>
              <p className="text-neutral-600 mb-6">We&apos;ll email you the complete breakdown and optimization steps.</p>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  if (fd.get('website')) return; // honeypot
                  
                  await fetch('/api/leads', {
                    method: 'POST',
                    body: JSON.stringify({
                      auditId: audit.id,
                      email: fd.get('email'),
                      company: fd.get('company'),
                      role: fd.get('role'),
                      teamSize: 10, // from form context ideally
                      slug: slug
                    })
                  });
                  alert('Report sent! Check your inbox.');
                  setShowModal(false);
                }}
                className="space-y-4"
              >
                {/* Honeypot */}
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input type="email" name="email" required className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input type="text" name="company" className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input type="text" name="role" className="w-full border rounded-md p-2" />
                </div>

                <Button type="submit" className="w-full">
                  Send me the report
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
