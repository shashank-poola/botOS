export const cluster = (c: {
    id: number;
    runId: number;
    label: string;
    size: number;
    percentage: number;
    priorityScore: number | null;
    trend: "NEW" | "GROWING" | "STABLE" | "SHRINKING" | null;
    createdAt: Date;
}) => ({
    ...c,
});
