/**
 * Pre-generates voice preview audio files for all 22 Gemini TTS voices.
 * Saves WAV files to public/voices/ so the UI can play them instantly
 * without any API call.
 *
 * Usage:
 *   node scripts/generate-voice-previews.mjs
 *
 * Requires:
 *   GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in .env.local
 *
 * Each voice says: "გამარჯობა, ეს არის ჩემი ხმის მოკლე მაგალითი"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load env vars from .env.local
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const API_KEY =
  process.env.GEMINI_API_KEY ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error(
    "Missing API key. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local"
  );
  process.exit(1);
}

const VOICES = [
  { id: "Zephyr", name: "ნინო" },
  { id: "Puck", name: "გიორგი" },
  { id: "Charon", name: "დავითი" },
  { id: "Kore", name: "ნათია" },
  { id: "Fenrir", name: "თორნიკე" },
  { id: "Leda", name: "მარიამი" },
  { id: "Orus", name: "ნიკა" },
  { id: "Aoede", name: "ანა" },
  { id: "Callirrhoe", name: "სოფო" },
  { id: "Autonoe", name: "ელენე" },
  { id: "Enceladus", name: "ლაშა" },
  { id: "Iapetus", name: "გიგა" },
  { id: "Umbriel", name: "ლუკა" },
  { id: "Algieba", name: "დაჩი" },
  { id: "Despina", name: "ეკა" },
  { id: "Erinome", name: "თათია" },
  { id: "Gacrux", name: "გვანცა" },
  { id: "Pulcherrima", name: "ია" },
  { id: "Vindemiatrix", name: "ხატია" },
  { id: "Sadachbia", name: "დიტო" },
  { id: "Sadaltager", name: "ბექა" },
  { id: "Sulafat", name: "თეო" },
];

const PREVIEW_TEXT = "გამარჯობა, ეს არის ჩემი ხმის მოკლე მაგალითი";
const MODEL = "gemini-2.5-pro-preview-tts";
const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent`;
const OUTPUT_DIR = path.join(ROOT, "public", "voices");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const dataLength = pcmBuffer.byteLength;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  buffer.writeUInt16LE(channels * (bitDepth / 8), 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  Buffer.from(pcmBuffer).copy(buffer, 44);

  return buffer;
}

async function generateVoice(voice) {
  const outPath = path.join(OUTPUT_DIR, `${voice.id.toLowerCase()}.wav`);

  if (fs.existsSync(outPath)) {
    console.log(`  ✓ ${voice.id} (${voice.name}) — already exists, skipping`);
    return;
  }

  const body = {
    contents: [{ parts: [{ text: PREVIEW_TEXT }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice.id },
        },
      },
    },
    systemInstruction: {
      parts: [
        {
          text: `წაიკითხე ეს მოკლე მისალმება ბუნებრივი და სასიამოვნო ტონით. ხმის სახელი მომხმარებლისთვის არის ${voice.name}.`,
        },
      ],
    },
  };

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  const part = json?.candidates?.[0]?.content?.parts?.[0];
  const audioData = part?.inlineData?.data;

  if (!audioData) {
    throw new Error("No audio data in response");
  }

  const pcmBuffer = Buffer.from(audioData, "base64");
  const wavBuffer = pcmToWav(pcmBuffer);
  fs.writeFileSync(outPath, wavBuffer);

  const kb = Math.round(wavBuffer.byteLength / 1024);
  console.log(`  ✓ ${voice.id} (${voice.name}) — ${kb}KB saved`);
}

async function main() {
  console.log(`Generating ${VOICES.length} voice previews → public/voices/\n`);

  let ok = 0;
  let failed = 0;

  for (const voice of VOICES) {
    try {
      await generateVoice(voice);
      ok++;
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ${voice.id} (${voice.name}) — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} generated, ${failed} failed`);
  if (ok > 0) {
    console.log("Voice files are in public/voices/ — commit them to the repo.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
