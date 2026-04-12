import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { Play, CheckCircle2, XCircle, ChevronRight, Activity, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

const defaultPayload = `{
  "event": "order.created",
  "data": {
    "order_id": "ORD-99382",
    "customer": {
      "id": "CUST-112",
      "email": "shopper@example.com",
      "loyalty_tier": "Gold"
    },
    "order_details": {
      "total_amount": 750.00,
      "currency": "USD",
      "item_count": 3,
      "shipping_country": "US"
    },
    "risk_assessment": {
      "fraud_score": 12,
      "risk_level": "Low"
    }
  }
}`;

export function ExecutionSimulator() {
  const [payloadStr, setPayloadStr] = useState(defaultPayload);
  const [errorStr, setErrorStr] = useState('');
  
  const executeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.executions.execute(payload);
      return res.results;
    }
  });

  const handleExecute = () => {
    setErrorStr('');
    try {
      const payload = JSON.parse(payloadStr);
      executeMutation.mutate(payload);
    } catch (e: any) {
      setErrorStr(e.message || 'Invalid JSON');
    }
  };

  const results = executeMutation.data || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Execution Simulator</h1>
        <p className="text-slate-500 mt-1">Test your workflows with custom JSON payloads.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Payload Editor */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Terminal className="w-5 h-5 text-slate-500" />
              Event Payload (JSON)
            </div>
            
            <button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executeMutation.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Run Simulation
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 font-mono text-sm bg-slate-900 text-slate-100 resize-none outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>
          {errorStr && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm font-mono border-t border-rose-200">
              Error parsing JSON: {errorStr}
            </div>
          )}
          {executeMutation.error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm border-t border-rose-200">
              Execution Error: {(executeMutation.error as any).message}
            </div>
          )}
        </div>

        {/* Results Viewer */}
        <div className="flex-[1.5] glass-panel rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-medium text-slate-700">Execution Trace</h3>
          </div>
          
          <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
            {!executeMutation.data && !executeMutation.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Play className="w-12 h-12 mb-4 opacity-20" />
                <p>Run a simulation to see step-by-step logs</p>
              </div>
            )}
            
            {executeMutation.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-primary-500">
                <Activity className="w-8 h-8 animate-spin mb-4" />
                <p>Executing engine...</p>
              </div>
            )}

            {results.map((result: any, workflowIdx: number) => (
              <div key={result.executionId} className="mb-10 last:mb-0 animate-slide-up" style={{ animationDelay: `${workflowIdx * 0.1}s` }}>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">{result.workflowName}</h3>
                    <p className="text-sm text-slate-500 font-mono mt-0.5">ID: {result.executionId}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2",
                    result.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {result.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {result.status.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[1.35rem] before:w-0.5 before:bg-slate-200">
                  {result.logs.map((log: any, idx: number) => (
                    <div key={idx} className="relative pl-12">
                      <div className={cn(
                        "absolute left-3.5 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-slate-50 flex flex-col items-center justify-center z-10",
                        log.status === 'passed' || log.status === 'default' ? "bg-emerald-500" :
                        log.status === 'skipped' ? "bg-slate-400" : "bg-rose-500"
                      )} />
                      
                      <div className="bg-white border text-sm box-border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-slate-50/80 flex items-center justify-between border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{log.stepName}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-semibold uppercase">{log.stepType}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {idx === 0 ? '+0ms' : '+3ms'}
                          </span>
                        </div>
                        
                        {(log.rulesEvaluated && log.rulesEvaluated.length > 0) ? (
                          <div className="divide-y divide-slate-100 bg-white p-2">
                            {log.rulesEvaluated.map((r: any, rIdx: number) => (
                              <div key={rIdx} className="p-2 flex items-start gap-3">
                                {r.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 font-mono text-[13px] leading-relaxed">
                                  <div className="text-slate-800">
                                    {r.field} <span className="text-primary-600">{r.operator}</span> {r.expectedValue}
                                  </div>
                                  <div className="text-slate-400 text-xs mt-0.5 flex gap-1 items-center">
                                    actual: <span className={r.passed ? "text-emerald-600" : "text-rose-500"}>{JSON.stringify(r.actualValue)}</span>
                                  </div>
                                  {r.condition === 'DEFAULT' && (
                                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2">DEFAULT MATCH</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : log.error ? (
                          <div className="px-4 py-3 text-rose-600 font-mono text-sm bg-rose-50/50">
                            Error: {log.error}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-slate-500 text-sm">
                            No rules evaluated. Step passed by default.
                          </div>
                        )}
                        
                        {log.nextStepId && (
                           <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-medium tracking-wide text-slate-500 flex items-center gap-1.5 pt-3">
                             <ChevronRight className="w-3.5 h-3.5" />
                             Moved to next step
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="relative pl-12 pt-4">
                     <div className="absolute left-3.5 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-slate-50 flex flex-col items-center justify-center z-10 bg-slate-800" />
                     <div className="font-bold text-slate-700 mt-0.5 text-sm uppercase tracking-wider">End of Workflow</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
