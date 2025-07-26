import React, { useState } from 'react';
import type { LayerInfo } from './LayerManager';

interface ItineraryExportModalProps {
  layers: LayerInfo[];
  onClose: () => void;
  onExport: (layerAttributes: Record<string, number>) => void;
}

const ItineraryExportModal: React.FC<ItineraryExportModalProps> = ({ layers, onClose, onExport }) => {
  const [layerAttributes, setLayerAttributes] = useState<Record<string, number>>(
    Object.fromEntries(layers.map(layer => [layer.id, 0]))
  );

  const handleAttributeChange = (layerId: string, value: number) => {
    setLayerAttributes({ ...layerAttributes, [layerId]: value });
  };

  const handleExport = () => {
    onExport(layerAttributes);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 400 }}>
        <h3>Export Itinéraire</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {layers.map(layer => (
            <li key={layer.id} style={{ marginBottom: 10 }}>
              <span>{layer.name}</span>
              <input
                type="number"
                value={layerAttributes[layer.id] || ''}
                onChange={(e) => handleAttributeChange(layer.id, parseInt(e.target.value, 10))}
                style={{ marginLeft: 10 }}
              />
            </li>
          ))}
        </ul>
        <button onClick={handleExport} style={{ marginRight: 10, backgroundColor: '#4caf50', color: '#fff', padding: '5px 10px', border: 'none', borderRadius: 4 }}>Exporter</button>
        <button onClick={onClose} style={{ backgroundColor: '#f44336', color: '#fff', padding: '5px 10px', border: 'none', borderRadius: 4 }}>Annuler</button>
      </div>
    </div>
  );
};

export default ItineraryExportModal;
