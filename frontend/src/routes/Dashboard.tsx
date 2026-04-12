import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';

export function Dashboard() {
  const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.workflows.list(),
  });

  const { data: executionsRes, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['executions', { limit: 5 }],
    queryFn: () => api.executions.list(),
  });

  const executions = executionsRes?.executions || [];
  
  const activeWorkflows = workflows.filter((w: any) => w.is_active).length;
  const recentSuccess = executions.filter((e: any) => e.status === 'completed').length;
  
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your automated operations.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100/50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Workflows</p>
              <p className="text-3xl font-bold text-slate-900">{isLoadingWorkflows ? '-' : activeWorkflows}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100/50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Recent Success</p>
              <p className="text-3xl font-bold text-slate-900">{isLoadingExecutions ? '-' : recentSuccess}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100/50 text-rose-600 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Recent Failures</p>
              <p className="text-3xl font-bold text-slate-900">
                {isLoadingExecutions ? '-' : executions.length - recentSuccess}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="glass-panel rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Recent Executions</h2>
          <Link to="/simulator" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Test Workflow &rarr;
          </Link>
        </div>
        <div className="p-0">
          {isLoadingExecutions ? (
            <div className="p-8 text-center text-slate-500">Loading executions...</div>
          ) : executions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No recent executions</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {executions.map((execution: any) => (
                  <tr key={execution.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{execution.workflow?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{execution.id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        execution.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        execution.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {execution.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {execution.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                        {(execution.status === 'pending' || execution.status === 'in_progress') && <Clock className="w-3.5 h-3.5" />}
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {format(new Date(execution.created_at), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
                        View Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
