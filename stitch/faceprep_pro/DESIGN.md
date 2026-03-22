# Design System Strategy: The Intelligent Path

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Articulated Mentor."** In the high-stakes world of AI interview preparation, the UI must feel both intellectually superior and emotionally steady. We move beyond generic SaaS templates by embracing a high-end editorial aesthetic: one that values negative space as a functional tool rather than a void. 

This system breaks the "standard grid" through **intentional asymmetry**—using wide margins and off-center focal points to guide the candidate's focus. We replace rigid structural lines with tonal depth, creating a digital environment that feels like a quiet, premium study lounge rather than a cluttered dashboard.

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated interplay of deep professional blues and ivory-leaning neutrals, moving away from cold, stark whites to a more grounded, editorial "paper" feel.

- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for defining sections. Structure is achieved through "Tonal Shifts." For instance, a `surface-container-low` (#f6f3f2) card should sit on a `surface` (#fcf9f8) background. The eye perceives the boundary through the change in luminosity, not a harsh stroke.
- **Surface Hierarchy & Nesting:** Treat the UI as layers of physical material.
    - **Base Layer:** `surface` (#fcf9f8)
    - **In-Page Containers:** `surface-container-low` (#f6f3f2)
    - **Floating Interactions:** `surface-container-lowest` (#ffffff) for maximum "lift."
- **The Glass & Gradient Rule:** To evoke the "AI" intelligence of the platform, use Glassmorphism for floating overlays. Apply a 20px `backdrop-blur` with a semi-transparent `surface-container-lowest` fill. 
- **Signature Textures:** For primary CTAs and hero sections, use a subtle linear gradient from `primary` (#004ac6) to `primary-container` (#2563eb). This creates a "glow" effect that suggests energy and momentum.

---

## 3. Typography: Editorial Authority
The typographic pairing of **Plus Jakarta Sans** and **Inter** creates a balance between architectural confidence and functional clarity.

- **Display & Headlines (Plus Jakarta Sans):** Used for large-scale emotional impact. These levels should use **tight tracking (-2%)** to create a cohesive, custom-lettered look.
- **Body & Labels (Inter):** Used for the "data layer." Inter’s high x-height ensures readability during stressful mock interview sessions.
- **Brand Identity through Scale:** We utilize extreme contrast. A `display-lg` (3.5rem) headline might sit near a `label-md` (0.75rem) descriptor. This "High-Low" pairing is a hallmark of premium editorial design, making the platform feel curated and expensive.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor spacing. In this system, we use **Tonal Layering** first.

- **The Layering Principle:** Depth is inherent in the color tokens. Use `surface-container-high` (#eae7e7) to indicate "depressed" or secondary areas, while using `surface-container-lowest` (#ffffff) to make active elements "pop."
- **Ambient Shadows:** When a true floating state is required (e.g., a modal or a primary floating action button), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(28, 27, 27, 0.06);`. The shadow must feel like ambient light, never like a dark smudge.
- **The "Ghost Border" Fallback:** For accessibility in complex inputs, use the `outline-variant` (#c3c6d7) at **15% opacity**. This provides a hint of structure without breaking the minimalist aesthetic.

---

## 5. Components

### Buttons
- **Primary:** Rounded (`md`: 0.75rem), using the signature Blue Gradient. Text is `label-md` in `on-primary` (#ffffff).
- **Secondary:** Transparent background with a "Ghost Border" or a `surface-container-highest` fill.
- **Interaction:** On hover, a subtle shift in the gradient's angle or a 2px elevation lift.

### Input Fields & AI Chat Bubbles
- **Inputs:** Forgo the 4-sided box. Use a `surface-container-low` fill with a bottom-only 2px weighted line in `primary` when focused.
- **Interview Response Bubbles:** Use `surface-container-lowest` with a `lg` (1rem) corner radius. For AI feedback bubbles, use a subtle `glassmorphism` effect to distinguish "machine" from "human."

### Progress & Assessment Bars
- **Style:** Avoid rounded-cap "pill" bars. Use flat-ended, slim bars with `outline-variant` as the track and `primary` as the fill. This feels more like a professional technical instrument.

### Cards & Lists
- **Rule:** **No Divider Lines.** Use the `Spacing Scale: 8 (2rem)` to create separation. Content groups should be defined by their proximity to one another, not by lines drawn between them. Use `surface-container-low` to wrap related list items.

---

## 6. Do’s and Don’ts

### Do:
- **Use "Active" Whitespace:** Use `Spacing: 16 (4rem)` to separate major sections. Let the content breathe.
- **Intentional Asymmetry:** If a header is left-aligned, try placing the supporting body text 2 columns to the right.
- **Subtle Glass Effects:** Use `backdrop-blur` on navigation bars to allow the brand colors to bleed through as the user scrolls.

### Don't:
- **Don't use 100% Black:** Never use #000000. Use `on-surface` (#1c1b1b) for all text to maintain a soft, premium feel.
- **Don't use Standard Shadows:** Avoid the "Default" shadow settings in design software. Always increase the blur and decrease the opacity.
- **Don't over-round:** While `lg` (1rem) is available, use `md` (0.75rem) for most functional components to keep the look professional and "tech-forward," not "bubbly."
- **Don't use Dividers:** If you find yourself reaching for a `<hr>` tag, use a background color shift or a `24 (6rem)` spacing block instead.