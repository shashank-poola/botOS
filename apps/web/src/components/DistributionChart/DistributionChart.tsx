'use client';

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, LabelList } from 'recharts';
import type { Insight } from '../../types';
import { severityConfig } from '../../lib/utils';

interface DistributionChartProps {
    insights: Insight[];
}

function truncate(str: string, len: number): string {
    return str.length > len ? str.slice(0, len) + '…' : str;
}

export function DistributionChart({ insights }: DistributionChartProps) {
    const data = insights.map((i) => ({
        name: truncate(i.headline, 42),
        value: i.affectedPercent,
        color: severityConfig[i.severity].hex,
    }));

    const maxValue = Math.max(...data.map((d) => d.value));
    const domain: [number, number] = [0, Math.ceil(maxValue * 1.35)];
    const chartHeight = Math.min(insights.length * 34 + 8, 200);

    return (
        <div className="mb-6 rounded-xl border border-[#1e1e2e] bg-[#111118] p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                Impact Distribution
            </p>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                    barCategoryGap="30%"
                >
                    <XAxis type="number" domain={domain} hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={260}
                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={12}>
                        <LabelList
                            dataKey="value"
                            position="right"
                            formatter={(v: number) => `${v.toFixed(1)}%`}
                            style={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                        />
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
