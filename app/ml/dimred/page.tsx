'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Chapter from '@/components/ml/primitives/Chapter'
import Scrolly from '@/components/scrolly/Scrolly'
import Playground from '@/components/ml/primitives/Playground'
import MathBlock from '@/components/ml/primitives/Math'
import CodeDrawer from '@/components/ml/primitives/CodeDrawer'
import SandboxPanel from '@/components/playground/SandboxPanel'
import Slider from '@/components/playground/Slider'
import Select from '@/components/playground/Select'

const PCA = dynamic(() => import('@/components/ml/dimred/PCA'), { ssr: false })
const PointCloud3D = dynamic(() => import('@/components/r3f/PointCloud3D'), { ssr: false })
const LDA = dynamic(() => import('@/components/ml/dimred/LDA'), { ssr: false })
const TSNE = dynamic(() => import('@/components/ml/dimred/TSNE'), { ssr: false })
const Comparison = dynamic(() => import('@/components/ml/dimred/Comparison'), { ssr: false })

const PCA_CODE = `from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X)
print('Explained variance:', pca.explained_variance_ratio_)`

const LDA_CODE = `from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

lda = LinearDiscriminantAnalysis(n_components=2)
X_lda = lda.fit_transform(X, y)`

const TSNE_CODE = `from sklearn.manifold import TSNE

tsne = TSNE(n_components=2, perplexity=30, random_state=42)
X_tsne = tsne.fit_transform(X)
# Note: no transform() — must retrain for new points`

const COMPARISON_CODE = `from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.manifold import TSNE

X_pca  = PCA(n_components=2).fit_transform(X)
X_lda  = LinearDiscriminantAnalysis(n_components=2).fit_transform(X, y)
X_tsne = TSNE(n_components=2, random_state=42).fit_transform(X)`

const PCA_FRAMES = [
  <div key="pca-0">
    <p><strong>High-dimensional data has redundancy — correlated features compress.</strong> When features move together, the effective dimensionality is lower than the number of features. PCA finds those directions.</p>
  </div>,
  <div key="pca-1">
    <p><strong>Principal components are orthogonal directions of maximum variance.</strong> The first PC points in the direction the data spreads most. Each subsequent PC is perpendicular and captures the remaining variance.</p>
  </div>,
  <div key="pca-2">
    <p><strong>PC1 captures the most variance; PC2 the next most.</strong> Together the first two PCs often explain most of the structure. The scree plot shows how variance is distributed across components.</p>
  </div>,
  <div key="pca-3">
    <p><strong>Project onto the top k PCs: dimensionality reduced, structure preserved.</strong> The 1D strip below the scatter shows all points collapsed onto PC1. Separation visible in the original scatter is retained.</p>
  </div>,
]

const LDA_FRAMES = [
  <div key="lda-0">
    <p><strong>PCA maximises variance — it ignores class labels.</strong> The direction of most spread may have nothing to do with the direction that best separates classes. LDA takes a different approach.</p>
  </div>,
  <div key="lda-1">
    <p><strong>LDA maximises the ratio of between-class to within-class scatter.</strong> It finds axes where class means are far apart relative to the spread within each class. Class structure guides the projection.</p>
  </div>,
  <div key="lda-2">
    <p><strong>Projecting onto discriminant axes separates classes better.</strong> The projection strip at the bottom of each panel shows class overlap. LDA&apos;s strip typically yields cleaner class separation than PCA&apos;s.</p>
  </div>,
  <div key="lda-3">
    <p><strong>LDA: supervised compression. PCA: unsupervised compression.</strong> LDA requires labels and assumes classes are Gaussian with equal covariance. PCA needs neither assumption but may not align with class structure.</p>
  </div>,
]

const TSNE_FRAMES = [
  <div key="tsne-0">
    <p><strong>t-SNE encodes high-D neighborhoods as probabilities.</strong> For each point, it computes a Gaussian distribution over neighbors. Points with similar high-D neighborhoods get high joint probability.</p>
  </div>,
  <div key="tsne-1">
    <p><strong>In low-D, it matches those probabilities using a Student-t distribution.</strong> The heavy-tailed distribution helps avoid the crowding problem — nearby clusters can stay nearby without crushing everything together.</p>
  </div>,
  <div key="tsne-2">
    <p><strong>The heavy tail lets dissimilar points spread further apart.</strong> Medium-distance pairs in high-D map to large distances in low-D, creating the clear visual gaps between clusters.</p>
  </div>,
  <div key="tsne-3">
    <p><strong>Iterate gradient descent until neighborhoods align.</strong> The KL divergence between high-D and low-D distributions is minimised. Final layout preserves local structure, not global distances.</p>
  </div>,
]

