# CLAUDE.md

## 🧠 CONTEXTO DO PROJETO

Este projeto é um webapp chamado **Empreende General**.

Trata-se de uma plataforma digital para valorização e visibilidade dos pequenos empreendedores da cidade de General Sampaio/CE.

O sistema deve:
- ser útil de verdade para o empreendedor local
- permitir descoberta de negócios por moradores e turistas
- funcionar como mapa econômico da cidade
- ter potencial de expansão para outras cidades
- ser moderno, leve, rápido e mobile-first
- parecer uma iniciativa institucional e tecnológica (não política)

---

## 🏷️ IDENTIDADE DO PRODUTO

- **Nome:** Empreende General
- **Slogan:** configurável via variável de ambiente `NEXT_PUBLIC_SLOGAN`
- **Crédito institucional:** "Uma iniciativa Andrade Systems" — exibido de forma discreta e elegante no rodapé
- **Tom:** institucional, tecnológico, próximo e profissional — nunca político

---

## 🎯 OBJETIVO DO PRODUTO

Criar um webapp robusto que permita:

- cadastro de negócios locais
- visualização em mapa interativo
- listagem e busca de empreendedores
- páginas individuais de negócios
- avaliações e comentários
- painel do empreendedor
- painel administrativo completo
- moderação de conteúdo
- geração de dados estratégicos

---

## 🏗️ STACK TECNOLÓGICA (OBRIGATÓRIA)

Utilizar:

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- Auth.js v5 (NextAuth)
- React Hook Form + Zod
- Google Maps API (Maps + Geocoding)
- Cloudinary (gestão de imagens e CDN)
- Deploy na Vercel (edge + serverless)

Não alterar a stack sem justificativa forte e documentada.

---

## 🎨 DIRETRIZES DE UX/UI

O design deve ser:

- moderno (estilo startup)
- leve e rápido
- mobile-first
- acessível para usuários simples
- visual premium, mas sem exageros
- com foco em clareza e facilidade de uso

Cores principais:
- azul
- branco

Evitar:
- interfaces pesadas
- excesso de elementos
- layouts confusos

---

## 👥 TIPOS DE USUÁRIO

### Visitante
- navega, busca e visualiza negócios
- pode avaliar apenas se logado

### Usuário autenticado
- login social
- pode avaliar, comentar, favoritar

### Empreendedor
- cadastra e edita seu negócio
- responde avaliações

### Administrador
- aprova negócios
- edita tudo
- remove avaliações
- gerencia conteúdo
- acessa dashboard

---

## 🔐 REGRAS DE NEGÓCIO IMPORTANTES

- Todo negócio precisa de aprovação antes de aparecer publicamente
- Apenas administradores podem remover avaliações
- Empreendedores NÃO podem apagar avaliações
- Avaliações exigem login
- Cada usuário pode ter uma avaliação por negócio
- Cadastro de negócio deve ser simples (UX rápida)

---

## 🗺️ MAPA E GEOLOCALIZAÇÃO

Fluxo obrigatório:

1. Usuário digita o endereço
2. Sistema converte em coordenadas via Google Geocoding API
3. Exibe o pin no mapa
4. Usuário confirma ou ajusta o pin manualmente
5. Salvar latitude e longitude no banco

Utilizar Google Maps API.

---

## 📸 IMAGENS

- cada negócio pode ter múltiplas imagens
- imagens devem ser otimizadas
- usar Cloudinary para upload, armazenamento e CDN
- evitar armazenamento local

---

## ⭐ AVALIAÇÕES

- nota de 1 a 5
- comentário opcional
- login obrigatório
- empreendedor pode responder
- admin pode remover

---

## 🛡️ MODERAÇÃO

- negócios: aprovação obrigatória antes de aparecer
- avaliações: removíveis apenas por admin
- denúncias devem existir

---

## 📊 DASHBOARD ADMIN

Deve incluir:

- total de negócios cadastrados
- negócios por categoria
- negócios por região
- novos cadastros (linha do tempo)
- avaliações recentes
- dados exportáveis
- gráficos simples e claros

---

## 📰 CONTEÚDO / EDITORIAL

