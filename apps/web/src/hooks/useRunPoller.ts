'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AnalysisRun } from '../types';
import { api } from '../services/api';

const TERMINAL_STATES = new Set<string>(['COMPLETE', 'FAILED']);

export function useRunPoller(onComplete?: () => void) {
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [triggering, setTriggering] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startPolling = useCallback(
        (runId: number) => {
            stopPolling();
            intervalRef.current = setInterval(async () => {
                try {
                    const updated = await api.getRunStatus(runId);
                    setRun(updated);
                    if (TERMINAL_STATES.has(updated.status)) {
                        stopPolling();
                        if (updated.status === 'COMPLETE') {
                            onCompleteRef.current?.();
                        }
                    }
                } catch {
                    stopPolling();
                }
            }, 2000);
        },
        [stopPolling]
    );

    const trigger = useCallback(async () => {
        try {
            setTriggering(true);
            const newRun = await api.triggerAnalysis();
            setRun(newRun);
            startPolling(newRun.id);
        } finally {
            setTriggering(false);
        }
    }, [startPolling]);

    useEffect(() => () => stopPolling(), [stopPolling]);

    const isRunning = run !== null && !TERMINAL_STATES.has(run.status);

    return { run, triggering, isRunning, trigger };
}
