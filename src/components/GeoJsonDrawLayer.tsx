import React, { useRef, useEffect } from 'react';
import { FeatureGroup, useMap } from 'react-leaflet';
import L, { FeatureGroup as LeafletFeatureGroup, Layer as LeafletLayer } from 'leaflet';
import 'leaflet-draw';

interface GeoJsonDrawLayerProps {
  data: GeoJSON.FeatureCollection;
  onChange: (data: GeoJSON.FeatureCollection) => void;
  active: boolean;
  visible: boolean;
  onFeatureClick?: (idx: number) => void;
}

const GeoJsonDrawLayer: React.FC<GeoJsonDrawLayerProps> = ({ data, onChange, active, visible, onFeatureClick }) => {
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

  // Gestion du contrôle de dessin
  useEffect(() => {
    if (!active || !fgRef.current) return;
    // Ajoute le contrôle de dessin uniquement pour le calque actif
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
      // Demande le nom à l'utilisateur
      let name = prompt('Nom de la nouvelle entité ?') || '';
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
  }, [active, map, onChange]);


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

  return <FeatureGroup ref={fgRef as any} />;
};

export default GeoJsonDrawLayer;
