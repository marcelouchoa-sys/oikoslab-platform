# CLAUDE.md — OikosLab

Contexto do projeto para o Claude Code. Leia antes de qualquer alteração.

## O que é

OikosLab é uma plataforma de simulação macroeconômica, projeto de graduação de
Marcelo de Salles Cunha Uchôa (Economia, UFRRJ). É uma peça de portfólio de longo
prazo, com vista a aplicações de estudo no exterior. O objetivo pedagógico é central:
o usuário deve **pensar em economia, não em programação**, e o rigor teórico importa
tanto quanto o funcionamento.

## Arquitetura — duas camadas

### Camada 1 — Laboratório Didático (Streamlit)
- Acesso livre, sem login. Simuladores educacionais (funções, escolas, IS-LM-BP).
- Deploy: Streamlit Cloud. Repositório separado.

### Camada 2 — Plataforma Econômica (foco deste repositório)
- `oikoslab-platform/frontend/` — Next.js 14 + TypeScript + Tailwind. Deploy na **Vercel** (auto-deploy via push no GitHub `oikoslab-platform`, branch `main`).
- `oikoslab-platform/backend/`  — FastAPI + Python. Deploy no **Railway** (repo GitHub `oikoslab-backend`, branch `main`).

Atenção: `frontend` e `backend` são repositórios git SEPARADOS (submódulos dentro de
`OIKOSLABOFICIAL`). Cada um tem seu próprio remote e seu próprio deploy. Sempre faça
`cd` na pasta correta antes de commitar.

## URLs
- Frontend: https://oikoslab-platform.vercel.app
- Backend:  https://oikoslab-backend-production.up.railway.app
- Supabase: https://vxtvjclprvmsanfciykl.supabase.co

## Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind, react-plotly.js, katex/react-katex, html2canvas + jspdf, @xyflow/react, three, lucide-react, shadcn/radix.
- Backend: FastAPI, sympy, numpy, httpx.
- Dados/auth: Supabase (`@supabase/supabase-js`, `@supabase/ssr`), RLS ativo.
- Tabelas: `profiles` (nome, instituicao, bio, lattes, linkedin, github, avatar_url, curriculo), `projetos`, `simulacoes`, `compartilhamentos`.

## Design system (seguir SEMPRE)
- Tema dark. Fundo base `#0b0f19`. Superfícies elevadas `#11162a`.
- Glassmorphism: cards `bg-white/5 border border-white/10 rounded-2xl`.
- Texto: branco para destaque, `text-gray-400`/`text-gray-500` para secundário.
- Acentos: azul `#3b82f6`/`blue-600` (primário), roxo `#a78bfa`, verde `#34d399`,
  ciano `#06b6d4`, laranja `#fb923c`, vermelho `#f87171`.
- Cores por categoria de projeto: simulador=azul, cenário=ciano, construtor=roxo,
  modelo próprio=laranja, economia real=ciano.
- Fonte: Montserrat.
- Plotly sempre com fundo transparente (`paper_bgcolor`/`plot_bgcolor` = rgba(0,0,0,0)),
  grids `rgba(255,255,255,0.06)`, fontes `#9ca3af`, `displayModeBar: false`.
- Evite tema claro. Se encontrar páginas com `bg-white` e classes `oikos-*`
  (oikos-blue, oikos-surface, etc.), elas são legado e devem ser migradas para o dark.

## Páginas (frontend)
- `/`, `/home`, `/sobre`, `/contato` — institucionais.
- `/login` — login/cadastro dark.
- `/dashboard` — sidebar, KPIs do Supabase, destaque, acesso rápido.
- `/projetos`, `/projetos/novo` — listagem e criação (2 etapas).
- `/projetos/[id]` — página individual do projeto.
- `/projetos/[id]/construtor` — Construtor de Funções (laboratório de modelos).
- `/projetos/[id]/economia-real` — Cenários Pré-calibrados (World Bank).
- `/projetos/[id]/simulador-dinamico` — Simulador Dinâmico.
- `/perfil` — perfil com upload de avatar (bucket `avatars`) e links Lattes/LinkedIn.
- `/blog` — blog econômico (mockado).

## Backend — routers
- `routers/simulador_dinamico.py` — **modelo Novo-Keynesiano de 3 equações** (ver abaixo).
- `routers/modelo_proprio.py` — laboratório de modelos: resolve sistemas simultâneos.
- `routers/economia_real.py` — World Bank + calibração (em evolução).
- Legados: `islmbp.py`, `funcoes.py`.

## Modelos econômicos implementados (rigor importa)

