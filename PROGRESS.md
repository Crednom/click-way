# Progresso do Click Way

## Fase atual
Fase 4 — Admin: locais (criar/editar/excluir POI clicando no mapa, com modal de categoria/ícone/nome/descrição)

## Concluído
- [x] Fase 1 — Setup do projeto
- [x] Fase 2 — Base de navegação
- [x] Fase 3 — Admin: mapa e escala
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

## O que foi feito na Fase 2
- `src/index.css`: tokens de cor definidos — `--color-passenger` / `--color-admin`
  (e variantes `-bg`) para diferenciar visualmente os dois módulos, e
  `--color-severity-*` (informação/atenção/urgente) já preparados para a
  Fase 11 reaproveitar sem redefinir paleta depois.
- `src/app/RoleGate.tsx`: tela inicial com dois cartões grandes (área de toque
  ampla, mobile-first) para escolher "Sou passageiro" ou "Sou administrador".
  Ao escolher, salva o papel no store (Zustand) e navega para o módulo.
- `src/shared/components/AppHeader.tsx`: cabeçalho reutilizado pelos dois
  módulos, com botão "Trocar perfil" (limpa o papel e volta ao RoleGate — é o
  mecanismo usado depois pela simulação Admin → Passageiro no mesmo
  dispositivo).
- `src/features/passenger/HomeScreen.tsx`: placeholder do módulo Passageiro
  (só o layout base); conteúdo real (busca, categorias, QR) entra na Fase 7.
- `src/features/admin/AdminHome.tsx`: menu do módulo Admin listando as seções
  futuras e em qual fase cada uma é implementada.
- `src/app/routes.tsx`: rotas `/`, `/admin`, `/passageiro`, com um guard
  `RequireRole` que redireciona para `/` se o papel salvo no store não bater
  com o módulo acessado.
- `src/app/App.tsx` atualizado para renderizar `AppRoutes` (substitui o
  placeholder da Fase 1).
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` (oxlint) — todos
  limpos.

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
- 31/07/2026 — Criei `src/features/admin/AdminHome.tsx`, arquivo não listado na
  seção 6 do spec original. É uma tela-índice/menu do módulo admin — necessária
  porque nenhuma das telas reais de admin (MapUpload, PoiEditor etc.) existe
  ainda; sem ela, `/admin` não teria o que renderizar. Vai virar a "home" do
  módulo admin conforme as fases seguintes forem adicionando as seções reais.
- 31/07/2026 — O `role` no Zustand não é persistido (localStorage/sessionStorage)
  entre recarregamentos de página. Se o navegador for atualizado dentro de
  `/admin` ou `/passageiro`, o guard `RequireRole` manda de volta pro RoleGate,
  exigindo escolher o papel de novo. Optei por isso porque simplifica o fluxo
  de simulação (trocar de perfil sempre passa pela escolha explícita) e evita
  side-effects de sincronizar papel entre localStorage e o restante da store
  antes da hora. Se isso incomodar na prática, dá pra revisar depois.

## O que foi feito na Fase 3
- `src/shared/lib/coordinates.ts` (novo): conversão pixel↔percentual, distância
  entre pontos em percentual, `computeScale` (calcula `metersPerPercentUnit` a
  partir de dois pontos de referência + distância real) e
  `percentDistanceToMeters` (será usada nas Fases 6/8 para instruções de rota
  com distância real).
- `src/shared/lib/image.ts` (novo, não listado na seção 6 original — ver
  decisão abaixo): lê o arquivo enviado e, se passar de 2000px no maior lado,
  redimensiona via canvas antes de gerar o data URL (boa prática da seção 9).
- `src/shared/lib/storage.ts`: `getMap`/`saveMap` implementados de verdade
  (IndexedDB via `idb`, chave fixa `map-default`), e `getDefaultFloor` criado
  (Floor fixo `floor-default`, criado automaticamente na primeira leitura).
- `src/features/map/MapView.tsx` (novo): componente central do mapa — Leaflet
  com `CRS.Simple`, recebe a imagem da planta e desenha como overlay dentro de
  um plano cartesiano (não mapa geográfico). Já nasce reutilizável: aceita
  `markers` e `onMapClick`, que serão usados pelas Fases 4 (POIs) e 5 (grafo).
- `src/features/map/MapScaleTool.tsx` (novo): componente controlado com 3
  estados visuais (idle / escolhendo ponto A-B / digitando distância).
- `src/features/admin/MapUpload.tsx` (novo): tela real de "Mapa e escala" —
  upload/troca de planta, exibição via MapView, e a máquina de estados da
  escolha dos dois pontos de referência + distância real, que calcula e salva
  a escala.
- `src/app/routes.tsx`: rota `/admin/mapa` adicionada (protegida pelo mesmo
  guard `RequireRole expected="admin"`).
- `src/features/admin/AdminHome.tsx`: item "Mapa e escala" agora é um link de
  verdade para `/admin/mapa`; os demais continuam com selo "em breve" até
  serem implementados.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — todos limpos.
  **Atenção:** não tenho como testar a renderização do Leaflet num navegador
  de verdade neste ambiente (só validei tipo/build/lint) — o teste manual seu
  no navegador é o que confirma se o mapa aparece e responde a zoom/clique
  como esperado.

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
- 31/07/2026 — Criei `src/features/admin/AdminHome.tsx`, arquivo não listado na
  seção 6 do spec original. É uma tela-índice/menu do módulo admin — necessária
  porque nenhuma das telas reais de admin (MapUpload, PoiEditor etc.) existe
  ainda; sem ela, `/admin` não teria o que renderizar. Vai virar a "home" do
  módulo admin conforme as fases seguintes forem adicionando as seções reais.
- 31/07/2026 — O `role` no Zustand não é persistido (localStorage/sessionStorage)
  entre recarregamentos de página. Se o navegador for atualizado dentro de
  `/admin` ou `/passageiro`, o guard `RequireRole` manda de volta pro RoleGate,
  exigindo escolher o papel de novo. Optei por isso porque simplifica o fluxo
  de simulação (trocar de perfil sempre passa pela escolha explícita) e evita
  side-effects de sincronizar papel entre localStorage e o restante da store
  antes da hora. Se isso incomodar na prática, dá pra revisar depois.
- 31/07/2026 — Criei `src/shared/lib/image.ts`, arquivo não listado na seção 6
  original. Ficou separado de `MapUpload.tsx` porque é uma função utilitária
  pura (ler arquivo → comprimir → dataURL), reaproveitável se algum dia outro
  lugar do app precisar comprimir imagem (ex: ícone customizado de POI na Fase
  4).
- 31/07/2026 — MVP tem um único `MapImage`/`Floor` fixos: `storage.saveMap`
  força `id: 'map-default'` independente do que for passado, e
  `getDefaultFloor` sempre retorna/cria `floor-default`. Isso é intencional
  (seção 9: "MVP usa sempre um único Floor fixo") — só vira múltiplos registros
  se decidirmos implementar múltiplos andares no futuro (fora do MVP, seção
  10).

## Problemas conhecidos / pendências
- Renderização do Leaflet ainda não testada num navegador real (ver nota na
  Fase 3 acima) — depende da validação manual do usuário.
- As funções de domínio restantes em `storage.ts` (POIs, grafo, QR, viagens,
  notificações) seguem como stub — esperado até as fases correspondentes.

## Última atualização
31/07/2026
