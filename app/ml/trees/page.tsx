'use client'
import { useEffect, useState } from 'react'
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

const DecisionTreeSplit = dynamic(() => import('@/components/ml/trees/DecisionTreeSplit'), { ssr: false })
const DecisionSurface3D = dynamic(() => import('@/components/r3f/DecisionSurface3D'), { ssr: false })
const Bagging = dynamic(() => import('@/components/ml/trees/Bagging'), { ssr: false })
const AdaBoost = dynamic(() => import('@/components/ml/trees/AdaBoost'), { ssr: false })
const GradientBoosting = dynamic(() => import('@/components/ml/trees/GradientBoosting'), { ssr: false })
const RandomForest = dynamic(() => import('@/components/ml/trees/RandomForest'), { ssr: false })
const Stacking = dynamic(() => import('@/components/ml/trees/Stacking'), { ssr: false })

const DT_CODE = `from sklearn.tree import DecisionTreeClassifier

clf = DecisionTreeClassifier(
    criterion='gini',   # or 'entropy'
    max_depth=3,
    min_samples_split=4,
)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))`

const BAGGING_CODE = `from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier

model = BaggingClassifier(
    estimator=DecisionTreeClassifier(max_depth=4),
    n_estimators=10,
    random_state=42
)
model.fit(X_train, y_train)`

const ADABOOST_CODE = `from sklearn.ensemble import AdaBoostClassifier

model = AdaBoostClassifier(
    n_estimators=50,
    learning_rate=1.0,
    random_state=42
)
model.fit(X_train, y_train)`

const GRADBOOST_CODE = `from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)
model.fit(X_train, y_train)`

const RF_CODE = `from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    max_features='sqrt',  # m ≈ √p
    random_state=42
)
model.fit(X_train, y_train)
print('OOB score:', model.oob_score_)`

const STACKING_CODE = `from sklearn.ensemble import StackingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression

estimators = [
    ('dt_deep', DecisionTreeClassifier(max_depth=4)),
    ('dt_shallow', DecisionTreeClassifier(max_depth=2)),
]
model = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression()
)
model.fit(X_train, y_train)`

const DT_FRAMES = [
  <div key="dt-0">
    <p><strong>All data, no split.</strong> The root node holds the entire training set. Its Gini impurity is high — the classes are thoroughly mixed.</p>
  </div>,
  <div key="dt-1">
    <p><strong>First split.</strong> CART searches every feature and threshold to find the cut that minimises weighted Gini impurity. One hyperplane divides the space into two regions.</p>
  </div>,
  <div key="dt-2">
    <p><strong>Depth 2.</strong> Each region is split again. The algorithm recurses, always choosing the locally optimal threshold. The boundary becomes more expressive.</p>
  </div>,
  <div key="dt-3">
    <p><strong>Depth 3 — a working classifier.</strong> Leaf nodes hold a predicted class (plurality vote). The tree stops when depth is reached or a node is already pure.</p>
  </div>,
]

const BAGGING_FRAMES = [
  <div key="bag-0">
    <p><strong>A single tree is unstable — high variance.</strong> Fit the same algorithm on different subsamples and you&apos;ll get wildly different boundaries.</p>
  </div>,
  <div key="bag-1">
    <p><strong>Draw N bootstrap samples, train one tree each.</strong> Each sample is drawn with replacement — on average 63% unique points per bag.</p>
  </div>,
  <div key="bag-2">
    <p><strong>Each tree votes; majority wins.</strong> Five trees produce five different boundaries. The ensemble takes the plurality prediction at each point.</p>
  </div>,
  <div key="bag-3">
    <p><strong>More trees → lower variance, stable boundary.</strong> Individual tree errors average out. The boundary smooths and generalises better than any single tree.</p>
  </div>,
]

const ADABOOST_FRAMES = [
  <div key="ada-0">
    <p><strong>Start with equal sample weights.</strong> Every point matters equally. The first decision stump picks the best single split, ignoring weights.</p>
  </div>,
  <div key="ada-1">
    <p><strong>Round 1: stump trained, misclassified samples gain weight.</strong> Points the stump got wrong are upweighted — the next round will focus on them.</p>
  </div>,
  <div key="ada-2">
    <p><strong>Each round focuses on hard examples.</strong> Circle size reflects current weight. Stumps contribute proportionally to their accuracy (α).</p>
  </div>,
  <div key="ada-3">
    <p><strong>Weighted vote of T stumps = strong classifier.</strong> Even stumps barely better than chance combine into a powerful ensemble via their α weights.</p>
  </div>,
]

