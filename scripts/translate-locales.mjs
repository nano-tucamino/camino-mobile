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

function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

const source = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../locales/es/common.json"), "utf8"),
);

async function translate(langCode, langName) {
  const targetPath = path.join(__dirname, `../locales/${langCode}/common.json`);
  const target = fs.existsSync(targetPath)
    ? JSON.parse(fs.readFileSync(targetPath, "utf8"))
    : {};

  const newKeys = getNewKeys(source, target);

  if (Object.keys(newKeys).length === 0) {
    console.log(`⏭️  ${langName} — sin claves nuevas`);
    return;
  }

  console.log(`Traduciendo a ${langName} (${Object.keys(newKeys).length} claves nuevas)...`);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Translate these JSON key-value pairs from Spanish to ${langName}.
Return ONLY a JSON object with the same keys and translated values, no markdown, no explanation.
Context: this is a Camino de Santiago pilgrimage app.

${JSON.stringify(newKeys, null, 2)}`,
      },
    ],
  });

  const text = response.content[0].text
    .trim()
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "");
  const translated = JSON.parse(text);

  // Merge translated keys into existing target
  for (const [key, value] of Object.entries(translated)) {
    setNestedKey(target, key, value);
  }

  fs.writeFileSync(targetPath, JSON.stringify(target, null, 2), "utf8");
  console.log(`✅ ${langName} listo`);
}

async function main() {
  for (const [code, name] of Object.entries(LANGUAGES)) {
    await translate(code, name);
  }
  console.log("\n🐚 Traducción completada!");
}

main().catch(console.error);
