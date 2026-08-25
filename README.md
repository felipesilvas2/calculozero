<h1 align="center">Cálculo Zero</h1>

<p align="center">
  <b>Matemática sem medo. Do zero até o cálculo.</b><br>
  <sub>Uma plataforma que acha a lacuna, volta o necessário e te traz de volta.</sub>
</p>

<p align="center">
  <a href="https://felipesilvas2.github.io/calculozero/"><b>🌐 Abrir a plataforma</b></a>
  ·
  <a href="#-o-que-tem-dentro">O que tem dentro</a>
  ·
  <a href="#️-feito-com">Feito com</a>
  ·
  <a href="PROMPT.md">Documentação técnica</a>
</p>

---

## 🌐 Abrir e usar

**Online:** https://felipesilvas2.github.io/calculozero/

> **Ainda não abriu?** O site precisa ser ligado uma única vez:
> **Settings → Pages → Source: GitHub Actions**. Depois disso todo commit
> republica sozinho.

**No seu computador** — sem instalar nada, sem internet:

```bash
git clone https://github.com/felipesilvas2/calculozero.git
cd calculozero
```

Agora é só dar **dois cliques no `index.html`**. Pronto.

**No celular:** rode `python3 build.py`. Ele gera `dist/calculozero.html`, um
arquivo único com tudo dentro — CSS, JavaScript, conteúdo. Manda por WhatsApp
e abre.

---

## 💡 A ideia

> O aluno não é ruim em matemática. Ele provavelmente está tentando aprender
> algo **antes** de ter aprendido a base necessária.

Isso não é slogan — é o que decide o código. É por isso que existe:

- **grafo de pré-requisitos** — cada tópico sabe de quem depende
- **diagnóstico** — descobre onde você está antes de mandar você estudar
- **modo "Estou perdido"** — trava numa derivada? Ele sonda seus
  pré-requisitos e mostra que o problema é fração, três degraus atrás
- **revisão espaçada** — o que você errou volta no dia em que a memória
  começa a falhar

---

## 📚 O que tem dentro

<table>
<tr><td><b>12</b></td><td>disciplinas</td><td><b>355</b></td><td>tópicos</td></tr>
<tr><td><b>77</b></td><td>módulos</td><td><b>1.575</b></td><td>subtópicos</td></tr>
<tr><td><b>396</b></td><td>exercícios</td><td><b>38</b></td><td>fichas completas</td></tr>
<tr><td><b>27</b></td><td>aulas guiadas</td><td><b>11</b></td><td>simulados</td></tr>
<tr><td><b>15</b></td><td>gráficos interativos</td><td><b>7</b></td><td>laboratórios</td></tr>
</table>

**As 12 disciplinas**, de quem começa do zero até quem quer Ciência de Dados:

```
 1. Matemática Básica       7. Cálculo I
 2. Álgebra                 8. Probabilidade
 3. Geometria               9. Estatística
 4. Funções                10. Matemática para Computação
 5. Trigonometria          11. Matemática para Ciência de Dados
 6. Pré-Cálculo            12. Álgebra Linear
```

### Cada tópico tem

```
o que é  →  por que existe  →  explicação simples  →  explicação acadêmica
   →  3 exemplos (básico, intermediário, avançado)  →  aplicação real
   →  fórmulas  →  erros comuns  →  dica  →  exercícios em 4 níveis
   →  revisão  →  laboratório
```

### E se você não entender?

O botão **"Não entendi"** abre até **14 lentes** sobre o mesmo conteúdo:
analogia do dia a dia, passo a passo, imagem mental, erro comum, fórmula
comentada, versão formal, em código, pergunta guiada…

A plataforma percebe qual delas funciona com você e passa a oferecer essa
primeiro.

### Laboratórios

| | O que você faz |
|---|---|
| **Funções** | Mexe nos parâmetros e vê o gráfico mudar |
| **Círculo trigonométrico** | Gira o ângulo e vê a onda nascer |
| **Limites** | Chega perto do ponto e vê o valor convergir |
| **Derivadas** | Vê a secante virar tangente |
| **Integrais** | Aumenta os retângulos e vê o erro sumir |
| **Probabilidade** | Roda 10 mil experimentos de uma vez |
| **Estatística** | Arrasta um valor extremo e vê a média correr atrás |

---

## 🛠️ Feito com

**Zero dependências no front-end.** Nada de React, nada de `npm install`,
nada de CDN. Abre offline, abre do pendrive, abre em computador de
laboratório de faculdade.

