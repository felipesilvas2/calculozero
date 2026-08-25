# Cálculo Zero — especificação e prompt de continuação

Este arquivo serve para duas coisas: documentar o projeto e ser colado como
prompt quando você for continuar o desenvolvimento em outra sessão, em
qualquer editor ou ferramenta.

---

## PARTE 1 — O que é o projeto

**Cálculo Zero** é uma plataforma web educacional que leva alguém de "não sei
nem por onde começar" até "consigo estudar Cálculo I sozinho".

**Princípio do produto:** o aluno não é ruim em matemática. Ele provavelmente
está tentando aprender algo antes de ter aprendido a base necessária. A
plataforma encontra a lacuna, volta o necessário e o traz de volta.

Isso não é slogan — é a regra que decide o código. É por isso que existe grafo
de pré-requisitos, desbloqueio por domínio, repetição espaçada e o modo
"Estou perdido".

### Contexto do autor

Estudante de Engenharia da Computação no SENAC São Paulo. A plataforma nasceu
para atender duas disciplinas da própria grade:

- **Cálculo I** — limites, derivadas, integrais
- **Física das Variações** — vetores, produtos, espaços vetoriais
  (Prof. Me. Izaias Neri; Listas 01 a 09)

Os exercícios da trilha de vetores são baseados nas listas reais da disciplina.

### Stack e restrições

- HTML, CSS e JavaScript puro. **Sem framework, sem npm, sem bundler.**
- **Scripts clássicos, não módulos ES.** Módulos ES exigem servidor por causa
  de CORS; scripts clássicos abrem direto do disco com dois cliques. Isso é
  proposital — o autor nem sempre tem máquina própria disponível.
- **Sem dependência externa.** Os gráficos são SVG escritos à mão, não
  Chart.js: reta tangente girando e retângulos de Riemann precisam de controle
  que biblioteca de dashboard não dá. Zero dependência também significa que
  abre offline.
- `build.py` gera `dist/calculozero.html`, um HTML autocontido com todo o CSS
  e JS embutidos, para compartilhar por link ou abrir no celular.

---

## PARTE 2 — Arquitetura

```
index.html                 carrega os módulos na ordem de dependência
build.py                   empacota tudo num HTML autocontido
tools/
  validar-curriculo.js     confere o grafo do currículo (roda em Node)
src/
  styles/
    base.css               tokens de design, reset, tipografia
    ui.css                 componentes e páginas
  data/                    CONTEÚDO — editável sem tocar em lógica
    curriculum.js          trilhas, níveis, grafo de pré-requisitos
    diagnostic.js          banco de questões do diagnóstico
    lessons.js             aulas da trilha de cálculo
    lessons-vectors.js     aulas da trilha de vetores
    exercises.js           exercícios da trilha de cálculo
    exercises-vectors.js   exercícios das listas de Física das Variações
    exams.js               simulados: escopo + plano de prova
    syllabus/              base curricular — uma disciplina por arquivo
    sheets/                fichas de tópico — uma disciplina por arquivo
  core/                    LÓGICA
    dom.js                 hyperscript minimalista (h, qs, clear, mount)
    storage.js             adaptador de persistência
    syllabus.js            registro e consulta da base curricular
    sheets.js              registro das fichas de tópico
    store.js               estado único + assinaturas + migração de esquema
    engine.js              regras pedagógicas e níveis de domínio
    viz.js                 visualizações SVG das aulas
    labs.js                laboratórios interativos
    exams.js               montagem e correção de simulados
    router.js              rotas por hash
    ai.js                  o tutor (provedor local + remoto opcional)
  components/
    ui.js                  Bar, Chip, modal, toast, Exercise, TopicCard
    tutor.js               painel flutuante do tutor
  pages/
    landing.js  diagnostic.js  dashboard.js  map.js  lesson.js  practice.js
    catalog.js  topic.js  lab.js  exam.js
  app.js                   shell, rotas, modo "Estou perdido"
```

**Duas camadas de conteúdo, e elas não competem:**

- **Trilhas** (`curriculum.js` + `lessons*.js`) — o caminho guiado, em aulas de
  7 passos. É o que o aluno percorre linearmente.
