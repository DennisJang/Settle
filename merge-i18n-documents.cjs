/**
 * merge-i18n-documents.cjs
 * Documents 위젯 i18n 키를 각 언어 JSON에 병합
 * 사용: node merge-i18n-documents.cjs
 */

const fs = require("fs");
const path = require("path");

const { visa_en, visa_ko, visa_vi, visa_zh } = require("./i18n-documents.cjs");

const localesDir = path.resolve(__dirname, "src/i18n/locales");

const pairs = [
  ["en.json", { visa: visa_en }],
  ["ko.json", { visa: visa_ko }],
  ["vi.json", { visa: visa_vi }],
  ["zh.json", { visa: visa_zh }],
];

for (const [file, newKeys] of pairs) {
  const filePath = path.join(localesDir, file);
  const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Deep merge visa namespace
  for (const [ns, keys] of Object.entries(newKeys)) {
    if (!existing[ns]) existing[ns] = {};
    Object.assign(existing[ns], keys);
  }

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  console.log(`✅ ${file} merged (visa namespace)`);
}

console.log("Done!");