### Simulador Dinâmico — Novo-Keynesiano de 3 equações (Carlin-Soskice / Galí)
NÃO é mais IS-LM. As três equações:
1. IS dinâmica:   `y_gap(t) = a·y_gap(t-1) − α·(r(t-1) − r_n) + ε_demanda`
2. Phillips:      `π(t) = π_e(t) + β·y_gap(t) + ε_oferta`
3. Regra de Taylor: `r(t) = r_n + φ_π·(π − π_meta) + φ_y·y_gap`
4. Okun:          `u(t) = u_n − okun·y_gap(t)`

As ESCOLAS são parametrizações do mesmo modelo (não rótulos cosméticos):
- Novo-clássica: expectativas racionais (θ=1), Phillips íngreme, BC duro.
- Keynesiana: rigidez alta, Phillips plana, expectativas adaptativas (θ=0).
- Monetarista: φ_π alto (BC durão), expectativas semi-adaptativas.
- Pós-keynesiana: histerese (u_natural e r_natural se movem com o hiato).
Parâmetros estruturais (informalidade, crédito, desigualdade, setor público,
tecnologia) modificam os coeficientes com justificativa teórica.
Endpoints: `/simular` (campo `comparar_escolas` para rodar as 4), `/irf`
(resposta a impulso), `/choques-predefinidos`.
Trabalha em INFLAÇÃO (π) e HIATO, não em nível de preços.

### Construtor de Funções — laboratório de modelos (sympy)
- Detecta endógenas automaticamente: variável no lado esquerdo de uma equação é
  endógena (resolvida); símbolo que nunca é lado esquerdo é parâmetro (usuário dá valor).
  Não exigir cadastro de Y, C etc. como parâmetros.
- Resolve sistemas simultâneos com `sympy.solve` (Cruz Keynesiana, IS-LM, Solow...).
- Resolve também SIMBOLICAMENTE para derivar multiplicadores analíticos `∂Y/∂G` etc.
- Biblioteca de blocos (`/blocos`, `/blocos/{id}`, `/modelos/{id}`) e modelos prontos.
- Análise de sensibilidade: variar um parâmetro e plotar o efeito nas endógenas.
- Painel de relações qualitativas (↑G → ↑Y) gerado pelo sinal das derivadas.

### Cenários Pré-calibrados — World Bank (em evolução)
Objetivo acordado: calibrar o modelo de 3 equações a partir de dados reais, com
transparência metodológica (fonte/qualidade de cada parâmetro: dados/estimado/
suposição) e backtesting (modelo calibrado vs realidade observada). Cenários
nomeados com narrativa (Brasil, Argentina, EUA, Chile, Turquia). NÃO calibrar o
IS-LM antigo.

## Convenções de trabalho
- Entregas em par backend+frontend quando o recurso atravessa as duas camadas;
  aplicar JUNTOS (o frontend novo chama endpoints novos).
- Antes de propor mudança em modelo econômico, pedir o arquivo real do router para
  não quebrar o contrato com o frontend.
- Validar a matemática com testes (casos canônicos: multiplicador = 1/(1−c),
  convergência à meta, histerese só na pós-keynesiana) antes de entregar.
- Preferir iteração rápida com entrega direta de arquivo a explicações longas.
- Comunicação em português.

## Fluxo de deploy (PowerShell, Windows)
Frontend (Vercel):
```
cd oikoslab-platform\frontend
git add "caminho\do\arquivo"
git commit -m "mensagem"
git push origin main
```
Backend (Railway):
```
cd oikoslab-platform\backend
git add routers\arquivo.py
git commit -m "mensagem"
git push origin main
```
Forçar redeploy sem mudança: `git commit --allow-empty -m "chore: redeploy"; git push origin main`.
Após push, confirmar deploy "Ready" e testar com hard refresh (Ctrl+Shift+R).

## Pipeline de decisão
Ordem de raciocínio antes de tocar em qualquer coisa. Não pule etapas.
1. **Entender o pedido na camada certa.** Identificar se é frontend (Vercel), backend
   (Railway), banco (Supabase) ou modelo econômico. Um pedido pode atravessar várias.
2. **Pedir o arquivo real antes de reescrever.** Nunca adivinhar o conteúdo de um
   router ou página existente — se o contrato de dados (campos que o frontend espera)
   não estiver à vista, solicitar o arquivo. Reescrever às cegas quebra a integração.
3. **Verificar o contrato frontend↔backend.** Os nomes de campos no JSON de resposta
   do backend são consumidos pelo frontend. Mudou um, mude os dois.
4. **Validar a economia antes do código.** Se o pedido envolve um modelo, conferir a
   teoria primeiro (a matemática tem que estar certa, não só rodar sem erro).
