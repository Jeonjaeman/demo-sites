import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

const requiredEvidenceIds = [
  "BIZ-03",
  "ASIS-01",
  "ASIS-03",
  "SEC-01",
  "SEC-03",
  "SEC-04",
  "SEC-05",
  "SSO-01",
  "SSO-02",
  "SSO-03",
  "SSO-04",
  "DEP-01",
  "OPS-01",
  "OPS-02",
  "DOC-01",
  "DOC-02",
  "DOC-03",
  "KT-01",
  "ACC-01",
  "ACC-02",
  "ACC-03",
  "ACC-04",
  "ACC-05",
  "ACC-06",
  "PRIV-02",
  "PRIV-03",
  "PRIV-04",
];

function expandLineSpec(spec) {
  const values = [];
  for (const token of spec.split(",").map((item) => item.trim()).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:[–-](\d+))?$/);
    assert.ok(match, `invalid source line spec: ${token}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    for (let line = start; line <= end; line += 1) values.push(line);
  }
  return values;
}

function readZipEntry(archive, entryName) {
  const minimumEocd = 22;
  const lowerBound = Math.max(0, archive.length - 65557);
  let eocdOffset = -1;
  for (let offset = archive.length - minimumEocd; offset >= lowerBound; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  assert.notEqual(eocdOffset, -1, "DOCX end-of-central-directory record must exist");

  const entryCount = archive.readUInt16LE(eocdOffset + 10);
  let centralOffset = archive.readUInt32LE(eocdOffset + 16);
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(archive.readUInt32LE(centralOffset), 0x02014b50, "valid ZIP central entry");
    const compression = archive.readUInt16LE(centralOffset + 10);
    const compressedSize = archive.readUInt32LE(centralOffset + 20);
    const nameLength = archive.readUInt16LE(centralOffset + 28);
    const extraLength = archive.readUInt16LE(centralOffset + 30);
    const commentLength = archive.readUInt16LE(centralOffset + 32);
    const localOffset = archive.readUInt32LE(centralOffset + 42);
    const name = archive.subarray(centralOffset + 46, centralOffset + 46 + nameLength).toString("utf8");

    if (name === entryName) {
      assert.equal(archive.readUInt32LE(localOffset), 0x04034b50, "valid ZIP local entry");
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
      if (compression === 0) return compressed;
      if (compression === 8) return inflateRawSync(compressed);
      assert.fail(`unsupported DOCX compression method: ${compression}`);
    }

    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  assert.fail(`DOCX entry not found: ${entryName}`);
}

function decodeXmlText(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the production-transition evidence demo", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /AI 교수·학습 플랫폼/);
  assert.match(html, /프로덕션 전환/);
  assert.match(html, /문서 인용형 AI 튜터/);
  assert.match(html, /관리자/);
  assert.match(html, /교수자/);
  assert.match(html, /학생/);
  assert.match(html, /AnythingLLM/);
  assert.match(html, /LanceDB/);
  assert.match(html, /OpenAI 호환/);
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape/);
});

test("exposes every acceptance domain as traceable evidence", async () => {
  const response = await render();
  const html = await response.text();

  for (const id of requiredEvidenceIds) {
    assert.match(html, new RegExp(`data-requirements=["'][^"']*${id}`));
  }

  assert.match(html, /OIDC/);
  assert.match(html, /SAML/);
  assert.match(html, /학교 이메일/);
  assert.match(html, /백업 생성/);
  assert.match(html, /복구 리허설/);
  assert.match(html, /클린 서버/);
  assert.match(html, /하드닝/);
  assert.match(html, /인수인계/);
});

