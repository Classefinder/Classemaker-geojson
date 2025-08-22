const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

// Base path configurable to avoid conflicts with other services (e.g. nginx using /api)
// Set API_BASE_PATH in the environment to change it (no trailing slash). Default: /export
const BASE_PATH = (process.env.API_BASE_PATH || '/export').replace(/\/+$|^\s+|\s+$/g, '');

// Endpoint pour convertir GeoJSON en MBTiles uniquement
// Final route: <BASE_PATH>/export-pbf
app.post(`${BASE_PATH}/export-pbf`, upload.single('geojson'), async (req, res) => {
  const geojsonPath = req.file.path;
  const mbtilesPath = geojsonPath + '.mbtiles';

  // Tippecanoe: GeoJSON -> MBTiles
  exec(`tippecanoe -o ${mbtilesPath} -zg --drop-densest-as-needed --force ${geojsonPath}`,
    (err) => {
      if (err) {
        fs.rmSync(geojsonPath, { force: true });
        return res.status(500).send('Erreur Tippecanoe');
      }

      // Envoie directement le fichier mbtiles
      res.download(mbtilesPath, 'tiles.mbtiles', (err) => {
        // Nettoyage fichiers temporaires
        fs.rmSync(geojsonPath, { force: true });
        fs.rmSync(mbtilesPath, { force: true });
      });
    });
});

app.listen(3001, () => {
  console.log(`Export PBF server listening on port 3001, base path: "${BASE_PATH}"`);
});
