from flask import Flask, jsonify, render_template, request
from flask_cors import CORS  # Import the CORS extension
import pandas as pd
from sklearn.cluster import KMeans
import numpy as np


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

if __name__ == '__main__':
    app.run(debug=True)