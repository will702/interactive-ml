'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Chapter from '@/components/ml/primitives/Chapter'
import Scrolly from '@/components/scrolly/Scrolly'
import Playground from '@/components/ml/primitives/Playground'
import MathBlock from '@/components/ml/primitives/Math'
import CodeDrawer from '@/components/ml/primitives/CodeDrawer'
import Figure from '@/components/ml/primitives/Figure'
import SandboxPanel from '@/components/playground/SandboxPanel'
import Slider from '@/components/playground/Slider'
import Select from '@/components/playground/Select'

const KMeans = dynamic(() => import('@/components/ml/clustering/KMeans'), { ssr: false })
const Hierarchical = dynamic(() => import('@/components/ml/clustering/Hierarchical'), { ssr: false })
const DBSCAN = dynamic(() => import('@/components/ml/clustering/DBSCAN'), { ssr: false })

const KMEANS_CODE = `from sklearn.cluster import KMeans

model = KMeans(n_clusters=3, random_state=42, n_init='auto')
labels = model.fit_predict(X)
print('WCSS:', model.inertia_)

# Elbow
wcss = [KMeans(n_clusters=k, n_init='auto').fit(X).inertia_ for k in range(1, 8)]`

const HIERARCHICAL_CODE = `from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import dendrogram, linkage
import matplotlib.pyplot as plt

model = AgglomerativeClustering(n_clusters=4, linkage='average')
labels = model.fit_predict(X)

# Dendrogram
Z = linkage(X, method='average')
dendrogram(Z)
plt.show()`

const DBSCAN_CODE = `from sklearn.cluster import DBSCAN

model = DBSCAN(eps=0.5, min_samples=5)
labels = model.fit_predict(X)
# labels == -1 are noise
noise_count = (labels == -1).sum()
print(f'Clusters: {labels.max() + 1}, Noise: {noise_count}')`

const KMEANS_FRAMES = [
  <div key="km-0">
    <p><strong>Assign each point to the nearest centroid.</strong> Place k centroids at random. Every point joins the cluster whose centroid is closest under Euclidean distance.</p>
  </div>,
  <div key="km-1">
    <p><strong>Recompute centroids as cluster means.</strong> Each centroid moves to the average position of its assigned points. The cluster &ldquo;center of mass&rdquo; shifts.</p>
  </div>,
  <div key="km-2">
    <p><strong>Repeat until centroids stop moving (convergence).</strong> Assignment and update alternate. Each iteration decreases or maintains WCSS — the algorithm always improves.</p>
  </div>,
  <div key="km-3">
    <p><strong>Choose k with the elbow method — look for the bend in WCSS.</strong> WCSS drops sharply as k increases, then plateaus. The &ldquo;elbow&rdquo; marks the best trade-off between fit and complexity.</p>
  </div>,
]

const HIERARCHICAL_FRAMES = [
  <div key="hc-0">
    <p><strong>Start with each point as its own cluster.</strong> Every observation is its own singleton cluster. The distance matrix records pairwise distances between all n points.</p>
  </div>,
  <div key="hc-1">
    <p><strong>Merge the two closest clusters at each step.</strong> Using the chosen linkage (single, complete, average), find the pair of clusters with minimum inter-cluster distance and merge them.</p>
  </div>,
  <div key="hc-2">
    <p><strong>The dendrogram records every merge and its distance.</strong> Each horizontal line marks a merge; its height is the distance at which it occurred. The tree fully encodes the clustering hierarchy.</p>
  </div>,
  <div key="hc-3">
    <p><strong>Cut at any height to read off k clusters.</strong> A horizontal cut through the dendrogram at height h produces as many clusters as branches it crosses. No need to commit to k upfront.</p>
  </div>,
]

