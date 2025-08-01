const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

// Endpoint pour convertir GeoJSON en tuiles PBF (zip)
app.post('/export-pbf', upload.single('geojson'), async (req, res) => {
  const geojsonPath = req.file.path;
  const mbtilesPath = geojsonPath + '.mbtiles';
  const tilesDir = geojsonPath + '_tiles';
  const zipPath = geojsonPath + '_tiles.zip';

  // 1. Tippecanoe: GeoJSON -> MBTiles
  exec(`tippecanoe -o ${mbtilesPath} -zg --drop-densest-as-needed --force ${geojsonPath}`,
    (err) => {
      if (err) return res.status(500).send('Erreur Tippecanoe');
      // 2. mb-util: MBTiles -> dossier tuiles PBF
      exec(`mb-util --image_format=pbf ${mbtilesPath} ${tilesDir}`,
        (err) => {
          if (err) return res.status(500).send('Erreur mb-util');
          // 3. Zip le dossier
          const output = fs.createWriteStream(zipPath);
          const archive = archiver('zip');
          output.on('close', () => {
            res.download(zipPath, 'tiles.zip', (err) => {
              // Nettoyage fichiers temporaires
              fs.rmSync(geojsonPath, { force: true });
              fs.rmSync(mbtilesPath, { force: true });
              fs.rmSync(zipPath, { force: true });
              fs.rmSync(tilesDir, { recursive: true, force: true });
            });
          });
          archive.on('error', err => res.status(500).send('Erreur zip'));
          archive.pipe(output);
          archive.directory(tilesDir, false);
          archive.finalize();
        });
    });
});

app.listen(3001, () => {
  console.log('Export PBF server listening on port 3001');
});
