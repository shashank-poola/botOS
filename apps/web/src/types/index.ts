export type RunStatus = 'PENDING' | 'EMBEDDING' | 'CLUSTERING' | 'LABELING' | 'COMPLETE' | 'FAILED';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type InsightStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type Trend = 'NEW' | 'GROWING' | 'STABLE' | 'SHRINKING';

export interface AnalysisRun {
    id: number;
    status: RunStatus;
    totalConversations: number;
    clustersFound: number | null;
    noisePoints: number | null;
    silhouetteScore: number | null;
    startedAt: string;
    completedAt: string | null;
}

export interface Cluster {
    id: number;
    runId: number;
    label: string;
    size: number;
    percentage: number;
    priorityScore: number | null;
    trend: Trend | null;
    createdAt: string;
}

export interface Insight {
    id: string;
    runId: number;
    clusterId: number;
    headline: string;
    detail: string;
    recommendation: string | null;
    severity: Severity;
    affectedPercent: number;
    affectedCount: number;
    exampleQuotes: string[];
    status: InsightStatus;
    createdAt: string;
}

export interface Conversation {
    id: string;
    messages: Array<{ role: string; text: string }>;
    fullText: string;
    messageCount: number;
    resolved: boolean | null;
    clusterId: number | null;
    conversationAt: string | null;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error: string | null;
    message: string | null;
}
