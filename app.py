from flask import Flask, jsonify, render_template, request
from flask_cors import CORS  # Import the CORS extension
import pandas as pd
from sklearn.cluster import KMeans
import numpy as np
from sklearn.preprocessing import PowerTransformer, StandardScaler
from sklearn.manifold import MDS
from sklearn.metrics import pairwise_distances


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the cancer dataset
cancer_data = pd.read_csv('./static/dataset/dataset.csv')
cancer_data = cancer_data.sample(frac=0.002, random_state=42)
pcp_df = cancer_data.copy()
exclude1 = ['Entity', 'Code', '15-49 years', '5-14 years', '50-69 years', '70+ years', 'Under 5']
pcp_df.drop(exclude1, inplace=True, axis=1)
numerical_columns = cancer_data.select_dtypes(include=[np.number])
exclude = ["Year", "m49_code"]
numerical_columns.drop(exclude, inplace=True, axis=1)
col_names = list(pcp_df.columns)
pcpCols = col_names.copy()

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/pcp', methods=['GET'])
def pcp():
    num_clusters1 = 4
    
    print(num_clusters1)

    kmeans = KMeans(n_clusters=num_clusters1, random_state=42)
    kmeans.fit(numerical_columns)
    cluster_labels = kmeans.labels_
    
    print(cluster_labels)
    
    data_dict = pcp_df.to_dict(orient='records')
    data = {
        'columns' :  data_dict,
        'col_names': pcpCols,
        'cluster_labels': cluster_labels.tolist()
    }
    return jsonify(data)

@app.route('/mds', methods=['GET', 'POST'])
def mds():
    num_clusters2 = 4
    

    scaler = StandardScaler()
    X_s = scaler.fit_transform(numerical_columns)
    power_transformer = PowerTransformer(method='yeo-johnson')
    X_s = power_transformer.fit_transform(X_s)

    mds_data = MDS(n_components=2, dissimilarity='euclidean', random_state=69)
    mds_data_transformed = mds_data.fit_transform(X_s)

    
    correlation_distances = np.corrcoef(X_s.T)
    correlation_distances = 1 - correlation_distances
    variables_mds = MDS(n_components=2, dissimilarity='precomputed',random_state=69)
    variables_mds_transformed = variables_mds.fit_transform(correlation_distances)

    
    kmeans = KMeans(n_clusters=num_clusters2, random_state=42)
    kmeans.fit(mds_data_transformed)
    cluster_labels = kmeans.labels_
    
    data = {
        'X_pca': mds_data_transformed.tolist(),
        'X_pca1':variables_mds_transformed.tolist(),
        'cluster_labels': cluster_labels.tolist(),
        'feature_names': numerical_columns.columns.tolist(),
        'num_clusters': num_clusters2
    }

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)