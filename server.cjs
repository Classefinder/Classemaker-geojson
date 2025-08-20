const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

// Endpoint pour convertir GeoJSON en MBTiles uniquement
app.post('/api/export-pbf', upload.single('geojson'), async (req, res) => {
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
  console.log('Export PBF server listening on port 3001');
});
