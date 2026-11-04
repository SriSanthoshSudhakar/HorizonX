import glob
import os
import pandas as pd

def process_gas_sensor_data(input_dir, output_csv):
    print(f"Reading .dat files from {input_dir}...")
    file_pattern = os.path.join(input_dir, "batch*.dat")
    dat_files = glob.glob(file_pattern)
    
    all_data = []
    
    for file in dat_files:
        print(f"Processing {os.path.basename(file)}...")
        with open(file, 'r') as f:
            for line in f:
                parts = line.strip().split(' ')
                if not parts or parts[0] == "":
                    continue
                
                # Parse label and concentration
                label_concentration = parts[0].split(';')
                label = int(label_concentration[0])
                concentration = float(label_concentration[1])
                
                # Parse features
                feature_dict = {}
                for p in parts[1:]:
                    if ':' in p:
                        idx, val = p.split(':')
                        feature_dict[int(idx)] = float(val)
                
                row = [label, concentration] + [feature_dict.get(i, 0.0) for i in range(1, 129)]
                all_data.append(row)
                
    columns = ["gas_type", "concentration"] + [f"feature_{i}" for i in range(1, 129)]
    
    print("Converting to DataFrame...")
    df = pd.DataFrame(all_data, columns=columns)
    
    print(f"Saving to {output_csv}...")
    df.to_csv(output_csv, index=False)
    
    print("Done! Total rows processed:", len(df))
    
    print("\n--- Transformations & Actions Summary ---")
    high_conc = df[df['concentration'] > 50]
    print(f"Rows with concentration > 50: {len(high_conc)}")
    
    summary = df.groupby('gas_type').agg(
        avg_concentration=('concentration', 'mean'),
        sample_count=('concentration', 'count')
    ).reset_index()
    print("\nSummary by Gas Type:")
    print(summary.to_string(index=False))

if __name__ == "__main__":
    input_directory = r"C:\Horizon\gas sensor"
    output_file = r"C:\Horizon\analytics\processed_gas_sensor_data.csv"
    process_gas_sensor_data(input_directory, output_file)

