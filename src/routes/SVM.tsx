import Chapter from '../components/Chapter'
import Scrolly from '../components/Scrolly'
import Playground from '../components/Playground'
import MathBlock from '../components/Math'
import CodeDrawer from '../components/CodeDrawer'
import MaxMargin from '../widgets/svm/MaxMargin'
import SoftMargin from '../widgets/svm/SoftMargin'
import KernelTrick from '../widgets/svm/KernelTrick'

const MAXMARGIN_CODE = `from sklearn.svm import SVC

# Hard margin (linearly separable only)
model = SVC(kernel='linear', C=1e6)
model.fit(X_train, y_train)
print('Support vectors:', model.support_vectors_.shape)`

const SOFTMARGIN_CODE = `from sklearn.svm import SVC

# Soft margin — tune C
for C in [0.1, 1, 10, 100]:
    model = SVC(kernel='linear', C=C)
    model.fit(X_train, y_train)
    print(f'C={C}: {model.score(X_test, y_test):.3f}')`

const KERNEL_CODE = `from sklearn.svm import SVC

# RBF kernel (most common default)
model = SVC(kernel='rbf', C=1.0, gamma='scale')
model.fit(X_train, y_train)

# Other kernels
poly_model = SVC(kernel='poly', degree=3, coef0=1)
sigmoid_model = SVC(kernel='sigmoid', gamma='scale')`

const MAXMARGIN_FRAMES = [
  <div>
    <p><strong>When classes are linearly separable, infinitely many boundaries exist.</strong> Any hyperplane that correctly classifies all points is technically valid — but which one to choose?</p>
  </div>,
  <div>
    <p><strong>The maximal margin classifier picks the one farthest from all points.</strong> After 50 gradient steps the boundary is forming, and margin lines begin to appear on each side.</p>
  </div>,
  <div>
    <p><strong>Support vectors are the critical points that define the margin.</strong> After 200 steps, the circled points are the ones lying exactly on or nearest to the margin boundaries.</p>
  </div>,
  <div>
    <p><strong>Only support vectors matter — all other points are irrelevant.</strong> Remove any non-support-vector point and the boundary stays identical. The margin width is the key metric.</p>
  </div>,
]

const SOFTMARGIN_FRAMES = [
  <div>
    <p><strong>Real data is rarely linearly separable.</strong> The two-moons dataset has no line that perfectly separates the classes — we need a way to allow imperfect solutions.</p>
  </div>,
  <div>
    <p><strong>Soft margin allows some points to violate the margin — controlled by C.</strong> Open circles are violators: they land inside or on the wrong side of the margin. C=0.5 allows many.</p>
  </div>,
  <div>
    <p><strong>Large C: narrow margin, fewer violations, more overfit.</strong> C=5 penalises violations heavily, forcing a tighter fit. The margin shrinks but fewer points are open circles.</p>
  </div>,
  <div>
    <p><strong>Small C: wide margin, more violations, more robust.</strong> C=50 goes narrow seeking perfection on this non-separable data — violations drop but the model is fragile to noise.</p>
  </div>,
]

const KERNEL_FRAMES = [
  <div>
    <p><strong>Linear boundaries fail on non-linear data.</strong> A straight line through two-moons data gives a poor boundary — half the points will always be misclassified.</p>
  </div>,
  <div>
    <p><strong>The kernel trick implicitly maps data to a high-dimensional space.</strong> RBF with γ=0.5 wraps loosely around each moon — the decision boundary is now a curve.</p>
  </div>,
  <div>
    <p><strong>In that space, a linear boundary becomes a curve in the original space.</strong> RBF with γ=2.0 wraps more tightly, following each moon's arc more precisely.</p>
  </div>,
  <div>
    <p><strong>RBF kernel: γ controls how tightly it wraps around points.</strong> A polynomial kernel of degree 3 gives a different curved shape — exploring kernels reveals which structure fits best.</p>
  </div>,
]

