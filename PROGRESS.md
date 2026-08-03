# Progresso do Click Way

## Fase atual
Fase 8 — Navegação passo a passo (transformar o caminho do grafo em instruções textuais com distância real)

## Concluído
- [x] Fase 1 — Setup do projeto
- [x] Fase 2 — Base de navegação
- [x] Fase 3 — Admin: mapa e escala
- [x] Fase 4 — Admin: locais
- [x] Fase 5 — Admin: grafo
- [x] Fase 6 — Roteamento (Dijkstra)
- [x] Fase 7 — Passageiro: busca e rota
- [ ] Fase 8 — Navegação passo a passo
- [ ] Fase 9 — QR Code
- [ ] Fase 10 — Viagens
- [ ] Fase 11 — Notificações
- [ ] Fase 12 — Polimento

> **Nota sobre este arquivo:** até a revisão da Fase 4, a seção de decisões
> estava sendo reescrita inteira a cada fase (bug de edição, não de código) e
> se repetia várias vezes no arquivo; foi consolidada então. Na Fase 7, o
> mesmo tipo de bug de edição bagunçou a ordem cronológica das seções (o
> conteúdo estava certo, só fora de ordem). Esta é uma reescrita completa,
> nesta ordem, sem esse problema — nenhum conteúdo foi perdido.

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
  pontos, `computeScale` e `percentDistanceToMeters` (uso futuro nas Fases 6/8).
- `src/shared/lib/image.ts`: lê e comprime/redimensiona imagem antes de salvar.
- `src/shared/lib/storage.ts`: `getMap`/`saveMap` (IndexedDB, chave fixa
  `map-default`) e `getDefaultFloor` (Floor fixo `floor-default`).
- `src/features/map/MapView.tsx`: componente central do mapa — Leaflet com
  `CRS.Simple`, reutilizável (`markers`, `onMapClick`).
- `src/features/map/MapScaleTool.tsx`: ferramenta de configuração de escala.
- `src/features/admin/MapUpload.tsx`: tela "Mapa e escala" completa.
- `src/app/routes.tsx` / `AdminHome.tsx`: rota `/admin/mapa` linkada.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — limpos.
  Ressalva: sem como testar a renderização do Leaflet num navegador real
  neste ambiente — depende de validação manual.

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

1. **Bug: o mapa (Leaflet) aparecia por cima do modal.** Causa: os controles
   do Leaflet (botões de zoom) usam z-index até 800 por padrão, e o modal
   estava em z-index 100. Corrigido criando `src/shared/lib/zIndex.ts` com
   constantes centralizadas (`Z_INDEX.modal = 2000`) — qualquer modal futuro
   deve usar essa constante em vez de um número solto, pra não repetir o bug.
2. **Marcador no mapa só tinha cor, sem ícone.** `MapView.tsx` trocou
   `L.circleMarker` por `L.marker` com `divIcon`, aceitando um novo campo
   opcional `iconHtml` no `MapViewMarker` (HTML pré-renderizado pelo
   chamador — o MapView continua genérico, sem saber o que é um POI). Criado
   `src/shared/lib/poiIconHtml.tsx` com `renderPoiIconHtml()`, que usa
   `renderToStaticMarkup` (react-dom/server) pra transformar o ícone
   React/SVG em string HTML utilizável pelo Leaflet.
3. **Pedido: categoria personalizada (nome + cor) além das 13 de fábrica, e
   ícone customizado por local.** Mudanças:
   - **DESVIO no modelo de dados:** `Poi.category`/`PoiCategory` eram uma
     union fechada de 13 valores — viraram `string` livre. A union original
     continua existindo, mas só internamente em `poiCategories.ts` (não
     exportada, renomeada `BuiltinCategoryId`), usada apenas pra dar
     segurança de tipo ao escrever o seed das 13 categorias de fábrica.
   - Novo tipo `Category` em `shared/types/index.ts`: `{ id, label, color,
     isCustom }`.
   - `storage.ts`: `getCategories()` (mescla fábrica + personalizadas) e
     `saveCustomCategory()` — personalizadas ficam em localStorage na chave
     `categories:custom`.
   - `PoiFormModal.tsx`: grid de categorias vem de `getCategories()`, com
     botão "+ Nova categoria" (nome + `<input type="color">`).
   - `PoiFormModal.tsx` ganhou upload de ícone customizado por local (campo
     `Poi.iconUrl`, que já existia no modelo mas não tinha UI): usa
     `loadAndCompressImage` (agora parametrizada com
     `maxDimension`/`quality`/`outputFormat`) com `maxDimension: 128` e saída
     em PNG. Se o POI tiver `iconUrl`, ele tem prioridade sobre o ícone da
     categoria em todo lugar (marcador do mapa, lista, prévia no modal).
   - `PoiCategoryIcon.tsx`: categorias sem ícone próprio caem num ícone
     genérico (`FaLocationDot`).

