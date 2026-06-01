# Design Spec — Primeiro Loop de Valor (v2 — mapa-first)

**Data:** 2026-06-01 (revisado com mudança de produto mapa-first)
**Sprint:** Login Google → Cadastro de Negócio → Aprovação Admin → Publicação no Mapa  
**Critério de sucesso:** Um usuário novo entra com Google, cadastra um negócio com localização, o admin aprova, e o negócio aparece como pin no mapa público.

**Conceito central:** "Mapa vivo da economia local" — ao abrir o app, o usuário vê o mapa de General Sampaio com os negócios como pontos vivos.

---

## 1. Alterações no Schema (Prisma)

### 1.1 Enum `UserRole`

```prisma
enum UserRole {
  USER
  ENTREPRENEUR
  ADMIN
  SUPER_ADMIN
}
```

### 1.2 Campos novos em `Business`

```prisma
rejectionReason String? @db.Text  // preenchido pelo admin ao rejeitar
hours           String?           // horário de funcionamento em texto livre
```

### 1.3 Modelo `EntrepreneurProfile`

Criado automaticamente quando o admin aprova o primeiro negócio de um `USER`.

```prisma
model EntrepreneurProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio       String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 1.4 Modelo `AdminAction`

Registro imutável de aprovações e rejeições.

```prisma
model AdminAction {
  id        String   @id @default(cuid())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  action    String   // "APPROVE_BUSINESS" | "REJECT_BUSINESS"
  targetId  String   // businessId alvo
  reason    String?  @db.Text
  createdAt DateTime @default(now())
}
```

Relações adicionadas em `User`:
```prisma
entrepreneurProfile EntrepreneurProfile?
adminActions        AdminAction[]
```

---

## 2. Autenticação e Roles

### 2.1 ADMIN_EMAILS

```env
ADMIN_EMAILS=email1@example.com,email2@example.com
```

### 2.2 Callback `signIn` em `auth.ts`

1. Split de `ADMIN_EMAILS` por vírgula, `.trim().toLowerCase()` em cada entrada.
2. Comparar com `user.email?.toLowerCase()`.
3. Se match e `user.role !== "SUPER_ADMIN"`: atualizar no banco para `SUPER_ADMIN`.
4. O banco é a fonte de verdade — logins subsequentes não repetem o update.

### 2.3 Página `/login`

Server Component. Form com `action` que chama `signIn("google")`. Redirect para `/dashboard` após login.

### 2.4 Header

`Header` como Server Component (chama `auth()`). Quando autenticado: `UserMenu` (client, dropdown com painel + sair). Quando não autenticado: "Cadastrar negócio" + "Entrar".

O Header aparece apenas nas rotas do grupo `(main)` — não aparece na homepage map-first.

---

## 3. Geocodificação — Nominatim (OpenStreetMap)

**Não usar Google Maps API.** Substituir por Nominatim — gratuito, sem chave de API.

### 3.1 `services/maps.ts`

```ts
GET https://nominatim.openstreetmap.org/search
  ?q=ENCODED_ADDRESS
  &format=json
  &limit=1
  &countrycodes=br

