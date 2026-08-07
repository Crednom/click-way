# Progresso do Click Way

## Fase atual
Fase 11 — Notificações (criação com severidade, simulação pelo admin, recebimento como toast colorido no passageiro, recálculo de rota em troca de plataforma)

## Concluído
- [x] Fase 1 — Setup do projeto
- [x] Fase 2 — Base de navegação
- [x] Fase 3 — Admin: mapa e escala
- [x] Fase 4 — Admin: locais
- [x] Fase 5 — Admin: grafo
- [x] Fase 6 — Roteamento (Dijkstra)
- [x] Fase 7 — Passageiro: busca e rota
- [x] ~~Fase 8 — Navegação passo a passo~~ (implementada e depois **revertida** a pedido do usuário — ver seção própria)
- [x] Fase 9 — QR Code
- [x] Fase 10 — Viagens
- [ ] Fase 11 — Notificações
- [ ] Fase 12 — Polimento

> **Nota sobre este arquivo:** já precisou ser reescrito do zero algumas
> vezes (Fase 4 e Fase 7/8) porque edições cirúrgicas num arquivo grande,
> feitas por mim, bagunçaram a ordem cronológica ou apagaram cabeçalhos por
> engano — sempre bug de edição do texto, nunca de código (o projeto em si
> nunca foi afetado). Nenhum conteúdo foi perdido nas reescritas, só
> reorganizado.

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
  IndexedDB (via `idb`) já funcional. As funções de domínio são stubs que
  lançam erro "não implementado", cada uma com comentário indicando em qual
  fase será implementada.
- `src/store/useAppStore.ts` criado com Zustand.
- `src/app/App.tsx` criado como placeholder mínimo (substituído na Fase 2).
- Validado com `npx tsc -b` e `npm run build`.

## O que foi feito na Fase 2
- `src/index.css`: tokens de cor — `--color-passenger` / `--color-admin` (e
  variantes `-bg`), e `--color-severity-*` (informação/atenção/urgente) já
  preparados para a Fase 11.
- `src/app/RoleGate.tsx`: tela inicial com dois cartões grandes para escolher
  "Sou passageiro" ou "Sou administrador".
- `src/shared/components/AppHeader.tsx`: cabeçalho com botão "Trocar perfil".
- `src/features/passenger/HomeScreen.tsx`: placeholder do módulo Passageiro
  (substituído pela tela real na Fase 7).
- `src/features/admin/AdminHome.tsx`: menu do módulo Admin.
- `src/app/routes.tsx`: rotas `/`, `/admin`, `/passageiro`, com guard
  `RequireRole`.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — limpos.

## O que foi feito na Fase 3
- `src/shared/lib/coordinates.ts`: conversão pixel↔percentual, distância entre
  pontos, `computeScale` e `percentDistanceToMeters`.
- `src/shared/lib/image.ts`: lê e comprime/redimensiona imagem antes de salvar.
- `src/shared/lib/storage.ts`: `getMap`/`saveMap` (IndexedDB, chave fixa
  `map-default`) e `getDefaultFloor` (Floor fixo `floor-default`).
- `src/features/map/MapView.tsx`: componente central do mapa — Leaflet com
  `CRS.Simple`, reutilizável (`markers`, `onMapClick`).
- `src/features/map/MapScaleTool.tsx`: ferramenta de configuração de escala.
- `src/features/admin/MapUpload.tsx`: tela "Mapa e escala" completa.
- `src/app/routes.tsx` / `AdminHome.tsx`: rota `/admin/mapa` linkada.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — limpos.

## O que foi feito na Fase 4
- `src/shared/lib/id.ts`: `generateId()`, reutilizado por POIs e futuras
  entidades (nós do grafo, QR, viagens, notificações).
- `src/shared/lib/storage.ts`: `getPois`/`savePoi`/`deletePoi` implementados
  (array em localStorage, chave `pois`).