const DBSCAN_FRAMES = [
  <div key="db-0">
    <p><strong>Core points have ≥ MinPts neighbors within radius ε.</strong> For each point, draw a circle of radius ε. Points with at least MinPts neighbors inside the circle (including themselves) are core points.</p>
  </div>,
  <div key="db-1">
    <p><strong>Border points are reachable from a core but not dense themselves.</strong> A point within ε of a core point, but with fewer than MinPts neighbors, is a border point — it belongs to the cluster but does not extend it.</p>
  </div>,
  <div key="db-2">
    <p><strong>Clusters form as connected sets of core points.</strong> Density-connectivity propagates: if two core points are within ε of each other, they share a cluster. The cluster grows to include all reachable border points.</p>
  </div>,
  <div key="db-3">
    <p><strong>Noise: neither core nor reachable — labeled as outliers.</strong> Points that are not within ε of any core point receive label −1. DBSCAN discovers clusters of arbitrary shape and handles outliers natively.</p>
  </div>,
]

function ClusterSandbox() {
  const [k, setK] = useState(3)
  const [eps, setEps] = useState(0.5)
  const [minSamples, setMinSamples] = useState(5)
  const [algo, setAlgo] = useState<'kmeans' | 'dbscan'>('kmeans')

  return (
    <SandboxPanel
      title="Clustering — Parameter Sandbox"
      controls={
        <>
          <Select
            label="Algorithm"
            options={[{ value: 'kmeans', label: 'K-Means' }, { value: 'dbscan', label: 'DBSCAN' }]}
            value={algo}
            onChange={v => setAlgo(v as 'kmeans' | 'dbscan')}
          />
          {algo === 'kmeans' && (
            <Slider label="K (clusters)" min={2} max={8} step={1} value={k} onChange={setK} />
          )}
          {algo === 'dbscan' && (
            <>
              <Slider label="ε (epsilon)" min={0.1} max={2.0} step={0.1} value={eps} onChange={setEps} />
              <Slider label="Min Samples" min={2} max={15} step={1} value={minSamples} onChange={setMinSamples} />
            </>
          )}
        </>
      }
      viz={
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', lineHeight: 1.8 }}>
          <div>algorithm: <strong style={{ color: 'var(--ink)' }}>{algo}</strong></div>
          {algo === 'kmeans' && <div>k: <strong style={{ color: 'var(--ink)' }}>{k}</strong></div>}
          {algo === 'dbscan' && <>
            <div>eps: <strong style={{ color: 'var(--ink)' }}>{eps}</strong></div>
            <div>min_samples: <strong style={{ color: 'var(--ink)' }}>{minSamples}</strong></div>
          </>}
          <div style={{ marginTop: '1rem', color: 'var(--ink-soft)', fontSize: '0.85em' }}>
            {algo === 'kmeans'
              ? `Partitions data into exactly ${k} clusters`
              : `Finds dense regions with radius ${eps}, min ${minSamples} points`}
          </div>
        </div>
      }
    />
  )
}

