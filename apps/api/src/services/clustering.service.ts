export interface ClusterResult {
    id: string;
    clusterId: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        dot += ai * bi;
        magA += ai * ai;
        magB += bi * bi;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

export function clusterVectors(
    vectors: Array<{ id: string; vector: number[] }>,
    threshold = 0.78,
    minClusterSize = 3
): ClusterResult[] {
    const n = vectors.length;
    const adj: Set<number>[] = Array.from({ length: n }, () => new Set<number>());

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const vi = vectors[i]?.vector;
            const vj = vectors[j]?.vector;
            if (vi && vj && cosineSimilarity(vi, vj) >= threshold) {
                adj[i]?.add(j);
                adj[j]?.add(i);
            }
        }
    }

    const labels: number[] = new Array(n).fill(-1) as number[];
    let clusterId = 0;

    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue;
        const queue: number[] = [i];
        labels[i] = clusterId;
        while (queue.length > 0) {
            const curr = queue.shift()!;
            for (const neighbor of adj[curr] ?? []) {
                if (labels[neighbor] === -1) {
                    labels[neighbor] = clusterId;
                    queue.push(neighbor);
                }
            }
        }
        clusterId++;
    }

    const sizes = new Map<number, number>();
    for (const l of labels) {
        sizes.set(l, (sizes.get(l) ?? 0) + 1);
    }

    return vectors.map((v, i) => {
        const label = labels[i] ?? -1;
        return {
            id: v.id,
            clusterId: (sizes.get(label) ?? 0) >= minClusterSize ? label : -1,
        };
    });
}

export function computeSilhouette(
    vectors: Array<{ id: string; vector: number[] }>,
    results: ClusterResult[]
): number {
    const valid = results.filter((r) => r.clusterId !== -1);
    const clusterIds = [...new Set(valid.map((r) => r.clusterId))];
    if (clusterIds.length < 2) return 0;

    const idxMap = new Map<string, number>(vectors.map((v, i) => [v.id, i]));
    let total = 0, count = 0;

    for (const result of valid) {
        const i = idxMap.get(result.id);
        if (i === undefined) continue;
        const vi = vectors[i]?.vector;
        if (!vi) continue;

        const sameCluster = valid.filter((r) => r.clusterId === result.clusterId && r.id !== result.id);
        if (sameCluster.length === 0) continue;

        const getVec = (id: string): number[] | undefined => {
            const idx = idxMap.get(id);
            return idx !== undefined ? vectors[idx]?.vector : undefined;
        };

        const a = sameCluster.reduce((s, r) => {
            const vj = getVec(r.id);
            return s + (vj ? 1 - cosineSimilarity(vi, vj) : 0);
        }, 0) / sameCluster.length;

        const bValues = clusterIds
            .filter((c) => c !== result.clusterId)
            .map((c) => {
                const others = valid.filter((r) => r.clusterId === c);
                return others.reduce((s, r) => {
                    const vj = getVec(r.id);
                    return s + (vj ? 1 - cosineSimilarity(vi, vj) : 0);
                }, 0) / (others.length || 1);
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
