import '../feature-name-list.css'; // Styles dédiés FeatureNameList
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
    //
    // .feature-list-panel : panneau principal
    // .feature-list-block : bloc d'un calque
    // .feature-list-title : titre du calque
    // .feature-list : liste des entités
    // .feature-list-item : ligne d'entité
    // .feature-list-name : nom d'entité
    //
    <div className="feature-list-panel">
      <h3>Entités (nom)</h3>
      {layers.map(layer => (
        <div key={layer.info.id} className="feature-list-block">
          <div className="feature-list-title">{layer.info.name}</div>
          <ul className="feature-list">
            {layer.data.features.map((f, idx) => (
              <li key={idx} className="feature-list-item">
                <span
                  className="feature-list-name"
                  onClick={() => layer.onSelectFeature?.(idx)}
                >
                  {f.properties?.name || `Entité ${idx + 1}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FeatureNameList;
