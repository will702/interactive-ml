**Machine Learning**

**Comprehensive Study Notes**

Sessions 15–22 | BINUS University

| Session 15–16 Decision Tree & Ensemble Learning | Session 17–18 Support Vector Machine | Session 19–20 Clustering | Session 21–22 Dimensionality Reduction |
| :---: | :---: | :---: | :---: |

# **Session 15–16: Decision Tree & Ensemble Learning**

This session covers tree-based classifiers and the ensemble strategies that extend them into powerful predictive models.

## **1\. Decision Tree**

### **What is a Decision Tree?**

A Decision Tree is an iterative, top-down construction method for building a classifier. It represents a hierarchy of decisions that progressively divide the feature space into subspaces.

| Tree Structure — Three Node Types Root Node: No incoming edges, zero or more outgoing edges.Internal/Decision Nodes: Exactly one incoming edge, two or more outgoing edges — represents a feature test.Leaf/Terminal Nodes: One incoming edge, no outgoing edges — holds the final class prediction. |
| :---- |

### **Training Process**

Decision trees are built by recursively splitting training samples using feature metrics:

* Gini Index — measures impurity; favored by CART algorithm.

* Entropy / Information Gain — measures uncertainty; favored by ID3/C4.5.

* Discrete features: all possible values are evaluated, producing N metrics per variable.

* Continuous features: the mean of each two consecutive ordered values is used as a threshold.

### **Making Predictions**

Prediction traverses the tree from root to leaf:

* Start at the root node and evaluate the feature it tests.

* Move left or right to the appropriate child based on the feature value.

* Repeat until a leaf node is reached.

* The predicted class is the mode of training samples in that leaf.

## **2\. Introduction to Ensemble Learning**

Ensemble methods combine multiple models so the aggregate outperforms any individual model. There are two primary paradigms:

| Paradigm | Idea | Addresses |
| :---- | :---- | :---- |
| Voting / Bagging | Combine many high-variance models and average their outputs | Overfitting & variance |
| Boosting | Sequentially boost weak learners into a strong learner | Bias & underfitting |

### **Majority Voting**

* Plurality voting: The class with the most votes wins.

* For binary classification, plurality and majority are equivalent.

## **3\. Bagging (Bootstrap Aggregating)**

Bagging reduces variance by training many models on different bootstrap samples of the training set and aggregating their predictions.

* Bootstrap sampling: Draw N samples with replacement from the training set.

* Train an independent model on each bootstrap sample.

* Aggregate via majority vote (classification) or averaging (regression).

* Out-of-bag (OOB) samples can be used as a built-in validation set.

## **4\. Boosting**

Boosting trains models sequentially; each new model focuses more on the examples misclassified by previous models.

### **AdaBoost (Adaptive Boosting)**

* Assign equal weights to all training samples initially.

* Train a weak learner (e.g., decision stump).

* Increase weights for misclassified samples.

* Repeat for T iterations; combine all classifiers with weighted voting.

### **Gradient Boosting**

* Fits each new model to the residual errors (gradients) of the combined ensemble.

* More general than AdaBoost; supports arbitrary differentiable loss functions.

## **5\. Random Forest**

Random Forest extends bagging by adding random feature selection at each split, which de-correlates the individual trees:

* At each split, only a random subset of m features is considered (typically m ≈ √p where p is total features).

* Builds many diverse decision trees and averages their predictions.

* Performs well out-of-the-box with minimal hyperparameter tuning.

* Provides built-in feature importance estimates.

## **6\. Stacking**

Stacked generalization (Stacking) trains a meta-model to combine the predictions of diverse base learners:

* Step 1 — Train multiple strong base learners on the training data.

* Step 2 — Use their predictions as input features for a meta-model (combiner).

* Unlike boosting (weak → strong), stacking combines already strong and diverse learners.

* A single meta-model learns the optimal way to combine base model outputs.

| Key Takeaway Decision Tree → Bagging → Random Forest adds random feature subsampling.Boosting (AdaBoost / Gradient Boosting) addresses bias sequentially.Stacking assembles diverse strong learners via a learned meta-model. |
| :---- |

# **Session 17–18: Support Vector Machine (SVM)**

