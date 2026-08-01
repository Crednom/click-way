# Click Way — Especificação Técnica do Projeto (MVP Acadêmico)

> **Este documento é a fonte de verdade do projeto.** Qualquer IA que for gerar código
> para este projeto — nesta sessão ou em uma sessão/ferramenta futura — deve seguir as
> instruções da seção 0 antes de escrever qualquer linha de código.

---

## 0. Como usar este documento (protocolo entre sessões)

Este projeto pode ser implementado em várias sessões de IA diferentes (ex: se um chat
atingir limite de uso e o trabalho continuar em outro chat, ou em outra ferramenta como
Claude Code). Para isso não quebrar o código já existente, siga estas regras:

### 0.1 Regra de ouro
**Nunca comece a gerar código sem antes ler, nesta ordem:**
1. Este documento inteiro (`click-way-spec.md`).
2. O arquivo `PROGRESS.md` na raiz do projeto (se existir) — ele diz o que já foi feito,
   o que está em andamento e quais decisões foram tomadas ao longo do caminho.
3. A árvore de arquivos já existente em `src/` (se existir) — para entender os padrões
   de código já em uso (nomes, convenções, como os componentes existentes estão
   escritos) e **seguir o mesmo estilo**, em vez de introduzir um padrão novo.

### 0.2 Arquivo `PROGRESS.md` — obrigatório manter atualizado
Desde o primeiro código gerado, crie e mantenha um arquivo `PROGRESS.md` na raiz do
projeto com esta estrutura:

```markdown
# Progresso do Click Way

## Fase atual
Fase X — [nome da fase]

## Concluído
- [x] Fase 1 — Setup do projeto
- [x] Fase 2 — Tela inicial e seleção de papel
- [ ] Fase 3 — Admin: mapa e escala
...

## Decisões tomadas ao longo do caminho
(qualquer desvio do documento original, ou decisão não coberta pela spec, registrar aqui
com data e motivo — ex: "usei tal biblioteca no lugar de outra porque X")

## Problemas conhecidos / pendências
(bugs não resolvidos, partes incompletas, TODOs importantes)

## Última atualização
[data]
```

**Toda vez que uma fase (seção 11) for concluída, atualize este arquivo antes de
encerrar a sessão.** Isso é o que permite trocar de IA/chat sem perder contexto — o
progresso vive no repositório, não na conversa.

### 0.3 Regra de continuidade de código
- Não refatore código já funcional só por preferência de estilo. Só refatore se algo
  estiver quebrado ou impedindo a fase atual.
- Siga o modelo de dados da seção 5 à risca. Se precisar mudar algo nele, atualize a
  seção correspondente neste documento (ou registre a mudança no `PROGRESS.md`) para
  que a próxima sessão saiba.
- Trabalhe uma fase da seção 11 por vez, sempre a próxima não concluída. Não pule fases.

---

## 1. Visão Geral

Sistema de navegação interna para rodoviárias, mobile-first, que ajuda o passageiro a
encontrar plataformas, banheiros, lanchonetes e outros pontos dentro do terminal, com
rota traçada automaticamente (menor caminho) e navegação passo a passo.

**MVP de trabalho acadêmico, sem backend.** Toda a persistência acontece no dispositivo
(localStorage / IndexedDB), simulando os dois perfis (administrador e passageiro) no
mesmo aparelho e no mesmo navegador.

O projeto é dividido em dois módulos, que devem ser tratados como áreas praticamente
independentes da aplicação:

- **Módulo 1 — Administrador**: configura tudo (mapa, locais, grafo, QR Codes, viagens,
  notificações).
- **Módulo 2 — Passageiro**: consome o que o administrador configurou (busca, rota,
  navegação, notificações recebidas).

---

## 2. Escopo do MVP

### 2.1 Módulo 1 — Administrador

**Gerenciamento do mapa**
- Upload da planta (imagem).
- Alterar a planta.
- Configurar escala: desenhar uma linha de referência sobre a planta e informar a que
  distância real (em metros) ela corresponde. O sistema calcula um fator de conversão
  percentual→metros, usado depois para gerar instruções de navegação com distância real
  (ex: "siga 20 metros").