5. **Testar casos canônicos** (ver Protocolo de mudança) antes de entregar.
6. **Entregar com o fluxo de deploy correto** para a camada certa.
Em caso de ambiguidade, perguntar — uma pergunta é mais barata que um deploy quebrado.

## Regras de impacto
Classificação do risco de cada mudança, para calibrar o cuidado.
- **Cosmético** (cor, texto, espaçamento, copy): baixo risco. Aplicar direto, manter design system.
- **Frontend isolado** (novo componente, layout, estado local): risco médio. Não pode
  quebrar chamadas de API existentes.
- **Contrato de API** (mudar campos de request/response de um endpoint): ALTO risco.
  Exige alterar frontend e backend juntos, no mesmo ciclo. Nunca subir um sem o outro.
- **Modelo econômico** (equações, parametrizações, calibração): ALTO risco conceitual.
  Erro aqui não dá exceção, dá resultado errado que parece certo. Sempre validar com
  testes numéricos de casos conhecidos.
- **Banco/Supabase** (schema, RLS, storage): ALTO risco, irreversível em dados.
  Usar sempre `IF NOT EXISTS`/`on conflict do nothing`; nunca dropar dado sem confirmação
  explícita do Marcelo. Migrações de schema vão em SQL revisável, não em código escondido.
- **Legado** (páginas com `bg-white`/classes `oikos-*`): tratar como migração para o
  dark; não introduzir novo código no padrão antigo.

## Protocolo de mudança
Checklist obrigatório antes de declarar uma entrega pronta.
1. Sintaxe validada (Python: `ast.parse`; TS: compila sem erro de tipo óbvio).
2. Para modelos econômicos, rodar os **casos canônicos**:
   - Multiplicador keynesiano `∂Y/∂G = 1/(1−c)`.
   - Sem choque → economia em equilíbrio (hiato 0, π na meta).
   - Choque temporário → converge de volta (salvo pós-keynesiana, que tem histerese).
   - Histerese aparece SÓ na pós-keynesiana.
3. Verificar que o contrato de dados bate com o que o frontend lê.
4. Confirmar aderência ao design system (dark, glassmorphism, Plotly transparente).
5. Indicar caminho exato do arquivo e o bloco de deploy (Vercel ou Railway).
6. Quando a mudança cruza camadas, dizer explicitamente "aplicar os dois juntos".
7. Não deixar `console.log`/prints de debug nem imports não usados.

## Padrão de resposta
Como o Claude Code deve responder ao Marcelo.
- Português, direto, sem floreio. Iteração rápida e entrega de arquivo > textão.
- Quando agir como economista (modelos), explicar a teoria em 2-4 frases antes do código.
- Sempre fechar com: caminho do arquivo + comandos de deploy em PowerShell.
- Sinalizar risco quando a mudança for de contrato de API, modelo ou banco.
- Uma pergunta por vez quando houver ambiguidade real; caso contrário, agir.
- Não reabrir decisões já tomadas (ex: simulador usa 3 equações, não IS-LM).
- Preferir mostrar o que mudou (diff conceitual curto) a reexplicar o arquivo todo.

## Integração futura com Graphify
Graphify é a ferramenta de gráficos/visualização que substituirá/complementará o
react-plotly.js. Preparar o terreno desde já:
- **Isolar a camada de gráfico.** Não espalhar configuração de Plotly por toda página;
  centralizar layout/tema num helper reutilizável (ex: `plotlyLayoutBase`) para que a
  troca por Graphify seja em um lugar só.
- **Separar dados de apresentação.** Os componentes devem receber séries de dados
  limpas (`{x: [], y: [], nome: ''}`); o backend já entrega assim. O motor de render
  (Plotly hoje, Graphify amanhã) consome esse formato neutro.
- **Tema compartilhado.** Graphify deve herdar o design system: fundo transparente,
  grids `rgba(255,255,255,0.06)`, paleta de acentos já definida, fonte Montserrat.
- **Contrato estável.** Ao criar gráficos novos, manter a forma dos dados consistente
  com os já existentes (séries por nome), para que a migração seja mecânica.
- Quando o Graphify chegar, criar um wrapper único (`<Grafico/>`) que encapsule a lib
  ativa; trocar a implementação interna sem mexer nas páginas.

## Pendências
1. Terminar Cenários Pré-calibrados (calibração 3 equações + backtesting + transparência).
2. Conectar a calibração do World Bank ao modelo de 3 equações do simulador.
3. Decidir rich text das notas acadêmicas (TipTap vs Quill).
4. Blog econômico: sair do mock para publicação real.
5. Considerar domínio único com subdomínio para o Streamlit (lab.dominio) e raiz para a Vercel.
6. Integrar Graphify (ver seção acima) substituindo/complementando react-plotly.js.