SVM is one of the most popular and versatile supervised learning algorithms, capable of linear/nonlinear classification, regression, and outlier detection.

## **1\. Introduction**

* Powerful for complex, small-to-medium-sized datasets.

* A family of methods encompassing both parametric (linear) and nonparametric (kernel-based) approaches.

* Generalizes linear decision boundaries by constructing them in a transformed high-dimensional feature space.

* Three core approaches: Maximal Margin Classifier → Support Vector Classifier → SVM.

## **2\. Maximal Margin Classifier**

### **Separating Hyperplane**

A hyperplane in p dimensions is a flat (p-1)-dimensional subspace. For binary classification, data is split on either side of this hyperplane. When data is linearly separable, infinitely many separating hyperplanes exist.

### **Maximal Margin**

Given a separating hyperplane, the margin is the minimum distance from any training observation to the hyperplane. The Maximal Margin Classifier chooses the hyperplane that maximizes this margin.

| Support Vectors The observations that lie exactly on the margin boundaries are called support vectors. Only these points define the decision boundary — all other points are irrelevant. This sparse representation is a core property of SVM. |
| :---- |

## **3\. Support Vector Classifier (Soft-Margin)**

When classes are not linearly separable, the maximal margin classifier fails. The Support Vector Classifier relaxes the hard margin constraint:

* Allows some observations to fall within the margin or even on the wrong side of the hyperplane.

* Controlled by the penalty parameter C (budget for margin violations).

* Larger C → narrower margin, fewer violations → more overfit.

* Smaller C → wider margin, more violations → more robust.

* Support vectors include: points on the margin, points within the margin, and misclassified points.

## **4\. Support Vector Machine (Kernel Trick)**

SVM extends the Support Vector Classifier to handle nonlinear boundaries through the kernel trick — replacing dot products with kernel functions that implicitly compute feature transformations in high-dimensional spaces without explicitly computing the coordinates.

| Kernel | Formula (sketch) | Suitable For |
| :---- | :---- | :---- |
| Linear | K(x,x') \= x·x' | Linearly separable data |
| Polynomial | K(x,x') \= (γx·x' \+ r)^d | Moderate non-linearity |
| Radial Basis (RBF) | K(x,x') \= exp(-γ||x-x'||²) | Complex, non-linear boundaries |
| Sigmoid | K(x,x') \= tanh(γx·x' \+ r) | Neural network approximation |

| Key Takeaway The kernel trick allows SVM to operate in very high-dimensional implicit feature spaces with the same computational cost as the original space. RBF kernel is the most commonly used default. |
| :---- |

# **Session 19–20: Clustering**

Clustering is an unsupervised learning technique that finds natural groupings in data without pre-labeled categories.

## **1\. Clustering Analysis**

### **Definition**

Finding groups of objects such that objects within a group are similar to each other and dissimilar to objects in other groups. Unlike classification, no ground-truth labels are used.

### **Real-World Applications**

* Customer Segmentation — Group customers by behavior/demographics for targeted marketing.

* Anomaly Detection — Identify outliers in fraud detection, intrusion detection, and quality control.

* Social Network Analysis — Discover communities and influence patterns in networks.

### **Taxonomy of Clustering Algorithms**

| Category | Examples |
| :---- | :---- |
| Centroid-based | K-Means, K-Medoid |
| Hierarchical | Agglomerative (AGNES), Divisive (DIANA) |
| Density-based | DBSCAN, OPTICS |
| Distribution-based | Gaussian Mixture Models (GMM) |
| Modern (Deep/Ensemble) | Spectral, Affinity Propagation, Deep Clustering |

## **2\. Centroid-Based Clustering — K-Means**

K-Means partitions n observations into k clusters by minimizing the total within-cluster sum of squared distances to cluster centroids.

### **Algorithm Steps**

* 1\. Choose the number of clusters k.

* 2\. Initialize k centroids randomly.

* 3\. Assignment step: Assign each point to the nearest centroid.

* 4\. Update step: Recalculate each centroid as the mean of its assigned points.

* 5\. Repeat steps 3–4 until centroids do not change (convergence).

### **Finding Optimal k**

| Elbow Method Run K-Means for k \= 1, 2, ..., K. Plot within-cluster sum of squares (WCSS) vs k. The 'elbow' — where the rate of decrease sharply changes — indicates the optimal k. |
| :---- |

| Silhouette Method For each point i, compute S(i) \= (b(i) \- a(i)) / max(a(i), b(i)), where a(i) \= avg intra-cluster distance and b(i) \= avg nearest-cluster distance. S(i) ∈ \[-1, 1\]; higher is better. Choose k that maximizes the average silhouette score. |
| :---- |

## **3\. Hierarchical Clustering**

Hierarchical clustering builds a nested sequence of clusters visualized as a dendrogram. No need to specify k in advance — any number of clusters can be obtained by cutting the dendrogram at the desired level.

### **Agglomerative (Bottom-Up)**

* Start with each point as its own cluster.

* Merge the two closest clusters at each step.

* Continue until one cluster remains.

### **Inter-Cluster Similarity Measures**

| Linkage | Distance Definition | Strength | Weakness |
| :---- | :---- | :---- | :---- |
| Single (Min) | Min distance between any pair across clusters | Handles non-elliptical shapes | Sensitive to noise/outliers |
| Complete (Max) | Max distance between any pair across clusters | Robust to noise/outliers | Breaks large clusters |
| Average | Average pairwise distance across all pairs | Balanced, robust | Biased toward globular clusters |

## **4\. Density-Based Clustering — DBSCAN**

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) forms clusters as dense regions separated by areas of low density. It requires two parameters: Eps (radius) and MinPts (minimum neighborhood size).

