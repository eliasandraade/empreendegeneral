# Redesign do Frontend Público — Empreende General

**Data:** 2026-06-01
**Escopo:** Apenas páginas e componentes públicos
**Abordagem:** Reescrita cirúrgica por componente (sem tocar em backend, auth, admin ou dashboard)

---

## Contexto

O backend e o fluxo funcional estão operacionais. O problema é que o frontend público não transmite a qualidade de um produto real. O objetivo é redesenhar a experiência pública com padrão premium, mantendo toda a lógica de negócio intacta.

**Referências visuais:** Pokémon GO (exploração), Google Maps (clareza), Waze (mapa vivo), TripAdvisor (confiança e descoberta), Airbnb (qualidade visual).

**Diretriz de tom:** premium, produto real, não cyberpunk, não neon exagerado.

---

## 1. Tema Visual — Azul Noturno

### Paleta

| Token | Valor |
|---|---|
| Background base | `#0c1b2e` |
| Superfícies elevadas | `rgba(30,58,95,0.7–0.9)` |
| Bordas | `rgba(147,197,253,0.10–0.20)` |
| Texto primário | `#f0f9ff` |
| Texto secundário | `rgba(147,197,253,0.50–0.60)` |
| Acento azul | `#60a5fa → #2563eb` |
| Verde WhatsApp | `#22c55e → #16a34a` |
| Dourado destaque | `#eab308 / #facc15` |

### Cores por categoria

| Categoria | Cor | Ícone Lucide |
|---|---|---|
| alimentacao | `#f97316` | `Utensils` |
| beleza | `#be185d` | `Scissors` |
| comercio | `#3b82f6` | `ShoppingBag` |
| servicos | `#6b7280` | `Wrench` |
| agro | `#22c55e` | `Sprout` |
| saude | `#ef4444` | `Cross` |
| default | `#1d4ed8` | `MapPin` |

### Diretrizes

- Glassmorphism leve: `backdrop-blur-sm/md` + bordas `border-white/10–20`
- Ícones: Lucide em produção; emojis aceitos como placeholder durante dev
- Evitar bordas sólidas escuras — preferir bordas translúcidas
- Não usar gradientes neon; gradientes suaves da cor da categoria são permitidos

---

## 2. `MapView.tsx` — Mapa e Pins

**Tile:** OpenStreetMap (sem alteração de provider)

### Pin normal
- Forma: círculo com gradiente da cor da categoria
- Tamanho: `40×40px` + seta triangular abaixo (CSS border-trick)
- Borda: `2.5px solid rgba(255,255,255,0.9)`
- Ícone: Lucide da categoria, branco, `16px`, centralizado
- Glow: `box-shadow: 0 4px 12px <cor-categoria>@60%`

### Pin destaque (`featured: true`)
- Tamanho maior: `52×52px` + seta
- Cor exclusiva: dourado `#eab308` (não usa cor da categoria)
- Borda: `3px solid rgba(255,255,255,0.95)`
- Glow premium (não neon): `box-shadow: 0 4px 14px rgba(234,179,8,0.45)`
- Halo pulsante sutil: `animation: pulse` via `@keyframes` injetado no init do mapa
- Badge de estrela `★` discreto sobreposto no canto inferior direito do círculo (sem texto)

### Comportamento por zoom
- Zoom distante (< 15): apenas pins, sem labels
- Zoom próximo (≥ 15): exibir nome do negócio abaixo do pin
- Implementação: escutar `zoomend` do Leaflet, recriar markers com label condicional

### Implementação técnica
- `createBusinessIcon()` continua gerando `L.DivIcon` com HTML inline
- Ícones Lucide: SVG strings hardcoded por categoria (evitar `renderToStaticMarkup` por complexidade)
- Animação `pulse` definida via `<style>` injetado uma vez no `useEffect` de init

### Pin de localização do usuário
- Mantém ponto azul atual — reconhecível, sem mudança

---

## 3. `MapOverlayHeader.tsx` — Overlay do Mapa

**Estrutura:** `absolute top-0 left-0 right-0 z-[500]`
- Gradiente escuro `from-black/50 to-transparent` nos primeiros `180px`
- Container: `pointer-events-none`; elementos interativos: `pointer-events-auto`

