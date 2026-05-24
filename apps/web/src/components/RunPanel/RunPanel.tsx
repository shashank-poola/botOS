'use client';

import { Loading01Icon } from 'hugeicons-react';

interface RunButtonProps {
    triggering: boolean;
    isRunning: boolean;
    onTrigger: () => void;
}

export function RunButton({ triggering, isRunning, onTrigger }: RunButtonProps) {
    return (
        <button
            onClick={onTrigger}
            disabled={triggering || isRunning}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {triggering || isRunning ? (
                <Loading01Icon size={14} className="animate-spin" />
            ) : (
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            )}
            {triggering ? 'Starting…' : isRunning ? 'Running…' : 'Run Analysis'}
        </button>
    );
}

const PIPELINE_STAGES = ['PENDING', 'EMBEDDING', 'CLUSTERING', 'LABELING'] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number] | 'COMPLETE' | 'FAILED';

const stageLabel: Record<string, string> = {
    PENDING: 'Queued',
    EMBEDDING: 'Embedding',
    CLUSTERING: 'Clustering',
    LABELING: 'Labeling',
};

interface PipelineStripProps {
    status: PipelineStage;
}

export function PipelineStrip({ status }: PipelineStripProps) {
    const currentIdx = PIPELINE_STAGES.indexOf(status as (typeof PIPELINE_STAGES)[number]);

    return (
        <div className="flex items-center gap-1.5">
            {PIPELINE_STAGES.map((stage, idx) => (
                <div key={stage} className="flex items-center gap-1.5">
                    <div
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            idx < currentIdx
                                ? 'bg-green-500'
                                : idx === currentIdx
                                  ? 'animate-pulse bg-indigo-400'
                                  : 'bg-[#1e1e2e]'
                        }`}
                    />
                    <span
                        className={`text-xs transition-colors ${
                            idx < currentIdx
                                ? 'text-green-500'
                                : idx === currentIdx
                                  ? 'text-indigo-400'
                                  : 'text-[#94a3b8]/25'
                        }`}
                    >
                        {stageLabel[stage]}
                    </span>
                    {idx < PIPELINE_STAGES.length - 1 && (
                        <span className="text-xs text-[#1e1e2e]">→</span>
                    )}
                </div>
            ))}
            <span className="ml-1 text-xs text-[#94a3b8]/25">→ Complete</span>
        </div>
    );
}
