'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Insight } from '../types';
import { api } from '../services/api';

export function useInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getInsights();
            setInsights(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const updateStatus = useCallback(async (id: string, status: string) => {
        const updated = await api.updateInsightStatus(id, status);
        setInsights((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }, []);

    return { insights, loading, error, refetch: fetchInsights, updateStatus };
}
