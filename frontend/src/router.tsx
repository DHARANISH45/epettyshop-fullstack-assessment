import {
  Outlet,
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './routes/Dashboard';
import { WorkflowList } from './routes/WorkflowList';
import { WorkflowBuilder } from './routes/WorkflowBuilder';
import { ExecutionSimulator } from './routes/ExecutionSimulator';
import { Layout } from './components/Layout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Outlet />
      </Layout>
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const workflowsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workflows',
  component: WorkflowList,
});

const workflowCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workflows/new',
  component: WorkflowBuilder,
});

const workflowEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workflows/$id',
  component: WorkflowBuilder,
});

const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simulator',
  component: ExecutionSimulator,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  workflowsRoute,
  workflowCreateRoute,
  workflowEditRoute,
  simulatorRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
