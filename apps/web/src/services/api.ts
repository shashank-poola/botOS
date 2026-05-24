import type { ApiResponse, AnalysisRun, Insight, Cluster, Conversation } from '../types';
import {
    TRIGGER_ANALYSIS_URL,
    runStatusUrl,
    GET_INSIGHTS_URL,
    updateInsightStatusUrl,
    GET_CLUSTERS_URL,
    clusterConversationsUrl,
} from '../routes';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) throw new Error(json.error ?? 'Request failed');
    return json.data;
}

export const api = {
    triggerAnalysis: () =>
        request<AnalysisRun>(TRIGGER_ANALYSIS_URL, { method: 'POST' }),

    getRunStatus: (runId: number) =>
        request<AnalysisRun>(runStatusUrl(runId)),

    getInsights: () =>
        request<Insight[]>(GET_INSIGHTS_URL),

    updateInsightStatus: (id: string, status: string) =>
        request<Insight>(updateInsightStatusUrl(id), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }),

    getClusters: () =>
        request<Cluster[]>(GET_CLUSTERS_URL),

    getClusterConversations: (clusterId: number) =>
        request<Conversation[]>(clusterConversationsUrl(clusterId)),
};