Headers: User-Agent: EmpreendedorGeneral/1.0
```

Retorna `{ latitude, longitude, formattedAddress }` ou `null`.

### 3.2 Rota `/api/geocode`

`GET /api/geocode?address=...` — chama `geocodeAddress()` de `services/maps.ts`.
- Sucesso: `{ latitude, longitude, formattedAddress }`
- Endereço não encontrado: `{ error: "address_not_found" }` com status 404
- Falha de serviço: `{ error: "geocoding_error" }` com status 500
- **Nunca** retorna fallback que permita salvar sem coordenadas.

### 3.3 Componente `LocationPicker` (client)

Estados: `idle` → `searching` → `preview` | `error` → `confirmed`

Preview: usa iframe **OpenStreetMap** embed (não Google Maps):
```
https://www.openstreetmap.org/export/embed.html?bbox=LNG±0.01,LAT±0.01&layer=mapnik&marker=LAT,LNG
```

Hidden inputs: `latitude`, `longitude`, `formattedAddress` — obrigatórios para submit.

**Submit bloqueado** enquanto `confirmed === false`.

---

## 4. Cadastro de Negócio

### 4.1 Formulário `/dashboard/new` (em rota `(main)`)

Seções: dados básicos (nome*, categoria, descrição), contato (telefone, WhatsApp, Instagram, website), localização (`LocationPicker`), horários (texto livre). Imagens: adiadas.

### 4.2 Server Action `createBusinessAction`

1. `auth()` → se não autenticado → erro
2. Validar com Zod (lat/lng obrigatórios via `z.coerce.number()`)
3. Gerar slug único: `padaria-do-ze`, `padaria-do-ze-2`, `padaria-do-ze-3` (loop com contador a partir de 2)
4. `prisma.business.create({ status: "PENDING" })`
5. `redirect("/dashboard?cadastro=sucesso")`

---

## 5. Painel Admin `/admin/businesses` (em rota `(main)`)

Guard: `role === "ADMIN" | "SUPER_ADMIN"`.

### 5.1 `approveBusinessAction(businessId)`

1. Verificar role
2. `business.update({ status: "APPROVED" })`
3. Se `owner.role === "USER"` → promover para `ENTREPRENEUR` + criar `EntrepreneurProfile`
4. `adminAction.create({ action: "APPROVE_BUSINESS" })`
5. Revalidar: `/admin/businesses`, `/businesses`, `/`, `/businesses/[slug]`

### 5.2 `rejectBusinessAction(businessId, reason: string)`

`reason` obrigatório (mínimo 10 caracteres).
1. Verificar role
2. `business.update({ status: "REJECTED", rejectionReason: reason })`
3. `adminAction.create({ action: "REJECT_BUSINESS", reason })`
4. Revalidar: `/admin/businesses`

---

## 6. Dashboard do Empreendedor `/dashboard` (em rota `(main)`)

Lista negócios do usuário com status badges:
- `PENDING` → amarelo + "Aguardando aprovação"
- `APPROVED` → verde + link para página pública
- `REJECTED` → vermelho + `rejectionReason` + "Verifique os requisitos"

---

## 7. Arquitetura de Rotas — Route Groups

O root layout `app/layout.tsx` passa a ser mínimo (html, body, fonts, providers). Header e Footer ficam em `app/(main)/layout.tsx`.

```
app/
  layout.tsx                    ← root: html, body, fonts apenas
  page.tsx                      ← homepage = mapa-first (sem header/footer)
  (main)/
    layout.tsx                  ← Header + Footer
    login/page.tsx
    businesses/
    dashboard/
    admin/
  api/
    geocode/route.ts
    auth/[...nextauth]/route.ts
