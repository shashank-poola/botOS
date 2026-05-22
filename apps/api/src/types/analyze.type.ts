export const analysisRun = (run: {
    id: number;
    status: "PENDING" | "EMBEDDING" | "CLUSTERING" | "LABELING" | "COMPLETE" | "FAILED";
    totalConversations: number;
    clustersFound: number | null;
    noisePoints: number | null;
    silhouetteScore: number | null;
    startedAt: Date;
    completedAt: Date | null;
}) => ({
    ...run,
});
