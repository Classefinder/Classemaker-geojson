import React from 'react';

interface FeatureNameListProps {
  layers: Array<{
    info: { id: string; name: string };
    data: GeoJSON.FeatureCollection;
    onUpdateName: (featureIdx: number, newName: string) => void;
    onSelectFeature: (featureIdx: number) => void;
  }>;
}

const FeatureNameList: React.FC<FeatureNameListProps> = ({ layers }) => {
  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 12, marginTop: 16 }}>
      <h3>Entités (nom)</h3>
      {layers.map(layer => (
        <div key={layer.info.id} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{layer.info.name}</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {layer.data.features.map((f, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <input
                  value={f.properties?.name || ''}
                  onChange={e => layer.onUpdateName(idx, e.target.value)}
                  style={{ flex: 1, marginRight: 8, cursor: 'pointer' }}
                  placeholder="Nom"
                  onClick={() => layer.onSelectFeature(idx)}
                  readOnly
                />
                <button onClick={() => layer.onSelectFeature(idx)} title="Éditer les attributs">✏️</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FeatureNameList;