### **Point Classification**

* Core Point — Has ≥ MinPts within radius Eps. Forms the interior of a cluster.

* Border Point — Has \< MinPts within Eps but falls within the neighborhood of a core point.

* Noise Point — Neither core nor border; treated as an outlier.

### **DBSCAN Strengths & Limitations**

| Strengths | Limitations |
| :---- | :---- |
| Resistant to noise and outliers | Struggles with varying density clusters |
| Can detect clusters of arbitrary shapes | Poor performance in high-dimensional data |
| No need to specify number of clusters | Sensitive to Eps and MinPts hyperparameters |

| Choosing Eps Plot the sorted k-NN (k \= MinPts) distance graph. The optimal Eps corresponds to the 'knee' of the curve — where distance starts increasing sharply. |
| :---- |

# **Session 21–22: Dimensionality Reduction**

Dimensionality reduction transforms high-dimensional data into a lower-dimensional representation while preserving meaningful structure, addressing the curse of dimensionality.

## **1\. The Curse of Dimensionality**

Coined by Richard Bellman, this term describes how high-dimensional data creates fundamental challenges:

* Computational cost — Processing, storing, and communicating high-dimensional data is expensive.

* Visualization — Data beyond 3D cannot be directly visualized.

* Redundancy & noise — Adding features beyond the optimal number degrades model performance (Hughes phenomenon).

* Feature encoding — One-hot encoding of categorical variables can drastically inflate dimensions.

## **2\. Dimensionality Reduction — Benefits**

* Reduces storage space and computation time.

* Reduces multicollinearity among features.

* Enables visualization in 2D/3D.

* Improves generalization by removing noise dimensions.

## **3\. Principal Component Analysis (PCA)**

PCA is an unsupervised technique that extracts the directions of maximum variance (principal components) in the data.

### **Core Idea**

* For a large set of correlated variables, PCA finds a small set of uncorrelated components that capture most variability.

* Principal components are orthogonal directions in feature space along which data varies most.

### **PCA Algorithm**

* 1\. Standardize the features (zero mean, unit variance).

* 2\. Compute the covariance matrix.

* 3\. Compute eigenvectors and eigenvalues of the covariance matrix.

* 4\. Sort eigenvectors by descending eigenvalue.

* 5\. Project data onto the top k eigenvectors to obtain the reduced representation.

| PCA Note PCA is unsupervised — it maximizes global variance without regard to class labels. This makes it ideal for exploratory analysis, compression, and noise reduction, but not for class separation. |
| :---- |

## **4\. Linear Discriminant Analysis (LDA)**

