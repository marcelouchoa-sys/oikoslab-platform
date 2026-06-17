# DECISÕES — OikosLab

Registro de decisões técnicas e econômicas (ADR — Architecture Decision Record).
Cada entrada: o que foi decidido, por quê, e o que foi descartado. Serve para não
refazer discussões e para fundamentar a defesa do projeto.

Formato: data · decisão · contexto · alternativas descartadas · consequências.

---

## D-001 · Arquitetura em duas camadas (Streamlit + Next.js/FastAPI)
**Data:** estabelecida no início do projeto.
**Decisão:** manter o Laboratório Didático em Streamlit e a Plataforma Econômica em
Next.js + FastAPI, como camadas separadas.
**Por quê:** Streamlit é imbatível para prototipar simuladores didáticos rápido; o
Next.js dá a base profissional (auth, projetos salvos, design) necessária para portfólio.
**Descartado:** unificar tudo em Streamlit (limitado para produto sério) ou reescrever
o didático em React agora (trabalho alto, baixo retorno imediato).
**Consequência:** dois deploys, mas cada ferramenta no que faz melhor. Ver D-010 sobre domínio.

## D-002 · Frontend e backend em repositórios separados
**Decisão:** `oikoslab-platform` (frontend, Vercel) e `oikoslab-backend` (backend, Railway)
são repos git distintos.
**Por quê:** deploys independentes, cada plataforma com seu pipeline.
**Consequência:** mudanças que cruzam camadas exigem dois commits/pushes. Atenção aos
submódulos dentro de `OIKOSLABOFICIAL`. Sempre `cd` na pasta certa.

## D-003 · Supabase para auth e dados, com RLS
**Decisão:** Supabase como backend de autenticação e banco (Postgres), com Row Level Security.
**Por quê:** auth pronta, Postgres real, storage para avatares, tudo integrado e gratuito no início.
**Consequência:** regras de RLS precisam ser mantidas; migrações de schema feitas em SQL revisável.

## D-004 · Design system dark com glassmorphism
**Decisão:** tema único dark (`#0b0f19`), cards `bg-white/5 border-white/10`, fonte Montserrat,
paleta de acentos fixa.
**Por quê:** identidade visual coesa e moderna; diferencia de dashboards genéricos.
**Descartado:** tema claro (algumas páginas nasceram assim, com classes `oikos-*`, e estão
sendo migradas).
**Consequência:** todo código novo segue o dark; páginas com `bg-white`/`oikos-*` são legado a migrar.

## D-005 · Simulador Dinâmico: modelo Novo-Keynesiano de 3 equações
**Data:** junho/2026.
**Decisão:** aposentar o IS-LM estático e adotar o modelo de 3 equações (IS dinâmica,
Curva de Phillips, Regra de Taylor) à la Carlin-Soskice / Galí.
**Por quê:** o IS-LM resolvido período a período é teoricamente datado (crítica de Lucas,
sem microfundamentos, juros exógenos via oferta de moeda). O modelo de 3 equações é o
padrão de ensino de mestrado, endogeniza juros (Taylor), conecta hiato e inflação
(Phillips) e incorpora expectativas. Eleva o projeto ao nível de pós-graduação.
**Descartado:** manter o IS-LM corrigido (paliativo); modelos DSGE completos (complexos demais
para o escopo didático).
**Consequência:** trabalha em inflação e hiato (não nível de preços). As escolas viraram
parametrizações reais. Validado com casos canônicos.

## D-006 · Escolas econômicas como parametrizações, não rótulos
**Decisão:** clássica/keynesiana/monetarista/pós-keynesiana são conjuntos de parâmetros
do mesmo modelo de 3 equações (rigidez da Phillips, eficácia monetária, expectativas,
pesos da regra de Taylor, histerese).
**Por quê:** pedagogicamente honesto — o aluno vê a mesma estrutura responder diferente
conforme as hipóteses, em vez de rótulos cosméticos.
**Consequência:** comparação de escolas vira "mesmo choque, parametrizações diferentes".
Histerese existe só na pós-keynesiana.

## D-007 · Parâmetros estruturais modificam coeficientes do modelo
**Decisão:** informalidade, crédito, desigualdade, setor público e tecnologia alteram
os coeficientes (α, β, a, θ) com justificativa teórica, em vez de serem decorativos.
**Por quê:** conecta a realidade estrutural de economias emergentes à dinâmica do modelo.
**Consequência:** ex.: informalidade reduz a eficácia da política monetária (α menor).

## D-008 · Construtor: endógenas detectadas automaticamente + sistemas simultâneos
**Data:** junho/2026.
**Decisão:** variável no lado esquerdo de uma equação é endógena (resolvida via `sympy.solve`);
símbolo que nunca é lado esquerdo é parâmetro. Resolver o sistema todo de uma vez.
**Por quê:** o sistema antigo avaliava expressões em sequência e obrigava o usuário a
cadastrar `Y=0, C=0` (gambiarra). A nova abordagem resolve Cruz Keynesiana, IS-LM, Solow
sem valores iniciais artificiais.
**Descartado:** avaliação sequencial com `eval` (frágil, não resolve simultaneidade).
**Consequência:** o usuário pensa no modelo, não na ordem de cálculo.

## D-009 · Multiplicadores por derivação analítica (não numérica)
**Decisão:** resolver o sistema também simbolicamente e usar `sympy.diff` para obter
`∂Y/∂G` etc. de forma exata.
**Por quê:** mais correto e elegante que variar numericamente; dá o multiplicador exato
(ex.: dY/dG = 1/(1−c)). Também gera as relações qualitativas (↑G → ↑Y) pelo sinal da derivada.
**Consequência:** painel de relações e multiplicadores sai "de graça" da solução simbólica.

## D-010 · Cenários Pré-calibrados calibram o modelo de 3 equações (não IS-LM)
**Data:** junho/2026 (decidido; implementação em curso).
**Decisão:** a calibração via World Bank deve mirar os parâmetros do modelo de 3 equações
(π_meta, r_natural, u_natural, β estimado, etc.), com transparência (fonte/qualidade de
cada parâmetro) e backtesting.
**Por quê:** coerência — o resto da plataforma fala 3 equações; calibrar o IS-LM antigo
criaria incoerência teórica. Transparência metodológica separa trabalho acadêmico de caixa-preta.
**Descartado:** manter a calibração do IS-LM existente.
**Consequência:** o módulo `economia_real.py` está sendo reescrito.

## D-011 · Graphify como camada de visualização futura
**Decisão:** preparar a troca de react-plotly.js por Graphify isolando a config de gráfico
e usando formato de dados neutro (`{x, y, nome}`), com um wrapper `<Grafico/>` único no futuro.
**Por quê:** evitar acoplamento da lib de gráfico às páginas, tornando a migração mecânica.
**Consequência:** novos gráficos seguem o formato neutro; tema herda o design system.

## D-012 · Ferramentas de desenvolvimento
**Decisão:** Claude Code para edições no VS Code; v0.dev para gerar componentes/design;
Vercel (auto-deploy) e Railway (com runtime.txt python-3.11.9).
**Por quê:** acelera iteração mantendo qualidade.
**Consequência:** CLAUDE.md documenta as convenções para o Claude Code seguir.

---

## Como registrar uma nova decisão
Acrescente uma entrada D-0XX com: data, decisão, por quê, o que foi descartado e a
consequência. Decisões não se apagam — se forem revertidas, registre a reversão como
nova entrada referenciando a anterior.