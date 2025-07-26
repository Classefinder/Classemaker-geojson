import React, { useRef, useEffect } from 'react';
import { FeatureGroup, useMap } from 'react-leaflet';
import L, { FeatureGroup as LeafletFeatureGroup, Layer as LeafletLayer } from 'leaflet';
import 'leaflet-draw';

interface GeoJsonDrawLayerProps {
  data: GeoJSON.FeatureCollection;
  onChange: (data: GeoJSON.FeatureCollection) => void;
  active: boolean;
  visible: boolean;
}

const GeoJsonDrawLayer: React.FC<GeoJsonDrawLayerProps> = ({ data, onChange, active, visible }) => {
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
      fgRef.current?.addLayer(e.layer);
      const geojson = fgRef.current?.toGeoJSON() as GeoJSON.FeatureCollection;
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

  // Synchronise les données GeoJSON
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.clearLayers();
    L.geoJSON(data).eachLayer((layer: LeafletLayer) => {
      fgRef.current?.addLayer(layer);
    });
  }, [data]);

  return <FeatureGroup ref={fgRef as any} />;
};

export default GeoJsonDrawLayer;