const COMPARISON_FRAMES = [
  <div key="cmp-0">
    <p><strong>Choose PCA for compression and preprocessing.</strong> PCA is fast, deterministic, and invertible. Use it before fitting models to reduce noise, speed up training, or visualise high-D data.</p>
  </div>,
  <div key="cmp-1">
    <p><strong>Choose LDA when class labels are available and separation matters.</strong> LDA is a supervised method — it uses label information to find a projection that makes classification easier. The number of discriminant dimensions is at most C−1 where C is the number of classes.</p>
  </div>,
  <div key="cmp-2">
    <p><strong>Choose t-SNE only for 2D/3D visualization — not for preprocessing.</strong> t-SNE is non-parametric: it cannot project new points and runs O(n²). It excels at revealing cluster structure visually but the axes have no interpretable meaning.</p>
  </div>,
  <div key="cmp-3">
    <p><strong>No single method wins — match the technique to the goal.</strong> Labels available? Try LDA first. Unsupervised? PCA for preprocessing, t-SNE for visualization. All three reveal different aspects of the same data.</p>
  </div>,
]

function DimRedSandbox() {
  const [nComponents, setNComponents] = useState(2)
  const [method, setMethod] = useState<'pca' | 'lda' | 'tsne'>('pca')
  const [perplexity, setPerplexity] = useState(30)

  return (
    <SandboxPanel
      title="Dimensionality Reduction — Parameter Sandbox"
      controls={
        <>
          <Select
            label="Method"
            options={[
              { value: 'pca', label: 'PCA' },
              { value: 'lda', label: 'LDA' },
              { value: 'tsne', label: 't-SNE' },
            ]}
            value={method}
            onChange={v => setMethod(v as 'pca' | 'lda' | 'tsne')}
          />
          <Slider label="Components" min={1} max={3} step={1} value={nComponents} onChange={setNComponents} />
          {method === 'tsne' && (
            <Slider label="Perplexity" min={5} max={50} step={5} value={perplexity} onChange={setPerplexity} />
          )}
        </>
      }
      viz={
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', lineHeight: 1.8 }}>
          <div>method: <strong style={{ color: 'var(--ink)' }}>{method.toUpperCase()}</strong></div>
          <div>n_components: <strong style={{ color: 'var(--ink)' }}>{nComponents}</strong></div>
          {method === 'tsne' && <div>perplexity: <strong style={{ color: 'var(--ink)' }}>{perplexity}</strong></div>}
          <div style={{ marginTop: '1rem', color: 'var(--ink-soft)', fontSize: '0.85em' }}>
            {method === 'pca' && 'Linear, preserves global variance'}
            {method === 'lda' && 'Supervised, maximizes class separation'}
            {method === 'tsne' && 'Nonlinear, preserves local structure'}
          </div>
        </div>
      }
    />
  )
}