### Linha 1 — Brand + ações
- Logo: `Empreende General` `text-white font-bold`, slogan em `text-white/60 text-xs`
- CTA principal: `"+ Negócio"` — pill com gradiente `#3b82f6→#1d4ed8`, ícone `Plus`, sombra
- Botão perfil: `bg-white/5 border border-white/10 backdrop-blur-sm` — mais discreto que o CTA

### Linha 2 — Search (protagonismo)
- `bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg`
- Placeholder: `"Buscar negócio, categoria ou serviço..."`
- Ícone `Search` à esquerda, botão `X` para limpar à direita
- Estado de foco: `ring-2 ring-blue-400/30`
- Sem borda visível — sombra define o card

### Linha 3 — Filtros de categoria
- Scroll horizontal sem scrollbar (`scrollbar-hide`)
- Pill ativo: gradiente azul + ícone Lucide da categoria
- Pill inativo: `bg-white/90 text-gray-700`
- Cada pill: ícone Lucide da categoria + nome

### Espaço reservado
- Layout da linha 1 deve comportar futuramente um botão "📍 Perto de você" sem reformulação

### Sem mudança de lógica
- Estado gerenciado pelo `MapCanvas` existente

---

## 4. `BusinessMapCard.tsx` — Bottom Sheet

**Posicionamento:**
- Mobile: `fixed bottom-0 left-0 right-0 rounded-t-3xl`
- Desktop: `absolute bottom-6 right-4 w-[340px] max-w-[380px] rounded-2xl max-h-[480px] overflow-y-auto`

**Visual:**
- `bg-[#0c1b2e]/97 backdrop-blur-2xl`
- `border-t border-white/10` (mobile) / `border border-white/10` (desktop)
- `z-[1000] shadow-2xl`
- Entrada: `animate-slide-up` (transition via `translate-y`)

**Conteúdo — de cima para baixo:**

1. **Drag handle** (mobile only): `w-10 h-1 bg-white/20 rounded-full mx-auto mt-3`

2. **Header:**
   - Ícone: `48×48px rounded-xl` com gradiente da categoria + ícone Lucide branco
   - Badge categoria: `text-[10px] font-bold uppercase tracking-wide` na cor da categoria
   - Nome: **`text-lg font-black text-white`** — elemento mais importante
   - Metadados: estrelas `text-yellow-400` + contagem + `·` + distância com ícone `Navigation` (se localização ativa)
   - Endereço: ícone `MapPin` mini + endereço curto em `text-white/60 text-xs`
   - Botão fechar `X`: `absolute top-3 right-3 bg-white/10 rounded-xl p-1.5`

3. **Ações (ordem de prioridade):**
   - WhatsApp (se disponível): `flex-1` gradiente verde, ícone `MessageCircle`, `font-bold` — dominante
   - Rota: `bg-white/8 border border-white/12`, ícone `MapPin`
   - Ver detalhes: `bg-white/8 border border-white/12 ml-auto`
   - Telefone: substitui WhatsApp apenas quando não houver WhatsApp cadastrado

**Slot para "Perto de você":** linha de metadados tem espaço para distância calculada — pronto para expansão futura.

---

## 5. Página `/businesses`

**Layout:**
- Background: `bg-[#0c1b2e]` full-page
- Header: `"Negócios em General Sampaio"` `text-white font-black text-2xl` + subtítulo + link "Ver no mapa →"

**Search bar:**
- `bg-white/8 border border-white/12 backdrop-blur-sm rounded-2xl`
- Placeholder: `"Buscar negócio, categoria ou serviço..."`
- Submit via `form method="get"` — sem mudança de lógica

**Filtros:**
- Scroll horizontal sem scrollbar
- Pill ativo: gradiente azul + ícone Lucide
- Pill inativo: `bg-white/8 border border-white/10 text-white/70`
- Preserva `?categoria=` e `?q=` na URL

**Lista de cards (lista vertical):**
- Contador: `"X negócios encontrados"` em `text-white/40 text-xs`
- `flex-col gap-3`

**Card horizontal — estrutura:**
- Container: `<Link>` inteiro clicável — card completo é o link
- `bg-white/5 border border-white/10 rounded-2xl p-4`
- Hover: `hover:bg-white/8 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all`
- Ícone categoria: `52×52px rounded-xl` com gradiente + ícone Lucide
- Badge destaque: pill `#eab308` com `★` se `featured: true`
- Nome: `text-white font-bold text-sm`
- Endereço: `text-white/50 text-xs` com ícone `MapPin` mini
- Distância: `"• 850 m"` ou `"• 1,2 km"` — ocultar se localização não disponível
  - **Implementação:** distância requer geolocalização client-side. Extrair um componente `BusinessCardDistance` com `"use client"` que lê coordenadas do negócio e calcula via Haversine. O card pai (`BusinessCard`) permanece Server Component; `BusinessCardDistance` é filho client.
