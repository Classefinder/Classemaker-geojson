import './app-style-refactor.css'; // Styles extraits pour App
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
import ExportModal from './components/ExportModal';
import type { ExportOptions } from './components/ExportModal';
import JSZip from 'jszip';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';
import './export-modal.css';

export type LayerData = {
  info: LayerInfo;
  data: GeoJSON.FeatureCollection;
};

function App() {
  const initialLayerId = uuidv4();
  const [layers, setLayers] = useState<LayerData[]>([
    {
      info: { id: initialLayerId, name: 'Salle 1', visible: true, category: 'salles', features: [] },
      data: { type: 'FeatureCollection', features: [] },
    },
  ]);
  // Correction bug build : ajout de updateFeatureName
  const updateFeatureName = (layerId: string, featureIdx: number, newName: string) => {
    setLayers(prevLayers =>
      prevLayers.map(l =>
        l.info.id === layerId
          ? {
              ...l,
              data: {
                ...l.data,
                features: l.data.features.map((f, i) =>
                  i === featureIdx
                    ? { ...f, properties: { ...f.properties, name: newName } }
                    : f
                ),
              },
            }
          : l
      )
    );
  };
  const [activeLayerId, setActiveLayerId] = useState<string | null>(initialLayerId);
  const [selectedFeature, setSelectedFeature] = useState<{ layerId: string; featureIdx: number } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [customExport, setCustomExport] = useState(false);
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




  // Export MBTiles via serveur Node.js (pour les calques de fond)
  // Export personnalisé ou complet
  const handleExport = async (options: ExportOptions | null, schoolName: string) => {
    const zip = new JSZip();

    // Si options est null, c'est un export complet
    if (!options) {
      options = {
        geojson: layers.filter(l => ['salles', 'chemin'].includes(l.info.category)).map(() => true),
        osrm: true,
        mbtiles: layers.filter(l => l.info.category === 'fond').map(() => true)
      };
    }

    // Export GeoJSON
    const geojsonLayers = layers.filter(l => ['salles', 'chemin'].includes(l.info.category));
    options.geojson.forEach((shouldExport, idx) => {
      if (shouldExport) {
        const layer = geojsonLayers[idx];
        zip.file(
          `geojson/${schoolName}/${layer.info.name}.geojson`,
          JSON.stringify(layer.data, null, 2)
        );
      }
    });

    // Export OSRM
    if (options.osrm) {
      const cheminLayers = layers.filter(l => l.info.category === 'chemin');
      if (cheminLayers.length > 0) {
        const osm = generateOsmFile(cheminLayers);
        zip.file(`osrm/${schoolName}/itineraire.osm`, osm);
      }
    }

    // Export MBTiles
    const mbtilesLayers = layers.filter(l => l.info.category === 'fond');
    for (let i = 0; i < mbtilesLayers.length; i++) {
      if (options.mbtiles[i]) {
        const layer = mbtilesLayers[i];
        try {
          const formData = new FormData();
          formData.append('geojson', new Blob([JSON.stringify(layer.data)], { type: 'application/json' }));
          const res = await fetch('http://localhost:3001/export-pbf', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('Erreur serveur');
          const blob = await res.blob();
          zip.file(`mbtiles/${schoolName}/${layer.info.name}.mbtiles`, blob);
        } catch (e) {
          alert(`Erreur export MBTiles ${layer.info.name}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    // Génère et télécharge le zip
    const content = await zip.generateAsync({type: 'blob'});
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schoolName}-export.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Fonction utilitaire pour générer le fichier OSM
  const generateOsmFile = (cheminLayers: LayerData[]): string => {
    let nodeId = -1;
    let wayId = -1;
    const nodes: { id: number; lat: number; lon: number; tags?: Record<string, string|number> }[] = [];
    const ways: { id: number; nodeRefs: number[]; tags: Record<string, string|number> }[] = [];
    const nodeMap = new Map<string, number>();

    cheminLayers.forEach((layer, layerIdx) => {
      (layer.data.features || []).forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          const coords = feature.geometry.coordinates as [number, number][];
          const nodeRefs: number[] = [];
          coords.forEach(([lon, lat]) => {
            const key = `${lat},${lon}`;
            let id;
            if (nodeMap.has(key)) {
              id = nodeMap.get(key)!;
            } else {
              id = nodeId--;
              nodeMap.set(key, id);
              nodes.push({ id, lat, lon });
            }
            nodeRefs.push(id);
          });
          ways.push({
            id: wayId--,
            nodeRefs,
            tags: {
              bridge: 'yes',
              layer: layerIdx,
              foot: 'yes',
              name: feature.properties?.name || `Chemin ${wayId * -1}`,
            }
          });
        }
      });
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="ClassefinderGeoJSONMaker">\n`;
    nodes.forEach(node => {
      xml += `<node id="${node.id}" lat="${node.lat}" lon="${node.lon}" />\n`;
    });
    ways.forEach(way => {
      xml += `<way id="${way.id}">\n`;
      way.nodeRefs.forEach(ref => {
        xml += `  <nd ref="${ref}" />\n`;
      });
      Object.entries(way.tags).forEach(([k, v]) => {
        xml += `  <tag k="${k}" v="${v}" />\n`;
      });
      xml += `</way>\n`;
    });
    xml += `</osm>`;
    return xml;
  };

  return (
    <div className="app-root">
      {/* Panneau latéral */}
      <div className="app-sidebar">
        <div className="app-sidebar-content">
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
          <div className="app-section">
            <label className="app-section-label">Images de fond :</label>
            <input type="file" accept="image/png,image/jpeg" onChange={handleImageFondUpload} />
            {imagesFond.length > 0 && (
              <div className="app-image-list">
                {imagesFond.map(img => (
                  <div key={img.id} className="app-image-item">
                    <span className="app-image-name">{img.url.split('/').pop()}</span>
                    <button onClick={() => toggleImageFond(img.id)} className="app-image-btn">
                      {img.visible ? 'Cacher' : 'Afficher'}
                    </button>
                    <button onClick={() => removeImageFond(img.id)} className="app-image-btn app-image-btn-delete">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Attributs des calques visibles */}
          <div className="app-section">
            <div className="app-section-label">Attributs des calques visibles :</div>
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
          <div className="app-section">
            <div className="app-section-label">Export :</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={() => {
                  const name = prompt("Nom de l'établissement :");
                  if (name?.trim()) handleExport(null, name);
                }} 
                className="app-export-btn app-export-btn-all"
              >
                Tout exporter
              </button>
              <button 
                onClick={() => {
                  setCustomExport(true);
                  setShowExportModal(true);
                }} 
                className="app-export-btn"
              >
                Export personnalisé
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal d'export personnalisé */}
      {showExportModal && customExport && (
        <ExportModal
          layers={layers}
          onClose={() => {
            setShowExportModal(false);
            setCustomExport(false);
          }}
          onExport={handleExport}
        />
      )}
      {/* Carte plein écran */}
      <div className="app-main">
        <MapContainer center={[48.8588443, 2.2943506]} zoom={13} className="app-map-container">
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
            <div className="app-attribute-panel">
              <AttributeEditor properties={feature.properties || {}} onChange={handleAttributeChange} />
              <button onClick={closeAttributeEditor} className="app-attribute-btn">Fermer</button>
              <button onClick={handleDeleteFeature} className="app-attribute-btn app-attribute-btn-delete">Supprimer cette entité</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default App;