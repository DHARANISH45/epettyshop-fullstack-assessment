import { Link } from '@tanstack/react-router';
import { Activity, LayoutDashboard, Settings, PlayCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { useMatchRoute } from '@tanstack/react-router';

export function Layout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/workflows', icon: Activity, label: 'Workflows' },
    { to: '/simulator', icon: PlayCircle, label: 'Simulator' },
  ];

  return (
    <div className="flex h-screen bg-surface-50 text-surface-900 overflow-hidden text-sm md:text-base">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Merchant Hub</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = matchRoute({ to: item.to, fuzzy: item.to !== '/' });

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary-50 text-primary-700 font-medium" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none" />
        
        <div className="flex-1 overflow-auto relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
