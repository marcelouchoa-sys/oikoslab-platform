# ROADMAP — OikosLab

Planejamento de evolução do projeto. Organizado por fases, da base ao longo prazo.
Marque com `[x]` o que for concluído. Datas são alvo, não promessa.

---

## Estado atual (junho/2026)
Plataforma em duas camadas funcionando. Os três tipos de projeto existem e foram
aprimorados com rigor teórico:
- Simulador Dinâmico → modelo Novo-Keynesiano de 3 equações (trajetória, IRF, comparação de escolas).
- Construtor de Funções → resolve sistemas simultâneos, blocos prontos, sensibilidade, multiplicadores.
- Cenários Pré-calibrados → em migração para calibrar o modelo de 3 equações.

---

## Fase 1 — Consolidação dos três pilares (em curso)
Objetivo: os três tipos de projeto sólidos, coerentes entre si e bem testados.

- [x] Simulador Dinâmico: substituir IS-LM pelo modelo de 3 equações.
- [x] Simulador Dinâmico: IRF e comparação de escolas.
- [x] Construtor: detecção de endógenas + sistemas simultâneos.
- [x] Construtor: biblioteca de blocos e modelos prontos.
- [x] Construtor: sensibilidade e multiplicadores analíticos.
- [x] Migração visual das páginas internas para o tema dark.
- [x] Perfil com upload de avatar e links acadêmicos.
- [ ] Cenários Pré-calibrados: calibrar o modelo de 3 equações a partir do World Bank.
- [ ] Cenários Pré-calibrados: backtesting (modelo vs realidade) e transparência metodológica.
- [ ] Cenários Pré-calibrados: cenários nomeados com narrativa (Brasil, Argentina, etc.).
- [ ] Conectar calibração do World Bank → alimentar o Simulador Dinâmico com país real.
- [ ] Seção de fundamentação teórica visível dentro do Simulador (as 3 equações explicadas).

## Fase 2 — Profundidade analítica
Objetivo: elevar do nível graduação ao nível de pesquisa.

- [ ] Choques permanentes (mudam o equilíbrio, não só desvio temporário).
- [ ] Deslocamento endógeno dos naturais (r_natural, u_natural) configurável por escola.
- [ ] Bandas estocásticas / Monte Carlo no Simulador (intervalos de confiança).
- [ ] Construtor: mais modelos prontos (IS-LM completo, Solow dinâmico, Harrod-Domar, Kalecki, Goodwin).
- [ ] Construtor: validação de equações em tempo real com feedback no editor.
- [ ] Exportação PDF acadêmica de verdade (equações em LaTeX renderizado, não imagem).

## Fase 3 — Experiência e visualização
Objetivo: a plataforma parecer e funcionar como produto profissional.

- [ ] Integrar Graphify substituindo/complementando react-plotly.js (wrapper único `<Grafico/>`).
- [ ] Tema de gráficos unificado herdando o design system.
- [ ] Responsividade mobile das páginas de simulação.
- [ ] Onboarding/tour guiado para novos usuários.
- [ ] Blog econômico real (publicação, não mock).

## Fase 4 — Comunidade e compartilhamento
Objetivo: a plataforma como espaço de colaboração acadêmica.

- [ ] Compartilhamento de projetos com permissões (já há tabela `compartilhamentos`).
- [ ] Galeria de modelos públicos (professores/alunos publicam modelos).
- [ ] Comentários/revisão em modelos compartilhados.
- [ ] Modelos criados por professores como material de aula.

## Fase 5 — Infra e profissionalização
Objetivo: pronto para portfólio internacional e uso real.

- [ ] Domínio próprio (raiz → Vercel, subdomínio lab → Streamlit).
- [ ] SEO e indexação no Google.
- [ ] Monitoramento de erros e analytics de uso.
- [ ] Documentação pública (como usar, fundamentação dos modelos).
- [ ] Versão em inglês (para aplicações no exterior).

---

## Princípios que guiam o roadmap
- Rigor teórico antes de recurso visual. Um modelo correto com gráfico simples vale
  mais que um modelo frágil com gráfico bonito.
- Coerência entre os módulos: o mesmo arcabouço teórico atravessa a plataforma.
- O usuário pensa em economia, a plataforma cuida da computação.
- Cada recurso deve fortalecer o projeto como peça de portfólio acadêmico.