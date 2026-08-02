# Progresso do Click Way

## Fase atual
Fase 6 — Roteamento (Dijkstra): calculateRoute.ts com graphology-shortest-path, conversão de custo para distância real via escala

## Concluído
- [x] Fase 1 — Setup do projeto
- [x] Fase 2 — Base de navegação
- [x] Fase 3 — Admin: mapa e escala
- [x] Fase 4 — Admin: locais
- [x] Fase 5 — Admin: grafo
- [ ] Fase 6 — Roteamento (Dijkstra)
- [ ] Fase 7 — Passageiro: busca e rota
- [ ] Fase 8 — Navegação passo a passo
- [ ] Fase 9 — QR Code
- [ ] Fase 10 — Viagens
- [ ] Fase 11 — Notificações
- [ ] Fase 12 — Polimento

> **Nota sobre este arquivo:** até a revisão da Fase 4, a seção "Decisões
> tomadas ao longo do caminho" estava sendo reescrita inteira a cada fase
> (bug de edição, não de código) e se repetia várias vezes no arquivo. Foi
> consolidada numa lista única, no final do arquivo, nesta reescrita.

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
- `src/features/passenger/HomeScreen.tsx`: placeholder do módulo Passageiro.
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
500KB minificado (608KB / 187KB gzip), por causa do `react-dom/server` +
Leaflet somados. Não é erro, é só informativo — não vou otimizar isso agora
(MVP acadêmico, bundle size não é prioridade). Registrado como possível item
da Fase 12 (Polimento): `import()` dinâmico do Leaflet/react-dom-server só
quando as telas que os usam forem abertas.

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
  POI criado não tem nó nenhum pra apontar ainda. Fica `undefined` até a
  Fase 5 vincular (plano: vincular automaticamente cada POI ao nó mais
  próximo, ou dar ao admin uma ação explícita — decisão final quando a
  Fase 5 for implementada).
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

## Problemas conhecidos / pendências
- Interação do grafo (criar nó, conectar, editar peso, excluir com cascata)
  ainda não testada no navegador por você — validada só por tipo/build/lint
  neste ambiente.
- `Poi.nearestNodeId` fica `undefined` só enquanto não existir nenhum nó de
  grafo — assim que o primeiro nó for criado, `relinkAllPois()` vincula todo
  POI automaticamente. Não é mais uma pendência em aberto, é o comportamento
  esperado (ver "O que foi feito na Fase 5").
- Bundle final passou de 500KB minificado (aviso do Vite) — não bloqueante,
  possível item de polimento na Fase 12 (ver nota da Fase 4).
- Funções de domínio restantes em `storage.ts` (QR, viagens, notificações)
  seguem como stub — esperado até as fases correspondentes.
- `Poi.nearestNodeId` fica `undefined` em todo POI até a Fase 5 vincular o
  grafo — esperado, não é bug.
- Bundle final passou de 500KB minificado (aviso do Vite) — não bloqueante,
  possível item de polimento na Fase 12 (ver nota acima).
- Funções de domínio restantes em `storage.ts` (grafo, QR, viagens,
  notificações) seguem como stub — esperado até as fases correspondentes.

## Última atualização
31/07/2026
