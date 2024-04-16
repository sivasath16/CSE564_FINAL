import pandas as pd

file_path = '/content/merged_dataset.csv'
data = pd.read_csv(file_path)

columns_to_keep = ['Entity', 'Code', 'Year'] + [col for col in data.columns if 'cancer' in col.lower()]
data = data[columns_to_keep]

def clean_column_name(name):
    if 'cancer' in name.lower():
        parts = [part.strip() for part in name.split('-')]
        cleaned_name = ' - '.join(parts[1:-2])
        return cleaned_name
    return name

data.columns = [clean_column_name(col) for col in data.columns]

output_file_path = 'cleaned_dataset.csv'
data.to_csv(output_file_path, index=False)