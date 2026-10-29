import axios from 'axios';

export const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexora_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Service Interfaces
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  status: string;
  extension: string;
}

export interface DashboardKPIs {
  total_calls: number;
  incoming_calls: number;
  outgoing_calls: number;
  answered_calls: number;
  missed_calls: number;
  active_calls: number;
  avg_duration_seconds: number;
  avg_latency_ms: number;
  csat_score: number;
  handoff_rate_percent: number;
  resolved_by_ai_percent: number;
  data_source: string;
}

export interface CallRecord {
  id: string;
  caller_number: string;
  receiver_number: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  language: string;
  detected_languages: string[];
  duration_seconds: number;
  latency_ms: number;
  transcript: Array<{ speaker: string; text: string; timestamp: string; language?: string; grounded?: boolean }>;
  summary?: string;
  intent?: string;
  sentiment?: string;
  outcome?: string;
  transferred_to_user_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  preferred_language: string;
  company_name?: string;
  notes?: string;
  tags: string[];
  consent_for_outbound: boolean;
  dnd_opt_out: boolean;
  total_calls_count: number;
  last_contacted_at?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  items: Array<{ sku: string; name: string; quantity: number; unit_price: number; total: number }>;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string;
  tracking_number?: string;
  courier_name?: string;
  estimated_delivery?: string;
  shipping_address?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  customer_id: string;
  employee_id?: string;
  service_name: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  location_type: string;
  location_details?: string;
  notes?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  customer_id: string;
  order_id?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to_id?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface HandoffTicket {
  id: string;
  call_id: string;
  customer_id?: string;
  assigned_user_id?: string;
  target_department: string;
  status: string;
  reason: string;
  ai_summary: string;
  context_notes: Record<string, any>;
  customer_name: string;
  customer_phone: string;
  customer_language: string;
  created_at: string;
  resolved_at?: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  doc_category: string;
  chunks_count: number;
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  script_prompt: string;
  target_language: string;
  scheduled_at?: string;
  status: string;
  total_leads: number;
  completed_calls: number;
  successful_outcomes: number;
  failed_calls: number;
  respect_dnd: boolean;
  require_prior_consent: boolean;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  receptionist_name: string;
  default_language: string;
  supported_languages: string[];
  greeting_template: string;
  operating_hours: Record<string, any>;
  handoff_phone?: string;
  auto_handoff_on_low_confidence: boolean;
  confidence_threshold: string;
  telephony_mode: string;
  sip_server?: string;
}

// API methods
export const api = {
  // Auth
  login: (data: any) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),

  // Dashboard
  getKPIs: () => apiClient.get<DashboardKPIs>('/dashboard/kpis'),
  getTelephonyStatus: () => apiClient.get('/dashboard/telephony-status'),

  // Live Calls
  startCall: (caller_number?: string, language?: string) =>
    apiClient.post(`/live-calls/start?caller_number=${encodeURIComponent(caller_number || '+1-800-BROWSER')}&language=${language || 'en'}`),
  sendTurn: (call_id: string, user_text: string, language?: string) =>
    apiClient.post(`/live-calls/turn?call_id=${call_id}&user_text=${encodeURIComponent(user_text)}&language=${language || 'auto'}`),
  bargeIn: (call_id: string) => apiClient.post(`/live-calls/barge-in?call_id=${call_id}`),
  endCall: (call_id: string, outcome?: string) =>
    apiClient.post(`/live-calls/end?call_id=${call_id}&outcome=${outcome || 'RESOLVED_BY_AI'}`),

  // Calls
  listCalls: (params?: any) => apiClient.get<CallRecord[]>('/calls', { params }),
  getCall: (id: string) => apiClient.get<CallRecord>(`/calls/${id}`),

