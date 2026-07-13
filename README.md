# Un Vol Mystérieux — Version 5

Cette version ajoute un bouton **START / PAUSE / REPRENDRE**.

- START lance le chrono et l'ambiance sonore.
- PAUSE arrête le chrono et la musique.
- REPRENDRE relance les deux.

# Un Vol Mystérieux — Version 4

Cette version comprend :

- saisie libre des codes dans un champ texte ;
- chronomètre persistant de 90 minutes ;
- bouton de pénalité circulaire avec la tête de mort ;
- système d'indices progressifs avec coût de 2 minutes ;
- plusieurs ambiances musicales ;
- changement automatique d'ambiance selon le code validé ;
- fondu entre les pistes ;
- piste de tension automatique à 10 minutes ;
- effets sonores pour les codes, les pénalités et les indices ;
- aucun journal de bord ;
- sauvegarde automatique dans le navigateur.

## Fichiers audio à ajouter

Placez les ambiances dans :

- `sons/ambiances/train.mp3`
- `sons/ambiances/mine.mp3`
- `sons/ambiances/foret.mp3`
- `sons/ambiances/bigben.mp3`
- `sons/ambiances/laboratoire.mp3`
- `sons/ambiances/tension.mp3`
- `sons/ambiances/victoire.mp3`

Placez les effets dans :

- `sons/effets/code-correct.mp3`
- `sons/effets/code-incorrect.mp3`
- `sons/effets/penalite.mp3`
- `sons/effets/indice.mp3`

## Modifier les associations entre codes et ambiances

Ouvrez :

`js/audio-config.js`

Puis modifiez le bloc :

```js
const soundtrackByCode = {
```

## Modifier les codes

Ouvrez :

`js/codes.js`

## Modifier les indices

Ouvrez :

`js/indices.js`

## Ajouter une image de fond

Ajoutez votre image sous le nom :

`images/fond.jpg`

Le site fonctionne aussi sans image de fond.

## Publier sur GitHub Pages

1. Décompressez le ZIP.
2. Envoyez tout son contenu dans votre dépôt GitHub.
3. Ouvrez `Settings` puis `Pages`.
4. Choisissez `Deploy from a branch`.
5. Sélectionnez `main` et `/ (root)`.
6. Cliquez sur `Save`.

Important : les navigateurs empêchent souvent le démarrage automatique du son. Les joueurs devront appuyer une première fois sur le bouton 🔊.


## Correction START / PAUSE

Le bouton démarre désormais le chronomètre immédiatement. Le chargement ou l'absence d'un fichier audio ne peut plus empêcher le chrono de fonctionner.


## Amélioration des indices

- Les indices déjà consultés restent cliquables et peuvent être relus gratuitement.
- Après avoir révélé un indice, le bouton permet immédiatement de consulter le suivant sans fermer la fenêtre.
- Chaque nouvel indice coûte toujours 2 minutes.


## Correction du chronomètre — version 7

Le chronomètre utilise désormais une heure de fin réelle (`deadline`) :

- START démarre immédiatement le chrono ;
- PAUSE fige exactement le temps restant ;
- REPRENDRE repart depuis ce temps ;
- l'audio ne peut jamais empêcher le chrono de démarrer ;
- une actualisation de la page ne décale plus le temps ;
- les pénalités et les indices modifient correctement le temps, même pendant la marche.


## Correction de la lecture des cartes — version 8

La fenêtre d'indices possède maintenant son propre champ « numéro ou lettre de la carte ».

- Il n'est plus nécessaire que la carte soit un code ouvrant un fichier.
- Les cartes 15, 50, V, F, etc. sont reconnues directement.
- Le numéro déjà tapé dans le champ principal est repris automatiquement lorsqu'il correspond à une carte avec indices.
- La dernière carte d'indice sélectionnée est mémorisée.
- La touche Entrée charge également la carte.


## Introduction et boucles audio — version 9

- Ajoutez l'introduction sous le nom `sons/ambiances/intro-enquete.mp3`.
- Au premier clic sur **START**, cette introduction se lance immédiatement.
- Chaque piste d'ambiance tourne en boucle grâce aux lecteurs audio de la page.
- Une ambiance reste active jusqu'à la saisie et la validation d'un numéro de carte présent dans `soundtrackByCode`.
- Le passage sous les 10 minutes ne change plus automatiquement la musique.
- Un numéro de carte associé uniquement à une ambiance est accepté sans pénalité, même s'il n'ouvre aucun fichier.
