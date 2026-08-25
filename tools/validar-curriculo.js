/* ==========================================================================
   tools/validar-curriculo.js — conferência da base curricular.

   Roda em Node, fora do navegador. Carrega os arquivos de dados num
   `window` falso e verifica o que um erro de digitação quebraria em
   silêncio: pré-requisito apontando para id inexistente, id duplicado,
   ciclo no grafo e referência a aula, tópico de trilha ou laboratório que
   não existe.

   Uso:  node tools/validar-curriculo.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const sandbox = { window: {}, console, document: undefined };
sandbox.window.CZ = {};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

/* ordem de dependência, igual à do index.html */
load('src/core/dom.js');
load('src/core/syllabus.js');
load('src/data/curriculum.js');
load('src/data/lessons.js');
load('src/data/exercises.js');
load('src/data/lessons-vectors.js');
load('src/data/exercises-vectors.js');

fs.readdirSync(path.join(ROOT, 'src/data/syllabus'))
  .filter((f) => f.endsWith('.js'))
  .sort()
  .forEach((f) => load('src/data/syllabus/' + f));

load('src/core/sheets.js');

const sheetsDir = path.join(ROOT, 'src/data/sheets');
if (fs.existsSync(sheetsDir)) {
  fs.readdirSync(sheetsDir).filter((f) => f.endsWith('.js')).sort()
    .forEach((f) => load('src/data/sheets/' + f));
}

const CZ = sandbox.window.CZ;
const S = CZ.syllabus;

const errors = [];
const warnings = [];

/* ---- ids duplicados ---- */
const seen = new Map();
S.allTopics().forEach((t) => {
  if (seen.has(t.id)) errors.push(`id de tópico duplicado: ${t.id}`);
  seen.set(t.id, t);
});

/* ---- pré-requisitos inexistentes ---- */
S.allTopics().forEach((t) => {
  t.requires.forEach((dep) => {
    if (!S.topic(dep)) errors.push(`${t.id} exige "${dep}", que não existe`);
  });
});

/* ---- ciclos ---- */
const WHITE = 0, GRAY = 1, BLACK = 2;
const color = {};
S.allTopics().forEach((t) => { color[t.id] = WHITE; });

function visit(id, stack) {
  color[id] = GRAY;
  const t = S.topic(id);
  for (const dep of t.requires) {
    if (!S.topic(dep)) continue;
    if (color[dep] === GRAY) {
      errors.push(`ciclo: ${stack.slice(stack.indexOf(dep)).concat(dep).join(' → ')}`);
    } else if (color[dep] === WHITE) {
      visit(dep, stack.concat(dep));
    }
  }
  color[id] = BLACK;
}
S.allTopics().forEach((t) => { if (color[t.id] === WHITE) visit(t.id, [t.id]); });

/* ---- referências cruzadas com o conteúdo já existente ---- */
S.allTopics().forEach((t) => {
  if (t.track && !CZ.curriculum.byId[t.track]) {
    errors.push(`${t.id} aponta para a trilha "${t.track}", que não existe`);
  }
  if (t.lesson && !CZ.lessons.byId[t.lesson]) {
    errors.push(`${t.id} aponta para a aula "${t.lesson}", que não existe`);
  }
});

/* ---- disciplinas: requires entre disciplinas ---- */
const discIds = new Set(S.DISCIPLINES.map((d) => d.id));
S.DISCIPLINES.forEach((d) => {
  (d.requires || []).forEach((r) => {
    if (!discIds.has(r)) errors.push(`disciplina ${d.id} exige "${r}", que não existe`);
  });
});

/* ---- coerência entre o grafo de tópicos e o de disciplinas ----
   A numeração das disciplinas é a ordem do catálogo, não a ordem de estudo:
   Álgebra Linear é a 12ª mas vem antes de Computação na dependência. Por
   isso a conferência usa o fecho transitivo de `requires` das disciplinas.
   Um tópico marcado `deferred` é uma exceção declarada: ele fica no fim da
   disciplina justamente por depender de outra. */
function closureOf(id, acc, guard) {
  acc = acc || new Set();
  guard = guard || new Set();
  if (guard.has(id)) return acc;
  guard.add(id);
  const d = S.discipline(id);
  (d && d.requires ? d.requires : []).forEach((r) => { acc.add(r); closureOf(r, acc, guard); });
  return acc;
}
const closures = {};
S.DISCIPLINES.forEach((d) => { closures[d.id] = closureOf(d.id); });

const cross = [];
S.allTopics().forEach((t) => {
  t.requires.forEach((dep) => {
    const d = S.topic(dep);
    if (!d || d.discipline === t.discipline) return;
    if (closures[t.discipline].has(d.discipline)) return;   // dependência declarada
    if (t.deferred) { cross.push(`${t.id} → ${dep} (adiado de propósito)`); return; }
    warnings.push(`${t.id} (${t.discipline}) depende de ${dep} (${d.discipline}) sem que a disciplina declare essa dependência`);
  });
});

