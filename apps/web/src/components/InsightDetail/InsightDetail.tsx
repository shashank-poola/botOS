'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cancel01Icon } from 'hugeicons-react';
import type { Insight, InsightStatus } from '../../types';
import { severityConfig, statusConfig, nextStatusMap, formatPercent } from '../../lib/utils';

const ALL_STATUSES: InsightStatus[] = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];

interface InsightDetailProps {
    insight: Insight;
    onClose: () => void;
    onStatusUpdate: (id: string, status: string) => Promise<void>;
}

export function InsightDetail({ insight, onClose, onStatusUpdate }: InsightDetailProps) {
    const [updating, setUpdating] = useState(false);
    const sev = severityConfig[insight.severity];
    const next = nextStatusMap[insight.status];

    const handleClose = useCallback(() => onClose(), [onClose]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [handleClose]);

    const handleStatusChange = async (status: InsightStatus) => {
        if (updating) return;
        setUpdating(true);
        try {
            await onStatusUpdate(insight.id, status);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#111118] shadow-2xl">
                {/* Sticky header */}
                <div className="flex items-center justify-between border-b border-[#1e1e2e] px-7 py-5">
                    <div className="flex items-center gap-3 text-sm text-[#94a3b8]">
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${sev.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                            {sev.label}
                        </span>
                        <span>·</span>
                        <span>{formatPercent(insight.affectedPercent)}</span>
                        <span>·</span>
                        <span>{insight.affectedCount} conversations</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-[#f1f5f9]"
                    >
                        <Cancel01Icon size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-7 py-6">
                    <h2 className="text-lg font-semibold leading-snug text-[#f1f5f9]">
                        {insight.headline}
                    </h2>

                    <div className="mt-6">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                            Detail
                        </p>
                        <p className="text-sm leading-relaxed text-[#94a3b8]">{insight.detail}</p>
                    </div>

                    {insight.recommendation && (
                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                                Recommendation
                            </p>
                            <div className="flex items-start gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                                <span className="mt-0.5 text-indigo-400">▸</span>
                                <p className="text-sm leading-relaxed text-[#f1f5f9]">
                                    {insight.recommendation}
                                </p>
                            </div>
                        </div>
                    )}

                    {insight.exampleQuotes.length > 0 && (
                        <div className="mt-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                                User Quotes
                            </p>
                            <div className="flex flex-col gap-3">
                                {insight.exampleQuotes.map((quote, i) => (
                                    <blockquote
                                        key={i}
                                        className="rounded-r-lg py-3 pl-4 pr-4 text-sm italic leading-relaxed text-[#94a3b8]"
                                        style={{
                                            borderLeft: `2px solid ${sev.hex}`,
                                            backgroundColor: `${sev.hex}08`,
                                        }}
                                    >
                                        "{quote}"
                                    </blockquote>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status row */}
                    <div className="mt-8 flex items-center justify-between border-t border-[#1e1e2e] pt-6">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[#94a3b8]">Status:</span>
                            <select
                                value={insight.status}
                                onChange={(e) => handleStatusChange(e.target.value as InsightStatus)}
                                disabled={updating}
                                className="cursor-pointer rounded-md border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-1.5 text-xs font-medium text-[#f1f5f9] outline-none transition-colors hover:border-[#3b3b5c] disabled:opacity-50"
                            >
                                {ALL_STATUSES.map((s) => (
                                    <option key={s} value={s} className="bg-[#111118]">
                                        {statusConfig[s].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {next && (
                            <button
                                onClick={() => handleStatusChange(next)}
                                disabled={updating}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {updating ? 'Updating…' : `Mark as ${statusConfig[next].label}`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
