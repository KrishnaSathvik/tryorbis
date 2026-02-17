

# Orbis Redesign -- Adopting the Warm, Polished Design Language

## Overview

Redesign the entire Orbis application to adopt the warm, cream-toned, rounded aesthetic from the shared design template. The template uses a warm beige/cream palette, soft shadows, large rounded corners (up to `rounded-[32px]`), the **Nunito** font for headings, backdrop blur / glassmorphism effects, and subtle hover animations. We will extract these design tokens and apply them consistently across all pages and components.

## Design Tokens to Extract

| Token | Current Value | New Value (from template) |
|---|---|---|
| Background | `hsl(0 0% 99%)` (near-white) | Warm cream `#FDFBF9` (light) / keep dark mode dark |
| Card background | Pure white | `#FDFBF9` or `white/80` with backdrop-blur |
| Stat card bg | `bg-secondary` | Warm stone `#F6F4F0` |
| Heading font | Space Grotesk | **Nunito** (600/700/800) |
| Body font | Inter (keep) | Inter (keep) |
| Primary accent | Blue `hsl(220 70% 50%)` | Keep blue but warmer tone or shift slightly |
| Border radius | `0.75rem` | Larger: cards `1.5rem` (24px), feature cards `2rem` (32px) |
| Card borders | `border` (gray) | `border-white/60` or `border-slate-100` -- softer |
| Shadows | `shadow-sm` | Richer: `shadow-lg` on hover, `shadow-2xl` on hero elements |
| Buttons | `rounded-md` | `rounded-full` (pill shape) for primary CTAs |
| Sidebar active bg | `bg-sidebar-accent` | Warm cream `#EAE5DC` |
| Stat labels | Standard text | `text-xs font-semibold` with icon in `bg-white rounded-md shadow-sm` container |
| Hover effects | Basic color change | `hover:-translate-y-0.5 hover:shadow-xl transition-all` |
| Animations | None | `fade-in` and `slide-up` keyframes on page load |

## Files to Change

### 1. `src/index.css` -- Global Design Tokens
- Import Nunito font (replace Space Grotesk)
- Update CSS custom properties for the warm cream palette:
  - `--background: 30 25% 98%` (cream)
  - `--card: 30 20% 99%`
  - `--secondary: 30 15% 94%` (warm stone `#F6F4F0`)
  - `--accent: 30 15% 90%` (warm `#EAE5DC`)
  - `--border: 30 10% 90%`
  - `--sidebar-accent: 30 20% 90%`
- Set heading font-family to Nunito
- Add `fade-in` and `slide-up` keyframe utilities
- Add utility classes: `.card-warm` (large radius + soft shadow), `.btn-pill`
- Hide scrollbar styling from template

### 2. `tailwind.config.ts` -- Extended Tokens
- Add `cream` color scale (`50/100/200`)
- Add `nunito` font family
- Add `fade-in` and `slide-up` animations/keyframes
- Increase default `--radius` to `1rem`

### 3. `src/components/AppSidebar.tsx` -- Warm Sidebar
- Update sidebar background to `bg-white/50 backdrop-blur-sm`
- Active nav item: `bg-[#EAE5DC] text-slate-900 font-medium`
- Inactive nav items: `text-slate-500 hover:text-slate-900 hover:bg-slate-50`
- Logo section styling with warmer colors
- "Tools" / grouped section labels: `text-[11px] font-bold uppercase tracking-wider text-slate-400`

### 4. `src/components/AppLayout.tsx` -- Layout Updates
- Header bar: softer border, optional search bar (pill-shaped `rounded-full` input)
- Main content area: `bg-[#FDFBF9]` background

### 5. `src/pages/Dashboard.tsx` -- Warm Dashboard
- Stat cards: `bg-[#F6F4F0] rounded-xl` with icon in `bg-white rounded-md shadow-sm` container
- CTA cards: `bg-white/80 backdrop-blur-md rounded-[32px] border-white/60 shadow-lg hover:shadow-xl hover:-translate-y-1`
- Heading font: Nunito (`font-nunito`)
- Add slide-up animation on mount

### 6. `src/pages/Landing.tsx` -- Premium Landing
- Hero section: Larger heading (80px on desktop), Nunito font, tighter tracking
- CTA buttons: pill-shaped (`rounded-full`), dark bg (`bg-[#1A1A1A]`), hover lift effect
- Secondary CTA: `bg-white/40 backdrop-blur-md border-white/50` glassmorphism
- Feature cards: `bg-white/80 backdrop-blur-md rounded-[32px] p-8 border-white/60 shadow-lg`
- Icon containers: `w-14 h-14 bg-[#F6F4F0] rounded-2xl shadow-sm`
- Section headers: `text-xs font-bold tracking-widest uppercase text-slate-500`
- Stats section: warm card style matching dashboard stat cards
- Fade-in and slide-up animations

### 7. `src/pages/Auth.tsx` -- Warm Auth Card
- Card: `rounded-[32px]` with warm background
- Button: pill-shaped, dark background
- Overall warmer, softer feel

### 8. `src/pages/Backlog.tsx` -- My Ideas Redesign
- Idea cards: larger radius (`rounded-2xl`), warm hover states
- Status badges: pill-shaped with dot indicator (e.g., green dot + "Validated")
- Filter button: `rounded-xl` with icon, matching template filter style
- Add idea form: warmer card with `rounded-[32px]`

### 9. `src/pages/GenerateIdeas.tsx` -- Chat Redesign
- Chat bubbles: slightly warmer styling
- Research card: warm cream background, larger radius
- Result cards: `rounded-2xl`, warm hover effects
- Params preview: warmer chip styling

### 10. `src/pages/ValidateIdea.tsx` -- Validation Redesign
- Same chat warm treatment
- Report cards: larger radius, warm backgrounds
- Score bars: warmer colors
- Competitor cards: warm stone background

### 11. `src/pages/Reports.tsx` -- History Redesign
- History items: warm card styling with larger radius
- Badge styling: updated to match template pill badges

### 12. Shared Components
- `src/components/ScoreBar.tsx` -- warmer progress bar colors
- `src/components/VerdictBadge.tsx` -- pill-shaped with dot indicator
- `src/components/ResearchTrace.tsx` -- warmer step styling

## Implementation Order

1. Global tokens first (`index.css`, `tailwind.config.ts`) -- this propagates changes everywhere
2. Layout components (`AppLayout`, `AppSidebar`) -- sets the frame
3. Landing page -- first impression
4. Auth page -- entry point
5. Dashboard -- main app view
6. Remaining pages (Backlog, GenerateIdeas, ValidateIdea, Reports)
7. Shared components (ScoreBar, VerdictBadge, ResearchTrace)

## Technical Details

- Font import: Replace Space Grotesk with Nunito in the Google Fonts URL
- Keep Inter as body font (matches the template)
- Dark mode: Keep existing dark tokens, just warm them slightly
- No new dependencies needed -- all achievable with Tailwind utilities
- Animations use CSS keyframes, no JS animation library needed

