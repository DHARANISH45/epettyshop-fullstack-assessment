const API_BASE_URL = 'http://localhost:3001/api';
// Demo tenant ID matching the backend seed script
export const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithTenant(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-Tenant-ID', DEMO_TENANT_ID);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || errorData.message || 'An error occurred'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  workflows: {
    list: () => fetchWithTenant('/workflows'),
    get: (id: string) => fetchWithTenant(`/workflows/${id}`),
    create: (data: any) => fetchWithTenant('/workflows', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithTenant(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithTenant(`/workflows/${id}`, { method: 'DELETE' }),
  },
  steps: {
    create: (data: any) => fetchWithTenant('/steps', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithTenant(`/steps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithTenant(`/steps/${id}`, { method: 'DELETE' }),
  },
  rules: {
    create: (data: any) => fetchWithTenant('/rules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithTenant(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithTenant(`/rules/${id}`, { method: 'DELETE' }),
  },
  executions: {
    list: () => fetchWithTenant('/executions'),
    get: (id: string) => fetchWithTenant(`/executions/${id}`),
    execute: (data: any) => fetchWithTenant('/executions/execute', { method: 'POST', body: JSON.stringify(data) }),
  }
};