- Campo `floorId` preparado no modelo de dados para suporte futuro a múltiplos andares
  — **não implementar múltiplos andares no MVP**, apenas deixar a estrutura pronta (ver
  seção 5 e seção 9).

**Gerenciamento de locais (POIs)**
- Adicionar local clicando no mapa.
- Editar / excluir.
- Campos: categoria, ícone, nome, descrição.

**Gerenciamento do grafo — tela própria**
- Criar nós clicando no mapa.
- Criar conexões (arestas) entre nós.
- Alterar peso das conexões (distância/custo usado pelo Dijkstra).
- Remover conexões.
- Esta tela é separada da tela de locais — são interações visuais diferentes e não
  devem ser misturadas.

**Gerenciamento de QR Codes — dois fluxos**
1. **Fluxo rápido** (a partir de um local): ao criar/editar um Local, botão
   "Gerar QR Code" → sistema gera automaticamente um código vinculado a esse `poiId` →
   pronto para imprimir.
2. **Fluxo avançado** (a partir de um nó do grafo, na tela de grafo): clicar em um nó →
   "Gerar QR Code para este ponto" → gera um código vinculado a esse `nodeId`.
   Necessário para cobrir pontos de localização que não são locais nomeados (corredores,
   cruzamentos, pé de escada) — sem isso, o usuário só consegue se localizar em cima de
   plataformas/lojas, o que não é realista.

Os dois fluxos usam o mesmo componente gerador (`QrGenerator`), variando apenas se o
`targetType` é `'poi'` ou `'node'`.

**Gerenciamento de viagens**
- Tela para cadastrar: Empresa, Destino, Horário, Plataforma, Status.
- Serve para demonstrar o fluxo completo (viagem → plataforma → notificação → usuário).

**Gerenciamento de notificações**
- Tipos: atraso, cancelamento, embarque iniciado, embarque encerrado, troca de
  plataforma.
- Cada notificação tem um **nível de severidade**: `informacao`, `atencao`, `urgente` —
  usado para colorir o toast (ex: azul / amarelo / vermelho) na exibição ao passageiro.
- Botão de simulação: dispara a notificação como se o admin estivesse no lugar de um
  usuário, ficando disponível para visualização depois no perfil Passageiro (mesmo
  dispositivo — ver seção 4).

### 2.2 Módulo 2 — Passageiro

**Tela inicial**
- Barra de pesquisa.
- Categorias (Serviços, Banheiros, Alimentação, Compras, Embarque, Atendimento,
  Emergência).
- Botão de QR Code, fixo e acessível com o polegar.

**Localização**
- Escaneia QR Code (câmera) → sistema identifica onde o usuário está (POI ou nó) →
  mapa centraliza nesse ponto.

**Selecionar destino**
- Por busca (plataforma, loja, banheiro, restaurante, caixa eletrônico...) ou tocando
  direto no mapa.

**Calcular rota**
- Grafo (`graphology`) → Dijkstra (`graphology-shortest-path`) → linha traçada no mapa →
  instruções passo a passo com distância real (usando o fator de escala configurado
  pelo admin).

**Informações da viagem**
- Ao tocar numa plataforma: Empresa, Destino, Horário, Status.

**Notificações**
- Recebe como toast, colorido conforme severidade, o que foi simulado pelo
  administrador. Se a notificação for de troca de plataforma, a rota é recalculada
  automaticamente.

---

## 3. Stack Técnica

