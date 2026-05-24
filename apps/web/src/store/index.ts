'use client';

import { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { AnalysisRun, Insight, Cluster } from '../types';

interface DashboardState {
    activeRun: AnalysisRun | null;
    clusters: Cluster[];
    insights: Insight[];
    selectedInsightId: string | null;
    loading: boolean;
    error: string | null;
}

type Action =
    | { type: 'SET_RUN'; payload: AnalysisRun }
    | { type: 'SET_CLUSTERS'; payload: Cluster[] }
    | { type: 'SET_INSIGHTS'; payload: Insight[] }
    | { type: 'SELECT_INSIGHT'; payload: string | null }
    | { type: 'UPDATE_INSIGHT_STATUS'; payload: Insight }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

const initialState: DashboardState = {
    activeRun: null,
    clusters: [],
    insights: [],
    selectedInsightId: null,
    loading: false,
    error: null,
};

function reducer(state: DashboardState, action: Action): DashboardState {
    switch (action.type) {
        case 'SET_RUN':
            return { ...state, activeRun: action.payload };
        case 'SET_CLUSTERS':
            return { ...state, clusters: action.payload };
        case 'SET_INSIGHTS':
            return { ...state, insights: action.payload };
        case 'SELECT_INSIGHT':
            return { ...state, selectedInsightId: action.payload };
        case 'UPDATE_INSIGHT_STATUS':
            return {
                ...state,
                insights: state.insights.map((i) =>
                    i.id === action.payload.id ? action.payload : i
                ),
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

const DashboardContext = createContext<{
    state: DashboardState;
    dispatch: Dispatch<Action>;
} | null>(null);

export { DashboardContext, reducer, initialState };
export type { DashboardState, Action };
