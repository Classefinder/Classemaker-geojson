import React, { useRef, useEffect, useState } from 'react';
import { FeatureGroup, useMap } from 'react-leaflet';
import L, { FeatureGroup as LeafletFeatureGroup, Layer as LeafletLayer } from 'leaflet';
import 'leaflet-draw';

interface GeoJsonDrawLayerProps {
  data: GeoJSON.FeatureCollection;
  onChange: (data: GeoJSON.FeatureCollection) => void;
  active: boolean;
  visible: boolean;
  onFeatureClick?: (idx: number) => void;
  allLayersData?: GeoJSON.FeatureCollection[]; // Ajouté pour le snapping interlayer
}

const GeoJsonDrawLayer: React.FC<GeoJsonDrawLayerProps> = ({ data, onChange, active, visible, onFeatureClick, allLayersData }) => {
  const fgRef = useRef<LeafletFeatureGroup>(null);
  const map = useMap();

  // Synchronise la visibilité
  useEffect(() => {
    if (fgRef.current) {
      if (visible) {
        map.addLayer(fgRef.current);
      } else {
        map.removeLayer(fgRef.current);
      }
    }
  }, [visible, map]);

  // Mode aimant (snapping)
  const [snapping, setSnapping] = useState(false);

  // Gestion du contrôle de dessin
  useEffect(() => {
    if (!active || !fgRef.current) return;
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: fgRef.current },
      draw: {
        polygon: {},
        polyline: {},
        rectangle: {},
        marker: {},
        circle: false,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    // Gestion des événements
    const onCreated = (e: any) => {
      let name = prompt('Nom de la nouvelle entité ?') || '';
      // Utilise la valeur courante de snapping
      if (snapping && e.layer instanceof L.Polyline && !(e.layer instanceof L.Polygon)) {
        // Utilise toutes les features visibles de tous les calques pour le snapping
        const allFeatures: GeoJSON.Feature[] = (allLayersData || []).flatMap(fc => fc.features);
        let features: GeoJSON.Feature[] = allFeatures;
        // Récupère tous les sommets existants du réseau
        let allPoints: {coord: [number, number], featureIdx: number, segIdx?: number}[] = [];
        let allSegments: {a: [number, number], b: [number, number], featureIdx: number, segIdx: number}[] = [];
        features.forEach((f, i) => {
          if (f.geometry.type === 'LineString') {
            const coords = f.geometry.coordinates as [number, number][];
            coords.forEach((c, j) => {
              allPoints.push({coord: c, featureIdx: i, segIdx: j});
            });
            for (let j = 0; j < coords.length - 1; j++) {
              allSegments.push({a: coords[j], b: coords[j+1], featureIdx: i, segIdx: j});
            }
          } else if (f.geometry.type === 'Point') {
            allPoints.push({coord: f.geometry.coordinates as [number, number], featureIdx: i});
          }
        });
        let newCoords = e.layer.getLatLngs().map((latlng: any) => [latlng.lng, latlng.lat]);
        if (newCoords.length < 2) {
          // Pas assez de points pour une ligne
        } else {
          // Pour chaque extrémité (début et fin)
          [0, newCoords.length - 1].forEach((extIdx) => {
            let minDist = Infinity;
            let closest = null;
            let closestFeatureIdx = -1;
            let closestSegIdx = -1;
            // Cherche le sommet le plus proche
            allPoints.forEach(pt => {
              const dx = pt.coord[0] - newCoords[extIdx][0];
              const dy = pt.coord[1] - newCoords[extIdx][1];
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < minDist) {
                minDist = dist;
                closest = pt.coord;
                closestFeatureIdx = pt.featureIdx;
                closestSegIdx = pt.segIdx ?? -1;
              }
            });
            // Cherche le segment le plus proche
            let minSegDist = Infinity;
            let segProj = null;
            let segFeatureIdx = -1;
            let segSegIdx = -1;
            allSegments.forEach(seg => {
              const [x, y] = newCoords[extIdx];
              const [x1, y1] = seg.a;
              const [x2, y2] = seg.b;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len2 = dx*dx + dy*dy;
              if (len2 === 0) return;
              const t = ((x-x1)*dx + (y-y1)*dy) / len2;
              const tClamped = Math.max(0, Math.min(1, t));
              const proj = [x1 + tClamped*dx, y1 + tClamped*dy];
              const dist = Math.sqrt((proj[0]-x)**2 + (proj[1]-y)**2);
              if (dist < minSegDist) {
                minSegDist = dist;
                segProj = proj;
                segFeatureIdx = seg.featureIdx;
                segSegIdx = seg.segIdx;
              }
            });
            // On choisit le plus proche entre sommet et segment
            let snapType = null;
            let snapCoord = null;
            let snapFeatureIdx = -1;
            let snapSegIdx = -1;
            if (minDist < minSegDist && minDist < 0.0005) {
              snapType = 'vertex';
              snapCoord = closest;
              snapFeatureIdx = closestFeatureIdx;
              snapSegIdx = closestSegIdx;
            } else if (minSegDist < 0.0005) {
              snapType = 'segment';
              snapCoord = segProj;
              snapFeatureIdx = segFeatureIdx;
              snapSegIdx = segSegIdx;
            }
            if (snapType && snapCoord) {
              newCoords[extIdx] = snapCoord;
              if (snapType === 'segment' && snapFeatureIdx !== -1 && snapSegIdx !== -1) {
                // Insère le point sur la ligne existante
                const f = features[snapFeatureIdx];
                if (f.geometry.type === 'LineString') {
                  const coords = f.geometry.coordinates as [number, number][];
                  coords.splice(snapSegIdx+1, 0, snapCoord);
                  f.geometry.coordinates = coords;
                }
              }
            }
          });
          e.layer.setLatLngs(newCoords.map((c: any) => L.latLng(c[1], c[0])));
        }
      }
      // Ajoute la couche dessinée
      fgRef.current?.addLayer(e.layer);
      // Récupère le GeoJSON
      let geojson = fgRef.current?.toGeoJSON() as GeoJSON.FeatureCollection;
      // Ajoute l'attribut name à la dernière feature
      if (geojson && geojson.features.length > 0) {
        geojson.features[geojson.features.length - 1].properties = {
          ...geojson.features[geojson.features.length - 1].properties,
          name,
        };
      }
      onChange(geojson);
    };
    const onEdited = () => {
      const geojson = fgRef.current?.toGeoJSON() as GeoJSON.FeatureCollection;
      onChange(geojson);
    };
    const onDeleted = () => {
      const geojson = fgRef.current?.toGeoJSON() as GeoJSON.FeatureCollection;
      onChange(geojson);
    };
    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    // Nettoyage
    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
    };
  }, [active, map, onChange, snapping]);


  // Synchronise les données GeoJSON et ajoute gestion du clic
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.clearLayers();
    let idx = 0;
    L.geoJSON(data).eachLayer((layer: LeafletLayer) => {
      fgRef.current?.addLayer(layer);
      if (onFeatureClick) {
        layer.on('click', () => onFeatureClick(idx));
      }
      idx++;
    });
  }, [data, onFeatureClick]);

  return <>
    <button
      style={{position:'absolute',top:10,right:10,zIndex:2000,padding:6,background:snapping?'#4caf50':'#ccc',color:snapping?'#fff':'#222',border:'none',borderRadius:4,cursor:'pointer'}}
      onClick={()=>setSnapping(s=>!s)}
      title={snapping ? 'Désactiver le mode aimant' : 'Activer le mode aimant'}
    >
      {snapping ? 'Aimant : ON' : 'Aimant : OFF'}
    </button>
    <FeatureGroup ref={fgRef as any} />
  </>;
};

export default GeoJsonDrawLayer;
