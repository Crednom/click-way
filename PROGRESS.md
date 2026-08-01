# Progresso do Click Way

## Fase atual
Fase 2 — Base de navegação (RoleGate, rotas /admin e /passageiro, layout mobile-first)

## Concluído
- [x] Fase 1 — Setup do projeto
- [ ] Fase 2 — Base de navegação
- [ ] Fase 3 — Admin: mapa e escala
- [ ] Fase 4 — Admin: locais
- [ ] Fase 5 — Admin: grafo
- [ ] Fase 6 — Roteamento (Dijkstra)
- [ ] Fase 7 — Passageiro: busca e rota
- [ ] Fase 8 — Navegação passo a passo
- [ ] Fase 9 — QR Code
- [ ] Fase 10 — Viagens
- [ ] Fase 11 — Notificações
- [ ] Fase 12 — Polimento

## O que foi feito na Fase 1
- Projeto criado com `npm create vite@latest -- --template react-ts`.
- Dependências de produção instaladas: `react-router-dom`, `zustand`, `leaflet`,
  `graphology`, `graphology-shortest-path`, `graphology-types` (peer dependency
  exigida pelo shortest-path), `html5-qrcode`, `qrcode`, `react-icons`,
  `react-toastify`, `idb`.
- Dependências de tipos instaladas: `@types/leaflet`, `@types/qrcode` (`graphology`
  e `graphology-shortest-path` já vêm com `.d.ts` embutido, não precisam de
  `@types/*` separado).
- `tsconfig.app.json` ajustado para `"strict": true` explícito (exigido pela
  seção 9 do spec).
- Estrutura de pastas criada exatamente como a seção 6 do spec (pastas ainda
  vazias receberam `.gitkeep` para serem versionadas no git).
- `src/shared/types/index.ts` criado com o modelo de dados completo da seção 5.
- `src/shared/lib/storage.ts` criado: infraestrutura genérica de localStorage/
  IndexedDB (via `idb`) já funcional, incluindo `onExternalStorageChange` (usado
  depois pela Fase 11 para a simulação admin→passageiro). As funções de domínio
  (`getPois`, `saveMap`, `getGraphNodes` etc.) são stubs que lançam erro
  "não implementado", cada uma com um comentário indicando em qual fase será
  implementada — não implementei regra de negócio antes de existir tela que a
  use.
- `src/store/useAppStore.ts` criado com Zustand: `role` já funcional; `activeRoutePath`
  e `notifications` têm o formato definido mas ainda não são usados por nenhuma tela.
- `src/app/App.tsx` criado como placeholder mínimo (só confirma que o setup
  funciona) — **será substituído pelo `RoleGate.tsx` na Fase 2**, não é a tela
  final.
- Validado com `npx tsc -b` (typecheck limpo) e `npm run build` (build de
  produção OK).

## Decisões tomadas ao longo do caminho
- 31/07/2026 — Adicionei `graphology-types` como dependência direta, não listada
  explicitamente na seção 3 do spec. É uma peer dependency obrigatória de
  `graphology-shortest-path` (usada para tipar o grafo no TypeScript); sem ela o
  build falha. Não é uma biblioteca nova de fato, é parte do ecossistema
  `graphology` já escolhido.
- 31/07/2026 — Criei `src/shared/types/index.ts` já na Fase 1, mesmo o roadmap não
  citando esse arquivo explicitamente nela. A seção 6 do spec já lista esse
  arquivo como parte da estrutura de pastas, e as funções stub de `storage.ts`
  precisavam de tipos para terem assinaturas corretas. Não adiciona nenhuma
  lógica de negócio antes da hora, só o contrato de dados.
- 31/07/2026 — `App.tsx` foi movido para `src/app/App.tsx` (fora do padrão do
  Vite, que cria em `src/App.tsx`), para bater com a estrutura da seção 6.
  `main.tsx` foi ajustado para importar do novo caminho.

## Problemas conhecidos / pendências
- Nenhum no momento. Todas as funções de domínio em `storage.ts` estão
  propositalmente incompletas (stub) — não é bug, é o esperado até as fases
  correspondentes.

## Última atualização
31/07/2026
