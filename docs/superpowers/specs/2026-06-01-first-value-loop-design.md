# Design Spec — Primeiro Loop de Valor

**Data:** 2026-06-01  
**Sprint:** Login Google → Cadastro de Negócio → Aprovação Admin → Publicação  
**Critério de sucesso:** Um usuário novo entra com Google, cadastra um negócio, o admin aprova, e o negócio aparece publicamente.

---

## 1. Alterações no Schema (Prisma)

### 1.1 Enum `UserRole`

Adicionar `SUPER_ADMIN`:

```prisma
enum UserRole {
  USER
  ENTREPRENEUR
  ADMIN
  SUPER_ADMIN
}
```

### 1.2 Modelo `EntrepreneurProfile`

Criado automaticamente quando o admin aprova o primeiro negócio de um usuário `USER`.

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

Adicionar relação em `User`:
```prisma
entrepreneurProfile EntrepreneurProfile?
```

### 1.3 Campo `rejectionReason` em `Business`

Adicionar campo opcional em `Business`:

```prisma
rejectionReason String? @db.Text
```

Preenchido por `rejectBusinessAction`. Exibido no dashboard do empreendedor quando `status === "REJECTED"`.

### 1.4 Modelo `AdminAction` (log de ações admin)

Registro imutável de aprovações e rejeições.

```prisma
model AdminAction {
  id         String   @id @default(cuid())
  adminId    String
  admin      User     @relation(fields: [adminId], references: [id])
  action     String   // "APPROVE_BUSINESS" | "REJECT_BUSINESS"
  targetId   String   // businessId alvo
  reason     String?  @db.Text
  createdAt  DateTime @default(now())
}
```

Adicionar relação em `User`:
```prisma
adminActions AdminAction[]
```

---

## 2. Autenticação e Roles

### 2.1 Variável de ambiente

```env
ADMIN_EMAILS=email1@example.com,email2@example.com
```

### 2.2 Lógica no `auth.ts`

No callback `signIn`, após o adapter criar/carregar o usuário:

1. Ler `process.env.ADMIN_EMAILS`, split por vírgula, aplicar `.trim().toLowerCase()` em cada entrada.
2. Comparar com `user.email?.toLowerCase()`.
3. Se match **e** `user.role !== "SUPER_ADMIN"`: `prisma.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } })`.
4. O banco é a fonte de verdade a partir desse ponto — logins subsequentes não repetem o update.

### 2.3 Sessão

O callback `session` já injeta `id` e `role`. Nenhuma alteração necessária.

### 2.4 Página `/login`

Server Component. Contém apenas um form com `action` que chama `signIn("google")`. Após login, redireciona para `/dashboard`. Sem campos de e-mail/senha.

### 2.5 Header

- `Header` vira Server Component que chama `auth()` para obter a sessão.
- Quando autenticado: renderiza `UserMenu` (client component) com avatar, nome truncado, links "Meu painel" e "Sair" (dropdown).
- Quando não autenticado: exibe botões "Cadastrar negócio" e "Entrar".

---

## 3. Cadastro de Negócio

### 3.1 Rota `/api/geocode`

`GET /api/geocode?address=...`

- Chama `geocodeAddress()` de `services/maps.ts` (usa `GOOGLE_MAPS_API_KEY` server-side).
- Retorna `{ latitude, longitude, formattedAddress }` em caso de sucesso.
- Se a API key não estiver configurada, retorna `{ error: "geocoding_unavailable" }` com status 503.
- O frontend exibe: "Cadastro de localização temporariamente indisponível."
- **Nunca** retorna fallback que permita salvar sem coordenadas.

### 3.2 Formulário `/dashboard/new`

Rota protegida (middleware já cobre `/dashboard/*`). Estrutura visual em seções — um único `<form>` com Server Action:

| Seção | Campos |
|-------|--------|
| Dados básicos | nome*, categoria (select), descrição |
| Contato | telefone, WhatsApp, Instagram, website |
| Localização | `LocationPicker` (client component) |
| Horários | texto livre (ex.: "Seg–Sex 8h–18h") |
| Imagens | **adiado** — schema preparado, UI na próxima iteração |

`*` obrigatório.

### 3.3 Componente `LocationPicker` (client)

Estados internos: `idle` → `searching` → `confirmed` | `error` | `unavailable`

