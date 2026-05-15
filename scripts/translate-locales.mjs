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

const source = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../locales/es/common.json"), "utf8"),
);

async function translate(langCode, langName) {
  console.log(`Traduciendo a ${langName}...`);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `Translate this JSON from Spanish to ${langName}. 
Return ONLY the translated JSON, no markdown, no explanation.
Keep all keys exactly as they are, only translate the values.
Context: this is a Camino de Santiago pilgrimage app.

${JSON.stringify(source, null, 2)}`,
      },
    ],
  });

  const text = response.content[0].text
    .trim()
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "");
  const translated = JSON.parse(text);

  fs.writeFileSync(
    path.join(__dirname, `../locales/${langCode}/common.json`),
    JSON.stringify(translated, null, 2),
    "utf8",
  );

  console.log(`✅ ${langName} listo`);
}

async function main() {
  for (const [code, name] of Object.entries(LANGUAGES)) {
    await translate(code, name);
  }
  console.log("\n🐚 Todos los idiomas traducidos!");
}

main().catch(console.error);
