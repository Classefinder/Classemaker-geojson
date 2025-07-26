import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-toolbar/dist/leaflet.toolbar.css';
import 'leaflet-toolbar';
import 'leaflet-distortableimage/dist/leaflet.distortableimage.css';
import 'leaflet-distortableimage';

export type DistortableImageData = {
  id: string;
  url: string;
  visible: boolean;
  corners: [[number, number], [number, number], [number, number], [number, number]] | null;
};

interface DistortableImageListProps {
  images: DistortableImageData[];
  onUpdate: (id: string, data: Partial<DistortableImageData>) => void;
}

const DistortableImageList: React.FC<DistortableImageListProps> = ({ images, onUpdate }) => {
  const map = useMap();
  const overlaysRef = useRef<Record<string, any>>({});

  useEffect(() => {
    images.forEach(img => {
      let overlay = overlaysRef.current[img.id];
      if (!overlay) {
        // Ajout de l'image
        overlay = (window as any).L.distortableImageOverlay(
          img.url,
          img.corners || [[48.85, 2.28], [48.87, 2.28], [48.87, 2.31], [48.85, 2.31]],
          { selected: true }
        ).addTo(map);
        overlaysRef.current[img.id] = overlay;
        overlay.on('edit', () => {
          const newCorners = overlay.getCorners().map((latlng: any) => [latlng.lat, latlng.lng]);
          onUpdate(img.id, { corners: newCorners });
        });
      }
      // Masquer/afficher via CSS
      const imgEl = overlay.getElement && overlay.getElement();
      if (imgEl) {
        imgEl.style.opacity = img.visible ? '1' : '0';
        imgEl.style.pointerEvents = img.visible ? '' : 'none';
      }
      // Si l'image a changé de corners, on met à jour
      if (img.corners && overlay.getCorners) {
        const current = overlay.getCorners().map((latlng: any) => [latlng.lat, latlng.lng]);
        const changed = JSON.stringify(current) !== JSON.stringify(img.corners);
        if (changed) overlay.setCorners(img.corners);
      }
    });
    // Nettoyage des overlays supprimés
    Object.keys(overlaysRef.current).forEach(id => {
      if (!images.find(img => img.id === id)) {
        const overlay = overlaysRef.current[id];
        if (overlay && map.hasLayer(overlay)) map.removeLayer(overlay);
        delete overlaysRef.current[id];
      }
    });
  }, [images, map, onUpdate]);

  return null;
};

export default DistortableImageList;
