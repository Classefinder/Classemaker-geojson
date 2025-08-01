import '../itinerary-export-modal.css'; // Styles dédiés ItineraryExportModal
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

  //
  // .export-modal-overlay : overlay sombre
  // .export-modal-panel : panneau modal
  // .export-modal-list : liste des calques
  // .export-modal-list-item : ligne calque
  // .export-modal-input : input numéro
  // .export-modal-btn : bouton action
  // .export-modal-btn-export : bouton export
  // .export-modal-btn-cancel : bouton annuler
  //
  return (
    <div className="export-modal-overlay">
      <div className="export-modal-panel">
        <h3>Export Itinéraire</h3>
        <ul className="export-modal-list">
          {layers.map(layer => (
            <li key={layer.id} className="export-modal-list-item">
              <span>{layer.name}</span>
              <input
                type="number"
                value={layerAttributes[layer.id] || ''}
                onChange={(e) => handleAttributeChange(layer.id, parseInt(e.target.value, 10))}
                className="export-modal-input"
              />
            </li>
          ))}
        </ul>
        <button onClick={handleExport} className="export-modal-btn export-modal-btn-export">Exporter</button>
        <button onClick={onClose} className="export-modal-btn export-modal-btn-cancel">Annuler</button>
      </div>
    </div>
  );
};

export default ItineraryExportModal;
