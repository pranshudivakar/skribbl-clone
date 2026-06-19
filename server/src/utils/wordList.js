// ✅ FIX: Ab wordCategories 5 languages support karta hai.
// Structure: wordsByLanguage[languageCode][category] = [words...]
export const wordsByLanguage = {
  en: {
    animals: [
      "elephant",
      "giraffe",
      "dolphin",
      "penguin",
      "kangaroo",
      "butterfly",
      "crocodile",
    ],
    objects: [
      "laptop",
      "umbrella",
      "notebook",
      "scissors",
      "headphones",
      "glasses",
      "keyboard",
    ],
    actions: [
      "running",
      "swimming",
      "dancing",
      "jumping",
      "singing",
      "painting",
      "cooking",
    ],
    food: [
      "pizza",
      "sushi",
      "burrito",
      "pancake",
      "spaghetti",
      "chocolate",
      "icecream",
    ],
    nature: [
      "mountain",
      "waterfall",
      "volcano",
      "rainbow",
      "sunset",
      "forest",
      "desert",
    ],
  },
  hi: {
    animals: [
      "हाथी",
      "जिराफ़",
      "डॉल्फिन",
      "पेंगुइन",
      "कंगारू",
      "तितली",
      "मगरमच्छ",
    ],
    objects: [
      "लैपटॉप",
      "छाता",
      "नोटबुक",
      "कैंची",
      "हेडफ़ोन",
      "चश्मा",
      "कीबोर्ड",
    ],
    actions: [
      "दौड़ना",
      "तैरना",
      "नाचना",
      "कूदना",
      "गाना",
      "पेंटिंग",
      "खाना बनाना",
    ],
    food: [
      "पिज़्ज़ा",
      "सुशी",
      "बरिटो",
      "पैनकेक",
      "स्पेगेटी",
      "चॉकलेट",
      "आइसक्रीम",
    ],
    nature: [
      "पहाड़",
      "झरना",
      "ज्वालामुखी",
      "इंद्रधनुष",
      "सूर्यास्त",
      "जंगल",
      "रेगिस्तान",
    ],
  },
  es: {
    animals: [
      "elefante",
      "jirafa",
      "delfín",
      "pingüino",
      "canguro",
      "mariposa",
      "cocodrilo",
    ],
    objects: [
      "portátil",
      "sombrilla",
      "cuaderno",
      "tijeras",
      "auriculares",
      "gafas",
      "teclado",
    ],
    actions: [
      "correr",
      "nadar",
      "bailar",
      "saltar",
      "cantar",
      "pintar",
      "cocinar",
    ],
    food: [
      "pizza",
      "sushi",
      "burrito",
      "panqueque",
      "espagueti",
      "chocolate",
      "helado",
    ],
    nature: [
      "montaña",
      "cascada",
      "volcán",
      "arcoíris",
      "atardecer",
      "bosque",
      "desierto",
    ],
  },
  fr: {
    animals: [
      "éléphant",
      "girafe",
      "dauphin",
      "pingouin",
      "kangourou",
      "papillon",
      "crocodile",
    ],
    objects: [
      "ordinateur",
      "parapluie",
      "cahier",
      "ciseaux",
      "écouteurs",
      "lunettes",
      "clavier",
    ],
    actions: [
      "courir",
      "nager",
      "danser",
      "sauter",
      "chanter",
      "peindre",
      "cuisiner",
    ],
    food: [
      "pizza",
      "sushi",
      "burrito",
      "crêpe",
      "spaghetti",
      "chocolat",
      "glace",
    ],
    nature: [
      "montagne",
      "cascade",
      "volcan",
      "arc-en-ciel",
      "coucher de soleil",
      "forêt",
      "désert",
    ],
  },
  de: {
    animals: [
      "Elefant",
      "Giraffe",
      "Delfin",
      "Pinguin",
      "Känguru",
      "Schmetterling",
      "Krokodil",
    ],
    objects: [
      "Laptop",
      "Regenschirm",
      "Notizbuch",
      "Schere",
      "Kopfhörer",
      "Brille",
      "Tastatur",
    ],
    actions: [
      "laufen",
      "schwimmen",
      "tanzen",
      "springen",
      "singen",
      "malen",
      "kochen",
    ],
    food: [
      "Pizza",
      "Sushi",
      "Burrito",
      "Pfannkuchen",
      "Spaghetti",
      "Schokolade",
      "Eis",
    ],
    nature: [
      "Berg",
      "Wasserfall",
      "Vulkan",
      "Regenbogen",
      "Sonnenuntergang",
      "Wald",
      "Wüste",
    ],
  },
};

// ✅ FIX: getRandomWords ab language parameter accept karta hai.
// Backward-compatible: language na diya jaaye to "en" use hoga.
export const getRandomWords = (count, category = null, language = "en") => {
  const langData = wordsByLanguage[language] || wordsByLanguage.en;

  let words = [];
  if (category && langData[category]) {
    words = [...langData[category]];
  } else {
    Object.values(langData).forEach((cat) => {
      words = [...words, ...cat];
    });
  }

  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getAllWords = (language = "en") => {
  const langData = wordsByLanguage[language] || wordsByLanguage.en;
  const all = [];
  Object.values(langData).forEach((cat) => {
    all.push(...cat);
  });
  return all;
};

// ✅ NAYA: List of supported language codes, validation ke liye useful
export const SUPPORTED_LANGUAGES = ["en", "hi", "es", "fr", "de"];
