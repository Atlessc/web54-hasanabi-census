# Contribution Breakdown

## Overview

This document summarizes the modernization and Census Explorer work contributed to the HasanAbi Census project in 2026.

The original application concept, census presentation, data work, visual language, SolidJS architecture, Chart.js visualizations, SCSS styling approach, and project direction belong to the original project and its author, **[brilliantdrink](https://github.com/brilliantdrink)**.

This contribution is intended to modernize and extend the existing project without replacing its framework, styling system, charting library, or overall character.

The contribution focuses on:

- dependency and security maintenance
- local development workflow improvements
- TypeScript modernization
- repository hygiene
- a new Census Explorer navigation shell
- responsive layout improvements
- chart sizing fixes
- accessibility and interaction improvements
- explicit original-project attribution

During preparation of the upstream pull request, the contribution was reconciled against the latest upstream `main` so the original author's new August 2026 census work and chart fixes remain intact.

---

## 1. Dependency and Security Modernization

The npm dependency tree was reviewed and updated with an emphasis on resolving known vulnerabilities without forcing unnecessary breaking upgrades.

### Work completed

- Audited the existing npm dependency tree.
- Avoided destructive `npm audit fix --force` behavior.
- Updated vulnerable or outdated packages to compatible modern versions.
- Updated the esbuild toolchain.
- Updated `esbuild-sass-plugin`.
- Updated compatible SolidJS-related dependencies through the lockfile.
- Regenerated `package-lock.json`.
- Re-ran dependency security checks after the updates.

### Result

The dependency audit reached:

```text
found 0 vulnerabilities
```

The project remains on the existing SolidJS + esbuild architecture.

---

## 2. Development and Build Workflow Improvements

The project already used a custom esbuild build process. That architecture was kept and extended instead of replacing it with Vite or another bundler.

### Development mode

The custom `build.js` workflow was expanded to support a proper development mode using esbuild's existing APIs.

Added behavior includes:

- esbuild `context()` workflow
- file watching
- automatic rebuilds
- local static serving
- browser live reload through esbuild's `/esbuild` Server-Sent Events endpoint
- development source maps
- development-specific build behavior
- production-only minification and tree shaking
- an initial build before serving so the generated application exists before the browser requests it

The local development server runs at:

```text
http://127.0.0.1:8000
```

### npm scripts

The project now exposes clear development, build, watch, and type-check commands:

```json
{
  "dev": "NODE_ENV=development node build.js",
  "build": "node build.js",
  "watch": "NODE_ENV=watch node build.js",
  "typecheck": "tsc --noEmit"
}
```

### Existing architecture intentionally preserved

The contribution continues to use:

- SolidJS
- esbuild
- SCSS
- CSS Modules
- PostCSS
- Autoprefixer
- Chart.js
- Embla Carousel
- the existing asset-loader approach
- the existing generated-site build model

---

## 3. TypeScript Modernization

TypeScript was added as an explicit development dependency and the compiler configuration was modernized for the current SolidJS/esbuild project.

### Compiler configuration improvements

The updated TypeScript configuration includes:

- `ES2020` target
- `ESNext` modules
- bundler-style module resolution
- DOM and iterable DOM libraries
- SolidJS JSX configuration
- strict type checking
- `noImplicitReturns`
- `isolatedModules`
- `noEmit`
- synthetic default import support
- consistent filename casing enforcement
- source-only inclusion
- generated output exclusion

### Asset module declarations

TypeScript declarations were added for asset types already supported by the project's esbuild configuration:

- `.module.scss`
- `.scss`
- `.csv`
- `.svg`
- `.png`
- `.jpg`
- `.webp`
- `.mp3`
- `.txt`
- `.ttf`
- `.woff`
- `.woff2`

This aligns TypeScript's module resolution with assets the application already imports successfully at build time.

---

## 4. Repository Hygiene

The repository ignore rules were expanded to cover common local-development artifacts.

Added or clarified ignore coverage includes:

- `node_modules/`
- environment files
- logs
- macOS metadata
- editor and IDE files
- temporary directories
- caches
- coverage output
- TypeScript build metadata
- local tooling caches
- backup/original files

### Generated `docs/` output

During preparation of the upstream PR, the original author changed upstream behavior so `docs/` is ignored as generated output.

That upstream choice is preserved.

The pull request therefore does **not** include generated `docs/` files.

`package-lock.json` remains tracked for reproducible dependency resolution.

---

## 5. Census Explorer Application Shell

The original full-screen slide presentation was reorganized into a more structured **Census Explorer** interface while retaining the original data visualizations.

The new shell is conceptually:

```text
┌──────────────────────────────────────────┐
│ Explorer Header                          │
├──────────────────────────────────────────┤
│                                          │
│ Home / Census Visualization              │
│                                          │
├──────────────────────────────────────────┤
│ Horizontal Category Navigation           │
├──────────────────────────────────────────┤
│ Original Project Attribution Footer      │
└──────────────────────────────────────────┘
```

The charting system itself remains Chart.js-based and continues to use the existing census datasets and presentation logic.

---

## 6. Stable Census Category Model

The slide registry was expanded so each census category has a stable machine-readable identifier in addition to its display name.

Current identifiers include:

```text
home
age
gender
political-ideology
ethnicity
religion
sexuality
height
trans-chatters
location
salary
education
vcard
weebs
diet
neurodiversity
gayming-frogs
years-watched
political-activism
housing
discovery
```

This provides a cleaner basis for:

- navigation state
- category synchronization
- future URL state
- future view switching
- future comparisons

### Cover renamed to Home

The navigation label formerly presented as:

```text
Cover
```

is now:

```text
Home
```

The internal identifier was also changed to `home` rather than retaining an obsolete `cover` slug.

---

## 7. Explorer Header

A persistent application header was added.

The header includes:

- the original HasanAbi Census title artwork
- Home navigation through the title/logo
- the current census category control
- the current visualization-mode indicator
- responsive behavior at narrower widths

The existing title SVG is reused rather than introducing replacement branding.

---

## 8. Custom Category Dropdown

The native browser category `<select>` was replaced with a custom SolidJS dropdown so its appearance and placement can match the Census Explorer interface.

### Behavior

The custom dropdown:

- opens directly below the category control
- uses the project's dark visual style
- displays all census categories
- highlights the current category
- updates the main visualization carousel
- closes after selection
- closes when clicking outside
- closes with `Escape`
- exposes expanded/menu state through ARIA attributes
- remains usable on narrower screens

This removes platform-dependent native select rendering while keeping the control keyboard-accessible.

---

## 9. Horizontal Category Rail

The original large wrapped category navigation was replaced with a horizontal category rail.

The new rail:

- stays on a single horizontal row
- uses the project's existing Embla Carousel dependency
- supports drag/swipe interaction
- includes previous/next rail controls
- synchronizes with the active census slide
- scrolls toward the currently selected category
- highlights the active category
- remains usable on mobile-width layouts
- reads from the same centralized census category registry as the header

### Navigation roles

The interface now provides two complementary category-navigation methods.

**Header dropdown**

Useful for jumping directly to a known category.

**Horizontal category rail**

Useful for sequential browsing and discovering adjacent categories.

---

## 10. Main Carousel Refactor

The original `Slider` component previously owned several overlapping navigation systems.

It handled:

- the primary visualization carousel
- desktop category navigation
- mobile category navigation
- mobile expansion/collapse behavior
- multiple carousel instances
- keyboard navigation
- visualization arrow controls

The component was simplified around the Explorer shell.

It now primarily owns:

- selected slide state
- previous/next state
- synchronization with the header
- synchronization with the category rail
- left/right visualization navigation
- keyboard navigation

The old wrapped desktop navigation and separate vertical mobile navigation were replaced by the shared responsive category rail.

---

## 11. Existing Visualization Behavior Preserved

The Explorer work intentionally does not replace the existing census chart system.

Preserved behavior includes:

- Chart.js stacked bar charts
- census data files
- chart labels
- chart colors
- census date ordering
- data labels
- tooltips
- chart notes
- Home presentation
- previous/next category navigation
- swipe/drag navigation
- keyboard category navigation

The initial Explorer phase changes application structure and navigation rather than redefining the census data.

---

## 12. Visualization Layout and Sizing Fixes

The original visualization layout assumed that the chart effectively owned the entire browser viewport.

After adding the Explorer header, category rail, and footer, that assumption caused oversized charts and content clipping.

Observed symptoms included:

- chart titles being pushed under the top header
- legends consuming too much vertical space
- visualization content being clipped
- charts overflowing the actual visualization area

### Legacy bottom-navigation spacing removed

The original slide styles reserved fixed bottom space for the previous navigation system.

That fixed spacing became obsolete once the category rail received its own application-grid row.

The old fixed bottom offset was removed.

### Container-aware chart sizing

`BarChartSlide` was updated so chart dimensions are derived from the actual available visualization container rather than the full browser viewport.

A `ResizeObserver` measures the remaining chart area.

The layout now behaves conceptually as:

```text
Visualization Row
│
├── Category title
├── Optional note
│
└── Remaining available space
    └── Chart
```

Chart sizing therefore accounts for:

- the top Explorer header
- the chart title
- optional chart notes
- the horizontal category rail
- the footer
- browser resizing

---

## 13. Responsive Header Improvements

The compact-header breakpoint was adjusted so desktop controls do not remain active at widths where they no longer fit.

At narrower widths:

- redundant control labels can be hidden
- the selected category remains visible
- the View control can be hidden where necessary
- the title/logo uses a smaller footprint
- the category dropdown remains accessible

This prevents the header controls from clipping or extending beyond the viewport.

---

## 14. Keyboard and Interaction Safety

Keyboard category navigation remains available for the primary visualization carousel.

Global navigation handling was also tightened so interacting with form controls or buttons does not unexpectedly trigger carousel navigation.

Interactive elements such as buttons, inputs, and selectors are excluded from global left/right navigation where appropriate.

---

## 15. Original Project Attribution Footer

A dedicated footer was added beneath the category navigation.

It credits the original project:

```text
Original project by @brilliantdrink
```

and links to the original author's GitHub profile.

This keeps original authorship visible after the interface restructuring.

---

## 16. Upstream 2026 Work Preserved During Reconciliation

The upstream pull-request branch was created from the latest original-project `main` and this contribution was applied on top of it.

The following upstream work was explicitly preserved rather than overwritten.

### August 2026 census data

The original author's latest August 2026 census update remains the source of truth.

### Ethnicity source update

Upstream replaced the previous `race.csv` source with:

```text
ethnicity.csv
```

The Explorer category model uses the new upstream ethnicity source.

### Age category/color changes

The upstream `colorsAge` changes remain enabled for the Age visualization.

### New 2026 categories

The following upstream categories were added to the Explorer registry:

```text
Political Activism
Housing
Discovery
```

They use stable Explorer IDs:

```text
political-activism
housing
discovery
```

### Chart normalization / scale fixes

The original author's latest Chart.js stacked-scale changes remain untouched by this contribution.

The PR branch is based on the upstream version containing the latest 0–100% scale correction.

### Data ownership

This contribution does not claim authorship of the new August 2026 census data or the new polls.

Those changes originate from the upstream project and are preserved so the Explorer UI works with the current project state.

---

## 17. Files Added by This Contribution

New application components include:

```text
src/components/ExplorerHeader/
├── ExplorerHeader.tsx
└── explorerHeader.module.scss

src/components/CategoryRail/
├── CategoryRail.tsx
└── categoryRail.module.scss

src/components/ProjectFooter/
├── ProjectFooter.tsx
└── projectFooter.module.scss

src/types/
└── assets.d.ts
```

This documentation file is also intentionally included:

```text
CONTRIBUTION_BREAKDOWN.md
```

---

## 18. Existing Files Significantly Updated

The modernization and Explorer work changes files including:

```text
.gitignore
build.js
package.json
package-lock.json
tsconfig.json

src/components/Slider/Slider.tsx
src/components/Slider/slider.module.scss

src/components/Slide/slideData.tsx
src/components/Slide/BarChartSlide.tsx
src/components/Slide/slide.module.scss
```

Generated `docs/` output is intentionally excluded from the upstream pull request.

---

## 19. Validation Performed

The contribution has been validated with:

```bash
npm run typecheck
npm run build
npm run dev
```

The TypeScript compiler and production esbuild build have completed successfully.

Dependency security validation also reached:

```text
found 0 vulnerabilities
```

Before the upstream PR commit, the reconciled branch also passed:

```bash
git diff --cached --check
npm run typecheck
npm run build
```

Visual testing during development included:

- Home
- census chart slides
- the Height slide and category-change note
- Explorer header
- custom category dropdown
- horizontal category rail
- responsive resizing
- medium-width layouts
- chart-title/layout behavior after the Explorer-shell refactor

---

## 20. Design Principles Followed

The modernization intentionally respects the original project's technology and design decisions.

### Preserved

- SolidJS
- SCSS
- CSS Modules
- esbuild
- Chart.js
- Embla Carousel
- existing fonts
- existing title artwork
- existing census presentation
- current upstream census data

### Deliberately not introduced

The contribution does **not** migrate the project to:

- React
- Next.js
- Vite
- Tailwind CSS
- shadcn
- a new router
- a replacement charting library

The purpose is to improve the existing project rather than replace its implementation style.

---

## 21. Current Explorer State

The application currently supports:

```text
Home
  ↓
Census category selection
  ↓
Snapshot visualization
  ↓
Horizontal browsing
```

The current visualization mode remains:

```text
Snapshot
```

This corresponds to the existing stacked census charts.

---

## 22. Planned / Not Yet Implemented

The following ideas are possible future work and are **not** part of this contribution.

### Trend View

A time-series view showing how a response changes across census dates.

### Change View

A visualization focused on percentage-point movement between two census periods.

### Compare View

A richer comparison interface between selected census periods or categories.

### Timeline Scrubber

Interactive selection of census dates.

### Biggest Movers

Automatic summaries of the largest increases and decreases between selected census periods.

### URL Navigation

Stable category/view URLs such as:

```text
#sexuality/snapshot
#sexuality/trend
```

No router has been added as part of this contribution.

---

## 23. Contribution Summary

This contribution:

- modernizes and secures the dependency tree
- adds a practical local development workflow
- adds strict TypeScript validation
- adds asset declarations for TypeScript
- improves repository hygiene
- preserves the existing SolidJS/esbuild/SCSS architecture
- introduces stable category identifiers
- renames Cover to Home
- adds a persistent Census Explorer header
- adds a custom category dropdown
- replaces wrapped category navigation with a horizontal rail
- reorganizes the application into an Explorer shell
- adds original-project attribution
- removes legacy layout assumptions
- makes chart sizing responsive to the actual visualization container
- improves responsive header behavior
- preserves current upstream census data and chart behavior
- integrates the upstream Political Activism, Housing, and Discovery categories into the Explorer model
- preserves the latest upstream ethnicity, age-color, and Chart.js scale changes
- establishes a foundation for future Trend, Change, Compare, and URL-state features

---

## Attribution

Original HasanAbi Census project, census data work, visual design, and core visualization concept:

**[brilliantdrink](https://github.com/brilliantdrink)**

Modernization, security updates, development workflow improvements, TypeScript work, responsive layout work, and Census Explorer interface changes:

**Tyler Smith / Atlessc**

This document is included to make the boundaries between original upstream work, preserved upstream updates, and this contribution explicit.
