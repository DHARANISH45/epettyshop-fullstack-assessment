import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Zap, Activity, MoreVertical } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';

export function WorkflowList() {
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.workflows.list(),
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-1">Manage your event-driven automations.</p>
        </div>
        <Link 
          to="/workflows/new" 
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          New Workflow
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="glass-panel h-24 rounded-2xl animate-pulse bg-slate-100/50" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border-dashed border-2 border-slate-300 bg-slate-50/50">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No workflows yet</h3>
          <p className="text-slate-500 mt-1 mb-6">Create your first automated workflow to get started.</p>
          <Link 
            to="/workflows/new" 
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {workflows.map((workflow: any, idx: number) => (
            <div 
              key={workflow.id} 
              className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:shadow-md transition-shadow animate-slide-up bg-white"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={`p-4 rounded-xl flex-shrink-0 ${workflow.is_active ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                <Zap className="w-8 h-8" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {workflow.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    workflow.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                    event: {workflow.trigger_event}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">{workflow.steps?.length || 0}</span> steps
                  </div>
                  <div>
                    Last updated {format(new Date(workflow.updated_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
                <Link
                  to="/workflows/$id"
                  params={{ id: workflow.id as string }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Edit
                </Link>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