  // Customers
  listCustomers: (params?: any) => apiClient.get<Customer[]>('/customers', { params }),
  createCustomer: (data: any) => apiClient.post<Customer>('/customers', data),
  updateCustomer: (id: string, data: any) => apiClient.put<Customer>(`/customers/${id}`, data),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),

  // Products
  listProducts: (params?: any) => apiClient.get<Product[]>('/products', { params }),
  createProduct: (data: any) => apiClient.post<Product>('/products', data),
  updateProduct: (id: string, data: any) => apiClient.put<Product>(`/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/products/${id}`),

  // Orders
  listOrders: (params?: any) => apiClient.get<Order[]>('/orders', { params }),
  createOrder: (data: any) => apiClient.post<Order>('/orders', data),
  getOrder: (id: string) => apiClient.get<Order>(`/orders/${id}`),
  updateOrder: (id: string, data: any) => apiClient.put<Order>(`/orders/${id}`, data),

  // Appointments
  listAppointments: (params?: any) => apiClient.get<Appointment[]>('/appointments', { params }),
  createAppointment: (data: any) => apiClient.post<Appointment>('/appointments', data),
  checkAvailableSlots: (date: string) => apiClient.post('/appointments/available-slots', { date }),
  updateAppointment: (id: string, data: any) => apiClient.put<Appointment>(`/appointments/${id}`, data),

  // Complaints
  listComplaints: (params?: any) => apiClient.get<Complaint[]>('/complaints', { params }),
  createComplaint: (data: any) => apiClient.post<Complaint>('/complaints', data),
  updateComplaint: (id: string, data: any) => apiClient.put<Complaint>(`/complaints/${id}`, data),

  // Handoffs
  listHandoffs: (params?: any) => apiClient.get<HandoffTicket[]>('/handoffs', { params }),
  acceptHandoff: (id: string, employee_id?: string) => apiClient.post(`/handoffs/${id}/accept?employee_id=${employee_id || 'admin-01'}`),
  rejectHandoff: (id: string, employee_id?: string) => apiClient.post(`/handoffs/${id}/reject?employee_id=${employee_id || 'admin-01'}`),

  // Knowledge
  listKnowledgeDocs: () => apiClient.get<KnowledgeDoc[]>('/knowledge/docs'),
  uploadKnowledgeDoc: (formData: FormData) => apiClient.post('/knowledge/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocChunks: (id: string) => apiClient.get(`/knowledge/docs/${id}/chunks`),
  deleteDoc: (id: string) => apiClient.delete(`/knowledge/docs/${id}`),
  testKnowledgeSearch: (query: string, limit?: number) => apiClient.post('/knowledge/test-search', { query, limit }),

  // Campaigns
  listCampaigns: () => apiClient.get<Campaign[]>('/campaigns'),
  createCampaign: (data: any) => apiClient.post<Campaign>('/campaigns', data),
  getCampaign: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`),
  listCampaignLeads: (id: string) => apiClient.get(`/campaigns/${id}/leads`),
  launchCampaign: (id: string) => apiClient.post(`/campaigns/${id}/launch`),

  // Employees
  listEmployees: (params?: any) => apiClient.get<User[]>('/employees', { params }),
  updateEmployeeStatus: (id: string, status: string) => apiClient.put(`/employees/${id}/status?status=${status}`),

  // Analytics
  getAnalyticsSummary: () => apiClient.get<DashboardKPIs>('/analytics/summary'),
  getLanguagesDistribution: () => apiClient.get('/analytics/languages'),
  getCallTrends: () => apiClient.get('/analytics/trends'),
  getEmployeePerformance: () => apiClient.get('/analytics/employees'),

  // Settings & AI Config
  getSettings: () => apiClient.get<CompanySettings>('/settings'),
  updateSettings: (data: any) => apiClient.put<CompanySettings>('/settings', data),
  getAIConfig: () => apiClient.get('/ai-config'),
  testDetector: (text: string) => apiClient.post('/ai-config/test-detector', { text }),
  testGrounding: (query: string, threshold?: number) => apiClient.post('/ai-config/test-grounding', { query, threshold }),
};
