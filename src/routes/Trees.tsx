import Chapter from '../components/Chapter'
import Scrolly from '../components/Scrolly'
import Playground from '../components/Playground'
import MathBlock from '../components/Math'
import CodeDrawer from '../components/CodeDrawer'
import Figure from '../components/Figure'
import DecisionTreeSplit from '../widgets/trees/DecisionTreeSplit'
import Bagging from '../widgets/trees/Bagging'
import AdaBoost from '../widgets/trees/AdaBoost'
import GradientBoosting from '../widgets/trees/GradientBoosting'
import RandomForest from '../widgets/trees/RandomForest'
import Stacking from '../widgets/trees/Stacking'

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
  <div>
    <p><strong>All data, no split.</strong> The root node holds the entire training set. Its Gini impurity is high — the classes are thoroughly mixed.</p>
  </div>,
  <div>
    <p><strong>First split.</strong> CART searches every feature and threshold to find the cut that minimises weighted Gini impurity. One hyperplane divides the space into two regions.</p>
  </div>,
  <div>
    <p><strong>Depth 2.</strong> Each region is split again. The algorithm recurses, always choosing the locally optimal threshold. The boundary becomes more expressive.</p>
  </div>,
  <div>
    <p><strong>Depth 3 — a working classifier.</strong> Leaf nodes hold a predicted class (plurality vote). The tree stops when depth is reached or a node is already pure.</p>
  </div>,
]

const BAGGING_FRAMES = [
  <div>
    <p><strong>A single tree is unstable — high variance.</strong> Fit the same algorithm on different subsamples and you'll get wildly different boundaries.</p>
  </div>,
  <div>
    <p><strong>Draw N bootstrap samples, train one tree each.</strong> Each sample is drawn with replacement — on average 63% unique points per bag.</p>
  </div>,
  <div>
    <p><strong>Each tree votes; majority wins.</strong> Five trees produce five different boundaries. The ensemble takes the plurality prediction at each point.</p>
  </div>,
  <div>
    <p><strong>More trees → lower variance, stable boundary.</strong> Individual tree errors average out. The boundary smooths and generalises better than any single tree.</p>
  </div>,
]

const ADABOOST_FRAMES = [
  <div>
    <p><strong>Start with equal sample weights.</strong> Every point matters equally. The first decision stump picks the best single split, ignoring weights.</p>
  </div>,
  <div>
    <p><strong>Round 1: stump trained, misclassified samples gain weight.</strong> Points the stump got wrong are upweighted — the next round will focus on them.</p>
  </div>,
  <div>
    <p><strong>Each round focuses on hard examples.</strong> Circle size reflects current weight. Stumps contribute proportionally to their accuracy (α).</p>
  </div>,
  <div>
    <p><strong>Weighted vote of T stumps = strong classifier.</strong> Even stumps barely better than chance combine into a powerful ensemble via their α weights.</p>
  </div>,
]

const GRADBOOST_FRAMES = [
  <div>
    <p><strong>Start with a constant prediction (log-odds).</strong> f₀ is set to the log-odds of the positive class — the best constant prediction under log-loss.</p>
  </div>,
  <div>
    <p><strong>Compute residuals — where we're wrong.</strong> Negative gradients of the loss tell us the direction each prediction should move to reduce error.</p>
  </div>,
  <div>
    <p><strong>Fit a stump to the residuals, add it × η.</strong> Three rounds in, the boundary begins correcting the regions where f₀ was most wrong.</p>
  </div>,
  <div>
    <p><strong>Repeat: each round shrinks the error.</strong> Ten stumps later the boundary is expressive. η (learning rate) controls the trade-off: smaller η needs more rounds but generalises better.</p>
  </div>,
]

const RF_FRAMES = [
  <div>
    <p><strong>Bagging reduces variance.</strong> Multiple trees each see a bootstrap sample. But trees on correlated features tend to look similar, limiting the benefit.</p>
  </div>,
  <div>
    <p><strong>At each split, only m random features are considered.</strong> Typically m ≈ √p. This de-correlates trees — they now make different mistakes.</p>
  </div>,
  <div>
    <p><strong>De-correlated trees → lower ensemble variance.</strong> Ten trees with random feature subsets produce a smoother, more stable boundary than bagging alone.</p>
  </div>,
  <div>
    <p><strong>OOB samples provide a free validation estimate.</strong> Each tree's ~37% out-of-bag points act as a held-out test set — no cross-validation needed.</p>
  </div>,
]

const STACKING_FRAMES = [
  <div>
    <p><strong>Train diverse base learners on the same data.</strong> Trees of different depths learn different aspects of the boundary — deliberately using diverse models.</p>
  </div>,
  <div>
    <p><strong>Use base predictions as features for a meta-learner.</strong> For each point, collect [h₁(x), h₂(x), …, hL(x)] into a new feature vector.</p>
  </div>,
  <div>
    <p><strong>The meta-learner learns to weight and combine.</strong> It discovers which base learner to trust in which region of the space.</p>
  </div>,
  <div>
    <p><strong>Stronger together than any individual model.</strong> The stacked boundary inherits the strengths of each base learner while the meta-learner covers their blind spots.</p>
  </div>,
]

export default function Trees() {
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

      {/* ── BAGGING ─────────────────────────────────── */}
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

      {/* ── ADABOOST ─────────────────────────────────── */}
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

      {/* ── GRADIENT BOOSTING ─────────────────────────────────── */}
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

      {/* ── RANDOM FOREST ─────────────────────────────────── */}
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
            The OOB error — computed on the ~37% of points excluded from each tree's bootstrap sample — is an unbiased estimate of generalisation error without any dedicated validation set.
          </p>
        </div>

        <Playground label="Explore Random Forest">
          {(reset) => <RandomForest key={reset} />}
        </Playground>

        <CodeDrawer label="sklearn — RandomForestClassifier" code={RF_CODE} />
        <hr className="section-rule" />
      </section>

      {/* ── STACKING ─────────────────────────────────── */}
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

    </Chapter>
  )
}
