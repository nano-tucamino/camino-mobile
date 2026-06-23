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

// Claves que contienen "Camino" o "Camino Francés" y fueron mal traducidas
// Se fuerza retraducción en TODOS los idiomas incluyendo inglés
const CLAVES_A_CORREGIR = [
  "hero.titulo",
  "hero.subtitulo",
  "hero.cta",
  "hero.vive_el",
  "hero.camino",
  "hero.explorar_etapas",
  "hero.ver_albergues",
  "hero.stats.km_label",
  "etapas.subtitulo",
  "etapas.completado",
  "albergues.subtitulo",
  "auth.login.subtitulo_email",
  "auth.registro_page.titulo_paso1",
  "auth.registro_page.bienvenido",
  "auth.registro_page.comenzar",
  "auth.registro_page.titulo_paso2",
  "auth.registro_page.subtitulo_paso2",
  "auth.confirmar.descripcion",
  "perfil.bio_placeholder",
  "perfil.como_haces",
  "perfil.con_quien",
  "perfil.como_organizas",
  "perfil.cuantas_veces",
  "perfil.camino_label",
  "perfil.empty_camino",
  "perfil.tabs.camino",
  "home.features.idiomas_desc",
  "home.features.albergues_titulo",
  "home.features.albergues_desc",
  "home.mapa.titulo",
  "home.mapa.subtitulo",
  "home.mapa.sectores",
  "home.mapa.cargando",
  "home.mapa.negocios",
  "home.cta_final.eyebrow",
  "home.cta_final.titulo",
  "home.cta_final.descripcion",
  "home.cta_final.nota",
  "landing.siente_el",
  "landing.camino",
  "landing.subtitulo",
  "landing.chat_titulo",
  "landing.chat_desc",
  "landing.descubre",
  "mapa.sectores",
  "mapa.cargando",
  "mapa.negocios",
  "etapa.meteo.fuente",
  "interactions.panel.banner_texto",
];

const GLOSSARY = `
TRANSLATION RULES for this Camino de Santiago pilgrimage app:

CRITICAL — These terms must NEVER be translated. Keep them EXACTLY as in Spanish:
- "Camino" — always keep as "Camino", even in English. Do NOT translate to "Way", "Path", "Route" or any other word.
- "Camino Francés" — always keep as "Camino Francés", never translate
- "Camino de Santiago" — always keep as "Camino de Santiago", never translate  
- "Camino Francés · 825 km" — keep entire string exactly as-is
- "Camino Francés · 34 etapas" — keep entire string exactly as-is
- "Camino Francés · Sectores" — keep entire string exactly as-is
- "825 km · 34 etapas · Saint-Jean → Santiago" — keep exactly as-is
- "Tu Camino" — keep as "Tu Camino", never translate
- "Buen Camino" — keep as-is
- "hospitalero" / "hospitalera" — keep in Spanish, no translation exists
- "cruceiro" — keep as-is, Galician stone cross monument
- "Open-Meteo · previsión hasta 16 días" — keep as-is
- Brand names: "Booking", "WhatsApp", "Google", "Stripe", "Cloudinary", "Supabase", "Mapbox"
- Email addresses and URLs: keep as-is

DO translate normally:
- "albergue" → hostel, Herberge, auberge, albergue, ostello etc.
- "etapa" → stage, Etappe, étape, tappa etc.
- "peregrino" → pilgrim, Pilger, pèlerin etc.
- All UI text, descriptions, instructions

IMPORTANT: Return ONLY valid JSON, same keys, no markdown, no explanation.
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

function getValueByPath(obj, keyPath) {
  return keyPath.split(".").reduce((cur, k) => cur?.[k], obj);
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

  // ── PASO 1: Forzar retraducción de claves que contienen Camino/términos protegidos ──
  const clavesARetraducir = {};
  let corregidas = 0;
  for (const clave of CLAVES_A_CORREGIR) {
    const valorEs = getValueByPath(source, clave);
    if (valorEs !== undefined) {
      deleteNestedKey(target, clave);
      clavesARetraducir[clave] = valorEs;
      corregidas++;
    }
  }

  if (corregidas > 0) {
    console.log(`   🔧 Retraducciendo ${corregidas} claves con el glosario correcto...`);
    const BLOCK_SIZE = 40;
    const entries = Object.entries(clavesARetraducir);
    for (let i = 0; i < entries.length; i += BLOCK_SIZE) {
      const bloque = Object.fromEntries(entries.slice(i, i + BLOCK_SIZE));
      const resultado = await traducirBloque(bloque, langName);
      for (const [key, value] of Object.entries(resultado)) {
        setNestedKey(target, key, value);
      }
    }
  }

  // ── PASO 2: Detectar y traducir claves nuevas ──
  const newKeys = getNewKeys(source, target);

  if (Object.keys(newKeys).length > 0) {
    console.log(`   📝 Traduciendo ${Object.keys(newKeys).length} claves nuevas...`);
    const BLOCK_SIZE = 50;
    const entries = Object.entries(newKeys);
    for (let i = 0; i < entries.length; i += BLOCK_SIZE) {
      const bloque = Object.fromEntries(entries.slice(i, i + BLOCK_SIZE));
      const resultado = await traducirBloque(bloque, langName);
      for (const [key, value] of Object.entries(resultado)) {
        setNestedKey(target, key, value);
      }
    }
  } else {
    console.log(`   ✅ Sin claves nuevas`);
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
