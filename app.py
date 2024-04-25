from flask import Flask, jsonify, render_template, request
from flask_cors import CORS  # Import the CORS extension
import pandas as pd
from sklearn.cluster import KMeans
import numpy as np


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the cancer dataset
cancer_data = pd.read_csv('./dataset/dataset.csv')
pcp_df = cancer_data.copy()
numerical_columns = cancer_data.select_dtypes(include=[np.number])
exclude = ["Year"]
numerical_columns.drop(exclude, inplace=True, axis=1)
col_names = list(pcp_df.columns)
pcpCols = col_names.copy()
# print(pcpCols)
# print(numerical_columns.columns)

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/cancer_data', methods=['GET'])
def get_cancer_data():
    # Convert the DataFrame to a JSON object
    cancer_data_json = cancer_data.to_json(orient='records')
    return jsonify(cancer_data_json)


@app.route('/pcp', methods=['GET'])
def pcp():
    num_clusters1 = 4

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