/* ---- fichas ---- */
if (CZ.sheets) {
  Object.keys(CZ.sheets.byTopic || {}).forEach((id) => {
    if (!S.topic(id)) errors.push(`ficha para tópico inexistente: ${id}`);
  });
}

/* ---- laboratórios declarados ---- */
load('src/core/viz.js');
load('src/core/labs.js');
load('src/data/exams.js');

const labs = new Set();
S.allTopics().forEach((t) => { if (t.lab) labs.add(t.lab); });
labs.forEach((id) => {
  if (!CZ.labs.get(id)) errors.push(`laboratório declarado mas inexistente: ${id}`);
});

/* ---- fichas: exercícios, viz e laboratórios ---- */
const idsEx = new Set();
CZ.exercises.EXERCISES.forEach((e) => {
  if (idsEx.has(e.id)) errors.push(`id de exercício duplicado: ${e.id}`);
  idsEx.add(e.id);
  if (!e.hints || e.hints.length < 1) warnings.push(`exercício ${e.id} sem dicas`);
  if (!e.solution || !e.solution.length) warnings.push(`exercício ${e.id} sem solução`);
});

CZ.sheets.SHEETS.forEach((sh) => {
  if (sh.lab && !CZ.labs.get(sh.lab)) errors.push(`ficha ${sh.topic} aponta para laboratório inexistente: ${sh.lab}`);
  if (sh.viz && !CZ.viz.BUILDERS[sh.viz]) errors.push(`ficha ${sh.topic} aponta para visualização inexistente: ${sh.viz}`);
  const obrig = ['whatIs', 'whyExists', 'simple', 'academic', 'examples', 'application', 'formulas', 'mistakes', 'tip', 'drills', 'review'];
  const faltando = obrig.filter((k) => !sh[k] || (Array.isArray(sh[k]) && !sh[k].length));
  if (faltando.length) warnings.push(`ficha ${sh.topic} sem: ${faltando.join(', ')}`);
  const c = CZ.sheets.drillCount(sh.topic);
  if (c.total < 4) warnings.push(`ficha ${sh.topic} tem só ${c.total} exercício(s)`);
});

/* ---- simulados ---- */
CZ.examBank.EXAMS.forEach((ex) => {
  const alvos = [].concat(ex.scope.discipline || [], ex.scope.disciplines || []);
  alvos.forEach((d) => { if (!S.discipline(d)) errors.push(`simulado ${ex.id}: disciplina "${d}" não existe`); });
  const mods = [].concat(ex.scope.module || [], ex.scope.modules || []);
  mods.forEach((m) => { if (!S.module(m)) errors.push(`simulado ${ex.id}: módulo "${m}" não existe`); });
  (ex.scope.topics || []).forEach((t) => { if (!S.topic(t)) errors.push(`simulado ${ex.id}: tópico "${t}" não existe`); });
});

/* ---- relatório ---- */
const st = S.stats();
console.log('=== Base curricular ===');
console.log(`disciplinas: ${st.disciplines}`);
console.log(`módulos:     ${st.modules}`);
console.log(`unidades:    ${st.units}`);
console.log(`tópicos:     ${st.topics}`);
console.log(`subtópicos:  ${st.sub}`);
console.log(`laboratórios: ${CZ.labs.all().length} (${labs.size} referenciados por tópicos)`);
console.log(`exercícios no banco: ${CZ.exercises.EXERCISES.length}`);
console.log(`simulados: ${CZ.examBank.EXAMS.length}`);

const ligados = S.allTopics().filter((t) => t.track).length;
const comAula = S.allTopics().filter((t) => t.lesson).length;
console.log(`tópicos ligados a uma trilha existente: ${ligados}`);
console.log(`tópicos com aula pronta: ${comAula}`);

if (CZ.sheets) {
  console.log(`fichas completas: ${Object.keys(CZ.sheets.byTopic || {}).length}`);
}

console.log('\n=== Ordem de estudo (10 primeiros) ===');
S.studyOrder().slice(0, 10).forEach((t, i) => console.log(`${i + 1}. ${t.name}  [${t.id}]`));

if (cross.length) {
  console.log(`\n=== ${cross.length} dependência(s) adiada(s), declaradas com deferred ===`);
  cross.forEach((c) => console.log('  · ' + c));
}

if (warnings.length) {
  console.log(`\n=== ${warnings.length} aviso(s) ===`);
  warnings.forEach((w) => console.log('  ! ' + w));
}

if (errors.length) {
  console.log(`\n=== ${errors.length} ERRO(S) ===`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}

console.log('\n✓ Nenhum erro estrutural.');
