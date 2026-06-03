import Chapter from '../components/Chapter'
import Scrolly from '../components/Scrolly'
import Playground from '../components/Playground'
import MathBlock from '../components/Math'
import CodeDrawer from '../components/CodeDrawer'
import Figure from '../components/Figure'
import DecisionTreeSplit from '../widgets/trees/DecisionTreeSplit'

const DT_CODE = `from sklearn.tree import DecisionTreeClassifier

clf = DecisionTreeClassifier(
    criterion='gini',   # or 'entropy'
    max_depth=3,
    min_samples_split=4,
)
clf.fit(X_train, y_train)
print(clf.score(X_test, y_test))`

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

export default function Trees() {
  return (
    <Chapter title="Decision Tree & Ensemble Learning" subtitle="Sessions 15–16">

      {/* ── Decision Tree ── */}
      <section>
        <h2 className="prose" style={{ marginBottom: '0.5rem' }}>Decision Tree</h2>
        <p className="prose" style={{ marginBottom: '2rem' }}>
          An iterative, top-down construction method that represents a hierarchy of decisions — each internal node tests one feature, and recursion continues until leaf nodes hold class predictions.
        </p>

        {/* Scrolly scene */}
        <Scrolly
          frames={DT_FRAMES}
          scene={(progress) => (
            <Figure caption="CART builds the tree by minimising Gini impurity at each split. Scroll to watch it grow.">
              <DecisionTreeSplit progress={progress} />
            </Figure>
          )}
        />

        {/* Math */}
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

        {/* Playground */}
        <Playground label="Decision Tree Playground">
          {(resetKey) => <DecisionTreeSplit key={resetKey} />}
        </Playground>

        <CodeDrawer code={DT_CODE} />
      </section>

      <hr className="section-rule" />

    </Chapter>
  )
}