| Camada | Escolha | Observação |
|---|---|---|
| Build | Vite | dev rápido, SPA |
| UI | React + TypeScript (`strict: true`) | tipagem forte para o modelo de grafo/POIs |
| Rotas | React Router | módulo admin e módulo passageiro em rotas separadas |
| Mapa | Leaflet, com `L.CRS.Simple` | mapa é imagem estática, não mapa geográfico |
| Grafo | `graphology` + `graphology-shortest-path` | Dijkstra incluso; não usar `graphlib` |
| QR Code (ler) | `html5-qrcode` | acesso à câmera do celular |
| QR Code (gerar) | `qrcode` | usado nos dois fluxos da seção 2.1 |
| Ícones | `react-icons` | |
| Notificações (UI) | `react-toastify` | com cor por severidade |
| Estado global | `zustand` | papel atual, rota ativa, notificações |
| Persistência | `localStorage` + `IndexedDB` (via `idb`) | ver seção 4 |

Sem backend, sem banco remoto, sem autenticação real — fora do escopo deste MVP.

---

## 4. Persistência de Dados (sem backend)

- **IndexedDB** (via `idb`): dados grandes — imagem do mapa em base64/blob.
  `localStorage` tem limite de ~5-10MB e não é adequado para imagens.
- **localStorage**: dados estruturados menores, serializados em JSON — POIs, nós,
  arestas, QR Codes, plataformas, viagens, notificações, configuração de escala.

Centralizar todo acesso em `src/shared/lib/storage.ts`, expondo funções como
`getMap()`, `saveMap()`, `getPois()`, `saveNotification()` etc. Nenhum componente deve
chamar `localStorage`/`indexedDB` diretamente.

**Simulação Admin → Passageiro no mesmo dispositivo:**
1. Admin dispara notificação → salva no localStorage (lista, status "não lida").
2. Ao trocar para o papel "Passageiro", a store Zustand relê o localStorage ao montar e
   também escuta `window.addEventListener('storage', ...)` (cobre o caso de duas abas
   abertas do mesmo navegador).
3. Toast aparece para o passageiro como se fosse recebida em tempo real.

---

## 5. Modelo de Dados

Princípio importante: **os locais (POIs) não são os nós do grafo.** O grafo representa
os caminhos por onde as pessoas andam; cada POI fica associado ao nó mais próximo. Isso
mantém o sistema flexível, como navegadores indoor reais funcionam.

```ts
// src/shared/types/index.ts

export type UserRole = 'admin' | 'passenger';

export interface Floor {
  id: string;
  name: string; // ex: "Térreo" — preparado para o futuro, MVP usa só 1 registro
}

export interface MapImage {
  id: string;
  floorId: string; // ver Floor acima — MVP terá sempre 1 floor fixo
  imageDataUrl: string; // salvo no IndexedDB
  width: number;
  height: number;
  scale?: MapScale;
}

// Escala: referência definida pelo admin (linha desenhada sobre o mapa)
export interface MapScale {
  pointA: Point;
  pointB: Point;
  realDistanceMeters: number;
  // fator derivado, calculado uma vez e cacheado:
  metersPerPercentUnit: number;
}

// Coordenadas sempre em PERCENTUAL (0-100) relativo à imagem, nunca pixel absoluto.
export interface Point {
  xPct: number;
  yPct: number;
}

export type PoiCategory =
  | 'banheiro'
  | 'alimentacao'
  | 'bilheteria'
  | 'loja'
  | 'caixa_eletronico'
  | 'sala_espera'
  | 'guarda_volumes'
  | 'achados_e_perdidos'
  | 'elevador'
  | 'escada'
  | 'escada_rolante'
  | 'saida'
  | 'plataforma';

export interface Poi {
  id: string;
  floorId: string;
  name: string;
  category: PoiCategory;
  position: Point;
  iconUrl?: string;
  description?: string;
  nearestNodeId: string; // vínculo obrigatório com um nó do grafo
}

export interface GraphNode {
  id: string;
  floorId: string;
  position: Point;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weight: number; // custo usado pelo Dijkstra (baseado na distância real, via escala)
  type?: 'corredor' | 'escada' | 'escada_rolante' | 'elevador';
}

export interface Sector {
  id: string;
  name: string; // ex: "Setor A"
  platformIds: string[];
}

export interface Platform {
  id: string;
  label: string; // ex: "A1"
  poiId: string;
}

export interface Trip {
  id: string;
  company: string;
  destination: string;
  time: string;
  status: 'no_horario' | 'atrasado' | 'cancelado' | 'embarque_iniciado' | 'embarque_encerrado';
  platformId: string;
}

export type QrTargetType = 'poi' | 'node';

export interface QrCodeLink {
  id: string;
  code: string; // valor codificado no QR
  targetType: QrTargetType;
  targetId: string; // poiId ou nodeId, conforme targetType
}

export type NotificationType =
  | 'atraso'
  | 'cancelamento'
  | 'embarque_iniciado'
  | 'embarque_encerrado'
  | 'troca_plataforma';

export type NotificationSeverity = 'informacao' | 'atencao' | 'urgente';

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  message: string;
  tripId?: string;
  createdAt: number;
  read: boolean;
}
```