test("ships Korean metadata and a complete requirements trace", async () => {
  const [layout, requirements, sourceText, docxArchive, baseStyles, platformSource] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/REQUIREMENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../work/source-docs/오픈소스 LLMRAG 교육 플랫폼 보안 강화·SSO 연동·배포.txt", import.meta.url), "utf8"),
    readFile(new URL("../work/source-docs/과업지시서.docx", import.meta.url)),
    readFile(new URL("../app/styles/base.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/DemoPlatform.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /AI 교수·학습 플랫폼/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.match(requirements, /TXT coverage: 84\/84 meaningful lines \+ 43\/43 blank formatting lines = 127\/127/);
  assert.match(requirements, /DOCX coverage: 58\/58 direct paragraphs \(57 non-empty \+ 1 blank\), 2\/2 tables/);
  assert.match(requirements, /Unmapped meaningful source text: 0/);
  assert.match(requirements, /신규 UI\/디자인 개발은 계약 과업에서 제외/);

  const acceptanceMapping = requirements.match(/## Acceptance mapping([\s\S]*?)## Explicit exclusions and assumptions/)?.[1] ?? "";
  for (const row of [
    ["재배포", "ACC-01"],
    ["보안", "ACC-02"],
    ["인증·권한", "ACC-03"],
    ["복구", "ACC-04"],
    ["운영 문서", "ACC-05"],
    ["인수인계", "ACC-06"],
  ]) {
    const matchingRow = acceptanceMapping.split("\n").find((line) => line.startsWith(`| ${row[0]} |`)) ?? "";
    assert.match(matchingRow, new RegExp(`\\b${row[1]}\\b`), `${row[0]} must map to ${row[1]}`);
  }
  for (const id of ["ACC-01", "ACC-02", "ACC-03", "ACC-04", "ACC-05", "ACC-06"]) {
    assert.equal(acceptanceMapping.match(new RegExp(`\\b${id}\\b`, "g"))?.length, 1, `${id} must appear once in the acceptance mapping`);
  }

  const sourceLines = sourceText.replaceAll("\r\n", "\n").split("\n");
  if (sourceLines.at(-1) === "") sourceLines.pop();
  assert.equal(sourceLines.length, 127, "the authoritative TXT must have 127 lines");

  const txtCoverage = requirements.match(/## TXT line coverage([\s\S]*?)## Acceptance mapping/)?.[1] ?? "";
  const semanticLines = [];
  for (const row of txtCoverage.matchAll(/^\| (\d[\d, –-]*) \|/gm)) {
    semanticLines.push(...expandLineSpec(row[1]));
  }
  const blankSpec = txtCoverage.match(/공백\/서식 줄 `([^`]+)`/)?.[1] ?? "";
  const blankLines = expandLineSpec(blankSpec);
  assert.equal(semanticLines.length, 84, "84 meaningful TXT lines must be mapped");
  assert.equal(blankLines.length, 43, "43 formatting TXT lines must be accounted for");
  assert.equal(new Set([...semanticLines, ...blankLines]).size, 127, "TXT coverage must contain no duplicate or missing line");
  assert.deepEqual([...new Set([...semanticLines, ...blankLines])].sort((a, b) => a - b), Array.from({ length: 127 }, (_, index) => index + 1));
  for (const line of semanticLines) assert.notEqual(sourceLines[line - 1].trim(), "", `TXT line ${line} must be meaningful`);
  for (const line of blankLines) assert.equal(sourceLines[line - 1].trim(), "", `TXT line ${line} must be blank formatting`);
  for (const phrase of ["유사 사례 2건", "개인·법인사업자", "정부지원사업", "사전 검증 질문", "원문 문장 절단"]) {
    assert.match(requirements, new RegExp(phrase), `TXT-specific condition must be traced: ${phrase}`);
  }

  const documentXml = readZipEntry(docxArchive, "word/document.xml").toString("utf8");
  const body = documentXml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/)?.[1] ?? "";
  const tableCount = body.match(/<w:tbl\b/g)?.length ?? 0;
  const bodyWithoutTables = body.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, "");
  const paragraphs = bodyWithoutTables.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
  const paragraphText = paragraphs.map((paragraph) =>
    [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => decodeXmlText(match[1])).join("").trim(),
  );
  assert.equal(paragraphs.length, 58, "DOCX must contain 58 direct body paragraphs");
  assert.equal(paragraphText.filter(Boolean).length, 57, "DOCX must contain 57 non-empty direct body paragraphs");
  assert.equal(tableCount, 2, "DOCX must contain two body tables");
  const joinedDocxText = [...documentXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => decodeXmlText(match[1]))
    .join("\n");
  for (const phrase of ["보안 강화·SSO 연동·배포 자동화 용역 과업지시서", "신규 UI/디자인 개발", "질의응답 포함"]) {
    assert.match(joinedDocxText, new RegExp(phrase), `authoritative DOCX phrase must exist: ${phrase}`);
  }

  const docxReferences = new Set();
  for (const match of requirements.matchAll(/P(\d{3})(?:–P?(\d{3}))?/g)) {
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    for (let paragraph = start; paragraph <= end; paragraph += 1) docxReferences.add(paragraph);
  }
  assert.deepEqual([...docxReferences].filter((value) => value <= 57).sort((a, b) => a - b), Array.from({ length: 57 }, (_, index) => index + 1));
  for (const tableReference of ["T01R01", "T02R02", "T02R03", "T02R04", "T02R05", "T02R06", "T02R07"]) {
    assert.match(requirements, new RegExp(tableReference), `DOCX table row must be mapped: ${tableReference}`);
  }

  assert.match(platformSource, /aria-live="polite"/);
  assert.match(platformSource, /현재 역할이 \{role\}/);
  assert.match(baseStyles, /textarea:focus-visible/);
});

test("renders every normalized DOCX requirement marker", async () => {
  const [response, requirements] = await Promise.all([
    render(),
    readFile(new URL("../docs/REQUIREMENTS.md", import.meta.url), "utf8"),
  ]);
  const html = await response.text();
  const register = requirements.match(/## Full DOCX register([\s\S]*?)## Improvement and delivery details/)?.[1] ?? "";
  const ids = [...register.matchAll(/^\| ([A-Z]+-\d{2}) \|/gm)].map((match) => match[1]);
  assert.ok(ids.length >= 60, "the normalized DOCX register must remain comprehensive");
  for (const id of ids) {
    assert.match(html, new RegExp(`data-requirements=["'][^"']*\\b${id}\\b`), `rendered evidence marker missing: ${id}`);
  }
});