O sistema deve permitir:

- publicar conteúdos/artigos
- destacar negócios na home
- criar seções configuráveis na home

---

## 📁 ORGANIZAÇÃO DO CÓDIGO

```
/app              → rotas (App Router)
/components       → componentes reutilizáveis
/lib              → utilitários, configs, helpers
/services         → integrações externas (Maps, Cloudinary, etc.)
/prisma           → schema e migrations
/hooks            → custom hooks
/types            → tipos globais TypeScript
/config           → constantes e configurações do projeto
/validations      → schemas Zod
```

Evitar:
- código duplicado
- lógica de negócio espalhada em componentes
- arquivos com mais de 300 linhas

---

## 🧾 BANCO DE DADOS

Utilizar Prisma com PostgreSQL.

Entidades principais:
- User
- Business
- Category
- Review
- ReviewReply
- Favorite
- Image
- Role
- Lead
- Article
- Highlight
- Report (denúncias)

Utilizar:
- enums para status (ex: BusinessStatus, UserRole)
- timestamps (createdAt, updatedAt) em todas as entidades
- soft delete (deletedAt) quando necessário

---

## 🧾 CONVENÇÕES DE CÓDIGO

- **Idioma do código:** inglês (variáveis, funções, componentes, rotas)
- **Idioma dos comentários:** português
- **Commits:** conventional commits (`feat`, `fix`, `chore`, `refactor`, `docs`)
- **Componentes:** PascalCase
- **Funções e variáveis:** camelCase
- **Server Actions:** sufixo `Action` (ex: `createBusinessAction`)
- **Arquivos de rota:** sempre `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Nunca usar `any` no TypeScript** — sempre tipar corretamente

---

## 🔑 VARIÁVEIS DE AMBIENTE

O projeto requer as seguintes variáveis:

```env
# Banco de dados
DATABASE_URL=

# Auth.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Produto
NEXT_PUBLIC_SLOGAN=
```

Nunca expor variáveis sensíveis no cliente. Usar prefixo `NEXT_PUBLIC_` apenas quando necessário.

---

## ⚙️ BOAS PRÁTICAS

- usar TypeScript corretamente (strict, sem `any`)
- validar todos os inputs com Zod
- tratar erros de forma consistente
- criar componentes reutilizáveis
- manter código legível
- evitar complexidade desnecessária
- comentar apenas o necessário, em português
- Server Actions para todas as mutations
- Componentes com `use client` apenas quando estritamente necessário

---

## 🚀 PERFORMANCE

- otimizar imagens via Cloudinary + next/image
- lazy loading quando possível
- evitar requisições desnecessárias
- usar cache (Next.js cache / revalidatePath) quando fizer sentido

---

## 🔐 LGPD (BÁSICO)

- incluir política de privacidade
- incluir termos de uso
- pedir consentimento no cadastro
- não expor dados sensíveis

---

## 🧠 TOM DO PRODUTO

O sistema deve transmitir:

- proximidade
- confiança
- valorização do empreendedor
- modernidade
- utilidade real

Nunca deve parecer:
- propaganda política
- sistema improvisado
- produto amador

---

## ⚠️ O QUE EVITAR

- decisões arquiteturais sem explicação
- criar funcionalidades fora do escopo
- usar bibliotecas desnecessárias
- ignorar mobile
- ignorar performance
- quebrar consistência do projeto
- pular etapas do fluxo de trabalho

---

## 🧭 FLUXO DE TRABALHO

Sempre trabalhar em etapas:

1. arquitetura e planejamento
2. estrutura do projeto e boilerplate
3. banco de dados (schema Prisma)
4. autenticação
5. páginas principais (público)
6. painel do empreendedor
7. painel administrativo
8. funcionalidades avançadas (mapa, avaliações, destaque)

**Nunca pular etapas.**

---

## 📌 IMPORTANTE

Este projeto deve ser tratado como um produto real, não um protótipo.

Priorizar:
- qualidade
- clareza
- escalabilidade
- experiência do usuário

Este produto representa uma iniciativa concreta de desenvolvimento econômico local. O código deve estar à altura dessa responsabilidade.