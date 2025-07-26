
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';
import { useState } from 'react';
import LayerManager from './components/LayerManager';
import type { LayerInfo } from './components/LayerManager';
import GeoJsonDrawLayer from './components/GeoJsonDrawLayer';
import { v4 as uuidv4 } from 'uuid';

type LayerData = {
  info: LayerInfo;
  data: GeoJSON.FeatureCollection;
};

function App() {
  const [layers, setLayers] = useState<LayerData[]>([
    {
      info: { id: uuidv4(), name: 'Calque 1', visible: true },
      data: { type: 'FeatureCollection', features: [] },
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[0].info.id);

  // Gestion des calques
  const addLayer = () => {
    const name = prompt('Nom du nouveau calque ?') || `Calque ${layers.length + 1}`;
    const newLayer: LayerData = {
      info: { id: uuidv4(), name, visible: true },
      data: { type: 'FeatureCollection', features: [] },
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.info.id);
  };
  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.info.id !== id));
    if (activeLayerId === id && layers.length > 1) {
      setActiveLayerId(layers.find(l => l.info.id !== id)?.info.id || null);
    }
  };
  const renameLayer = (id: string, name: string) => {
    setLayers(layers.map(l => l.info.id === id ? { ...l, info: { ...l.info, name } } : l));
  };
  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.info.id === id ? { ...l, info: { ...l.info, visible: !l.info.visible } } : l));
  };
  const selectLayer = (id: string) => setActiveLayerId(id);

  // Mise à jour des données GeoJSON d'un calque
  const updateLayerData = (id: string, data: GeoJSON.FeatureCollection) => {
    setLayers(layers.map(l => l.info.id === id ? { ...l, data } : l));
  };

  // Export d'un calque
  const exportLayer = (id: string) => {
    const layer = layers.find(l => l.info.id === id);
    if (!layer) return;
    const data = JSON.stringify(layer.data, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layer.info.name}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row' }}>
      <div style={{ margin: 16 }}>
        <LayerManager
          layers={layers.map(l => l.info)}
          activeLayerId={activeLayerId}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onRenameLayer={renameLayer}
          onToggleLayer={toggleLayer}
          onSelectLayer={selectLayer}
        />
        <div style={{ marginTop: 16 }}>
          {layers.map(l => (
            <button key={l.info.id} onClick={() => exportLayer(l.info.id)} style={{ width: '100%', marginBottom: 4 }}>
              Exporter {l.info.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ textAlign: 'center', margin: 0, padding: 10 }}>Mini QGIS Web (React + Leaflet)</h1>
        <MapContainer center={[48.8588443, 2.2943506]} zoom={13} style={{ height: '80vh', width: '100%', margin: '0 auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {layers.map(l => (
            <GeoJsonDrawLayer
              key={l.info.id}
              data={l.data}
              onChange={data => updateLayerData(l.info.id, data)}
              active={activeLayerId === l.info.id}
              visible={l.info.visible}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
