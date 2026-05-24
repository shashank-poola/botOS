const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
export const API_URL = `${API_BASE}/api/v1`;

export const HEALTH_URL = `${API_URL}/health`;

export const TRIGGER_ANALYSIS_URL = `${API_URL}/analyze`;
export const runStatusUrl = (runId: number) => `${API_URL}/analyze/runs/${runId}/status`;

export const GET_CLUSTERS_URL = `${API_URL}/clusters`;
export const clusterConversationsUrl = (clusterId: number) => `${API_URL}/clusters/${clusterId}/conversations`;

export const GET_INSIGHTS_URL = `${API_URL}/insights`;
export const insightUrl = (id: string) => `${API_URL}/insights/${id}`;
export const updateInsightStatusUrl = (id: string) => `${API_URL}/insights/${id}`;