- `src/features/map/MapView.tsx`: adicionado `onMarkerClick`.
- `src/features/admin/PoiFormModal.tsx`: bottom sheet de criar/editar local.
- `src/features/admin/PoiEditor.tsx`: tela em `/admin/locais` — mapa com POIs,
  botão "Adicionar local", lista abaixo do mapa (também clicável).
- `src/app/routes.tsx` / `AdminHome.tsx`: rota `/admin/locais` linkada.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — limpos.

## Correções e melhorias aplicadas após teste do usuário (ainda Fase 4)
Você testou a Fase 4 e reportou 3 problemas reais — todos corrigidos antes de
seguir pra Fase 5:

1. **Bug: o mapa (Leaflet) aparecia por cima do modal.** Corrigido criando
   `src/shared/lib/zIndex.ts` com constantes centralizadas
   (`Z_INDEX.modal = 2000`, acima do máximo usado pelo Leaflet, ~800).
2. **Marcador no mapa só tinha cor, sem ícone.** `MapView.tsx` trocou
   `L.circleMarker` por `L.marker` com `divIcon`, aceitando `iconHtml`
   (HTML pré-renderizado pelo chamador). Criado
   `src/shared/lib/poiIconHtml.tsx` com `renderPoiIconHtml()` (usa
   `renderToStaticMarkup` do react-dom/server).
3. **Pedido: categoria personalizada (nome + cor), e ícone customizado por
   local.**
   - **DESVIO no modelo de dados:** `Poi.category`/`PoiCategory` viraram
     `string` livre (eram union fechada de 13 valores). A union original
     continua só internamente em `poiCategories.ts` (renomeada
     `BuiltinCategoryId`, não exportada).
   - Novo tipo `Category`: `{ id, label, color, isCustom }`.
   - `storage.ts`: `getCategories()`/`saveCustomCategory()`.
   - `PoiFormModal.tsx`: grid de categorias + "+ Nova categoria" + upload de
     ícone customizado (`Poi.iconUrl`, via `loadAndCompressImage`
     parametrizada, `maxDimension: 128`, PNG).

Revalidado — 0 erros, 0 avisos.

**Nota sobre o tamanho do build:** registrado aqui desde a Fase 4 que o
bundle passaria de 500KB — hoje (Fase 9) já é bem maior ainda por causa do
`html5-qrcode`, ver nota na seção da Fase 9.

## Melhoria aplicada após novo teste do usuário (ainda Fase 4)
Nome do local só aparecia num tooltip de hover — ruim em touch/mobile.
`MapView.tsx` reescrito: nome sempre visível como "pill" no próprio
`L.divIcon`, com anti-colisão recalculada a cada zoom/arraste
(`MIN_LABEL_SPACING_PX = 68`, baseado em `map.latLngToContainerPoint`).

## O que foi feito na Fase 5
- `storage.ts`: `getGraphNodes`/`saveGraphNode`/`getGraphEdges`/
  `saveGraphEdge`/`deleteGraphEdge` implementados. Adicionado também
  `deleteGraphNode` (cascata: apaga arestas ligadas, desvincula POIs).
- **Pendência da Fase 4 resolvida:** `src/shared/lib/poiNodeLinking.ts` —
  `relinkAllPois()` recalcula `nearestNodeId` de todo POI pelo nó mais
  próximo, chamada automaticamente ao criar/remover um nó.
- `MapView.tsx`: suporte a `lines`/`onLineClick` (`L.polyline`).
- `src/features/graph/EdgeWeightForm.tsx` (novo): peso + tipo da aresta.
- `src/features/graph/GraphEditorView.tsx` (novo): tela em `/admin/grafo` —
  "Adicionar nó" / "Conectar nós", editar/remover aresta, excluir nó.
- Validado — 0 erros, 0 avisos.

## O que foi feito na Fase 6
- `src/features/routing/calculateRoute.ts` (novo): grafo `graphology` +
  `dijkstra.bidirectional` (namespace `dijkstra` — **atenção**: o pacote
  também exporta um `bidirectional` solto na raiz, que é a versão SEM peso;
  usar aquele por engano dá rota errada silenciosamente).
