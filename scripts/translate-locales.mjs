// 📄 scripts/translate-locales.mjs
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const LANGUAGES = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  ko: "Korean",
  ja: "Japanese",
};

// Claves que se tradujeron mal y hay que forzar retraducción
// Son claves cuyo valor en español contiene términos protegidos
// que los traductores convirtieron incorrectamente
const CLAVES_A_CORREGIR = [
  "hero.stats.km_label",
  "etapas.subtitulo",
  "albergues.subtitulo",
  "home.features.idiomas_desc",
  "home.mapa.titulo",
  "home.mapa.subtitulo",
  "home.mapa.sectores",
  "mapa.sectores",
  "etapa.meteo.fuente",
  "landing.subtitulo",
];

const GLOSSARY = `
TRANSLATION RULES for this Camino de Santiago pilgrimage app:

CRITICAL — NEVER translate or modify these terms, keep them EXACTLY as written in Spanish:
- "Camino Francés" — proper name of the pilgrimage route, NEVER translate
- "Camino de Santiago" — proper name, NEVER translate  
- "Camino Francés · 825 km" — keep entire string as-is
- "Camino Francés · 34 etapas" — keep entire string as-is
- "Camino Francés · Sectores" — keep entire string as-is
- "825 km · 34 etapas · Saint-Jean → Santiago" — keep entire string as-is
- "hospitalero" / "hospitalera" — Camino-specific term, no real equivalent, keep in Spanish
- "cruceiro" — Galician stone cross monument, proper noun, keep as-is
- "Buen Camino" — traditional pilgrim greeting, keep as-is
- "Open-Meteo · previsión hasta 16 días" — keep as-is
- Brand names: "Booking", "WhatsApp", "Google", "Stripe", "Cloudinary", "Supabase", "Mapbox"
- Email addresses and URLs: keep as-is

"Camino" alone: keep as-is ONLY when referring to the Camino de Santiago pilgrimage.
Translate normally when it means road/path/way in a generic sense.

"albergue": translate normally (hostel, Herberge, auberge, albergue, ostello, 旅館 etc.)
"etapa": translate normally (stage, Etappe, étape, tappa etc.)
"peregrino": translate normally (pilgrim, Pilger, pèlerin etc.)

IMPORTANT: Return ONLY valid JSON with the same keys, no markdown, no explanation.
`;

const source = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../locales/es/common.json"), "utf8")
);

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(acc, flattenKeys(val, fullKey));
    } else {
      acc[fullKey] = val;
    }
    return acc;
  }, {});
}

function getNewKeys(source, target) {
  const sourceFlat = flattenKeys(source);
  const targetFlat = flattenKeys(target);
  const newKeys = {};
  for (const key of Object.keys(sourceFlat)) {
    if (!(key in targetFlat)) {
      newKeys[key] = sourceFlat[key];
    }
  }
  return newKeys;
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((cur, k) => cur?.[k], obj);
}

function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function deleteNestedKey(obj, keyPath) {
  const parts = keyPath.split(".");
  const last = parts.pop();
  const parent = parts.reduce((cur, k) => cur?.[k], obj);
  if (parent) delete parent[last];
}

async function traducirBloque(claves, langName) {
  if (Object.keys(claves).length === 0) return {};

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `${GLOSSARY}\n\nTranslate these JSON key-value pairs from Spanish to ${langName}.\n\n${JSON.stringify(claves, null, 2)}`,
      },
    ],
  });

  const text = response.content[0].text
    .trim()
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "");

  return JSON.parse(text);
}

async function translate(langCode, langName) {
  const targetPath = path.join(__dirname, `../locales/${langCode}/common.json`);
  const target = fs.existsSync(targetPath)
    ? JSON.parse(fs.readFileSync(targetPath, "utf8"))
    : {};

  // ── PASO 1: Forzar retraducción de claves que se tradujeron mal ──
  const clavesARetraducir = {};
  for (const clave of CLAVES_A_CORREGIR) {
    const valorEs = getValueByPath(source, clave);
    if (valorEs !== undefined) {
      deleteNestedKey(target, clave);
      clavesARetraducir[clave] = valorEs;
    }
  }

  if (Object.keys(clavesARetraducir).length > 0) {
    console.log(`   🔧 Corrigiendo ${Object.keys(clavesARetraducir).length} claves mal traducidas...`);
    const corregidas = await traducirBloque(clavesARetraducir, langName);
    for (const [key, value] of Object.entries(corregidas)) {
      setNestedKey(target, key, value);
    }
  }

  // ── PASO 2: Detectar y traducir claves nuevas ──
  const newKeys = getNewKeys(source, target);

  if (Object.keys(newKeys).length === 0) {
    console.log(`   ✅ ${langName} — sin claves nuevas`);
  } else {
    console.log(`   Traduciendo ${Object.keys(newKeys).length} claves nuevas...`);

    const BLOCK_SIZE = 50;
    const entries = Object.entries(newKeys);

    for (let i = 0; i < entries.length; i += BLOCK_SIZE) {
      const bloque = Object.fromEntries(entries.slice(i, i + BLOCK_SIZE));
      const resultado = await traducirBloque(bloque, langName);
      for (const [key, value] of Object.entries(resultado)) {
        setNestedKey(target, key, value);
      }
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(target, null, 2), "utf8");
  console.log(`   ✅ ${langName} guardado`);
}

async function main() {
  console.log("🐚 Iniciando traducción de locales mobile...\n");
  for (const [code, name] of Object.entries(LANGUAGES)) {
    console.log(`\n── ${name} (${code}) ──`);
    await translate(code, name);
  }
  console.log("\n🐚 Traducción completada!");
}

main().catch(console.error);
