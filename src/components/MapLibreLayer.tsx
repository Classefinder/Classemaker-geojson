import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

// Composant MapLibreLayer pour intégrer MapLibre GL dans Leaflet
function MapLibreLayer({ styleUrl }: { styleUrl: string }) {
    const map = useMap();
    useEffect(() => {
        let layer: any = null;
        // @ts-ignore
        const MaplibreLayer = (window as any).MaplibreLayer;
        if (MaplibreLayer) {
            layer = new MaplibreLayer({ style: styleUrl });
            map.addLayer(layer);
            // @ts-ignore
            map._maplibreLayer = layer;
        }
        return () => {
            // @ts-ignore
            if (map._maplibreLayer) {
                // @ts-ignore
                map.removeLayer(map._maplibreLayer);
                // @ts-ignore
                map._maplibreLayer = null;
            }
        };
    }, [map, styleUrl]);
    return null;
}

export default MapLibreLayer;