LDA is a supervised dimensionality reduction technique that finds directions maximizing class separability, not just variance.

### **LDA vs PCA**

| Aspect | PCA | LDA |
| :---- | :---- | :---- |
| Supervision | Unsupervised | Supervised (uses class labels) |
| Objective | Maximize total variance | Maximize between-class / minimize within-class variance |
| Max components | min(n-1, p) | min(C-1, p) where C \= number of classes |
| Best for | Compression, visualization | Classification preprocessing |
| Limitation | May mix classes | Assumes Gaussian distribution, equal covariance |

## **5\. t-SNE (t-Distributed Stochastic Neighbor Embedding)**

t-SNE is a nonlinear dimensionality reduction algorithm primarily designed for visualization of high-dimensional datasets.

### **Core Mechanism**

* Encode high-dimensional neighborhood information as a probability distribution using Gaussian kernels.

* Find a low-dimensional embedding such that the neighborhood distributions match.

* Minimize KL-divergence between high-dimensional and low-dimensional distributions.

### **Crowding Problem & t-Distribution Solution**

In 2D, there is insufficient space to represent all high-dimensional neighbors accurately. t-SNE replaces the Gaussian in the low-dimensional space with a heavy-tailed Student-t distribution, providing more 'wiggle room' and pushing dissimilar points apart.

### **PCA vs LDA vs t-SNE Comparison**

| Aspect | PCA | LDA | t-SNE |
| :---- | :---- | :---- | :---- |
| Type | Linear, unsupervised | Linear, supervised | Non-linear, unsupervised |
| Structure preserved | Global variance | Class separation | Local neighborhoods |
| Primary use | Compression/noise reduction | Classification preprocessing | Visualization only |
| New point embedding | Yes (transform) | Yes (transform) | No (must retrain) |
| Computational cost | Low | Low | High (O(n²) or O(n log n)) |

| Choosing the Right Technique Use PCA for compression, preprocessing, and noise reduction in any ML pipeline.Use LDA when class labels are available and you want to maximize discriminability before classification.Use t-SNE exclusively for 2D/3D visualization of complex high-dimensional datasets. |
| :---- |

# **Quick Reference: Summary Table**

| Topic | Type | Key Algorithm/Method | Key Hyperparameter(s) | Output |
| :---- | :---- | :---- | :---- | :---- |
| Decision Tree | Supervised, Classification/Regression | CART (Gini / Entropy splits) | max\_depth, min\_samples\_split | Tree structure with class/value at leaves |
| Bagging | Ensemble (variance reduction) | Bootstrap \+ aggregation | n\_estimators | Aggregated predictions |
| Random Forest | Ensemble | Bagging \+ random feature subsets | n\_estimators, max\_features | Averaged tree predictions |
| AdaBoost | Ensemble (boosting) | Reweighted sequential training | n\_estimators, learning\_rate | Weighted combination |
| Stacking | Ensemble | Meta-model on base learners | Meta-model type | Meta-model output |
| SVM (Linear) | Supervised, Classification | Maximal Margin / Soft-Margin | C (regularization) | Hyperplane decision boundary |
| SVM (Kernel) | Supervised, Classification | Kernel trick (RBF, Poly, Sigmoid) | C, γ, kernel | Nonlinear decision boundary |
| K-Means | Unsupervised, Clustering | Lloyd's algorithm | k (\# clusters) | Cluster assignments \+ centroids |
| Hierarchical | Unsupervised, Clustering | Agglomerative linkage | Linkage method, cut threshold | Dendrogram / cluster labels |
| DBSCAN | Unsupervised, Clustering | Density reachability | Eps, MinPts | Cluster labels \+ noise labels |
| PCA | Unsupervised, Dim. Reduction | Eigendecomposition of covariance | n\_components | Low-dim projection |
| LDA | Supervised, Dim. Reduction | Maximize between/within scatter ratio | n\_components | Discriminant axes projection |
| t-SNE | Unsupervised, Visualization | KL-divergence minimization | perplexity, learning\_rate | 2D/3D visualization embedding |

*— End of Study Notes —*

BINUS University · Machine Learning Course · Sessions 15–22