- Sem tela própria — motor de cálculo puro.
- **Validação real:** testes à parte (fora do projeto) confirmaram: menor
  peso mesmo quando não é o caminho mais direto; `null` para nós
  desconectados; origem = destino.

## O que foi feito na Fase 7
- `poiNodeLinking.findNearestNode` generalizada (aceita qualquer `Point`).
- `src/features/passenger/SearchBar.tsx`, `SearchResultsList.tsx` (novos).
- `HomeScreen.tsx` reescrita: busca + rota no mapa.
- Validado — 0 erros, 0 avisos.

**Duas decisões desta fase:**
1. Localização do passageiro seria manual (toque no mapa) até a Fase 9 —
   resolvido na própria Fase 9 (ver abaixo), toque manual manteve-se como
   alternativa.
2. Categorias de busca = categorias reais dos POIs (`getCategories()`), não
   a taxonomia fixa do documento original (Serviços/Banheiros/Alimentação/
   Compras/Embarque/Atendimento/Emergência).

## Correções aplicadas após 1º teste do usuário (ainda Fase 7)
1. **Mapa só aparecia depois de escolher destino.** `HomeScreen.tsx`
   reescrito: mapa sempre visível, busca/resultados/rota viram painéis
   flutuantes por cima (`Z_INDEX.overlay = 1000`, novo tier). `MapView.tsx`:
   `heightPx` aceita `number | string` (`"100%"`).
2. **Rota não saía do ponto exato, só do nó mais próximo.**
   `calculateRoute.ts` reescrito: `(fromPoint, toPoint)` em vez de
   `(fromNodeId, toNodeId)` — encaixa cada ponto na **aresta** mais próxima
   (projeção perpendicular, `projectPointOnSegment`), não no nó mais
   próximo, via um nó virtual inserido só pro cálculo (nunca salvo). Técnica
   padrão de apps de navegação reais ("snap to edge/road"). Caso especial
   quando origem/destino caem na mesma aresta. `Poi.nearestNodeId`/
   `relinkAllPois()` continuam existindo, mas não são mais usados pelo
   cálculo de rota em si.
   - **Validação real:** 3 testes à parte confirmaram a projeção, o caso de
     mesma aresta (usar o peso real da aresta, não a distância geométrica —
     descoberto testando que a via genérica pelo grafo dava um valor 80%
     maior que o correto) e o caso de arestas diferentes num corredor em L.

## Correções aplicadas após 2º teste do usuário (ainda Fase 7)
1. **Rota cortava por cima de construções.** Causa: encaixe na aresta mais
   próxima sem limite de distância. Corrigido com `MAX_SNAP_DISTANCE_PCT`
   (12): acima disso, a rota é recusada (`'muito-longe'`) em vez de desenhar
   uma linha sem sentido. `calculateRoute` passou a retornar
   `RouteCalculation` (`{ok,result|reason}`) com 3 motivos de falha
   (`sem-caminhos`, `muito-longe`, `sem-rota`).
2. **Locais só apareciam depois de buscar; pedido: sempre visíveis + clique
   no ícone traça rota.** `HomeScreen.tsx`: `browseMarkers` (todos os POIs,
   sempre visíveis em modo busca) + `onMarkerClick` define destino direto.
   - **Validação real:** teste à parte confirmou o limite rejeitando um
     ponto a 55 de distância e aceitando um a 5.

## Melhorias aplicadas após 3º teste do usuário (ainda Fase 7)
1. Filtro de categoria passou a afetar também o mapa (`browseMarkers`), não
   só a lista de busca.
2. `src/features/passenger/CategoryFilterModal.tsx` (novo): grade responsiva
   com todas as categorias, aberta por um botão "Ver todas" quando há mais
   de `MAX_INLINE_CATEGORIES` (4) — evita poluir a fileira de chips.