const GRADBOOST_FRAMES = [
  <div key="gb-0">
    <p><strong>Start with a constant prediction (log-odds).</strong> f₀ is set to the log-odds of the positive class — the best constant prediction under log-loss.</p>
  </div>,
  <div key="gb-1">
    <p><strong>Compute residuals — where we&apos;re wrong.</strong> Negative gradients of the loss tell us the direction each prediction should move to reduce error.</p>
  </div>,
  <div key="gb-2">
    <p><strong>Fit a stump to the residuals, add it × η.</strong> Three rounds in, the boundary begins correcting the regions where f₀ was most wrong.</p>
  </div>,
  <div key="gb-3">
    <p><strong>Repeat: each round shrinks the error.</strong> Ten stumps later the boundary is expressive. η (learning rate) controls the trade-off: smaller η needs more rounds but generalises better.</p>
  </div>,
]

const RF_FRAMES = [
  <div key="rf-0">
    <p><strong>Bagging reduces variance.</strong> Multiple trees each see a bootstrap sample. But trees on correlated features tend to look similar, limiting the benefit.</p>
  </div>,
  <div key="rf-1">
    <p><strong>At each split, only m random features are considered.</strong> Typically m ≈ √p. This de-correlates trees — they now make different mistakes.</p>
  </div>,
  <div key="rf-2">
    <p><strong>De-correlated trees → lower ensemble variance.</strong> Ten trees with random feature subsets produce a smoother, more stable boundary than bagging alone.</p>
  </div>,
  <div key="rf-3">
    <p><strong>OOB samples provide a free validation estimate.</strong> Each tree&apos;s ~37% out-of-bag points act as a held-out test set — no cross-validation needed.</p>
  </div>,
]

const STACKING_FRAMES = [
  <div key="st-0">
    <p><strong>Train diverse base learners on the same data.</strong> Trees of different depths learn different aspects of the boundary — deliberately using diverse models.</p>
  </div>,
  <div key="st-1">
    <p><strong>Use base predictions as features for a meta-learner.</strong> For each point, collect [h₁(x), h₂(x), …, hL(x)] into a new feature vector.</p>
  </div>,
  <div key="st-2">
    <p><strong>The meta-learner learns to weight and combine.</strong> It discovers which base learner to trust in which region of the space.</p>
  </div>,
  <div key="st-3">
    <p><strong>Stronger together than any individual model.</strong> The stacked boundary inherits the strengths of each base learner while the meta-learner covers their blind spots.</p>
  </div>,
]

function TreeSandbox() {
  const [maxDepth, setMaxDepth] = useState(3)
  const [minSamples, setMinSamples] = useState(4)
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>('gini')

  return (
    <SandboxPanel
      title="Decision Tree — Parameter Sandbox"
      controls={
        <>
          <Slider label="Max Depth" min={1} max={10} step={1} value={maxDepth} onChange={setMaxDepth} />
          <Slider label="Min Samples Split" min={2} max={20} step={1} value={minSamples} onChange={setMinSamples} />
          <Select
            label="Criterion"
            options={[{ value: 'gini', label: 'Gini Impurity' }, { value: 'entropy', label: 'Entropy' }]}
            value={criterion}
            onChange={v => setCriterion(v as 'gini' | 'entropy')}
          />
        </>
      }
      viz={
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', lineHeight: 1.8 }}>
          <div>criterion: <strong style={{ color: 'var(--ink)' }}>{criterion}</strong></div>
          <div>max_depth: <strong style={{ color: 'var(--ink)' }}>{maxDepth}</strong></div>
          <div>min_samples_split: <strong style={{ color: 'var(--ink)' }}>{minSamples}</strong></div>
          <div style={{ marginTop: '1rem', color: 'var(--ink-soft)' }}>max nodes: ~{Math.pow(2, maxDepth + 1) - 1}</div>
          <div>max leaves: ~{Math.pow(2, maxDepth)}</div>
        </div>
      }
    />
  )
}

