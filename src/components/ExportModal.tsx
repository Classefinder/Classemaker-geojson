import React, { useState } from 'react';
import type { LayerData } from '../App';

interface ExportModalProps {
  layers: LayerData[];
  onClose: () => void;
  onExport: (options: ExportOptions, schoolName: string) => void;
}

export interface ExportOptions {
  geojson: boolean[];  // indices des calques geojson à exporter
  osrm: boolean;       // export du fichier OSRM
  mbtiles: boolean[];  // indices des calques fond à exporter en mbtiles
}

const ExportModal: React.FC<ExportModalProps> = ({ layers, onClose, onExport }) => {
  const [schoolName, setSchoolName] = useState('');
  const [options, setOptions] = useState<ExportOptions>({
    geojson: layers.filter(l => ['salles', 'chemin'].includes(l.info.category)).map(() => false),
    osrm: false,
    mbtiles: layers.filter(l => l.info.category === 'fond').map(() => false)
  });

  const handleExport = () => {
    if (!schoolName.trim()) {
      alert('Veuillez entrer le nom de l\'établissement');
      return;
    }
    onExport(options, schoolName);
    onClose();
  };

  const geoJsonLayers = layers.filter(l => ['salles', 'chemin'].includes(l.info.category));
  const mbtilesLayers = layers.filter(l => l.info.category === 'fond');

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3>Export personnalisé</h3>
        
        <div className="modal-section">
          <label>Nom de l'établissement :</label>
          <input 
            type="text" 
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Nom de l'établissement"
            className="modal-input"
          />
        </div>

        <div className="modal-section">
          <h4>Fichiers GeoJSON</h4>
          {geoJsonLayers.map((layer, idx) => (
            <label key={layer.info.id} className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={options.geojson[idx]}
                onChange={(e) => {
                  const newGeojson = [...options.geojson];
                  newGeojson[idx] = e.target.checked;
                  setOptions({ ...options, geojson: newGeojson });
                }}
              />
              {layer.info.name}
            </label>
          ))}
        </div>

        <div className="modal-section">
          <h4>Fichiers MBTiles</h4>
          {mbtilesLayers.map((layer, idx) => (
            <label key={layer.info.id} className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={options.mbtiles[idx]}
                onChange={(e) => {
                  const newMbtiles = [...options.mbtiles];
                  newMbtiles[idx] = e.target.checked;
                  setOptions({ ...options, mbtiles: newMbtiles });
                }}
              />
              {layer.info.name}
            </label>
          ))}
        </div>

        <div className="modal-section">
          <label className="modal-checkbox-label">
            <input
              type="checkbox"
              checked={options.osrm}
              onChange={(e) => setOptions({ ...options, osrm: e.target.checked })}
            />
            Fichier d'itinéraire (.osm)
          </label>
        </div>

        <div className="modal-buttons">
          <button onClick={handleExport} className="btn btn-primary">
            Exporter
          </button>
          <button onClick={onClose} className="btn">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
