/**
 * Profanity detector — Bahasa Indonesia + English
 * Mendeteksi kata kasar/vulgar secara cerdas dengan word-boundary check.
 * Tidak mendeteksi pengulangan karakter (waaaaah, !!! adalah ekspresi normal).
 */

// ─── Kata kasar Indonesia ─────────────────────────────────────────────────────
const KATA_KASAR_ID = [
  // Umpatan umum
  "anjing","anjir","anjrit","babi","bajingan","bangsat","brengsek",
  "sialan","celaka","keparat","kampret","kurang ajar","laknat","jahanam",
  // Kata bodoh/merendahkan
  "goblok","goblog","tolol","bego","idiot","dungu","dodol","pandir",
  // Organ tubuh vulgar
  "kontol","memek","ngentot","entot","colmek","jembut","titit","pepek",
  // Umpatan daerah (umum)
  "jancok","dancok","cok","asu","jangkrik","sempak","taek","tai","tae",
  // Cabul
  "cabul","mesum","bejat","sundal","pelacur","lonte","jalang",
];

// ─── Profanity English ────────────────────────────────────────────────────────
const PROFANITY_EN = [
  "fuck","fucker","fucking","fck","f*ck",
  "shit","bullshit","bullcrap",
  "bitch","btch","b1tch",
  "bastard","asshole","ass hole",
  "dick","cock","cunt","pussy","whore","slut","nigger","nigga",
  "retard","moron","imbecile","jackass",
  "goddamn","motherfucker","mfer",
];

// Build regex patterns once (cached)
const PATTERNS_ID = KATA_KASAR_ID.map((w) => ({
  word: w,
  re: new RegExp(
    `(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`,
    "i"
  ),
}));

const PATTERNS_EN = PROFANITY_EN.map((w) => ({
  word: w,
  re: new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
}));

/**
 * Detect profanity in text.
 * @param {string} text
 * @returns {{ found: boolean, word?: string, lang?: 'id'|'en' }}
 */
export function detectProfanity(text) {
  const cleaned = text
    .toLowerCase()
    .replace(/0/g, "o") // 0 → o (l33t speak)
    .replace(/1/g, "i") // 1 → i
    .replace(/3/g, "e") // 3 → e
    .replace(/4/g, "a") // 4 → a
    .replace(/5/g, "s") // 5 → s
    .replace(/\*/g, "");

  for (const { word, re } of PATTERNS_ID) {
    if (re.test(cleaned)) return { found: true, word, lang: "id" };
  }
  for (const { word, re } of PATTERNS_EN) {
    if (re.test(cleaned)) return { found: true, word, lang: "en" };
  }
  return { found: false };
}