---

## 6. Estrutura de Pastas

```
src/
  app/
    routes.tsx             # rotas separadas para /admin/* e /passageiro/*
    App.tsx
    RoleGate.tsx            # tela inicial: entrar como Passageiro ou Administrador
  features/
    map/
      MapView.tsx           # Leaflet + CRS.Simple, renderiza POIs sobre a imagem
      MapScaleTool.tsx       # ferramenta de configuração de escala
    graph/
      GraphEditorView.tsx    # tela própria de criação de nós/arestas
      useGraph.ts             # integração com graphology
    routing/
      calculateRoute.ts       # dijkstra + conversão pra distância real
      StepByStepView.tsx
    qrcode/
      QrScanner.tsx           # leitura via html5-qrcode
      QrGenerator.tsx         # geração via qrcode — usado nos dois fluxos (poi/node)
    admin/
      MapUpload.tsx
      PoiEditor.tsx
      QrCodeManager.tsx        # visão geral de todos os QR gerados
      TripManager.tsx
      NotificationSimulator.tsx
    passenger/
      HomeScreen.tsx
      SearchBar.tsx
      SearchResultsList.tsx
      TripInfoSheet.tsx
    notifications/
      NotificationCenter.tsx
      useNotifications.ts       # inclui listener de 'storage' e cor por severidade
  shared/
    components/
    hooks/
    lib/
      storage.ts                # camada única de acesso a localStorage/IndexedDB
      coordinates.ts             # conversão pixel <-> percentual <-> metros (usa escala)
    types/
      index.ts                    # modelo de dados da seção 5
  store/
    useAppStore.ts                # zustand: role atual, rota ativa, notificações
  styles/
main.tsx
PROGRESS.md                        # ver seção 0.2 — criar já na Fase 1
```

---

## 7. Fluxos Principais

**Fluxo do passageiro:**
1. Tela inicial → "Entrar como Passageiro".
2. Escaneia QR Code (POI ou nó) → localização atual identificada.
3. Busca destino ou toca no mapa.
4. Rota calculada (Dijkstra) e exibida com passo a passo em distância real.
5. Notificações simuladas pelo admin aparecem como toast colorido por severidade;
   troca de plataforma recalcula a rota automaticamente.

**Fluxo do administrador:**
1. "Entrar como Administrador".
2. Upload da imagem do mapa + configuração de escala (linha de referência).
3. Criação de POIs clicando no mapa.
4. Tela de grafo: criação de nós e arestas com peso.
5. Geração de QR Code — via Local (fluxo rápido) ou via nó (fluxo avançado).
6. Cadastro de viagens (empresa, destino, horário, plataforma, status).
7. Criação e simulação de notificações (com severidade).
8. Troca para "Passageiro" no mesmo dispositivo para validar o resultado.

---

## 8. Diretrizes de UI / Mobile-first

- Projetar toda tela primeiro para viewport mobile (~360–420px); desktop é secundário.
- Área de toque mínima 44x44px em botões e ícones do mapa.
- Botão de QR Code fixo, acessível com o polegar (canto inferior direito).
- Modais do admin em bottom sheet, não modal centralizado, sempre que possível.
- Acesso à câmera exige HTTPS em produção (em `localhost` funciona sem HTTPS).

---

## 9. Boas Práticas

