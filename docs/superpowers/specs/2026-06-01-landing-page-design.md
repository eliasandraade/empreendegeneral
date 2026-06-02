# Landing Page — Empreende General

**Data:** 2026-06-01  
**Status:** Aprovado

---

## Objetivo

Criar uma landing page de entrada para o webapp Empreende General. Atualmente a rota `/` carrega diretamente o mapa; o objetivo é interpor uma tela de boas-vindas que apresenta o produto antes de o usuário entrar no mapa.

---

## Decisões de Design

| Decisão | Escolha |
|---|---|
| Logo | Tipografia estilizada (sem arquivo de imagem) |
| Visual | Gradiente azul vibrante: `#1e3a8a` → `#2563eb`, texto branco |
| Extras | Apenas crédito "Andrade Systems" no rodapé |
| Rota do mapa | Movido de `/` para `/mapa` |

---

## Arquitetura de Rotas

```
/ (app/page.tsx)          → Landing page (NOVO)
/mapa (app/mapa/page.tsx) → Mapa interativo (antigo app/page.tsx, movido)
```

O botão "EXPLORAR!" faz `<Link href="/mapa">`.

---

## Layout — Landing Page

Tela cheia (`100dvh × 100dvw`), fundo em gradiente, conteúdo centralizado vertical e horizontalmente.

```
┌───────────────────────────────────────┐
│  [gradiente: #1e3a8a → #2563eb 135°]  │
│                                       │
│   📍 Empreende General                │  ← ícone SVG inline + nome bold, branco
│   "Conectando empreendedores..."      │  ← slogan do APP_CONFIG, branco/70%
│                                       │
│   Plataforma digital para descoberta  │  ← descrição do APP_CONFIG, branco/60%
│   dos pequenos negócios de General    │
│   Sampaio/CE.                         │
│                                       │
│       [ EXPLORAR →  ]                 │  ← botão grande, branco, texto azul
│                                       │
│   Uma iniciativa Andrade Systems      │  ← rodapé, branco/40%, texto xs
└───────────────────────────────────────┘
```

### Elementos

**Logo tipográfica:**
- Ícone SVG inline: pin de mapa minimalista (`<MapPin>` do lucide-react) em branco
- Nome: `"Empreende "` (font-light) + `"General"` (font-bold) — ambos brancos, `text-4xl md:text-5xl`

**Slogan:**
- Texto do `APP_CONFIG.slogan`, `text-lg`, `text-white/70`

**Descrição:**
- Texto do `APP_CONFIG.description`, `text-sm md:text-base`, `text-white/60`, `max-w-md`, centralizado

**Botão EXPLORAR!:**
- `<Link href="/mapa">` estilizado como botão
- Fundo branco, texto azul (`text-blue-700`), `font-bold`, padding generoso, `rounded-full`
- Hover: leve escala (`hover:scale-105`) e sombra
- Ícone de seta `→` do lucide-react à direita

**Animação de entrada:**
- Fade + slide up via Tailwind `animate-fade-in` ou keyframes inline via `@keyframes`
- Duração 0.6s, easing ease-out

**Rodapé:**
- `APP_CONFIG.credit` ("Uma iniciativa Andrade Systems")
- Posicionado `absolute bottom-4`, `text-xs`, `text-white/40`

---

## Componentes

- `app/page.tsx` — server component, sem DB calls, importa `LandingHero`
- `components/landing/LandingHero.tsx` — componente client (para animação), recebe `appName`, `slogan`, `description`, `credit` como props

---

## Mapa (rota movida)

`app/mapa/page.tsx` — conteúdo idêntico ao atual `app/page.tsx` (DB calls + MapCanvas).  
O antigo `app/page.tsx` é substituído pela landing.

---

## Fora do Escopo

- Login na landing
- Contador de negócios
- Múltiplas seções / scroll
- Animações complexas (parallax, vídeo)
