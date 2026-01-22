# Background System Architecture & Implementation

## 1. Description of the Architecture

The background system provides a consistent, immersive "guild hall" atmosphere across the entire application. It uses a **layered approach**:

1.  **Global Background Layer (z-0)**:
    *   **Base Layer**: A CSS linear gradient providing the deep brownish-black foundation.
    *   **Texture Layer**: An SVG noise filter applied via `backgroundImage` to simulate stone/parchment grain, set to low opacity.
    *   **Vignette Layer**: A radial gradient darkening the edges to focus attention on the center.
    *   **Lighting Layer**: A subtle "candlelight" warms wash in the center-top area.
    *   **Interaction**: All background layers are `pointer-events-none` to ensure they don't block clicks.

2.  **Foreground Content Layer (z-10)**:
    *   All interactive pages (`Dashboard`, `Lobby`, etc.) live in a relative container with `z-10`.
    *   **Panels**: Specific content is housed in `ContentPanel` components. These panels use `backdrop-blur` and semi-transparent gradients (`parchment`, `wood`, `stone` variants) to remain readable while letting the background texture subtly bleed through.

3.  **State Management**:
    *   The background supports a `isDarker` variant (toggled via Navigation) which shifts the base gradient to a deeper obsidian tone, suitable for "dungeon" moods.

## 2. New Components

### `GlobalBackground`
*   **Location**: `src/components/common/GlobalBackground.tsx`
*   **Purpose**: Renders the fixed-position background layers.
*   **Props**: `isDarker` (boolean).

### `ContentPanel`
*   **Location**: `src/components/common/ContentPanel.tsx`
*   **Purpose**: The primary container for text and interactive elements.
*   **Variants**: 
    *   `parchment` (Light, readable, for text/forms).
    *   `wood` (Dark brown, for structural headers/sidebars).
    *   `stone` (Dark grey, for map containers/dungeon elements).

### `Navigation`
*   **Location**: `src/components/navigation/Navigation.tsx`
*   **Purpose**: Global top bar. Includes page navigation and the Theme Toggle (Sun/Moon).

## 3. Theme Adjustment Guide

To adjust the intensity of the theme in the future:

*   **To make background darker/lighter**: Edit `GlobalBackground.tsx` -> `linear-gradient` colors.
*   **To change texture visibility**: Edit `GlobalBackground.tsx` -> `opacity-[0.15]` on the noise layer.
*   **To adjust Panel transparency**: Edit `ContentPanel.tsx` -> Tailwind opacity values (e.g., `stone-100/95` to `stone-100/100` for opaque).

## 4. Implementation Details

The system relies on Tailwind CSS for utility classes (`fixed inset-0`, `z-0`, `opacity-*`) and standard CSS for complex gradients. The configuration is centralized in `tailwind.config.js` to map semantic color names (even though the current implementation relies heavily on specific `amber-*` and `stone-*` palette colors introduced in the reference implementation).

This architecture cleanly separates *atmosphere* (background) from *function* (pages), allowing the "DnD" theme to be swapped or tweaked without breaking the app logic.
