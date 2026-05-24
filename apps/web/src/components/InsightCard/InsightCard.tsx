'use client';

import { useState } from 'react';
import type { Insight, InsightStatus } from '../../types';
import { severityConfig, statusConfig, formatPercent } from '../../lib/utils';

const CARD_STATUSES: InsightStatus[] = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];

interface InsightCardProps {
    insight: Insight;
    onClick: () => void;
    onStatusChange: (id: string, status: string) => Promise<void>;
}

export function InsightCard({ insight, onClick, onStatusChange }: InsightCardProps) {
    const [updating, setUpdating] = useState(false);
    const sev = severityConfig[insight.severity];
    const sta = statusConfig[insight.status];

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
        setUpdating(true);
        try {
            await onStatusChange(insight.id, e.target.value);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="group flex cursor-pointer flex-col rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3b3b5c]"
        >
            {/* Top row: severity + status */}
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${sev.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                    {sev.label}
                </span>

                <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <select
                        value={insight.status}
                        onChange={handleStatusChange}
                        disabled={updating}
                        className={`cursor-pointer appearance-none rounded-md py-0.5 pl-2 pr-5 text-xs font-medium outline-none transition-opacity disabled:opacity-50 ${sta.bg} ${sta.color}`}
                    >
                        {CARD_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#111118] text-[#f1f5f9]">
                                {statusConfig[s].label}
                            </option>
                        ))}
                    </select>
                    <svg
                        className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-60 ${sta.color}`}
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="currentColor"
                    >
                        <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* Headline */}
            <h3 className="mt-3 text-base font-semibold leading-snug text-[#f1f5f9]">
                {insight.headline}
            </h3>

            {/* Progress bar */}
            <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e2e]">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${Math.min(insight.affectedPercent, 100)}%`,
                            backgroundColor: sev.hex,
                        }}
                    />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[#94a3b8]">
                    <span>{insight.affectedCount} conversations affected</span>
                    <span className="font-medium text-[#f1f5f9]">
                        {formatPercent(insight.affectedPercent)}
                    </span>
                </div>
            </div>

            {/* Detail */}
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#94a3b8]">
                {insight.detail}
            </p>

            {/* Divider + Recommendation */}
            {insight.recommendation && (
                <>
                    <div className="my-3 border-t border-[#1e1e2e]" />
                    <p className="line-clamp-1 text-xs text-indigo-400">
                        Fix: {insight.recommendation} →
                    </p>
                </>
            )}
        </div>
    );
}
