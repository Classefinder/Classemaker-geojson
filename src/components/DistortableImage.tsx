
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-toolbar/dist/leaflet.toolbar.css';
import 'leaflet-toolbar';
import 'leaflet-distortableimage/dist/leaflet.distortableimage.css';
import 'leaflet-distortableimage';

interface DistortableImageProps {
  url: string;
  visible: boolean;
}

const DistortableImage: React.FC<DistortableImageProps> = ({ url, visible }) => {
  const map = useMap();
  useEffect(() => {
    if (!visible) return;
    // Ajoute l'image sur la carte avec DistortableImage
    // Par défaut, place l'image sur une zone visible de Paris
    const overlay = (window as any).L.distortableImageOverlay(
      url,
      [[48.85, 2.28], [48.87, 2.31]],
      { selected: true }
    ).addTo(map);
    return () => {
      map.removeLayer(overlay);
    };
  }, [url, visible, map]);
  return null;
};

export default DistortableImage;
