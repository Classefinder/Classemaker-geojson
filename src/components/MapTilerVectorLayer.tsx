import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';

function MapTilerVectorLayer({ apiKey, style = 'basic' }: { apiKey: string; style?: string }) {
    const map = useMap();
    useEffect(() => {
        const mtLayer = new MaptilerLayer({ apiKey, style });
        mtLayer.addTo(map);
        return () => {
            map.removeLayer(mtLayer);
        };
    }, [map, apiKey, style]);
    return null;
}

export default MapTilerVectorLayer;