export default function ClusteringPage() {
  return (
    <Chapter title="Clustering" subtitle="Finding natural groups without labels.">

      {/* ── K-Means ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>K-Means</h2>
        <p className="prose" style={{ marginBottom: '2rem' }}>
          Lloyd&apos;s algorithm partitions n points into exactly k clusters by alternating between assigning each point to its nearest centroid and recomputing each centroid as the mean of its cluster. Convergence is guaranteed but the solution may be a local minimum.
        </p>

        <Scrolly
          frames={KMEANS_FRAMES}
          scene={(progress) => (
            <Figure caption="Stars mark centroids. Points color by cluster assignment. Watch centroids converge iteration by iteration.">
              <KMeans progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <h3>Within-Cluster Sum of Squares</h3>
          <MathBlock block>
            {String.raw`\mathcal{J} = \sum_{k=1}^{K}\sum_{x_i \in C_k} \|x_i - \mu_k\|^2`}
          </MathBlock>
          <p>
            K-Means minimises <MathBlock>{String.raw`\mathcal{J}`}</MathBlock> — the total squared distance from each point to its assigned centroid <MathBlock>{String.raw`\mu_k`}</MathBlock>. Each alternating step is guaranteed to decrease or maintain <MathBlock>{String.raw`\mathcal{J}`}</MathBlock>, so the algorithm converges, though not necessarily to the global minimum. Multiple random restarts mitigate this.
          </p>
          <p>
            The elbow method plots <MathBlock>{String.raw`\mathcal{J}`}</MathBlock> against k. Beyond the true cluster count, adding more clusters yields diminishing returns — the curve &ldquo;elbows&rdquo; at the natural k.
          </p>
        </div>

        <Playground label="K-Means Playground">
          {(resetKey) => <KMeans key={resetKey} />}
        </Playground>

        <CodeDrawer label="sklearn — KMeans" code={KMEANS_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── Hierarchical ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Hierarchical Clustering</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Agglomerative clustering builds a full merge hierarchy bottom-up. No k is required upfront — choose the number of clusters after the fact by cutting the dendrogram at a chosen height.
        </p>

        <Scrolly
          frames={HIERARCHICAL_FRAMES}
          scene={(progress) => (
            <Figure caption="Left: scatter colored by cut assignment. Right: dendrogram with dashed cut line. Scroll to raise the cut.">
              <Hierarchical progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <h3>Average Linkage Distance</h3>
          <MathBlock block>
            {String.raw`d_{\text{avg}}(A,B) = \frac{1}{|A||B|}\sum_{a\in A}\sum_{b\in B}\|a-b\|`}
          </MathBlock>
          <p>
            Linkage defines inter-cluster distance. <strong>Single</strong> linkage uses the minimum pairwise distance — prone to chaining. <strong>Complete</strong> uses the maximum — produces compact clusters. <strong>Average</strong> uses the mean, balancing both tendencies and is often the most robust choice.
          </p>
          <p>
            The dendrogram height at each merge corresponds to the linkage distance at that step. A horizontal cut at height h yields clusters whose internal maximum distance is at most h.
          </p>
        </div>

        <Playground label="Hierarchical Playground">
          {(resetKey) => <Hierarchical key={resetKey} />}
        </Playground>

        <CodeDrawer label="sklearn — AgglomerativeClustering" code={HIERARCHICAL_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── DBSCAN ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>DBSCAN</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Density-Based Spatial Clustering of Applications with Noise discovers clusters of arbitrary shape and explicitly marks outliers — no k required, no assumption of convexity.
        </p>

        <Scrolly
          frames={DBSCAN_FRAMES}
          scene={(progress) => (
            <Figure caption="Large dots are core points. Smaller dots are border points. Gray points are noise (label −1).">
              <DBSCAN progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <h3>ε-Neighborhood</h3>
          <MathBlock block>
            {String.raw`N_{\varepsilon}(p) = \{q \in D \mid \|p-q\| \leq \varepsilon\}`}
          </MathBlock>
          <p>
            Point <MathBlock>{'p'}</MathBlock> is a <strong>core point</strong> if <MathBlock>{String.raw`|N_\varepsilon(p)| \geq \text{MinPts}`}</MathBlock>. A <strong>border point</strong> lies within <MathBlock>{String.raw`\varepsilon`}</MathBlock> of a core but is not dense itself. <strong>Noise</strong> points are neither core nor reachable from any core.
          </p>
          <p>
            Choosing <MathBlock>{String.raw`\varepsilon`}</MathBlock> and MinPts requires domain knowledge. A k-distance plot (sort distances to k-th nearest neighbor, look for the elbow) is a common heuristic for <MathBlock>{String.raw`\varepsilon`}</MathBlock>.
          </p>
        </div>

        <Playground label="DBSCAN Playground">
          {(resetKey) => <DBSCAN key={resetKey} />}
        </Playground>

        <CodeDrawer label="sklearn — DBSCAN" code={DBSCAN_CODE} />
      </section>

      <ClusterSandbox />

    </Chapter>
  )
}