- **Base curricular** (`syllabus/` + `sheets/`) — o mapa completo do
  conhecimento, em 12 disciplinas e 355 tópicos. É onde se consulta, se
  diagnostica lacuna e se pratica por nível.

Um tópico da base pode apontar para a trilha (campos `track` e `lesson`), e aí
o progresso conversa entre as duas.

### Regras de arquitetura que devem ser respeitadas

1. **`data/` é conteúdo puro.** Adicionar aula, exercício ou tópico não pode
   exigir abrir arquivo de lógica.
2. **`core/engine.js` concentra toda decisão pedagógica.** As telas perguntam,
   o engine decide. Nenhuma página calcula domínio ou desbloqueio sozinha.
3. **`core/store.js` é a única fonte de verdade.** Nenhuma tela guarda estado
   próprio. Toda escrita passa por `CZ.store.update()`.
4. **Namespace global `CZ`.** Cada arquivo é uma IIFE que se pendura em
   `window.CZ`. Sem `import`/`export`.
5. **Todo conteúdo se registra**, não se mistura. Cada arquivo se pendura
   sozinho no banco correspondente: `CZ.lessons.register([...])`,
   `CZ.exercises.register([...])`, `CZ.syllabus.register({...})` e
   `CZ.sheets.register([...])`. Nenhum arquivo de conteúdo conhece outro, e a
   ordem de carregamento fica livre.
6. **O grafo do currículo é conferido por script.** Antes de publicar, rode
   `node tools/validar-curriculo.js`. Ele pega id duplicado, pré-requisito
   inexistente, ciclo e referência a aula, laboratório ou visualização que não
   existe.
7. **Tópico sem ficha nunca tranca o seguinte.** A base tem muito mais tópicos
   mapeados do que escritos; travar o aluno atrás de um tópico vazio
   transformaria o mapa em muro.
8. **Todo texto de interface em português do Brasil.** Comentários no código
   também.

### Convenções de código

- Comentários explicam **por que**, não **o que**. Se o comentário só repete o
  nome da função, ele não deveria existir.
- Cabeçalho de bloco em cada arquivo explicando a responsabilidade dele.
- Nada de `localStorage` direto — sempre via `CZ.storage`, que é assíncrono e
  escolhe entre `window.storage`, `localStorage` e memória.
- Sem `<form>`. Use `onClick`/`onInput`.
- CSS por variáveis em `:root`. Nenhuma cor hardcoded fora de `base.css`.

### Modelos de dados

**Aula** (`data/lessons*.js`) — sempre 7 passos, nessa ordem:

```js
{
  id: 'de1', topic: 'derivadas', title: '...',
  why: 'por que aprender isso',
  whyByArea: { compe: '...', econ: '...' },   // opcional, modo faculdade
  steps: [
    { kind: 'contexto',   html: '...', alt: { simples, cotidiano, visual, passos, dica, outro } },
    { kind: 'explicacao', html: '...', alt: {...} },
    { kind: 'exemplo',    html: '...', alt: {...} },
    { kind: 'visual',     html: '...', viz: { type: 'tangente' } },
    { kind: 'guiado',     exercise: 'de-g1' },
    { kind: 'sozinho',    exercise: 'de-s1' },
    { kind: 'revisao',    html: '...' }
  ]
}
```

O objeto `alt` alimenta o botão **"Não entendi"** — seis reescritas da mesma
ideia. Nem todo passo precisa das seis; a interface só mostra as que existem.

**Exercício** (`data/exercises*.js`):

```js
{
  id: 'de-g1', topic: 'derivadas', type: 'input' | 'choice',
  prompt: '...',
  answer: '5x^4',                 // índice, quando type é 'choice'
  accept: ['5x⁴', '5*x^4'],       // variações aceitas
  choices: [...],                 // só quando type é 'choice'
  hints: ['leve', 'médio', 'quase a resposta'],
  solution: ['passo 1', 'passo 2', '...'],
  traps: { '5x^5': 'Você desceu o expoente mas esqueceu de diminuir um dele.' }
}
```