Revalidado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
avisos.

**Nota sobre o tamanho do build:** o Vite avisa que o chunk final passou de
500KB minificado, por causa do `react-dom/server` + Leaflet somados. Não é
erro, é só informativo — não vou otimizar isso agora (MVP acadêmico, bundle
size não é prioridade). Registrado como possível item da Fase 12
(Polimento): `import()` dinâmico do Leaflet/react-dom-server só quando as
telas que os usam forem abertas.

## Melhoria aplicada após novo teste do usuário (ainda Fase 4)
Nome do local só aparecia num tooltip de hover — ruim em touch/mobile. Pedido:
nome sempre visível ao lado do ícone (como no Google Maps), cuidando pra não
poluir visualmente quando dois pontos estão próximos.

`src/features/map/MapView.tsx` reescrito:
- Removido `bindTooltip` (hover). O nome agora faz parte do próprio
  `L.divIcon` do marcador — um "pill" branco ao lado do círculo colorido,
  sempre visível, sem depender de hover/toque.
- Anti-colisão: a cada redesenho (incluindo a cada zoom/arraste — evento
  `zoomend moveend` do Leaflet), cada marcador calcula sua posição em pixels
  de tela (`map.latLngToContainerPoint`). Um nome só é desenhado se estiver a
  pelo menos `MIN_LABEL_SPACING_PX` (68px) de distância de outro nome já
  desenhado nessa mesma passada; caso contrário, mostra só o ícone (sem
  nome). Isso precisa ser recalculado a cada zoom porque a distância em
  pixels entre dois pontos do mapa muda conforme o zoom (dois POIs que
  colidem zoomado longe podem não colidir mais ao aproximar).
- A ordem de prioridade de quem "ganha" o nome quando há colisão é a ordem
  do array `markers` recebido (primeiro a desenhar, primeiro a garantir o
  nome). Não há prioridade por categoria/importância — se isso importar no
  futuro (ex: sempre priorizar plataformas), dá pra ordenar o array antes de
  passar pro MapView.

Revalidado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
avisos.

## O que foi feito na Fase 5
- `src/shared/lib/storage.ts`: `getGraphNodes`/`saveGraphNode`/`getGraphEdges`/
  `saveGraphEdge`/`deleteGraphEdge` implementados (localStorage, chaves
  `graphNodes`/`graphEdges`). Adicionado também `deleteGraphNode` (não estava
  nos stubs originais da Fase 1) — remove o nó, e em cascata apaga as arestas
  que o usavam e desvincula (`nearestNodeId = undefined`) qualquer POI que
  apontava pra ele.
- **Pendência da Fase 4 resolvida:** `src/shared/lib/poiNodeLinking.ts`
  (novo) — `relinkAllPois()` recalcula o `nearestNodeId` de todo POI pelo nó
  de grafo mais próximo (distância percentual, `coordinates.percentDistance`).
  Chamada automaticamente sempre que um nó é criado ou removido em
  `GraphEditorView.tsx` — não é uma ação manual do admin, fica sempre
  consistente sozinho.
- `src/features/map/MapView.tsx`: adicionado suporte a `lines`/`onLineClick`
  (arestas desenhadas como `L.polyline`), mantendo o componente genérico —
  reaproveitado sem tocar na lógica de marcadores/anti-colisão de nomes.
- `src/features/graph/EdgeWeightForm.tsx` (novo): painel de criar/editar
  aresta — peso (com sugestão calculada pela escala, se configurada) e tipo
  (corredor/escada/escada rolante/elevador).
- `src/features/graph/GraphEditorView.tsx` (novo): tela em `/admin/grafo` —
  dois modos alternáveis ("Adicionar nó" / "Conectar nós"); tocar num nó em
  modo conexão seleciona-o (destaca na cor do admin), tocar num segundo nó
  abre o formulário de peso (criando ou editando, se já existir aresta entre
  os dois); tocar numa aresta (linha) também abre o formulário para editar;
  tocar num nó em modo idle abre confirmação de exclusão (cascata explicada
  acima).
