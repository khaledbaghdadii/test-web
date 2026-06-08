# Testing tooltips

Import `Tooltip` from PrimeNG (not mocked) and use `user.hover()` to trigger the tooltip. Assert the tooltip text is visible in the DOM.

```typescript
import { Tooltip } from "primeng/tooltip";

const MOCK_IMPORTS = [
  Button,
  Tooltip,
  // ...
];

it("shows a tooltip explaining the stage restriction when deployment is disabled", async () => {
  const user = userEvent.setup();
  await renderComponent({ enabledInCurrentlyActiveStage: false });

  await user.hover(screen.getByRole("button", { name: "Deploy" }));

  expect(
    screen.getByText(
      "Reference environment deployment is not allowed in the current stage of the process."
    )
  ).toBeTruthy();
});
```