export default function DimRedPage() {
  return (
    <Chapter title="Dimensionality Reduction" subtitle="Sessions 21–22">

      {/* ── PCA ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          Principal Component Analysis
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          Find the orthogonal axes of maximum variance and project data onto the top k of them — compressing dimensions while retaining structure.
        </p>

        <Scrolly
          frames={PCA_FRAMES}
          scene={progress => <PCA progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`\mathbf{z} = W^\top (\mathbf{x} - \bar{\mathbf{x}}),\quad W = [\mathbf{v}_1, \ldots, \mathbf{v}_k]`}
          </MathBlock>
          <p>
            The columns of <MathBlock>{'W'}</MathBlock> are the top <MathBlock>{'k'}</MathBlock> eigenvectors of the sample covariance matrix, sorted by descending eigenvalue. Each eigenvalue is proportional to the variance explained by its component. Projecting a centered point <MathBlock>{String.raw`\mathbf{x} - \bar{\mathbf{x}}`}</MathBlock> onto <MathBlock>{'W'}</MathBlock> gives a <MathBlock>{'k'}</MathBlock>-dimensional representation that minimises reconstruction error.
          </p>
        </div>

        <Playground label="Explore PCA">
          {reset => <PCA key={reset} />}
        </Playground>

        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--ink)' }}>3D view:</strong> Three clusters in 3D space with principal component axes (red = PC1, blue = PC2, green = PC3). Drag to orbit and see how the axes align with the directions of maximum spread.
          </p>
          <PointCloud3D />
        </div>

        <CodeDrawer label="sklearn — PCA" code={PCA_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── LDA ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          Linear Discriminant Analysis
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          A supervised alternative to PCA that finds projections maximising class separation — the ratio of between-class to within-class scatter.
        </p>

        <Scrolly
          frames={LDA_FRAMES}
          scene={progress => <LDA progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`J(\mathbf{w}) = \frac{\mathbf{w}^\top S_B \mathbf{w}}{\mathbf{w}^\top S_W \mathbf{w}}`}
          </MathBlock>
          <p>
            <MathBlock>{String.raw`S_B`}</MathBlock> is the between-class scatter matrix (weighted sum of squared distances from class means to the global mean) and <MathBlock>{String.raw`S_W`}</MathBlock> is the within-class scatter (sum of covariances within each class). The optimal projection <MathBlock>{String.raw`\mathbf{w}`}</MathBlock> is the leading eigenvector of <MathBlock>{String.raw`S_W^{-1} S_B`}</MathBlock>. With <MathBlock>{'C'}</MathBlock> classes, there are at most <MathBlock>{'C-1'}</MathBlock> discriminant directions.
          </p>
        </div>

        <Playground label="Explore LDA">
          {reset => <LDA key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — LinearDiscriminantAnalysis" code={LDA_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── t-SNE ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          t-SNE
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          A nonlinear method that preserves local neighborhood structure — excellent for revealing cluster geometry in 2D, but not suitable for preprocessing.
        </p>

        <Scrolly
          frames={TSNE_FRAMES}
          scene={progress => <TSNE progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`q_{ij} = \frac{(1+\|y_i-y_j\|^2)^{-1}}{\sum_{k\neq l}(1+\|y_k-y_l\|^2)^{-1}}`}
          </MathBlock>
          <p>
            <MathBlock>{String.raw`q_{ij}`}</MathBlock> is the low-dimensional similarity between points <MathBlock>{'i'}</MathBlock> and <MathBlock>{'j'}</MathBlock>, modelled by a Student-t distribution with 1 degree of freedom. The gradient descent minimises the KL divergence between the high-D joint probabilities <MathBlock>{String.raw`p_{ij}`}</MathBlock> and <MathBlock>{String.raw`q_{ij}`}</MathBlock>. Perplexity controls the effective number of neighbors each point considers.
          </p>
        </div>

        <Playground label="Explore t-SNE">
          {reset => <TSNE key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — TSNE" code={TSNE_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── Comparison ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          Choosing a Method
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          PCA, LDA, and t-SNE answer different questions — matching the method to the goal matters more than any single algorithm.
        </p>

        <Scrolly
          frames={COMPARISON_FRAMES}
          scene={progress => <Comparison progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 'var(--step--1)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--ink-soft)' }}></th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--ink)' }}>PCA</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--ink)' }}>LDA</th>
                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--ink)' }}>t-SNE</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-display)' }}>Type</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Linear</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Linear</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Nonlinear</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-display)' }}>Supervision</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Unsupervised</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Supervised</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Unsupervised</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-display)' }}>Structure</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Global variance</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Class separation</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Local neighborhoods</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-display)' }}>Use case</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Compression, preprocessing</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>Classification pipeline</td>
                <td style={{ padding: '0.4rem 0.6rem' }}>2D/3D visualization</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Playground label="Explore All Three">
          {reset => <Comparison key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — PCA / LDA / TSNE" code={COMPARISON_CODE} />
        <hr className="section-rule" />
      </section>

      <DimRedSandbox />

    </Chapter>
  )
}