export default function SVM() {
  return (
    <Chapter title="Support Vector Machine" subtitle="Finding the boundary with the widest margin.">

      {/* ── Maximal Margin Classifier ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          Maximal Margin Classifier
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          When data is linearly separable, choose the hyperplane that maximises the distance to the nearest points of each class.
        </p>

        <Scrolly
          frames={MAXMARGIN_FRAMES}
          scene={progress => <MaxMargin progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`\text{maximize} \; \frac{2}{\|\mathbf{w}\|}\; \text{ subject to } y_i(\mathbf{w}^\top x_i + b) \geq 1`}
          </MathBlock>
          <p>
            The margin width is <MathBlock>{String.raw`\frac{2}{\|\mathbf{w}\|}`}</MathBlock> — maximising it is equivalent to minimising <MathBlock>{String.raw`\|\mathbf{w}\|`}</MathBlock>. The constraint ensures all points are at least distance 1 from the boundary (in the normalised scale). Only the support vectors — the points at exactly <MathBlock>{String.raw`y_i(\mathbf{w}^\top x_i + b) = 1`}</MathBlock> — influence the solution.
          </p>
        </div>

        <Playground label="Explore Max Margin">
          {reset => <MaxMargin key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — SVC" code={MAXMARGIN_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── Soft Margin SVM ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          Soft Margin SVM
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          Relax the hard margin constraint to handle overlapping or non-separable classes — the regularisation parameter C trades margin width against training error.
        </p>

        <Scrolly
          frames={SOFTMARGIN_FRAMES}
          scene={progress => <SoftMargin progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`\text{minimize} \; \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i}\xi_i \; \text{ subject to } y_i(\mathbf{w}^\top x_i + b) \geq 1 - \xi_i`}
          </MathBlock>
          <p>
            The slack variable <MathBlock>{String.raw`\xi_i \geq 0`}</MathBlock> measures how far a point has violated the margin. A point is correctly classified with <MathBlock>{String.raw`\xi_i = 0`}</MathBlock>, on the margin at <MathBlock>{String.raw`\xi_i = 1`}</MathBlock>, and misclassified when <MathBlock>{String.raw`\xi_i > 1`}</MathBlock>. The hyperparameter C controls the penalty: large C = low tolerance for violations; small C = wide margin accepted.
          </p>
        </div>

        <Playground label="Explore Soft Margin">
          {reset => <SoftMargin key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — SVC soft margin" code={SOFTMARGIN_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── Kernel Trick ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', lineHeight: 1.15, marginBottom: '0.4em', color: 'var(--ink)' }}>
          The Kernel Trick
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: 'var(--measure)' }}>
          Replace the inner product with a kernel function to implicitly operate in a very high-dimensional feature space — enabling non-linear decision boundaries at no extra cost.
        </p>

        <Scrolly
          frames={KERNEL_FRAMES}
          scene={progress => <KernelTrick progress={progress} />}
          frameHeight="60vh"
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>
            {String.raw`K(x, x') = \exp\!\left(-\gamma\|x - x'\|^2\right)`}
          </MathBlock>
          <p>
            The RBF kernel computes similarity between points: 1 when identical, decaying exponentially as distance grows. The parameter <MathBlock>{String.raw`\gamma`}</MathBlock> controls the radius of influence — large <MathBlock>{String.raw`\gamma`}</MathBlock> means only very nearby points influence the boundary, producing tight, complex shapes. Small <MathBlock>{String.raw`\gamma`}</MathBlock> produces smoother, broader boundaries.
          </p>
          <p>
            Common kernels: <strong>linear</strong> <MathBlock>{String.raw`x^\top x'`}</MathBlock>, <strong>polynomial</strong> <MathBlock>{String.raw`(\gamma x^\top x' + 1)^d`}</MathBlock>, <strong>RBF</strong> (above), <strong>sigmoid</strong>. The choice of kernel encodes assumptions about the data geometry.
          </p>
        </div>

        <Playground label="Explore Kernels">
          {reset => <KernelTrick key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — SVC" code={KERNEL_CODE} />
        <hr className="section-rule" />
      </section>

    </Chapter>
  )
}