| Linguagem | Arquivos | Linhas | Para quê |
|---|---:|---:|---|
| **JavaScript** | 61 | 18.651 | A aplicação inteira — currículo, motor pedagógico, telas, tutor |
| **CSS** | 2 | 1.392 | Design system por variáveis, tema claro e escuro |
| **SVG** | *inline* | 155 formas | Mascote, gráficos e laboratórios, desenhados à mão dentro do JS |
| **HTML** | 1 | 101 | Só carrega os módulos na ordem certa |
| **Markdown** | 3 | 812 | Esta documentação |
| **YAML** | 1 | 71 | Publicação automática (GitHub Actions) |
| **Python** | 1 | 62 | `build.py`, que empacota tudo num HTML só |
| **JSON** | 1 | 10 | Dependência do proxy do tutor |

**Total: 21.137 linhas em 73 arquivos.**

### Por que assim

**JavaScript puro, sem módulos ES.** Módulos exigem servidor por causa de
CORS. Script clássico abre direto do disco — e nem todo estudante tem
ambiente montado.

**SVG escrito à mão em vez de Chart.js.** Reta tangente girando e retângulos
de Riemann precisam de controle que biblioteca de dashboard não dá. E sem
dependência, funciona offline.

**Node.js** aparece em dois lugares fora do navegador: o validador do
currículo (`tools/validar-curriculo.js`, que roda a cada commit) e o proxy
opcional do tutor.

---

## 🤖 O tutor

Um assistente dentro da plataforma, com dois modos:

**Motor local** *(padrão)* — busca no conteúdo que já existe: aulas, fichas,
dicas, armadilhas de erro e o grafo de pré-requisitos, cruzados com o seu
histórico. **Funciona offline e não custa nada.** Não é IA generativa e não
finge ser.

**Modelo remoto** *(opcional)* — para pergunta aberta. Precisa de um proxy
seu, porque **chave de API não pode ficar no navegador**: qualquer visitante
leria. Instruções em [`api/README.md`](api/README.md) — leva 5 minutos.

Os dois seguem a mesma regra: **não entregam resposta de exercício de
primeira.** Dão dica, perguntam o que você já tentou, e só abrem a solução
depois.

### A plataforma te observa (e te mostra o que concluiu)

Ela repara em qual explicação te destrava, quantas dicas você pede, seu
ritmo, e onde você erra sempre. Com isso reordena as lentes, ajusta o apoio e
sugere pausa quando você emenda erros.

Três coisas que valem dizer:

- **Tudo fica no seu aparelho.** Nada é enviado para lugar nenhum.
- **Toda conclusão vem com a evidência.** A tela `Perfil` mostra: *"você abriu
  esta lente 7 vezes e acertou 5 exercícios depois"*.
- **Dá para apagar** sem perder seu progresso.

---

## 📁 Estrutura

```
index.html              carrega tudo na ordem de dependência
build.py                empacota num HTML autocontido
src/
  data/                 CONTEÚDO — dá para editar sem tocar em lógica
    syllabus/             as 12 disciplinas
    sheets/               as fichas de tópico
    lessons*.js           as aulas
    exercises*.js         os exercícios
  core/                 LÓGICA — currículo, motor pedagógico, tutor, perfil
  components/           peças de interface reutilizáveis
  pages/                as telas
api/                    o proxy do tutor (opcional, roda em servidor)
tools/                  validador do currículo
```

**A separação que importa:** `data/` é conteúdo puro. Dá para adicionar uma
aula, um exercício ou uma disciplina inteira sem abrir arquivo de lógica.

---

## 🎓 De onde veio

Feito por um estudante de **Engenharia da Computação no SENAC São Paulo**,
para duas disciplinas da própria grade:

- **Cálculo I** — limites, derivadas, integrais
- **Física das Variações** — vetores, produtos, espaços vetoriais
  *(Prof. Me. Izaias Neri)*

Os exercícios da trilha de vetores vêm das **listas reais da disciplina**,
com a origem anotada em cada um.

---

## 🤝 Contribuindo

Antes de abrir um PR, rode a conferência do currículo:

```bash
node tools/validar-curriculo.js
```

Ela pega o que passa despercebido: id duplicado, pré-requisito apontando
para tópico inexistente, ciclo no grafo, referência a aula ou laboratório que
não existe. Nada disso dá erro de sintaxe — só quebra a navegação em
silêncio.

A especificação completa, com modelos de dados e convenções, está em
[**PROMPT.md**](PROMPT.md).

---

<p align="center">
  <sub>MIT · Feito para quem já achou que era ruim em matemática.</sub>
</p>
