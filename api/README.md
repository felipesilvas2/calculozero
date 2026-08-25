# O proxy do tutor

Esta pasta é a **única parte do Cálculo Zero que roda em servidor**. Todo o
resto é estático e abre com dois cliques.

## Por que ela existe

O tutor pode falar com um modelo da Anthropic. Para isso é preciso uma chave
de API — e **chave de API não pode viver no front-end de um site público**.
Qualquer visitante abre o JavaScript e lê. Não existe jeito de esconder
segredo em código que roda no navegador do outro; o que existe é não colocar
segredo lá.

Então a chave fica aqui, no servidor. O navegador manda a pergunta, o
servidor fala com o modelo, e devolve só a resposta.

O proxy também é quem monta o **prompt de sistema**. Se o navegador pudesse
mandar o sistema, qualquer pessoa reescreveria as regras do tutor com um
`fetch` — inclusive a regra de não entregar resposta de exercício.

## O que acontece se você não montar isso

Nada quebra. A plataforma continua funcionando inteira: o tutor cai no
**provedor local**, que é um motor de recuperação sobre o conteúdo que já
existe (aulas, fichas, dicas, armadilhas de erro e o grafo de pré-requisitos)
cruzado com o seu histórico. Ele não é IA generativa e não finge ser — mas
responde offline e não custa nada.

O provedor remoto é opcional, e existe para pergunta aberta que o local não
cobre.

---

## Subindo em 5 minutos (Vercel)

```bash
npm i -g vercel
cd api && npm install && cd ..

vercel env add ANTHROPIC_API_KEY      # cole a chave quando pedir
vercel env add CZ_ORIGENS             # ex: https://SEU-USUARIO.github.io
vercel deploy --prod
```

O endereço sai algo como `https://calculozero-tutor.vercel.app/api/tutor`.

Na plataforma: abra o **Tutor**, clique na engrenagem, cole esse endereço e
salve. O endereço fica guardado no seu navegador — ele não é segredo, ao
contrário da chave.

### Netlify

Mova o arquivo para `netlify/functions/tutor.js` e troque a última linha
(`export const config`) por nada — o Netlify não usa essa chave. As variáveis
de ambiente vão em *Site settings → Environment variables*.

### Express (servidor próprio)

```js
import express from 'express';
import handler from './api/tutor.js';

const app = express();
app.use(express.json({ limit: '16kb' }));
app.post('/api/tutor', (req, res) => handler(req, res));
app.listen(3000);
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `ANTHROPIC_API_KEY` | sim | A chave. Nunca commite isso. |
| `CZ_ORIGENS` | recomendada | Lista separada por vírgula dos sites que podem chamar. Sem ela, qualquer site pode usar o seu proxy — e a sua conta. |
| `CZ_MODELO` | não | Padrão `claude-opus-5`. |

**Configure `CZ_ORIGENS`.** Um proxy aberto é a conta de outra pessoa rodando
na sua chave.

---

## O que o proxy faz com a entrada

O navegador é entrada não confiável, então nada dele passa direto:

- **A pergunta** é limitada a 600 caracteres.
- **O contexto do aluno** é remontado campo a campo num molde fixo. Campo que
  não está no molde não chega ao modelo.
- **O histórico** aceita no máximo 6 rodadas, só com papéis `user` e
  `assistant`.
- **O prompt de sistema** é do servidor, e diz explicitamente ao modelo que o
  contexto é dado, não comando.
- **Freio de abuso**: 20 perguntas por minuto por IP, na memória do processo.
  Isso não é defesa séria — é para o caso de um laço esquecido rodando. Em
  produção de verdade, ponha um limitador na borda.

## Custo

Resposta de tutor tem no máximo 5 frases (`max_tokens: 1200`, `effort: low`).
Na prática cada pergunta custa fração de centavo. Ainda assim: **coloque um
limite de gasto no painel da Anthropic** antes de publicar o endereço.

## Formato da resposta

SSE (`text/event-stream`), três eventos:

```
event: texto    data: {"t":"pedaço de texto"}
event: erro     data: {"erro":"api","mensagem":"..."}
event: fim      data: {"modelo":"...","tokens":{"entrada":N,"saida":N}}
```

O cliente (`src/core/ai.js`) consome isso e escreve na tela conforme chega.
