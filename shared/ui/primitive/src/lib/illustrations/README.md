# Illustrations — Developer Guide

How to use illustrations in the mxevolve application.

---

## Quick start

```html
<mxevolve-illustration name="order_delivered" size="xl" />
```

Import the component once in your module/component:

```typescript
import { MxevolveIllustrationComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  imports: [MxevolveIllustrationComponent],
  template: `<mxevolve-illustration name="order_delivered" size="xl" />`,
})
export class MyComponent {}
```

---

## App setup

Provide the `ILLUSTRATIONS_PATH` token at the application level so the component
can resolve illustration SVGs by name:

```typescript
import { ILLUSTRATIONS_PATH } from "@mxevolve/shared/ui/primitive";

// In your app module or app config:
providers: [
  { provide: ILLUSTRATIONS_PATH, useValue: "assets/illustrations" },
]
```

Then make sure the build copies SVGs into that folder.
In the shell's `project.json`, add an asset entry:

```json
{
  "glob": "*.svg",
  "input": "libs/shared/ui/primitive/src/lib/illustrations/svgs",
  "output": "/assets/illustrations"
}
```

---

## Examples

### Basic usage

```html
<mxevolve-illustration name="order_delivered" />
<mxevolve-illustration name="designing_architecture_in_metaverse" />
```

### Sizes

```html
<mxevolve-illustration name="order_delivered" size="xs" />   <!-- 14px -->
<mxevolve-illustration name="order_delivered" size="sm" />   <!-- 16px -->
<mxevolve-illustration name="order_delivered" size="md" />   <!-- 20px -->
<mxevolve-illustration name="order_delivered" size="lg" />   <!-- 28px -->
<mxevolve-illustration name="order_delivered" size="xl" />   <!-- 36px -->
<mxevolve-illustration name="order_delivered" size="xxl" />  <!-- 48px -->
```

### Accessibility

```html
<!-- Decorative (no label needed) -->
<mxevolve-illustration name="order_delivered" />

<!-- Meaningful (screen reader needs context) -->
<mxevolve-illustration name="order_delivered" ariaLabel="Order has been delivered" />
```

---

## Adding a new illustration

1. Drop your `.svg` file in `svgs/` (use **snake_case** naming).
2. That's it — the build copies it to `assets/illustrations/` automatically.
3. Use it: `<mxevolve-illustration name="my_illustration" />`.

No registration code needed. The component resolves names as
`${ILLUSTRATIONS_PATH}/${name}.svg` and renders them via `<img>`.

---

## Currently available illustrations

| Name                                     | File                                            |
| ---------------------------------------- | ----------------------------------------------- |
| `order_delivered`                        | `svgs/order_delivered.svg`                       |
| `designing_architecture_in_metaverse`    | `svgs/designing_architecture_in_metaverse.svg`   |

---

## API reference

| Input       | Type                                              | Default     | Description                                 |
| ----------- | ------------------------------------------------- | ----------- | ------------------------------------------- |
| `name`      | `string` (required)                               | —           | Illustration name (SVG filename without ext) |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'` | —           | Size preset                                  |
| `ariaLabel` | `string`                                          | `undefined` | Accessible label; omit for decorative use    |

---

## File structure

```
illustrations/
├── README.md                                  ← you are here
├── mxevolve-illustration.component.ts         ← the component
├── mxevolve-illustration.component.html       ← template
├── mxevolve-illustration.component.scss       ← styles (sizes)
├── mxevolve-illustration.component.spec.ts    ← tests
├── illustration-urls.token.ts                 ← ILLUSTRATIONS_PATH injection token
├── index.ts                                   ← barrel export
└── svgs/                                      ← raw .svg files
```