- `src/app/routes.tsx` / `AdminHome.tsx`: rota `/admin/grafo` linkada.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
  avisos. Mesma ressalva de sempre: sem como testar a interação real no mapa
  (criar nó, conectar, editar peso, excluir com cascata) num navegador de
  verdade neste ambiente — depende da validação manual.

## O que foi feito na Fase 6
- `src/features/routing/calculateRoute.ts` (novo): monta um grafo
  `graphology` a partir de `getGraphNodes()`/`getGraphEdges()` e calcula o
  menor caminho entre dois nós com `dijkstra.bidirectional` (do namespace
  `dijkstra` de `graphology-shortest-path` — **atenção documentada no próprio
  código:** esse pacote também exporta um `bidirectional` solto na raiz do
  módulo, mas é a versão sem peso (BFS); usar aquele por engano dá uma rota
  "com menos saltos" em vez de "mais curta de verdade", sem nenhum erro de
  tipo ou runtime pra avisar). Retorna `{ nodeIds, totalWeight }` ou `null` se
  não houver caminho entre os nós (grafo desconectado nesse trecho).
- **Esta fase não tem tela própria** — é só o motor de cálculo, consumido a
  partir da Fase 7 (busca do passageiro) e da Fase 8 (instruções passo a
  passo).
- **Validação real, não só tipo/build:** diferente das fases anteriores (que
  dependem de Leaflet/DOM, que não consigo rodar neste ambiente), o
  roteamento é lógica pura — dava pra testar de verdade. Rodei um teste à
  parte (não faz parte do projeto, foi só verificação) reproduzindo a mesma
  lógica com dados inventados, cobrindo: (1) escolher o caminho de menor peso
  total mesmo quando não é o de menos "saltos"/mais direto geometricamente,
  (2) retornar `null` para nós sem conexão entre si, (3) origem igual ao
  destino. Todos passaram.
- Validado também com `npx tsc -b`, `npm run build` e `npm run lint` — 0
  erros, 0 avisos.

## O que foi feito na Fase 7
- `src/shared/lib/poiNodeLinking.ts`: `findNearestNode` generalizada (antes só
  aceitava POI, agora aceita qualquer `Point`) e exportada — reaproveitada
  aqui pra achar o nó mais próximo do toque manual do passageiro no mapa.
- `src/features/passenger/SearchBar.tsx` (novo): campo de busca + botão de QR
  Code. O botão já existe visualmente (seção 2.2 pede isso na tela inicial),
  mas não faz nada ainda — só um `title="Em breve"` — porque a leitura de QR é
  a Fase 9. Ver decisão abaixo.
- `src/features/passenger/SearchResultsList.tsx` (novo): lista de POIs que
  batem com a busca, cada item tocável pra virar o destino.
- `src/features/passenger/HomeScreen.tsx` (reescrita): duas visões dentro da
  mesma tela — (1) busca (campo + chips de categoria + resultados) e (2) rota
  (mapa com marcador de origem/destino, linha do caminho, distância
  aproximada). Recalcula a rota automaticamente (`useEffect`) sempre que
  destino, localização atual ou o grafo mudam.
- Validado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
  avisos. Ressalva de sempre: interação real no mapa (busca, toque pra
  indicar localização, linha da rota aparecendo) não testada num navegador de
  verdade neste ambiente.

**Duas decisões importantes desta fase:**

1. **Localização manual temporária.** Calcular rota exige um ponto de
   partida, mas o QR Code (que dá isso automaticamente) só chega na Fase 9.
   Solução: o passageiro toca no mapa pra indicar "estou aqui"
   (`originPoint`), e isso vira o ponto de partida do Dijkstra (via
   `findNearestNode`). Plano para a Fase 9: o QR Code deve preencher esse
   mesmo `originPoint` automaticamente — a ideia é manter o toque manual como
   alternativa (ex: passageiro sem como escanear o código), não substituí-lo.
