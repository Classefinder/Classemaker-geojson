import React from 'react';
import { ImageOverlay, useMap } from 'react-leaflet';

interface ImageOverlayLayerProps {
  url: string;
  bounds: [[number, number], [number, number]];
  visible: boolean;
  rotation?: number; // en degrés
  scale?: number; // multiplicateur d'échelle
}

const ImageOverlayLayer: React.FC<ImageOverlayLayerProps> = ({ url, bounds, visible, rotation = 0, scale = 1 }) => {
  const map = useMap();
  React.useEffect(() => {
    if (visible) {
      map.fitBounds(bounds);
    }
  }, [visible, bounds, map]);
  if (!visible) return null;

  // Ajout d'un ref pour accéder à l'élément image
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // Appliquer la rotation et l'échelle via CSS
  React.useEffect(() => {
    if (imgRef.current) {
      imgRef.current.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      imgRef.current.style.transformOrigin = 'center center';
    }
  }, [rotation, scale, url]);

  // Rendu personnalisé de l'image overlay
  return (
    <ImageOverlay
      url={url}
      bounds={bounds}
      opacity={0.7}
      eventHandlers={{
        add: (e) => {
          // On récupère l'élément image natif de Leaflet
          const img = e.target.getElement();
          if (img && img.tagName === 'IMG') {
            imgRef.current = img;
            img.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            img.style.transformOrigin = 'center center';
          }
        },
      }}
    />
  );
};

export default ImageOverlayLayer;