```

Rotas como `/businesses`, `/dashboard`, `/admin`, `/login` ficam dentro de `(main)` e exibem o header padrão. A homepage `/` fica fora e exibe apenas o mapa full-screen com overlays próprios.

---

## 8. Homepage Map-First (`/`)

### 8.1 Experiência desejada

Ao abrir o app, o usuário vê o mapa de General Sampaio preenchido com pins dos negócios aprovados. A marca, busca e filtros aparecem como overlays sobre o mapa — não acima/abaixo. Mobile-first, premium, leve.

### 8.2 Estrutura da tela

```
┌────────────────────────────────────┐
│ [Logo] Empreende General    [👤][+] │  ← overlay header (fixo, blur bg)
│ [🔍 Buscar negócios...          ]   │  ← barra de busca overlay
│ [Alimentação][Beleza][Serviços]...  │  ← chips de categoria (scroll horizontal)
├────────────────────────────────────┤
│                                    │
│          MAPA LEAFLET              │  ← ocupa 100dvh
│    📍 📍    📍                     │
│         📍                         │
│                                    │
│  [📍 Usar minha localização]        │  ← botão FAB canto inferior esquerdo
└────────────────────────────────────┘
```

Ao clicar em pin → abre `BusinessMapCard` como sheet/card sobre o mapa.

### 8.3 Dados carregados no servidor

```ts
// app/page.tsx (Server Component)
const businesses = await prisma.business.findMany({
  where: { status: "APPROVED", latitude: { not: null }, longitude: { not: null } },
  select: { id, name, slug, latitude, longitude, category, featured, phone, whatsapp, address }
})
const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
```

Passados como props para os componentes client.

---

## 9. Componentes de Mapa

### 9.1 `MapView` (client, SSR: false)

Localização: `components/map/MapView.tsx`

- Carregado via `dynamic(() => import("./MapView"), { ssr: false })` — Leaflet não suporta SSR
- Tile: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Centro padrão: General Sampaio, CE (`-3.754, -39.453`), zoom 14
- Marker customizado por categoria (DivIcon HTML com emoji + cor):

| Categoria | Emoji | Cor |
|-----------|-------|-----|
| Alimentação | 🍽️ | laranja |
| Beleza | 💅 | rosa |
| Comércio | 🛍️ | azul |
| Serviços | 🔧 | cinza |
| Agro | 🌾 | verde |
| Saúde | ❤️ | vermelho |
| Default | 📍 | azul-dark |

- Negócio em destaque (`featured: true`): marker 1,4× maior + borda dourada
- Localização do usuário: `navigator.geolocation.getCurrentPosition()` (opcional, ativado por botão)
- Clique no marker → chama `onSelectBusiness(business)`

### 9.2 `BusinessMapCard` (client)

Localização: `components/map/BusinessMapCard.tsx`

Card/sheet que aparece sobre o mapa ao clicar em um pin. Exibe:
- Nome do negócio + categoria badge
- Distância do usuário (se localização disponível): ex. "450 m" ou "1,2 km" — calculado via Haversine no cliente
- WhatsApp (link direto `https://wa.me/...`)
- Link "Ver detalhes" → `/businesses/[slug]`
- Botão X para fechar

Mobile: posicionado na base da tela (fixed bottom). Desktop: card posicionado.

**Fórmula de distância (Haversine):**
```ts
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number
```
Exibição: < 1 km → "450 m", ≥ 1 km → "1,2 km".

### 9.3 `MapOverlayHeader` (client)

Localização: `components/map/MapOverlayHeader.tsx`

Header fixo sobre o mapa com:
- Logo/marca + slogan (`NEXT_PUBLIC_SLOGAN`)
- Barra de busca (filtra pins por nome ao digitar)
- Chips de categoria (filtra pins ao clicar)
- Botão "+" → `/dashboard/new` (se autenticado) ou `/login`
- Botão de usuário (avatar se autenticado, ícone se não)

---

## 10. Distância e Localização do Usuário

- Localização é **opcional** — não solicitada automaticamente
- Botão FAB "📍 Usar minha localização" → chama `navigator.geolocation.getCurrentPosition()`
- Se negado: UI continua normalmente, distâncias não são exibidas
- Não rastrear em segundo plano (`watchPosition` não é usado)
- Google Maps para rota: link externo simples, sem API:
  `https://www.google.com/maps/search/?api=1&query=LAT,LNG`

---

## 11. Arquitetura futura prevista (não implementar agora)

O modelo `Business` já tem `featured` (boolean). Campos futuros sem implementação agora:
- `checkIns` — tabela `CheckIn(userId, businessId, createdAt)`
- `badges` — relação many-to-many `BusinessBadge`
- `promotions` — tabela `Promotion(businessId, title, discount, validUntil)`

Não implementar. Não bloquear arquitetura para isso.

---

## 12. Fora do Escopo deste Sprint

- Upload de imagens (Cloudinary)
- Avaliações (interface)
- Favoritos
- Denúncias
- Dashboard analítico
- CMS/artigos
- Pin arrastável no `LocationPicker`
- Painel de gestão de admins
- Check-ins, badges, cupons
- Importação da planilha de empreendimentos

---

## 13. Variáveis de Ambiente Necessárias

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=
NEXT_PUBLIC_SLOGAN=          # exibido no header do mapa
```

**Nota:** Nenhuma chave de API de mapas necessária — Nominatim é gratuito e sem autenticação. Google Maps usado apenas como link externo (não API).