2. **Categorias de busca = categorias reais dos POIs.** O documento original
   descrevia uma taxonomia de busca fixa e separada ("Serviços: Banheiros,
   Alimentação, Compras, Embarque, Atendimento, Emergência"), diferente das
   13 categorias de POI do admin. Em vez de criar essa segunda taxonomia
   paralela, os chips de categoria da busca usam `getCategories()` — as
   mesmas categorias (de fábrica + personalizadas) que o admin já cadastrou
   na Fase 4. Evita um filtro de busca que não bate com o que existe de
   verdade no mapa, e como categorias já são livres desde a revisão da Fase
   4, o admin pode criar "Emergência" como categoria própria se quiser.

## Correções aplicadas após teste do usuário (ainda Fase 7)
Você testou a Fase 7 e trouxe dois pontos, um de UX e um técnico importante:

1. **Mapa só aparecia depois de escolher um destino.** `HomeScreen.tsx`
   reescrito: o mapa agora fica **sempre visível**, ocupando a tela toda
   abaixo do cabeçalho. Busca, chips de categoria, resultados e o card de
   rota viram painéis flutuantes por cima do mapa (novo tier
   `Z_INDEX.overlay = 1000` em `zIndex.ts`, acima dos controles do Leaflet
   e abaixo de modais) — estilo Google Maps, igual ao print de referência do
   documento original. `MapView.tsx`: `heightPx` agora aceita `number | string`
   (usado como `"100%"` aqui, pra preencher o espaço flexível do pai).
2. **A rota não saía do ponto exato — só do nó mais próximo.** Isso é um
   problema real de design de roteamento indoor, não um bug pequeno.
   `calculateRoute.ts` foi reescrito:
   - Antes: `calculateRoute(fromNodeId, toNodeId)` — calculava entre nós.
   - Agora: `calculateRoute(fromPoint, toPoint)` — recebe pontos geométricos
     quaisquer (o toque do passageiro, a posição exata do POI) e encaixa
     cada um na **aresta mais próxima** via projeção perpendicular sobre o
     segmento (`projectPointOnSegment`), não no nó mais próximo. Um nó
     virtual é inserido nesse ponto projetado (só para aquele cálculo, nunca
     salvo no grafo), dividindo o peso da aresta original proporcionalmente
     à posição do ponto nela. Caso especial: se origem e destino caem na
     mesma aresta, calcula direto pela proporção do peso da aresta entre os
     dois `t`, sem precisar do resto do grafo.
   - Essa é a abordagem padrão de apps de navegação reais (Google Maps,
     Waze, OSRM chamam isso de "snap to road/edge") — mais precisa que
     adicionar pontos intermediários manualmente ou automaticamente ao
     longo das arestas (a alternativa que você tinha cogitado), e não exige
     nenhum trabalho extra do admin nem infla o grafo salvo.
   - `RouteResult` mudou de `{ nodeIds, totalWeight }` para
     `{ points, totalDistance, nodeIds }` — `points` já vem pronto pra
     desenhar (inclui o ponto real de origem/destino nas pontas), sem a
     `HomeScreen` precisar mais mapear ids de nó pra posição.
   - `Poi.nearestNodeId`/`relinkAllPois()` (Fase 5) **continuam existindo**,
     mas não são mais usados pelo cálculo de rota em si — o cálculo agora
     usa a posição real do POI (`poi.position`) diretamente. Mantidos porque
     ainda são úteis pra outras coisas (ex: o admin identificar POIs sem
     nenhum caminho próximo).
   - **Validação real:** essa lógica é geometria pura, testável fora do
     navegador. Rodei 3 testes à parte (não fazem parte do projeto):
     (1) projeção perpendicular cai no ponto certo do corredor; (2) origem e
     destino na mesma aresta — confirmei que o caso especial dá o resultado
     correto (peso proporcional ao trecho real, ~50 de uma aresta de 100),
     enquanto a via genérica pelo grafo (sem o caso especial) dá um valor
     inflado (~90, porque teria que ir até um nó e voltar) — foi assim que
     descobri que o caso especial era necessário, não só uma otimização;
     (3) origem e destino em arestas diferentes de um corredor em L,
     confirmando que o caminho passa pelo nó compartilhado com o peso certo.

Revalidado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
avisos.


- Adicionei `graphology-types` como dependência direta, não listada
  explicitamente na seção 3 do spec. É peer dependency obrigatória de
  `graphology-shortest-path` (usada para tipar o grafo); sem ela o build
  falha. Não é uma biblioteca nova, é parte do ecossistema `graphology` já
  escolhido.
- Criei `src/shared/types/index.ts` já na Fase 1, mesmo o roadmap não citando
  esse arquivo explicitamente nela — a seção 6 do spec já lista esse arquivo
  como parte da estrutura de pastas, e os stubs de `storage.ts` precisavam de
  tipos corretos. Não adianta lógica de negócio, só o contrato de dados.
- `App.tsx` foi movido para `src/app/App.tsx` (fora do padrão do Vite, que
  cria em `src/App.tsx`), para bater com a estrutura da seção 6. `main.tsx`
  ajustado.
- Criei `src/features/admin/AdminHome.tsx`, não listado na seção 6 original —
  é a tela-índice/menu do módulo admin, necessária porque nenhuma das telas
  reais de admin existia ainda quando a Fase 2 foi implementada.
- O `role` no Zustand não é persistido entre recarregamentos de página. Se o
  navegador recarregar dentro de `/admin` ou `/passageiro`, o guard
  `RequireRole` manda de volta pro RoleGate. Escolhido para simplificar o
  fluxo de simulação (troca de perfil sempre passa por escolha explícita).
- Criei `src/shared/lib/image.ts`, não listado na seção 6 original — função
  utilitária pura (ler arquivo → comprimir → dataURL), separada de
  `MapUpload.tsx` porque acabou sendo reaproveitada depois pelo upload de
  ícone de POI (Fase 4).
- MVP tem um único `MapImage`/`Floor` fixos: `storage.saveMap` força
  `id: 'map-default'`, e `getDefaultFloor` sempre retorna/cria
  `floor-default`. Intencional (seção 9 do spec) — só vira múltiplos
  registros se decidirmos implementar múltiplos andares no futuro (fora do
  MVP, seção 10).
- **DESVIO:** `Poi.nearestNodeId` era `string` obrigatório na seção 5
  original e virou `nearestNodeId?: string` (opcional). Motivo: o roadmap
  coloca a Fase 4 (criar POIs) antes da Fase 5 (criar o grafo) — o primeiro
  POI criado não tem nó nenhum pra apontar ainda. Resolvido na Fase 5 com
  `relinkAllPois()` (vínculo automático) — ver "O que foi feito na Fase 5".
- Criei `src/shared/lib/id.ts`, `src/shared/lib/zIndex.ts` e
  `src/shared/lib/poiIconHtml.tsx` — pequenas adições utilitárias não listadas
  na seção 6 original, todas de baixo risco (ver detalhes nas seções de cada
  fase acima).
- **DESVIO (revisão da Fase 4):** `PoiCategory` deixou de ser union fechada de
  13 valores e virou `string` livre, com um novo tipo `Category` (`{id, label,
  color, isCustom}`) pra suportar categorias personalizadas — ver seção
  "Correções e melhorias" acima para o detalhe completo.
- Para "Escolher ícone" (seção 2.1), a solução final (depois da revisão) é:
  ícone automático por categoria como padrão, com opção de upload de ícone
  customizado por local (`Poi.iconUrl`) sobrepondo o ícone padrão quando
  presente. A primeira versão da Fase 4 tinha só o ícone automático; o upload
  foi adicionado depois, a pedido do usuário.
- Criei `src/shared/lib/poiNodeLinking.ts` na Fase 5 (não listado na seção 6
  original) — resolve o desvio do `nearestNodeId` acima.
- **DESVIO (Fase 7):** localização do passageiro é manual (toque no mapa) até
  a Fase 9 implementar QR Code — ver "Duas decisões importantes desta fase"
  na seção da Fase 7.
- **DESVIO (Fase 7):** categorias de busca do passageiro usam as mesmas
  categorias do admin (`getCategories()`), não a taxonomia fixa do documento
  original — ver mesma seção acima.

## Correções aplicadas após 2º teste do usuário (ainda Fase 7)
Você testou de novo e trouxe dois pontos:

1. **A rota cortava por cima de construções/obstáculos.** Causa raiz: o
   encaixe na aresta mais próxima (correção anterior) não tinha limite de
   distância — se o destino estivesse longe de qualquer trecho do grafo
   desenhado pelo admin, o código encaixava na aresta mais próxima *de
   qualquer jeito*, por mais distante que fosse, e desenhava uma linha reta
   até lá (que não segue corredor nenhum, é só geometria — por isso cortava
   por cima de paredes). Corrigido com `MAX_SNAP_DISTANCE_PCT` (12, em
   unidades percentuais do mapa) em `calculateRoute.ts`: se a aresta mais
   próxima estiver mais longe que isso, a rota é **recusada** (motivo
   `'muito-longe'`) em vez de desenhar algo sem sentido. Isso é o
   comportamento certo: se um POI está longe de qualquer caminho modelado,
   o problema é o grafo do admin estar incompleto ali, não algo que o código
   deveria "inventar" uma linha reta pra disfarçar. **Ação recomendada pro
   admin:** estender os nós/arestas do grafo até perto de cada local
   cadastrado, especialmente os mais afastados do corredor principal.
   `calculateRoute` mudou de retornar `RouteResult | null` para um tipo
   `RouteCalculation` (`{ok:true,result} | {ok:false,reason}`), com 3 motivos
   possíveis (`sem-caminhos`, `muito-longe`, `sem-rota`) — a `HomeScreen`
   agora mostra uma mensagem diferente pra cada um, em vez de um erro
   genérico único.
2. **Locais só apareciam depois de escolher um destino pela busca; pedido:
   sempre visíveis + clicar no ícone no mapa já traça rota (como Google
   Maps).** `HomeScreen.tsx`: agora sempre mostra todos os POIs no mapa
   (`browseMarkers`) enquanto nenhum destino foi escolhido — cada um
   clicável (`onMarkerClick` do MapView), definindo aquele POI como destino
   direto, sem precisar passar pela busca. Assim que um destino é definido
   (seja pela busca ou pelo clique no mapa), os outros POIs somem e só
   origem+destino ficam visíveis — mesmo princípio de anti-poluição já usado
   nos mapas do admin.
   - **Validação real do limite de distância:** rodei um teste à parte
     reproduzindo um cenário parecido com o do seu print (grafo cobrindo só
     uma pequena região, destino bem longe dele) — confirmei que o ponto
     distante é corretamente recusado (55.4 de distância vs limite de 12), e
     que um ponto próximo (5.0) continua sendo aceito normalmente.

Revalidado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
avisos.

## Melhorias aplicadas após 3º teste do usuário (ainda Fase 7)
Duas melhorias de UX pedidas em cima do que já estava funcionando:

1. **Filtro de categoria só afetava a lista de busca, não o mapa.** Agora
   `browseMarkers` (os POIs mostrados no mapa em modo "busca") também filtra
   pela categoria selecionada — igual já acontecia com `filteredPois` (a
   lista). Selecionar "Alimentação" agora esconde os outros POIs do mapa
   também, não só da lista.
2. **Fileira de categorias precisava ser responsiva / não poluir a tela.**
   `src/features/passenger/CategoryFilterModal.tsx` (novo): bottom sheet com
   grade responsiva (`repeat(auto-fill, minmax(84px, 1fr))`, mesmo padrão do
   seletor de categoria do admin) mostrando TODAS as categorias usadas, mais
   uma opção "Todos os locais" pra limpar o filtro. Na tela principal, a
   fileira de chips agora mostra só até `MAX_INLINE_CATEGORIES` (4) direto,
   com um botão "Ver todas" no final que abre o modal quando há mais
   categorias do que isso. Detalhe: se a categoria ativa não estiver entre as
   4 visíveis (ex: foi selecionada pelo modal), ela é trazida pra fileira
   mesmo assim, pra sempre dar pra ver/desmarcar o filtro sem reabrir o
   modal.

Revalidado com `npx tsc -b`, `npm run build` e `npm run lint` — 0 erros, 0
avisos.

## Problemas conhecidos / pendências
- O filtro de categoria afetando o mapa e o modal "Ver todas as categorias"
  ainda não foram testados por você no navegador.
- Se o admin tiver POIs cadastrados longe de qualquer nó/aresta do grafo,
  a rota vai ser recusada com a mensagem "muito longe" — isso é esperado
  (ver correção acima), não é bug. A solução é o admin estender o grafo.
- Bundle final passou de 500KB minificado (aviso do Vite) — não bloqueante,
  possível item de polimento na Fase 12.
- Funções de domínio restantes em `storage.ts` (QR, viagens, notificações)
  seguem como stub — esperado até as fases correspondentes.
- O botão de QR Code na tela do passageiro é só visual por enquanto (Fase 9
  implementa a leitura de verdade).

## Última atualização
31/07/2026