export default function TreesPage() {
  useEffect(() => {
    localStorage.setItem('progress:ml:trees', Date.now().toString())
  }, [])

  return (
    <Chapter title="Decision Tree & Ensemble Learning" subtitle="Sessions 15–16">

      {/* ── Decision Tree ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Decision Tree</h2>
        <p className="prose" style={{ marginBottom: '2rem' }}>
          An iterative, top-down construction method that represents a hierarchy of decisions — each internal node tests one feature, and recursion continues until leaf nodes hold class predictions.
        </p>

        <Scrolly
          frames={DT_FRAMES}
          scene={(progress) => (
            <Figure caption="CART builds the tree by minimising Gini impurity at each split. Scroll to watch it grow.">
              <DecisionTreeSplit progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <h3>Gini Impurity</h3>
          <MathBlock block>
            {String.raw`\text{Gini}(t) = 1 - \sum_{k=1}^{K} p_k^2`}
          </MathBlock>
          <p>
            where <MathBlock>{'p_k'}</MathBlock> is the proportion of class <MathBlock>{'k'}</MathBlock> at node <MathBlock>{'t'}</MathBlock>. A node with only one class has Gini = 0 (pure). Equal class proportions maximise impurity.
          </p>
          <p>
            CART selects the feature <MathBlock>{'j'}</MathBlock> and threshold <MathBlock>{String.raw`\theta`}</MathBlock> that minimise the weighted average impurity of the two resulting child nodes.
          </p>
        </div>

        <Playground label="Decision Tree Playground">
          {(resetKey) => <DecisionTreeSplit key={resetKey} />}
        </Playground>

        <CodeDrawer code={DT_CODE} />
      </section>

      <hr className="section-rule" />

      {/* ── BAGGING ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Bagging</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Bootstrap Aggregating trains k classifiers on independent random subsamples and reduces variance by averaging their predictions.
        </p>

        <Scrolly
          frames={BAGGING_FRAMES}
          scene={(progress) => (
            <Figure caption="Each tree votes on its bootstrap sample. The ensemble boundary stabilises as k grows.">
              <Bagging progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>{String.raw`\hat{y} = \text{mode}\{h_1(x), h_2(x), \ldots, h_k(x)\}`}</MathBlock>
          <p>
            Each <MathBlock>{'h_i'}</MathBlock> is trained on a bootstrap sample — N draws with replacement from the training set. Roughly 63% of the original points appear in each bag; the remaining 37% form the <em>out-of-bag (OOB)</em> set, a free internal validation estimate.
          </p>
          <p>
            Bagging excels when the base learner has high variance (e.g., deep trees). It does not reduce bias — a consistently wrong learner stays wrong.
          </p>
        </div>

        <Playground label="Explore Bagging">
          {(reset) => <Bagging key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — BaggingClassifier" code={BAGGING_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── ADABOOST ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>AdaBoost</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Adaptive Boosting trains weak learners sequentially, re-weighting misclassified examples at each round so subsequent learners focus on hard cases.
        </p>

        <Scrolly
          frames={ADABOOST_FRAMES}
          scene={(progress) => (
            <Figure caption="Circle size is proportional to sample weight. Misclassified points grow; correct ones shrink.">
              <AdaBoost progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>{String.raw`H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t h_t(x)\right)`}</MathBlock>
          <p>
            Each round <MathBlock>{'t'}</MathBlock> trains a stump <MathBlock>{'h_t'}</MathBlock> on the current weight distribution. Its vote weight is <MathBlock>{String.raw`\alpha_t = \frac{1}{2}\ln\frac{1-\varepsilon_t}{\varepsilon_t}`}</MathBlock>, where <MathBlock>{String.raw`\varepsilon_t`}</MathBlock> is the weighted error. Weights are then updated: misclassified samples are multiplied by <MathBlock>{String.raw`e^{\alpha_t}`}</MathBlock>, correct ones by <MathBlock>{String.raw`e^{-\alpha_t}`}</MathBlock>.
          </p>
          <p>
            AdaBoost reduces both bias and variance. It is sensitive to noisy labels — outliers repeatedly gain weight and can dominate later rounds.
          </p>
        </div>

        <Playground label="Explore AdaBoost">
          {(reset) => <AdaBoost key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — AdaBoostClassifier" code={ADABOOST_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── GRADIENT BOOSTING ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Gradient Boosting</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Generalises boosting to any differentiable loss function by fitting each new tree to the negative gradient of the loss — the direction of steepest descent.
        </p>

        <Scrolly
          frames={GRADBOOST_FRAMES}
          scene={(progress) => (
            <Figure caption="The boundary starts flat (log-odds baseline) then corrects itself round by round.">
              <GradientBoosting progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>{String.raw`F_m(x) = F_{m-1}(x) + \eta \cdot h_m(x)`}</MathBlock>
          <p>
            At each stage <MathBlock>{'m'}</MathBlock>, the residuals <MathBlock>{String.raw`r_i = -\frac{\partial \mathcal{L}}{\partial F(x_i)}`}</MathBlock> are computed and a new weak learner <MathBlock>{'h_m'}</MathBlock> is fit to them. The learning rate <MathBlock>{String.raw`\eta`}</MathBlock> shrinks each step, trading convergence speed for better generalisation.
          </p>
          <p>
            For log-loss (binary classification), the residual simplifies to <MathBlock>{String.raw`r_i = y_i - \sigma(F(x_i))`}</MathBlock> where <MathBlock>{String.raw`\sigma`}</MathBlock> is the sigmoid. XGBoost and LightGBM are optimised implementations of this framework.
          </p>
        </div>

        <Playground label="Explore Gradient Boosting">
          {(reset) => <GradientBoosting key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — GradientBoostingClassifier" code={GRADBOOST_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── RANDOM FOREST ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Random Forest</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Extends bagging with random feature subsampling at each split, de-correlating trees so their errors cancel more effectively.
        </p>

        <Scrolly
          frames={RF_FRAMES}
          scene={(progress) => (
            <Figure caption="Each tree sees a bootstrap sample and a random subset of features. OOB points validate for free.">
              <RandomForest progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>{String.raw`\hat{y} = \frac{1}{k}\sum_{i=1}^{k} h_i(x),\quad m \approx \sqrt{p}`}</MathBlock>
          <p>
            At every split, only <MathBlock>{'m'}</MathBlock> features are considered — typically <MathBlock>{String.raw`m = \lfloor\sqrt{p}\rfloor`}</MathBlock> for classification. This forces diversity: even if one feature is strongly predictive, different trees may use different features, so their errors are less correlated.
          </p>
          <p>
            The OOB error — computed on the ~37% of points excluded from each tree&apos;s bootstrap sample — is an unbiased estimate of generalisation error without any dedicated validation set.
          </p>
        </div>

        <Playground label="Explore Random Forest">
          {(reset) => <RandomForest key={reset} />}
        </Playground>

        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step--1)', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--ink)' }}>3D view:</strong> Decision tree boundary as a stepped surface. Each column&apos;s height and color reflects its predicted class (blue = 1, orange = 0). The steps reveal the axis-aligned, piecewise structure of tree decisions. Drag to orbit.
          </p>
          <DecisionSurface3D />
        </div>

        <CodeDrawer label="sklearn — RandomForestClassifier" code={RF_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── STACKING ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Stacking</h2>
        <p className="prose" style={{ marginBottom: '2rem', color: 'var(--ink-soft)' }}>
          Stacked generalisation trains a meta-learner on the outputs of diverse base classifiers, learning which models to trust in which regions of the input space.
        </p>

        <Scrolly
          frames={STACKING_FRAMES}
          scene={(progress) => (
            <Figure caption="Light regions show individual base boundaries. Bold region shows the meta-learner's final decision.">
              <Stacking progress={progress} />
            </Figure>
          )}
        />

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <MathBlock block>{String.raw`\hat{y} = g\bigl(h_1(x), h_2(x), \ldots, h_L(x)\bigr)`}</MathBlock>
          <p>
            Base learners <MathBlock>{String.raw`h_1,\ldots,h_L`}</MathBlock> are trained on the full (or split) training data. Their predictions form a new feature vector that is fed to the meta-learner <MathBlock>{'g'}</MathBlock>. To avoid leakage, base predictions for the meta-training set are ideally produced via cross-validation (out-of-fold predictions).
          </p>
          <p>
            Stacking works best when base learners are <em>diverse</em> — using different algorithms, hyperparameters, or feature subsets. The meta-learner need not be complex; logistic regression is often sufficient.
          </p>
        </div>

        <Playground label="Explore Stacking">
          {(reset) => <Stacking key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — StackingClassifier" code={STACKING_CODE} />
        <hr className="section-rule" />
      </section>

      <TreeSandbox />

    </Chapter>
  )
}