`traps` é o que permite dizer **"você somou antes de multiplicar"** em vez de
**"resposta errada"**. Todo exercício novo deve trazer pelo menos um trap com
o erro mais provável.

**Tópico da base curricular** (`data/syllabus/*.js`):

```js
{
  id: 'c1.de.cadeia',            // prefixo por disciplina, separado por ponto
  name: 'Regra da cadeia',
  requires: ['c1.de.quociente', 'pc.cs.composicao'],   // ids de qualquer disciplina
  sub: ['(f∘g)′ = f′(g)·g′', 'camadas encaixadas'],    // subtópicos
  goal: 'Identificar as camadas de uma composta e derivar de fora para dentro.',
  track: 'derivadas',            // opcional: liga a um tópico de trilha
  lesson: 'de2',                 // opcional: liga a uma aula pronta
  lab: 'labDerivada',            // opcional
  deferred: true                 // opcional: depende de disciplina não declarada
}
```

**Ficha de tópico** (`data/sheets/*.js`) — a sequência é fixa porque é o método:

```js
{
  topic: 'c1.de.cadeia',
  whatIs: '<p>…</p>',            // o que é
  whyExists: '<p>…</p>',         // por que existe
  simple: '…',                   // explicação simples (uma frase densa)
  academic: '<p>…</p>',          // explicação acadêmica
  examples: [                    // básico, intermediário, avançado
    { level: 'basico', prompt: '…', steps: ['…'], answer: '…' }
  ],
  application: { area: 'Ciência de Dados', text: '…' },
  formulas: [{ f: '…', note: '…' }],
  mistakes: [{ erro: '…', porque: '…', certo: '…' }],
  tip: '…',
  drills: {                      // os exercícios moram DENTRO da ficha
    basico: [ /* itens no formato de exercises.js */ ],
    intermediario: [...], avancado: [...], desafio: [...]
  },
  review: ['…'],
  lab: 'labDerivada',            // opcional
  viz: 'tangente'                // opcional: visualização de core/viz.js
}
```

O registro em `core/sheets.js` publica os `drills` no banco geral, preenchendo
`topic` e `level`. Escrever um tópico novo não deve exigir abrir dois arquivos.

### Regras pedagógicas em vigor

| Decisão | Regra |
|---|---|
| Domínio de um tópico | 70% aulas concluídas + 30% acerto nos exercícios |
| Desbloqueio | pré-requisitos diretos a 80%+, ou diagnóstico forte no nível |
| Volta para revisão | erro agenda +1 dia; acertos espaçam em 1 / 3 / 7 / 16 dias |
| Fim do diagnóstico | dois erros no mesmo nível encerram a subida |
| Lacuna ("Estou perdido") | sonda a cadeia de pré-requisitos e aponta o primeiro que falhou |

---

## PARTE 3 — Estado atual (leia antes de mexer)

### Funcionando

- Landing, diagnóstico adaptativo, painel, mapa, player de aula, prática livre
- Trilha de cálculo completa: 8 tópicos, 17 aulas
- Trilha de vetores completa: 6 tópicos, 10 aulas, 20 exercícios das listas
- Tutor com dois provedores (`core/ai.js`) e painel flutuante
- XP, níveis, sequência diária, conquistas, repetição espaçada
- Modo "Estou perdido", modo faculdade, botão "Não entendi", tema claro/escuro

### Base curricular

- 12 disciplinas, 77 módulos, 100 unidades, 355 tópicos, 1.575 subtópicos
- Grafo de pré-requisitos que atravessa disciplinas, com ciclo verificado
- 38 fichas de tópico completas · 396 exercícios em 4 níveis
- 7 laboratórios interativos · 11 simulados
- Cinco níveis de domínio calculados por desempenho ponderado

### Identidade e adaptação

- `core/mascote.js` — o Zero, oito expressões, banco de falas sem elogio vazio
- `components/celebrate.js` — confete, XP voando, faixa de retorno, tela de conquista
- `core/explain.js` — 14 lentes de explicação sobre o mesmo conteúdo
- `core/profile.js` — o modelo do aluno: observa, infere e age; tudo local,
  explicável e reversível
