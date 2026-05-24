export interface ClusterResult {
    id: string;
    clusterId: number;
}

function dot(a: number[], b: number[]): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
    return s;
}

function norm(a: number[]): number {
    return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a: number[], b: number[]): number {
    const d = norm(a) * norm(b);
    return d === 0 ? 0 : dot(a, b) / d;
}

function normalize(v: number[]): number[] {
    const n = norm(v);
    return n === 0 ? v : v.map((x) => x / n);
}

function arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

function initKMeansPlusPlus(
    vectors: Array<{ id: string; vector: number[] }>,
    k: number
): number[][] {
    const centroids: number[][] = [];
    const first = Math.floor(Math.random() * vectors.length);
    centroids.push(normalize([...(vectors[first]?.vector ?? [])]));

    while (centroids.length < k) {
        const distances = vectors.map((v) => {
            const sims = centroids.map((c) => cosineSimilarity(v.vector, c));
            const maxSim = Math.max(...sims);
            return Math.pow(1 - maxSim, 2);
        });

        const total = distances.reduce((s, d) => s + d, 0);
        let rand = Math.random() * total;
        let chosen = distances.length - 1;
        for (let i = 0; i < distances.length; i++) {
            rand -= distances[i] ?? 0;
            if (rand <= 0) {
                chosen = i;
                break;
            }
        }
        centroids.push(normalize([...(vectors[chosen]?.vector ?? [])]));
    }

    return centroids;
}

export function clusterVectors(
    vectors: Array<{ id: string; vector: number[] }>,
    k = 6,
    maxIterations = 50
): ClusterResult[] {
    if (vectors.length === 0) return [];
    const effectiveK = Math.min(k, vectors.length);

    const centroids = initKMeansPlusPlus(vectors, effectiveK);
    let assignments: number[] = new Array(vectors.length).fill(0) as number[];

    for (let iter = 0; iter < maxIterations; iter++) {
        const newAssignments = vectors.map((v) => {
            let best = 0;
            let bestSim = -Infinity;
            for (let c = 0; c < centroids.length; c++) {
                const sim = cosineSimilarity(v.vector, centroids[c] ?? []);
                if (sim > bestSim) {
                    bestSim = sim;
                    best = c;
                }
            }
            return best;
        });

        if (arraysEqual(assignments, newAssignments)) break;
        assignments = newAssignments;

        const dim = vectors[0]?.vector.length ?? 0;
        for (let c = 0; c < effectiveK; c++) {
            const members = vectors.filter((_, i) => assignments[i] === c);
            if (members.length === 0) continue;
            const sum = new Array(dim).fill(0) as number[];
            for (const m of members) {
                for (let d = 0; d < dim; d++) {
                    sum[d] = (sum[d] ?? 0) + (m.vector[d] ?? 0);
                }
            }
            centroids[c] = normalize(sum);
        }
    }

    return vectors.map((v, i) => ({ id: v.id, clusterId: assignments[i] ?? 0 }));
}

export function computeSilhouette(
    vectors: Array<{ id: string; vector: number[] }>,
    results: ClusterResult[]
): number {
    const clusterIds = [...new Set(results.map((r) => r.clusterId))];
    if (clusterIds.length < 2) return 0;

    const idxMap = new Map<string, number>(vectors.map((v, i) => [v.id, i]));
    let total = 0;
    let count = 0;

    for (const result of results) {
        const i = idxMap.get(result.id);
        if (i === undefined) continue;
        const vi = vectors[i]?.vector;
        if (!vi) continue;

        const sameCluster = results.filter((r) => r.clusterId === result.clusterId && r.id !== result.id);
        if (sameCluster.length === 0) continue;

        const getVec = (id: string): number[] | undefined => {
            const idx = idxMap.get(id);
            return idx !== undefined ? vectors[idx]?.vector : undefined;
        };

        const a =
            sameCluster.reduce((s, r) => {
                const vj = getVec(r.id);
                return s + (vj ? 1 - cosineSimilarity(vi, vj) : 0);
            }, 0) / sameCluster.length;

        const bValues = clusterIds
            .filter((c) => c !== result.clusterId)
            .map((c) => {
                const others = results.filter((r) => r.clusterId === c);
                return (
                    others.reduce((s, r) => {
                        const vj = getVec(r.id);
                        return s + (vj ? 1 - cosineSimilarity(vi, vj) : 0);
                    }, 0) / (others.length || 1)
                );
            });

        if (bValues.length === 0) continue;
        const b = Math.min(...bValues);
        const maxAB = Math.max(a, b);
        if (maxAB === 0) continue;

        total += (b - a) / maxAB;
        count++;
    }

    return count > 0 ? total / count : 0;
}
