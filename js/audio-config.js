const soundtracks = {
  intro: {
    label: "Introduction de l’enquête",
    file: "sons/ambiances/intro-enquete.mp3"
  },
  train: {
    label: "Colt Express",
    file: "sons/ambiances/Colt.mp3"
  },
  mine: {
    label: "Mine",
    file: "sons/ambiances/Mine.mp3"
  },
  foret: {
    label: "Forêt de Root",
    file: "sons/ambiances/Root.mp3"
  },
  mort: {
    label: "Petite Mort",
    file: "sons/ambiances/Mort.mp3"
  },
  tension: {
    label: "Compte à rebours",
    file: "sons/ambiances/tension.mp3"
  },
  victoire: {
    label: "Victoire",
    file: "sons/ambiances/victoire.mp3"
  }
};

const soundtrackByCode = {
  "8": "train",
  "A": "train",
  "2": "train",

  "B": "mort",

  "M": "mine",
  
  "1": "intro",

  "F": "foret",
};

const soundEffects = {
  correct: "sons/effets/code-correct.mp3",
  incorrect: "sons/effets/code-incorrect.mp3",
  penalty: "sons/effets/penalite.mp3",
  hint: "sons/effets/indice.mp3"
};