- `pages/perfil.js` — mostra toda inferência com a evidência ao lado

### O tutor e a API

- `core/ai.js` — adaptador `local` (padrão, offline) + `remoto` (streaming)
- `api/tutor.js` — proxy serverless que guarda a chave e monta o prompt de
  sistema; a única peça do projeto que roda em servidor
- `CZ.ai.configurar()` recusa qualquer coisa com formato de chave: o
  front-end aceita endereço, nunca segredo

### O que falta

1. **Fichas.** 38 de 355 tópicos têm ficha. As disciplinas 10
   (Computação) e 11 (Ciência de Dados) ainda não têm nenhuma. Escrever uma
   ficha nova é acrescentar um objeto em `data/sheets/` — nada mais.
2. **Conteúdo das lentes novas.** `code`, `history`, `counter` e `byArea` são
   campos opcionais da ficha; poucas fichas os preenchem, e a lente
   correspondente só aparece quando há material.
3. **Aulas guiadas** para os tópicos da base que ainda só têm ficha.
4. **Publicação.** Ligar o GitHub Pages em Settings → Pages →
   Source: GitHub Actions, uma única vez.

### Conferência antes de publicar

```bash
node tools/validar-curriculo.js   # grafo, ids, referências cruzadas
python3 build.py                  # gera dist/calculozero.html
```

## PARTE 4 — Ideias para as próximas rodadas

- **Backend + banco.** Trocar o adaptador em `storage.js` por chamadas HTTP.
  Nenhum chamador muda — a interface já é assíncrona.
- **Proxy para o tutor remoto.** Um endpoint próprio que guarda a chave e
  encaminha para a API. É o que destrava o provedor remoto em produção.
- **Mais conteúdo de vetores.** Espaço e subespaço vetorial (Lista 07),
  produto interno em matrizes (Lista 09), matrizes e sistemas.
- **Cálculo além do básico.** Regra da cadeia com mais profundidade, regra do
  produto e do quociente, integração por substituição, trigonometria.
- **Modo prova.** Simulado cronometrado com questões embaralhadas de um
  conjunto de tópicos, gerando relatório de onde o tempo foi gasto.
- **Exportar progresso.** Um JSON que o aluno leva de máquina para máquina
  enquanto não existe backend.

## PARTE 5 — Prompt curto

Se precisar de uma versão para colar rápido:

> Estou desenvolvendo o **Cálculo Zero**, uma plataforma web educacional de
> matemática em HTML/CSS/JS puro, sem framework e sem dependências, organizada
> em `data/` (conteúdo), `core/` (lógica), `components/` e `pages/`, com
> namespace global `CZ` e scripts clássicos (não módulos ES, porque precisa
> abrir direto do disco). O princípio do produto é: o aluno não é ruim em
> matemática, ele só está tentando aprender algo antes da base necessária — por
> isso existe grafo de pré-requisitos, desbloqueio por domínio e repetição
> espaçada.
>
> São duas camadas de conteúdo. As **trilhas** guiadas (cálculo e vetores)
> estão completas, em aulas de 7 passos. A **base curricular** tem 12
> disciplinas, 355 tópicos e 1.575 subtópicos ligados por um grafo que
> atravessa disciplinas; 38 tópicos já têm ficha completa (o que é, por que
> existe, explicação simples e acadêmica, três exemplos, aplicação, fórmulas,
> erros comuns, dica, exercícios em quatro níveis, revisão, laboratório).
>
> Domínio na base é calculado por desempenho ponderado pela dificuldade, em
> cinco níveis, e erro recente derruba o nível. Há 7 laboratórios interativos e
> 11 simulados que se montam sozinhos a partir das fichas do escopo.
>
> Há também um tutor de dois provedores em `core/ai.js` — um local, que
> funciona offline e é o padrão, e um remoto opcional. Chave de API não pode
> ficar no front-end público; se for usar o remoto em produção, tem que ser via
> backend próprio fazendo proxy.
>
> Antes de publicar, rode `node tools/validar-curriculo.js`. Leia `PROMPT.md`
> no repositório para a especificação completa, e siga as convenções que já
> estão no código.