## Fase 8 — implementada e depois revertida
A Fase 8 (navegação passo a passo: `calculateRoute` ganhando `segments`
tipados, `generateInstructions.ts`, `StepByStepView.tsx`, botão "Ver passo a
passo" na `HomeScreen`) foi implementada e validada (inclusive com testes
reais de geometria/mesclagem de instruções, incluindo a convenção de
esquerda/direita no nosso sistema de coordenadas com y crescendo pra baixo).

Depois de conversar sobre o valor real disso pro projeto, você decidiu
remover — o app não tem localização contínua (sem GPS/QR narrando em tempo
real), então instruções em texto acabavam sendo só uma descrição estática da
rota, redundante com a linha já desenhada no mapa. O diferencial técnico real
do projeto (grafo + Dijkstra + encaixe preciso na aresta) já não dependia
disso.

**Revertido por completo:** `generateInstructions.ts` e `StepByStepView.tsx`
apagados; `calculateRoute.ts` voltou a não ter `segments` (RouteResult
voltou a `{ points, totalDistance, nodeIds }`); `HomeScreen.tsx` voltou a não
ter o botão "Ver passo a passo" nem o estado/import relacionados. Não ficou
nenhum código morto — se isso for reconsiderado no futuro, dá pra
reconstruir do zero olhando esta nota.

## O que foi feito na Fase 9
- `storage.ts`: `getQrCodeLinks`/`saveQrCodeLink` implementados. Adicionado
  também `deleteQrCodeLink` (não estava nos stubs originais — mesmo padrão
  de CRUD completo já usado em POIs e grafo).
- `src/features/qrcode/QrGenerator.tsx` (novo): gera e mostra o QR Code de
  um POI ou nó — reaproveitado nos dois fluxos decididos ainda no
  planejamento (seção 2.1 do spec: "Gerar QR Code" em vez de "Associar QR
  Code"). Valor codificado: `CLICKWAY:LOC:{code}` (prefixo pra distinguir de
  QR Codes de outros apps na hora de escanear). Botão "Baixar / Imprimir" e
  "Gerar novo código" (invalida o QR já impresso).
  - **Fluxo rápido** (via POI): `PoiFormModal.tsx` ganhou a seção de QR
    Code, visível só quando `isEditing` (precisa de um id já salvo). Novo
    prop `poiId` repassado por `PoiEditor.tsx`.
  - **Fluxo avançado** (via nó do grafo): o painel que já existia em
    `GraphEditorView.tsx` (ao tocar num nó em modo idle) ganhou a seção de
    QR Code, junto da opção de excluir o nó — cobre pontos de localização
    pura (corredores, cruzamentos) que não são POIs.
- `src/features/admin/QrCodeManager.tsx` (novo): tela em `/admin/qrcodes` —
  lista todos os QR Codes já gerados (prévia + local/nó de destino +
  excluir). Não gera QR Code aqui, só visão geral — geração acontece nos
  dois fluxos acima.
- `src/features/qrcode/QrScanner.tsx` (novo): usa `html5-qrcode`
  (`Html5Qrcode`, `facingMode: 'environment'` pra câmera traseira) pra ler o
  QR Code, resolve pro ponto real (posição do POI ou do nó) e entrega via
  callback `onLocationFound`. QR Codes que não começam com o prefixo do
  Click Way são ignorados silenciosamente (continua escaneando); códigos com
  prefixo certo mas não encontrados no armazenamento mostram uma mensagem
  ("não corresponde a nenhum local cadastrado").
