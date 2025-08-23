# Création des fichiers de données

Deux solutions sont possibles pour créer les fichiers nécessaires à **Classefinder** :

1. **Un petit logiciel web dédié** : minimaliste, conçu uniquement pour Classefinder.
2. **QGIS** : un logiciel SIG complet, plus puissant mais plus complexe à prendre en main.

## 1. Les fichiers attendus par Classefinder

---

Classefinder utilise plusieurs fichiers pour fonctionner correctement :

- **Salles (.geojson)**
    
    Contient les polygones représentant les salles de chaque étage.
    
    Chaque salle doit avoir un **nom unique** (exemple : *115*).
    
- **Chemins (.geojson)**
    
    Contient uniquement des **segments invisibles** servant à positionner les points de départ/arrivée des itinéraires.
    
    ⚠️ Contrairement au fichier **.osm**, ce calque n’est **pas un vrai réseau de chemins** : les segments ne sont pas forcément reliés entre eux, ils servent seulement de points d’ancrage.
    
    Chaque segment doit avoir **exactement le même nom que la salle correspondante** (exemple : un segment nommé *115* pour la salle *115*).
    
    → C’est grâce à cette correspondance que Classefinder peut calculer un itinéraire vers la bonne salle.
    
- **Carte de fond (optionnel)**
    - Un fichier **.mbtiles** + son fichier **style.json** pour l’affichage du fond de carte.
- **Chemins réels (.osm)**
    
    Utilisés par le moteur de routage (**OSRM**) pour le calcul des trajets dans le bâtiment.
    
    Ce fichier contient l’ensemble du réseau de circulation (escaliers, couloirs, etc.).
    

---

## 2. Règles importantes pour le calque “Chemins”

- Le **point de départ** des itinéraires se place **sur un segment du calque “Chemins”**.
- Chaque salle doit avoir **un segment associé**, avec le **même nom**.
- Les segments de liaison (par ex. couloirs) peuvent être laissés **sans nom**, ce n’est pas bloquant.
- Le bouton **“aimant”** permet de connecter facilement plusieurs segments entre eux si besoin.

---

## 3. Connexion entre étages

Pour permettre la navigation multi-étages :

- Il faut créer des **segments de liaison** entre les étages (par exemple via des escaliers).
- Ces segments doivent être configurés d’une certaine manière pour que le rendu soit correct.
- Même si le visuel n’est pas parfait, la navigation reste fonctionnelle.

*(Des illustrations seront ajoutées ici pour clarifier la méthode.)*