Comportamento:
1. Input de endereço + botão "Buscar endereço"
2. Ao clicar: fetch para `/api/geocode?address=...`
3. Se sucesso: exibe Google Maps Embed (`iframe` com `q=lat,lng`) + botão "Confirmar localização"
4. Ao confirmar: popula hidden inputs `latitude`, `longitude`, `formattedAddress`; exibe badge "Localização confirmada ✓"
5. O usuário pode clicar "Corrigir" para voltar ao estado `idle` e buscar novamente
6. Se erro/indisponível: exibe mensagem clara, **não** permite avanço

Hidden inputs (preenchidos pelo `LocationPicker`):
- `latitude` (obrigatório para submit)
- `longitude` (obrigatório para submit)
- `formattedAddress`

**O botão de submit do formulário fica desabilitado enquanto `confirmed === false`.**

### 3.4 Server Action `createBusinessAction`

```
Entrada: FormData (validada com createBusinessSchema + lat/lng obrigatórios)

1. auth() → se não autenticado → erro 401
2. Validar com Zod (lat e lng como z.number() obrigatórios)
3. Gerar slug: slugify(name) + verificar unicidade no banco
   - Formato: `padaria-do-ze`, `padaria-do-ze-2`, `padaria-do-ze-3`
   - Loop até encontrar slug disponível (contador começa em 2)
4. prisma.business.create({ status: "PENDING", ownerId: session.user.id, ... })
5. redirect("/dashboard?cadastro=sucesso")
```

Não promove role do usuário. Não cria `EntrepreneurProfile`.

---

## 4. Painel Admin

### 4.1 Rota `/admin/businesses`

Server Component. Guard: verifica `session.user.role` — se não for `ADMIN` ou `SUPER_ADMIN`, `redirect("/")`.

Exibe tabela com colunas: **Nome**, **Categoria**, **Dono** (nome + e-mail), **Endereço**, **Cadastrado em**, **Ações**.

Filtro por status visível: padrão mostra `PENDING`. Toggle para ver `APPROVED` e `REJECTED`.

### 4.2 Server Action `approveBusinessAction(businessId)`

```
1. auth() → verificar role (ADMIN | SUPER_ADMIN)
2. prisma.business.update({ status: "APPROVED" })
3. Buscar owner do negócio
4. Se owner.role === "USER":
   a. prisma.user.update({ role: "ENTREPRENEUR" })
   b. prisma.entrepreneurProfile.upsert({ where: { userId }, create: {...}, update: {} })
5. prisma.adminAction.create({ action: "APPROVE_BUSINESS", targetId: businessId, adminId })
6. revalidatePath("/admin/businesses")
7. revalidatePath("/businesses")
8. revalidatePath("/")
9. revalidatePath(`/businesses/${business.slug}`)
```

### 4.3 Server Action `rejectBusinessAction(businessId, reason: string)`

```
reason é obrigatório (mínimo 10 caracteres).

1. auth() → verificar role (ADMIN | SUPER_ADMIN)
2. prisma.business.update({ status: "REJECTED", rejectionReason: reason })
3. prisma.adminAction.create({ action: "REJECT_BUSINESS", targetId: businessId, adminId, reason })
4. revalidatePath("/admin/businesses")
```

Não altera role do usuário.

---

## 5. Dashboard do Empreendedor `/dashboard`

Server Component protegido. Exibe:

- Lista de negócios do usuário com: nome, status (badge colorido), data de cadastro.
- Status mapping:
  - `PENDING` → badge amarelo + "Aguardando aprovação"
  - `APPROVED` → badge verde + link para a página pública
  - `REJECTED` → badge vermelho + motivo da rejeição (`business.rejectionReason`) + "Verifique os requisitos e cadastre novamente"
- CTA "Cadastrar novo negócio" → `/dashboard/new`
- Se lista vazia: estado vazio com CTA.

---

## 6. Fora do Escopo deste Sprint

- Upload de imagens (Cloudinary)
- Avaliações (interface)
- Favoritos
- Mapa público
- Denúncias
- Dashboard analítico
- CMS/artigos
- Pin arrastável no `LocationPicker`
- Painel de gestão de admins (SUPER_ADMIN exclusivo)

---

## 7. Variáveis de Ambiente Necessárias

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=   # server-side only — não expor no cliente neste sprint
ADMIN_EMAILS=
```
