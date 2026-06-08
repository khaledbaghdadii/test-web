# Icons — Developer Guide

How to use icons in the mxevolve application.
For the full icon catalog and name lookup, see [ICON_CATALOG.md](ICON_CATALOG.md).

---

## Quick start

```html
<mxevolve-icon name="delete" />
```

Import the component once in your module/component:

```typescript
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  imports: [MxevolveIconComponent],
  template: `<mxevolve-icon name="delete" />`,
})
export class MyComponent {}
```

---

## App setup

Provide the `CUSTOM_ICONS_PATH` token at the application level so the component
can resolve custom SVG icons. Material icons work without any provider.

```typescript
import { CUSTOM_ICONS_PATH } from "@mxevolve/shared/ui/primitive";

// In your app module or app config:
providers: [
  { provide: CUSTOM_ICONS_PATH, useValue: "assets/icons" },
]
```

Then make sure the build copies SVGs into that folder.
In the shell's `project.json`, add an asset entry:

```json
{
  "glob": "*.svg",
  "input": "libs/shared/ui/primitive/src/lib/icons/custom-icons/svgs",
  "output": "/assets/icons"
}
```

---

## Examples

### Basic icons

```html
<mxevolve-icon name="home" />
<mxevolve-icon name="search" />
<mxevolve-icon name="settings" />
<mxevolve-icon name="delete" />
```

### Sizes

```html
<mxevolve-icon name="home" size="xs" />   <!-- 14px -->
<mxevolve-icon name="home" size="sm" />   <!-- 16px -->
<mxevolve-icon name="home" size="md" />   <!-- 20px -->
<mxevolve-icon name="home" />              <!-- 24px (default) -->
<mxevolve-icon name="home" size="lg" />   <!-- 28px -->
<mxevolve-icon name="home" size="xl" />   <!-- 36px -->
<mxevolve-icon name="home" size="xxl" />  <!-- 48px -->
```

### Filled vs outlined

```html
<mxevolve-icon name="home" />                    <!-- outlined (default) -->
<mxevolve-icon name="home" [filled]="true" />    <!-- filled -->
```

### Spinning (loading states)

```html
<mxevolve-icon name="progress_activity" [spin]="true" />
<mxevolve-icon name="refresh" [spin]="true" />
```

### Color

```html
<mxevolve-icon name="error" color="var(--p-red-500)" />
<mxevolve-icon name="check_circle" color="#4caf50" />
```

### Accessibility

```html
<!-- Decorative (next to text — no label needed) -->
<mxevolve-icon name="delete" />

<!-- Standalone (screen reader needs context) -->
<mxevolve-icon name="delete" ariaLabel="Delete item" />
```

### Inside PrimeNG buttons

```html
<!-- Icon + text -->
<p-button label="Create" severity="primary">
  <ng-template #icon>
    <mxevolve-icon name="add" size="sm" />
  </ng-template>
</p-button>

<!-- Danger button -->
<p-button label="Delete" severity="danger">
  <ng-template #icon>
    <mxevolve-icon name="delete" size="sm" />
  </ng-template>
</p-button>

<!-- Icon-only rounded button -->
<p-button severity="secondary" [rounded]="true">
  <ng-template #icon>
    <mxevolve-icon name="refresh" [spin]="true" size="sm" />
  </ng-template>
</p-button>
```

### Custom SVG icons

Custom icons are served as static SVG assets and rendered via `<img>`.
They use the same `<mxevolve-icon>` component — just use the SVG filename
(without extension) as the name:

```html
<mxevolve-icon name="murex_logo_ball" />
<mxevolve-icon name="murex_logo_ball" size="xl" />
```

> **Note:** `filled`, `spin`, and `color` only apply to Material icons.
> `size` works for both Material and custom icons.

---

## Adding a new Material icon

1. Find the icon at [Material Symbols (Rounded)](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Rounded).
2. Copy its name (e.g. `rocket_launch`).
3. Add it to `mxevolve-icon/names/mx-icon-names.ts`:
   ```typescript
   rocket_launch: "rocket_launch",
   ```
4. Use it: `<mxevolve-icon name="rocket_launch" />`.

---

## Adding a new custom SVG icon

1. Drop your `.svg` file in `custom-icons/svgs/` (use **snake_case** naming).
2. That's it — the build copies it to `assets/icons/` automatically.
3. Use it: `<mxevolve-icon name="my_icon" />`.

No registration step, no code changes beyond the SVG file itself.

---

## Resolution order

1. **`MX_ICON_NAMES`** — if the name is in the Material mapping, render a `<span>` with the Material Symbol ligature.
2. **`CUSTOM_ICONS_PATH`** — if a base path is provided, render an `<img>` pointing to `${basePath}/${name}.svg`.
3. **Not found** — renders nothing and logs `console.error`.

---

## API reference

| Input       | Type                                              | Default     | Description                                              |
| ----------- | ------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `name`      | `string` (required)                               | —           | Icon name: a key from `MX_ICON_NAMES` or an SVG filename |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'` | 24px        | Size preset (works for both Material and custom)          |
| `filled`    | `boolean`                                         | `false`     | Filled variant (Material icons only)                      |
| `spin`      | `boolean`                                         | `false`     | Continuous rotation animation                             |
| `color`     | `string`                                          | `undefined` | CSS color value (Material icons only)                     |
| `ariaLabel` | `string`                                          | `undefined` | Accessible label; omit for decorative icons               |

---

## File structure

```
icons/
├── README.md                              ← you are here
├── ICON_CATALOG.md                        ← icon name reference
├── mxevolve-icon/
│   ├── mxevolve-icon.component.ts         ← the component
│   ├── mxevolve-icon.component.html       ← template
│   ├── mxevolve-icon.component.scss       ← styles (sizes, spin, filled)
│   ├── mxevolve-icon.component.spec.ts    ← tests
│   └── names/
│       └── mx-icon-names.ts              ← Material Symbols name mapping
├── custom-icons/
│   ├── svgs/                              ← raw .svg files (custom icons)
│   └── custom-icon-urls.token.ts          ← CUSTOM_ICONS_PATH injection token
```
