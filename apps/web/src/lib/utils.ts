import type { Severity, InsightStatus } from '../types';

export const severityConfig: Record<
    Severity,
    { label: string; color: string; bg: string; border: string; dot: string; hex: string }
> = {
    CRITICAL: {
        label: 'Critical',
        color: 'text-red-400',
        bg: 'bg-red-500/15',
        border: 'border-red-500/25',
        dot: 'bg-red-500',
        hex: '#ef4444',
    },
    HIGH: {
        label: 'High',
        color: 'text-orange-400',
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/25',
        dot: 'bg-orange-500',
        hex: '#f97316',
    },
    MEDIUM: {
        label: 'Medium',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/15',
        border: 'border-yellow-500/25',
        dot: 'bg-yellow-500',
        hex: '#eab308',
    },
    LOW: {
        label: 'Low',
        color: 'text-green-400',
        bg: 'bg-green-500/15',
        border: 'border-green-500/25',
        dot: 'bg-green-500',
        hex: '#22c55e',
    },
};

export const statusConfig: Record<InsightStatus, { label: string; color: string; bg: string }> = {
    NEW: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ACKNOWLEDGED: { label: 'Acknowledged', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    RESOLVED: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-400/10' },
    DISMISSED: { label: 'Dismissed', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
};

export const nextStatusMap: Partial<Record<InsightStatus, InsightStatus>> = {
    NEW: 'ACKNOWLEDGED',
    ACKNOWLEDGED: 'IN_PROGRESS',
    IN_PROGRESS: 'RESOLVED',
};

export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

export function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
