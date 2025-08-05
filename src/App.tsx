import './app-style-refactor.css';
import { useState, useEffect } from 'react';
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

export type LayerData = {
  info: LayerInfo;
  data: GeoJSON.FeatureCollection;
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function App() {
  const initialLayerId = uuidv4();
  const [layers, setLayers] = useState<LayerData[]>([
    {
      info: { id: initialLayerId, name: 'Salle 1', visible: true, category: 'salles', features: [] },
      data: { type: 'FeatureCollection', features: [] },
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(initialLayerId);
  const [selectedFeature, setSelectedFeature] = useState<{ layerId: string; featureIdx: number } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [customExport, setCustomExport] = useState(false);
  const [imagesFond, setImagesFond] = useState<DistortableImageData[]>([]);
  // Handlers images de fond
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
    setLayers((prevLayers: LayerData[]) => prevLayers.map((l) => {
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
    setLayers(layers.filter((l: LayerData) => l.info.id !== id));
    if (activeLayerId === id && layers.length > 1) {
      setActiveLayerId(layers.find(l => l.info.id !== id)?.info.id || null);
    }
  };
  const renameLayer = (id: string, name: string) => {
    setLayers(layers.map((l: LayerData) => l.info.id === id ? { ...l, info: { ...l.info, name } } : l));
  };
  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(layers.map((l: LayerData) => l.info.id === id ? { ...l, info: { ...l.info, opacity } } : l));
  };
  const toggleLayer = (id: string) => {
    setLayers(layers.map((l: LayerData) => l.info.id === id ? { ...l, info: { ...l.info, visible: !l.info.visible } } : l));
  };
  const selectLayer = (id: string) => setActiveLayerId(id);
  const updateLayerData = (id: string, data: GeoJSON.FeatureCollection) => {
    setLayers(layers.map((l: LayerData) => l.info.id === id ? { ...l, data } : l));
  };

  // Import ZIP global
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      let root = '';
      zip.forEach((relPath: string) => {
        const match = relPath.match(/^geojson\/([^/]+)\//);
        if (match) root = match[1];
      });
      if (!root) {
        alert('Structure ZIP invalide.');
        return;
      }
      const geojsonFiles = zip.file(new RegExp(`^geojson/${root}/.+\\.geojson$`));
      for (const f of geojsonFiles) {
        const text = await f.async('text');
        const data = JSON.parse(text);
        if (data.type !== 'FeatureCollection') continue;
        let cat: LayerCategory = 'salles';
        if (/chemin/i.test(f.name)) cat = 'chemin';
        if (/fond/i.test(f.name)) cat = 'fond';
        const name = f.name.split('/').pop()?.replace(/\.geojson$/, '') || 'import';
        const newId = uuidv4();
        setLayers((prev: LayerData[]) => [...prev, { info: { id: newId, name, visible: true, category: cat, features: [] }, data }]);
      }
      const osmFiles = zip.file(new RegExp(`^osrm/${root}/.+\\.osm$`));
      if (osmFiles.length > 0) {
        alert('Import OSM non supporté pour le moment.');
      }
      const mbtilesFiles = zip.file(new RegExp(`^mbtiles/${root}/.+\\.mbtiles$`));
      if (mbtilesFiles.length > 0) {
        alert('Import MBTiles non supporté côté client.');
      }
      e.target.value = '';
    } catch (err) {
      alert('Erreur lors de l\'import ZIP : ' + (err instanceof Error ? err.message : err));
    }
  };

  // Export ZIP (ajoute .geojson pour chaque fond de carte)
  const handleExport = async (options: ExportOptions | null, schoolName: string) => {
    const zip = new JSZip();
    if (!options) {
      options = {
        geojson: layers.filter(l => ['salles', 'chemin'].includes(l.info.category)).map(() => true),
        osrm: true,
        mbtiles: layers.filter(l => l.info.category === 'fond').map(() => true)
      };
    }
    const geojsonLayers = layers.filter(l => ['salles', 'chemin'].includes(l.info.category));
    options.geojson.forEach((shouldExport: boolean, idx: number) => {
      if (shouldExport) {
        const layer = geojsonLayers[idx];
        zip.file(
          `geojson/${schoolName}/${layer.info.name}.geojson`,
          JSON.stringify(layer.data, null, 2)
        );
      }
    });
    const fondLayers = layers.filter(l => l.info.category === 'fond');
    fondLayers.forEach(layer => {
      zip.file(
        `geojson/${schoolName}/${layer.info.name}.geojson`,
        JSON.stringify(layer.data, null, 2)
      );
    });
    if (options.osrm) {
      const cheminLayers = layers.filter(l => l.info.category === 'chemin');
      if (cheminLayers.length > 0) {
        const osm = generateOsmFile(cheminLayers);
        zip.file(`osrm/${schoolName}/itineraire.osm`, osm);
      }
    }
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

  // Gestion import calque (GeoJSON, MBTiles, OSM)
  useEffect(() => {
    function handler(evt: Event) {
      const e = evt as CustomEvent<{ file: File; category: LayerCategory }>;
      (async () => {
        const { file, category } = e.detail;
        if (!file) return;
        let data: any = null;
        let name = file.name.replace(/\.(geojson|json|mbtiles|osm)$/i, '');
        if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
          const text = await readFileAsText(file);
          try {
            data = JSON.parse(text);
          } catch {
            alert('Fichier GeoJSON invalide');
            return;
          }
        } else if (file.name.endsWith('.osm')) {
          alert('Import OSM non supporté pour le moment.');
          return;
        } else if (file.name.endsWith('.mbtiles')) {
          alert('Import MBTiles non supporté côté client. Veuillez fournir un GeoJSON.');
          return;
        } else {
          alert('Format non supporté.');
          return;
        }
        if (!data || data.type !== 'FeatureCollection') {
          alert('Le fichier doit être un FeatureCollection GeoJSON.');
          return;
        }
        const newId = uuidv4();
        const newLayer: LayerData = {
          info: { id: newId, name, visible: true, category, features: [] },
          data,
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newId);
      })();
    }
    window.addEventListener('import-layer', handler);
    return () => window.removeEventListener('import-layer', handler);
  }, []);

  // updateFeatureName
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

  // Génération OSM (reprendre la fonction existante generateOsmFile)
  function generateOsmFile(cheminLayers: LayerData[]): string {
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
  }

  // --- RENDER ---
  return (
// ...existing code...
    <div className="app-root">
      {/* Panneau latéral */}
      <div className="app-sidebar">
        <div className="app-sidebar-content">
          {/* Import ZIP global */}
          <div className="app-section">
            <label className="app-section-label">Importer un ZIP :</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={handleImportZip} />
              <span className="app-import-zip-btn" style={{ fontSize: 18, padding: '2px 6px', border: '1px solid #ccc', borderRadius: 4, background: '#f7f7f7' }}>📦 Import ZIP</span>
            </label>
          </div>
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