- `SearchBar.tsx`: botão de QR Code (antes só visual, `opacity: 0.6`, "Em
  breve") virou funcional — abre o `QrScanner`.
- `HomeScreen.tsx`:
  - Ao escanear com sucesso, preenche `originPoint` automaticamente (mesmo
    mecanismo que já existia pro toque manual — QR só automatiza o mesmo
    fluxo, não substitui).
  - **Mudança de UX:** tocar no mapa ou escanear QR pra indicar "estou aqui"
    agora funciona a qualquer momento (antes só era possível depois de
    escolher um destino) — reflete melhor o fluxo real (passageiro entra no
    terminal, escaneia pra saber onde está, só depois decide pra onde ir).
    O marcador "Você está aqui" aparece também no modo busca agora, não só
    no modo rota.
  - Botão de QR Code adicional na instrução de localização (banner que pede
    "toque no mapa"), já que a barra de busca principal (onde fica o botão
    de QR) some quando um destino já foi escolhido.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
  avisos.
- **Validação real parcial:** a geração de QR Code (biblioteca `qrcode`) é
  testável fora do navegador — rodei um teste à parte confirmando que
  `QRCode.toDataURL()` gera uma imagem PNG válida a partir do texto
  esperado. **A leitura por câmera (`html5-qrcode`) não dá pra testar neste
  ambiente** — depende de hardware de câmera real e permissão do navegador,
  só valida de verdade no seu celular/computador.

**Nota sobre o tamanho do build:** o bundle deu um salto grande nesta fase
(de ~717KB pra ~1117KB minificado) por causa do `html5-qrcode`, que é uma
biblioteca pesada (inclui decodificação própria + fallback zxing). Já era um
item registrado pra Fase 12 (Polimento) considerar `import()` dinâmico só
quando as telas que usam Leaflet/QR são abertas — agora com mais peso ainda
nessa balança.

## O que foi feito na Fase 10
- **DESVIO no modelo de dados:** `Sector` e `Platform` (entidades separadas
  na seção 5 original) foram removidas. Nunca viraram uma fase própria no
  roadmap, e desde a Fase 4 já existe a categoria de POI 'plataforma' —
  manter `Platform` como entidade separada duplicaria o mesmo conceito
  (nome/label de uma plataforma) em dois lugares. `Trip.platformId` agora
  referencia diretamente o id de um `Poi` com `category === 'plataforma'`.
- `storage.ts`: `getSectors`/`getPlatforms` removidos (não deixados como
  stub — não fazem mais sentido dado o desvio acima). `getTrips`/`saveTrip`
  implementados; adicionado também `deleteTrip` (não estava nos stubs
  originais, mesmo padrão de CRUD completo das demais entidades).
- `src/shared/lib/tripStatus.ts` (novo): rótulo + cor de cada um dos 5
  status de viagem — reaproveitado pelo admin e pelo passageiro, mesmo
  padrão de `poiCategories.ts`.
- `src/features/admin/TripFormModal.tsx` (novo): bottom sheet de
  criar/editar viagem — empresa, destino, horário (`<input type="time">`),
  plataforma (select com os POIs categoria 'plataforma') e status.
- `src/features/admin/TripManager.tsx` (novo): tela em `/admin/viagens` —
  lista de viagens cadastradas (com badge de status colorido) + botão "Nova
  viagem". Se não houver nenhum POI categoria 'plataforma' ainda, mostra
  aviso com link pra `/admin/locais` em vez de uma tela vazia sem contexto.
- `src/features/passenger/TripInfoSheet.tsx` (novo): bottom sheet com
  Empresa/Destino/Horário/Status (exatamente como pedido na seção 2.2 do
  spec), com um botão "Traçar rota até aqui".
- `HomeScreen.tsx`: a lógica de seleção de POI foi unificada num só ponto de
  entrada (`handlePoiSelected`, usado tanto pelo clique no mapa quanto pela
  busca) — se o local tocado for uma plataforma **com viagem cadastrada**,
  mostra a ficha de informações antes de traçar rota; caso contrário
  (qualquer outro local, ou uma plataforma sem viagem associada), define
  como destino direto, como já acontecia.
- `src/app/routes.tsx` / `AdminHome.tsx`: rota `/admin/viagens` linkada.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
  avisos. Ressalva de sempre: interação real (formulário de viagem, tocar
  numa plataforma pra ver a ficha) não testada num navegador de verdade
  neste ambiente.

## Melhoria: viagem ativa do passageiro (pedido do usuário, pós-Fase 10)
Como o MVP não tem fluxo de compra de passagem, faltava um jeito do
passageiro "escolher" qual viagem é a dele, pra poder demonstrar o fluxo
completo (ir direto pra sua plataforma, ver ela destacada no mapa).

- `storage.ts`: `getActiveTripId()`/`setActiveTripId()` (novo) — guardam só
  o **id** da viagem, nunca os dados dela. Isso é o que garante o requisito
  "se a viagem for editada pelo admin, o passageiro reflete automaticamente"
  — a cada leitura, os dados vêm frescos de `getTrips()`.
- `src/features/map/MapView.tsx`: `MapViewMarker` ganhou `highlighted?:
  boolean` — marcador maior (36px em vez de 28px), borda dourada e animação
  pulsante (`clickway-marker-pulse`, `@keyframes` novo em `index.css` — não
  dava pra fazer só com estilo inline, já que o HTML do marcador do Leaflet
  é uma string crua). Genérico o suficiente pra qualquer destaque futuro, não
  só viagem ativa.
- `src/features/passenger/TripSelectorModal.tsx` (novo): lista todas as
  viagens cadastradas, com a ativa destacada; permite trocar ou remover a
  seleção. Uma das duas formas de escolher a viagem ativa.
- `TripInfoSheet.tsx`: ganhou `isActive`/`onSetActive` — botão "★
  Selecionar como minha viagem" quando ainda não é a ativa, ou um indicador
  "★ Esta é a sua viagem ativa" quando já é. A outra forma de escolher.
- `HomeScreen.tsx`:
  - Card "Minha viagem" na tela de busca (só quando não está buscando
    ativamente, pra não competir com os resultados): mostra a viagem ativa
    + botão **"Ir para minha plataforma"** (define a plataforma como
    destino direto, reaproveitando o fluxo de rota já existente), ou, se
    não houver viagem ativa (ou ela tiver sido removida/plataforma
    inválida), uma mensagem + botão "Selecionar viagem".
  - O marcador da plataforma da viagem ativa aparece destacado tanto no
    modo busca quanto no modo rota (se ela virar o destino) — sempre
    visível enquanto houver uma viagem ativa, mesmo sem rota calculada,
    como pedido.
  - **Sincronização entre abas:** registrado um listener
    (`onExternalStorageChange`, helper que já existia desde a Fase 1,
    pensado exatamente pra isso) que recarrega viagens + viagem ativa
    sempre que o localStorage muda numa aba diferente do mesmo navegador —
    cobre o caso de o admin editar a viagem (ex: trocar plataforma) numa
    aba enquanto o passageiro está aberto em outra, sem precisar recarregar
    a página manualmente.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
  avisos. Ressalva de sempre: interação real (destaque pulsante, troca de
  viagem, sincronização entre abas) não testada num navegador de verdade
  neste ambiente.

## Decisões tomadas ao longo do caminho (lista única, consolidada)
- Adicionei `graphology-types` como dependência direta, não listada na seção
  3 do spec — peer dependency obrigatória do `graphology-shortest-path`.
- Criei `src/shared/types/index.ts` já na Fase 1 (a seção 6 já listava esse
  arquivo na estrutura de pastas; os stubs de `storage.ts` precisavam de
  tipos corretos).
- `App.tsx` movido para `src/app/App.tsx` (Vite cria em `src/App.tsx` por
  padrão); `main.tsx` ajustado.
- Criei `src/features/admin/AdminHome.tsx` (não listado na seção 6) — tela-
  índice do módulo admin.
- `role` no Zustand não é persistido entre recarregamentos — recarregar
  dentro de `/admin` ou `/passageiro` volta pro RoleGate.
- Criei `src/shared/lib/image.ts` (não listado na seção 6) — reaproveitado
  depois pelo upload de ícone de POI.
- MVP tem um único `MapImage`/`Floor` fixos (`map-default`/`floor-default`).
- **DESVIO:** `Poi.nearestNodeId` virou opcional (Fase 4 cria POIs antes da
  Fase 5 criar o grafo) — resolvido com `relinkAllPois()` (Fase 5).
- Criei `src/shared/lib/id.ts`, `zIndex.ts`, `poiIconHtml.tsx` — utilitários
  não listados na seção 6, baixo risco.
- **DESVIO (revisão Fase 4):** `PoiCategory` virou `string` livre + novo tipo
  `Category`, pra categorias personalizadas.
- Ícone de POI: automático por categoria, com upload customizado
  sobrepondo quando presente.
- Criei `src/shared/lib/poiNodeLinking.ts` (Fase 5).
- **DESVIO (Fase 7):** localização do passageiro manual até virar automática
  também via QR na Fase 9 (toque manual mantido como alternativa).
- **DESVIO (Fase 7):** categorias de busca = categorias do admin.
- **DESVIO (revisão Fase 7, 1º teste):** `calculateRoute` passou a receber
  pontos em vez de ids de nó, com encaixe na aresta mais próxima.
- **DESVIO (revisão Fase 7, 2º teste):** `calculateRoute` passou a retornar
  `RouteCalculation` com motivo de falha, e ganhou `MAX_SNAP_DISTANCE_PCT`.
- Criei `src/features/passenger/CategoryFilterModal.tsx` (revisão Fase 7, 3º
  teste) — não listado na seção 6.
- **Fase 8 implementada e depois revertida por completo** — ver seção
  própria acima. Não ficou nenhum resquício no código.
- Criei `src/features/admin/QrCodeManager.tsx` (Fase 9) — não listado
  explicitamente na seção 6 com esse nome exato, mas a ideia de uma "visão
  geral de todos os QR gerados" já estava prevista desde o planejamento.
- Adicionei `deleteQrCodeLink` (Fase 9) — não estava nos stubs originais,
  mesmo padrão de CRUD completo das demais entidades.
- **Mudança de UX (Fase 9):** indicar "estou aqui" (toque ou QR) passou a
  funcionar a qualquer momento, não só depois de escolher destino.
- **DESVIO (Fase 10):** `Sector`/`Platform` removidos do modelo de dados —
  `Trip.platformId` referencia diretamente um `Poi` categoria 'plataforma'.
  Ver "O que foi feito na Fase 10" para o detalhe completo.
- Adicionei o conceito de "viagem ativa do passageiro" (pós-Fase 10, pedido
  do usuário) — não estava no spec original nem no roadmap, mas é necessário
  porque o MVP não tem fluxo de compra de passagem. `MapViewMarker` ganhou
  `highlighted` como campo genérico (não específico de viagem).

## Problemas conhecidos / pendências
- A melhoria de "viagem ativa" (card na tela, destaque pulsante no mapa,
  seletor, sincronização entre abas) ainda não foi testada por você no
  navegador.
- A Fase 10 (viagens) também segue pendente de teste: formulário de viagem,
  tela de listagem e a ficha ao tocar numa plataforma.
- A Fase 9 (QR Code) também segue pendente de teste: geração de imagem
  validada com teste real fora do navegador; leitura por câmera não dá pra
  testar neste ambiente de jeito nenhum — só no seu dispositivo.
- Se o admin tiver POIs cadastrados longe de qualquer nó/aresta do grafo, a
  rota é recusada com "muito longe" — esperado (Fase 7, 2º teste), não é bug.
- Bundle final em ~1127KB minificado (aviso do Vite) — não bloqueante, mas
  cresceu bastante desde o `html5-qrcode` (Fase 9); possível item de
  polimento na Fase 12 (code splitting).
- Funções de domínio restantes em `storage.ts` (notificações) seguem como
  stub — esperado até a Fase 11.

## Última atualização
04/08/2026