- TypeScript `strict: true` — o modelo tem muitas relações (POI→nó, aresta→nós,
  QR→POI/nó) e tipagem evita vínculos quebrados.
- Coordenadas sempre em percentual, nunca pixel absoluto.
- Validar, antes de considerar o mapa "pronto" no admin, se o grafo é conexo (sem nós
  órfãos ou POIs sem `nearestNodeId` válido).
- Isolar toda leitura/escrita de storage em `shared/lib/storage.ts`.
- Comprimir/redimensionar a imagem do mapa antes de salvar no IndexedDB.
- `floorId` já existe no modelo de dados (seção 5), mas o MVP usa sempre um único Floor
  fixo criado automaticamente — não construir seletor de andares nem lógica de troca de
  mapa por andar nesta entrega.
- Consistência de idioma nos nomes de arquivos/componentes (português ou inglês, não
  misturar).

---

## 10. O que fica fora do MVP (mas o modelo de dados já suporta)

Para deixar claro o que não deve ser implementado agora, mesmo que o modelo de dados
tenha campos prontos para isso:

- Múltiplos andares (campo `floorId` existe, mas só 1 floor é usado).
- Autenticação real / backend remoto.
- Notificações push reais (fora do dispositivo).
- Rota acessível (evitar escadas) — o campo `type` em `GraphEdge` já permite isso no
  futuro, mas a lógica de preferência de rota não entra no MVP.

---

## 11. Roadmap de Implementação (fases)

Cada fase é uma unidade de trabalho fechada — ao concluir, atualize `PROGRESS.md` (seção
0.2) antes de parar, mesmo que a sessão continue. Isso é o que protege o projeto se a
sessão for interrompida pelo limite do plano.

- [ ] **Fase 1 — Setup**: Vite + React + TS, estrutura de pastas (seção 6), Zustand,
      `shared/lib/storage.ts` (funções vazias/stub), criar `PROGRESS.md`.
- [ ] **Fase 2 — Base de navegação**: `RoleGate.tsx`, rotas `/admin/*` e
      `/passageiro/*`, layout mobile-first básico.
- [ ] **Fase 3 — Admin: mapa e escala**: upload de imagem (IndexedDB), exibição via
      Leaflet `CRS.Simple`, ferramenta de configuração de escala.
- [ ] **Fase 4 — Admin: locais**: criar/editar/excluir POI clicando no mapa, com modal
      (categoria, ícone, nome, descrição).
- [ ] **Fase 5 — Admin: grafo**: tela própria, criar nós, criar/editar/remover arestas
      com peso, integração `graphology`.
- [ ] **Fase 6 — Roteamento**: `calculateRoute.ts` com `graphology-shortest-path`
      (Dijkstra), conversão de custo para distância real via escala.
- [ ] **Fase 7 — Passageiro: busca e rota**: tela inicial, busca por POI/plataforma,
      traçado da rota no mapa.
- [ ] **Fase 8 — Navegação passo a passo**: transformar o caminho do grafo em
      instruções textuais com distância real.
- [ ] **Fase 9 — QR Code**: `QrGenerator` (dois fluxos: via POI e via nó) e
      `QrScanner` (leitura, localização atual, centralizar mapa).
- [ ] **Fase 10 — Viagens**: cadastro (empresa, destino, horário, plataforma, status) e
      exibição ao tocar numa plataforma no mapa do passageiro.
- [ ] **Fase 11 — Notificações**: criação com severidade, simulação pelo admin,
      recebimento como toast colorido no passageiro, recálculo de rota em troca de
      plataforma.
- [ ] **Fase 12 — Polimento**: revisão mobile-first geral, validação de grafo conexo,
      teste manual dos dois fluxos completos (admin configurando → passageiro usando).

---

*Documento pensado para ser entregue a uma IA de codificação (ex: Claude Code) como guia
de implementação, e para sobreviver à troca de sessão/chat/ferramenta sem perda de
contexto, desde que `PROGRESS.md` seja mantido atualizado a cada fase.*
