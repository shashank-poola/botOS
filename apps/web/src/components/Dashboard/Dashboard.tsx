'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Insight } from '../../types';
import { InsightCard } from '../InsightCard/InsightCard';
import { InsightDetail } from '../InsightDetail/InsightDetail';
import { RunButton, PipelineStrip } from '../RunPanel/RunPanel';
import { DistributionChart } from '../DistributionChart/DistributionChart';
import { useInsights } from '../../hooks/useInsights';
import { useRunPoller } from '../../hooks/useRunPoller';
import { formatRelativeTime } from '../../lib/utils';

function EmptyState({ onTrigger }: { onTrigger: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
            <svg
                className="h-12 w-12 text-[#1e1e2e]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
            </svg>
            <div>
                <p className="text-sm font-medium text-[#94a3b8]">No analysis run yet</p>
                <p className="mt-1 text-xs text-[#94a3b8]/50">
                    Click "Run Analysis" to process conversations and generate insights.
                </p>
            </div>
            <button
                onClick={onTrigger}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
                Run Analysis
            </button>
        </div>
    );
}

export function Dashboard() {
    const { insights, loading, error, refetch, updateStatus } = useInsights();
    const [selected, setSelected] = useState<Insight | null>(null);
    const [lastRunAt, setLastRunAt] = useState<string | null>(null);

    const { run, triggering, isRunning, trigger } = useRunPoller(() => {
        refetch();
        setLastRunAt(new Date().toISOString());
    });

    useEffect(() => {
        if (insights.length > 0 && !lastRunAt) {
            setLastRunAt(insights[0]!.createdAt);
        }
    }, [insights, lastRunAt]);

    const handleStatusUpdate = async (id: string, status: string) => {
        await updateStatus(id, status);
        setSelected((prev) =>
            prev?.id === id ? { ...prev, status: status as Insight['status'] } : prev
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9]">
            {/* Header */}
            <header className="border-b border-[#1e1e2e]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-3">
                        <Image src="/bot.png" alt="Botos" width={26} height={26} className="rounded-md" />
                        <div>
                            <span className="text-sm font-bold text-indigo-400">BotOS</span>
                            <p className="text-xs leading-none text-[#94a3b8]">Sentiment Analytics</p>
                        </div>
                    </div>
                    <RunButton triggering={triggering} isRunning={isRunning} onTrigger={trigger} />
                </div>

                {/* Pipeline strip */}
                {isRunning && run && (
                    <div className="border-t border-[#1e1e2e] px-8 py-2.5">
                        <div className="mx-auto max-w-6xl">
                            <PipelineStrip status={run.status as Parameters<typeof PipelineStrip>[0]['status']} />
                        </div>
                    </div>
                )}
            </header>

            <main className="mx-auto max-w-6xl px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                        {error}
                    </div>
                ) : insights.length === 0 ? (
                    <EmptyState onTrigger={trigger} />
                ) : (
                    <>
                        {/* Run info line */}
                        <p className="mb-6 text-xs text-[#94a3b8]">
                            <span className="font-medium text-[#f1f5f9]">{insights.length}</span>{' '}
                            insight{insights.length !== 1 ? 's' : ''} · ordered by impact
                            {lastRunAt && (
                                <> · last run: {formatRelativeTime(lastRunAt)}</>
                            )}
                        </p>

                        {/* Distribution chart */}
                        <DistributionChart insights={insights} />

                        {/* Cards grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {insights.map((insight) => (
                                <InsightCard
                                    key={insight.id}
                                    insight={insight}
                                    onClick={() => setSelected(insight)}
                                    onStatusChange={updateStatus}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {selected && (
                <InsightDetail
                    insight={selected}
                    onClose={() => setSelected(null)}
                    onStatusUpdate={handleStatusUpdate}
                />
            )}
        </div>
    );
}