- Estrelas + contagem: `text-yellow-400 text-xs`
- `ChevronRight` no canto direito: reforço visual, não único ponto clicável

**Estado vazio:** ícone `SearchX` Lucide + texto + link para limpar filtros (sem emojis)

**Loading:** skeleton cards com `animate-pulse bg-white/5 rounded-2xl`

**Diretriz:** a página deve parecer uma coleção de lugares interessantes, não um diretório ou tabela.

---

## 6. Página `/businesses/[slug]`

**Hero:**
- `h-56 md:h-72`
- Se houver imagem: `next/image` full-bleed com `object-cover`, overlay escuro forte `from-black/70 to-[#0c1b2e]`
- Se não houver imagem: gradiente da categoria como fallback (sem crop agressivo)
- Botão voltar: `← Negócios` pill glassmorphism `absolute top-4 left-4`
- Badge categoria: `absolute bottom-4 left-4` na cor da categoria

**Identidade:**
- Background `bg-[#0c1b2e]` contínuo com o hero
- Ícone categoria: `56×56px rounded-2xl` sobreposto `−28px` no hero (avatar flutuante)
- Nome: `text-white font-black text-2xl`
- Metadados: estrelas + contagem + badge `Destaque` se `featured`
- Endereço: ícone `MapPin` + `text-white/60`

**Barra de ações sticky:**
- `sticky top-0 z-40 bg-[#0c1b2e]/95 backdrop-blur-md border-b border-white/8 py-3 px-4`
- WhatsApp: dominante à esquerda (verde)
- Rota + Telefone/Instagram: botões secundários `bg-white/8`
- Sem WhatsApp → Telefone assume papel principal

**Body — ordem das seções:**

1. **Sobre:** `text-white/70 text-sm leading-relaxed`
2. **Informações:** grid `2×2` de cards `bg-white/5 rounded-xl p-3` (endereço, telefone, horário, site)
3. **Mini mapa:** OpenStreetMap embutido, pin do negócio, `h-[200px] rounded-2xl`, botão "Abrir rota"
   - **Implementação:** componente `MiniMap` importado via `dynamic(() => import(...), { ssr: false })`, igual ao `MapCanvas`. Recebe `lat`, `lng` e `name`. Zoom fixo `15`, interação desabilitada (`dragging: false`, `zoomControl: false`).
4. **Galeria:** grid 2 colunas de thumbnails `rounded-xl`, primeira imagem maior se `isPrimary`
5. **Avaliações:** título `"Avaliações (N)"` + cards `bg-white/5 rounded-xl p-4`
   - Avatar circular com inicial, nome, data, estrelas
   - Comentário `text-white/70`
   - Resposta do empreendedor: `border-l-2 border-blue-400/40 pl-3 bg-white/5 rounded-r-xl`

**Estado vazio avaliações:** ícone `Star` Lucide + texto encorajador (sem emojis)

**SEO:** `generateMetadata` preservado sem alteração.

---

## 7. Regras Gerais

- **Não alterar:** backend, Prisma, Auth.js, admin, dashboard, regras de negócio
- **Não alterar:** rotas atuais (`/`, `/businesses`, `/businesses/[slug]`)
- **Não alterar:** tile provider do mapa (OpenStreetMap)
- **Manter:** `MapCanvas` como orquestrador de estado do mapa
- **Manter:** `dynamic()` com `ssr: false` para componentes Leaflet
- **Ícones:** Lucide em produção; emojis aceitos como placeholder durante dev
- **Mobile-first:** breakpoints `md:` para ajustes desktop
- **Ordem de implementação:** MapView → pins → BusinessMapCard → MapOverlayHeader → `/businesses` → `/businesses/[slug]`

---

## 8. O que NÃO fazer

- Não introduzir novo provider de mapa
- Não criar novas rotas de API
- Não alterar schema Prisma
- Não alterar fluxo de autenticação
- Não alterar painel admin ou dashboard do empreendedor
- Não usar estética cyberpunk, neon exagerado ou Web3
- Não usar emojis em produção (apenas durante dev como placeholder)
