import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';
import GeoJsonDrawLayer from './components/GeoJsonDrawLayer';
import LayerManager from './components/LayerManager';
import type { LayerInfo, LayerCategory } from './components/LayerManager';
import AttributeEditor from './components/AttributeEditor';
import FeatureNameList from './components/FeatureNameList';
import DistortableImageList from './components/DistortableImageList';
import type { DistortableImageData } from './components/DistortableImageList';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

export type LayerData = {
  info: LayerInfo;
  data: GeoJSON.FeatureCollection;
};

function App() {
  const initialLayerId = uuidv4();
  const [layers, setLayers] = useState<LayerData[]>([
    {
      info: { id: initialLayerId, name: 'Salle 1', visible: true, category: 'salles' },
      data: { type: 'FeatureCollection', features: [] },
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(initialLayerId);
  const [selectedFeature, setSelectedFeature] = useState<{ layerId: string; featureIdx: number } | null>(null);
  // Gestion de plusieurs images de fond (DistortableImage)
  const [imagesFond, setImagesFond] = useState<DistortableImageData[]>([]);
  const handleImageFondUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagesFond(prev => [
      ...prev,
      {
        id: uuidv4(),
        url,
        visible: true,
        corners: null,
      },
    ]);
  };
  const toggleImageFond = (id: string) => {
    setImagesFond(prev => prev.map(img => img.id === id ? { ...img, visible: !img.visible } : img));
  };
  const updateImageFond = (id: string, data: Partial<DistortableImageData>) => {
    setImagesFond(prev => prev.map(img => img.id === id ? { ...img, ...data } : img));
  };
  const removeImageFond = (id: string) => {
    setImagesFond(prev => prev.filter(img => img.id !== id));
  };

  // Gestion de la sélection d'une entité pour édition d'attributs
  const handleFeatureClick = (layerId: string, idx: number) => {
    setSelectedFeature({ layerId, featureIdx: idx });
  };
  const handleAttributeChange = (props: Record<string, any>) => {
    if (!selectedFeature) return;
    setLayers((prevLayers: LayerData[]) => prevLayers.map((l: LayerData) => {
      if (l.info.id !== selectedFeature.layerId) return l;
      const features = l.data.features.map((f: GeoJSON.Feature, i: number) => i === selectedFeature.featureIdx ? { ...f, properties: props } : f);
      return { ...l, data: { ...l.data, features } };
    }));
  };
  const closeAttributeEditor = () => setSelectedFeature(null);

  // Gestion des calques
  const addLayer = (category: LayerCategory) => {
    let namePrompt = '';
    if (category === 'salles') namePrompt = 'Nom du nouveau salle ?';
    else if (category === 'chemin') namePrompt = 'Nom du nouveau chemin ?';
    else if (category === 'fond') namePrompt = 'Nom du nouveau fond de carte ?';
    const name = prompt(namePrompt) ||
      (category === 'salles' ? `Salle ${layers.filter(l => l.info.category === category).length + 1}` :
      category === 'chemin' ? `Chemin ${layers.filter(l => l.info.category === category).length + 1}` :
      `Fond ${layers.filter(l => l.info.category === category).length + 1}`);

    if (category === 'salles') {
      // Crée aussi un calque chemin et fond de carte avec le même nom
      const salleId = uuidv4();
      const cheminId = uuidv4();
      const fondId = uuidv4();
      const salleLayer: LayerData = {
        info: { id: salleId, name, visible: true, category: 'salles', features: [] },
        data: { type: 'FeatureCollection', features: [] },
      };
      const cheminLayer: LayerData = {
        info: { id: cheminId, name, visible: true, category: 'chemin', features: [] },
        data: { type: 'FeatureCollection', features: [] },
      };
      const fondLayer: LayerData = {
        info: { id: fondId, name, visible: true, category: 'fond', features: [] },
        data: { type: 'FeatureCollection', features: [] },
      };
      setLayers([...layers, salleLayer, cheminLayer, fondLayer]);
      setActiveLayerId(salleId);
    } else {
      const newId = uuidv4();
      const newLayer: LayerData = {
        info: { id: newId, name, visible: true, category, features: [] },
        data: { type: 'FeatureCollection', features: [] },
      };
      setLayers([...layers, newLayer]);
      setActiveLayerId(newId);
    }
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

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(layers.map(l => l.info.id === id ? { ...l, info: { ...l.info, opacity } } : l));
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

  // Mise à jour du nom d'une entité (feature) dans un calque
  const updateFeatureName = (layerId: string, featureIdx: number, newName: string) => {
    setLayers((prevLayers: LayerData[]) => prevLayers.map((l: LayerData) => {
      if (l.info.id !== layerId) return l;
      const features = l.data.features.map((f: GeoJSON.Feature, i: number) =>
        i === featureIdx ? { ...f, properties: { ...f.properties, name: newName } } : f
      );
      return { ...l, data: { ...l.data, features } };
    }));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Panneau latéral */}
      <div style={{ width: 320, minWidth: 320, maxWidth: 320, height: '100vh', overflowY: 'auto', background: '#f7f7fa', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: 20, flex: 1, minHeight: 0 }}>
          <LayerManager
            layers={layers}
            activeLayerId={activeLayerId}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
            onRenameLayer={renameLayer}
            onToggleLayer={toggleLayer}
            onSelectLayer={selectLayer}
            onSetLayerOpacity={setLayerOpacity}
          />
          {/* Images de fond */}
          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Images de fond :</label>
            <input type="file" accept="image/png,image/jpeg" onChange={handleImageFondUpload} />
            {imagesFond.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {imagesFond.map(img => (
                  <div key={img.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{img.url.split('/').pop()}</span>
                    <button onClick={() => toggleImageFond(img.id)} style={{ marginLeft: 6, fontSize: 13 }}>
                      {img.visible ? 'Cacher' : 'Afficher'}
                    </button>
                    <button onClick={() => removeImageFond(img.id)} style={{ marginLeft: 6, color: 'red', fontSize: 13 }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Attributs des calques visibles */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Attributs des calques visibles :</div>
            {layers.filter(l => l.info.visible).map(l => (
              <FeatureNameList
                key={l.info.id}
                layers={[{
                  info: l.info,
                  data: l.data,
                  onUpdateName: (featureIdx: number, newName: string) => updateFeatureName(l.info.id, featureIdx, newName),
                  onSelectFeature: (featureIdx: number) => setSelectedFeature({ layerId: l.info.id, featureIdx }),
                }]}
              />
            ))}
          </div>
          {/* Boutons d'export */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Export GeoJSON :</div>
            {layers.map(l => (
              <button key={l.info.id} onClick={() => exportLayer(l.info.id)} style={{ width: '100%', marginBottom: 4, fontSize: 13 }}>
                Exporter {l.info.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Carte plein écran */}
      <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <MapContainer center={[48.8588443, 2.2943506]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Images de fond manipulables (DistortableImageList) */}
          <DistortableImageList images={imagesFond} onUpdate={updateImageFond} />
          {layers.map(l => (
            <GeoJsonDrawLayer
              key={l.info.id}
              data={l.data}
              onChange={data => updateLayerData(l.info.id, data)}
              active={activeLayerId === l.info.id}
              visible={l.info.visible}
              onFeatureClick={idx => handleFeatureClick(l.info.id, idx)}
              allLayersData={layers.filter(ll => ll.info.visible).map(ll => ll.data)}
              highlight={selectedFeature && l.info.id === selectedFeature.layerId ? selectedFeature.featureIdx : undefined}
              category={l.info.category}
              opacity={l.info.opacity ?? 1}
            />
          ))}
        </MapContainer>
        {/* Panneau d'édition des attributs + suppression entité */}
        {selectedFeature && (() => {
          const layer = layers.find(l => l.info.id === selectedFeature.layerId);
          const feature = layer?.data.features[selectedFeature.featureIdx];
          if (!feature) return null;
          const handleDeleteFeature = () => {
            setLayers((prevLayers: LayerData[]) => prevLayers.map((l: LayerData) => {
              if (l.info.id !== selectedFeature.layerId) return l;
              const features = l.data.features.filter((_, i) => i !== selectedFeature.featureIdx);
              return { ...l, data: { ...l.data, features } };
            }));
            setSelectedFeature(null);
          };
          return (
            <div style={{ position: 'fixed', top: 40, right: 40, zIndex: 1000 }}>
              <AttributeEditor properties={feature.properties || {}} onChange={handleAttributeChange} />
              <button onClick={closeAttributeEditor} style={{ width: '100%', marginTop: 8 }}>Fermer</button>
              <button onClick={handleDeleteFeature} style={{ width: '100%', marginTop: 8, color: 'red' }}>Supprimer cette entité</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default App;