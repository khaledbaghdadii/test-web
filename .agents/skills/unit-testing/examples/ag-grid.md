# AG Grid-specific testing

Do **not** mock AG Grid components. Import `AgGridAngular` and register the community modules before rendering:

```typescript
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
```

AG Grid renders its header cells as `columnheader` roles and its data cells as `gridcell` roles — the same ARIA roles used in the general patterns above. All the helpers (`getDataRows`, `within`, `getByRole`) work unchanged against AG Grid tables.

Custom cell renderers and value formatters are exercised indirectly through the DOM: query the rendered cell text or the rendered child elements rather than calling the renderer/formatter directly.

## Minimal test setup for an AG Grid component

```typescript
import { render, screen, waitFor, within } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import { provideRouter } from "@angular/router";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ItemService } from "@mxevolve/domains/item/data-access";
import { ItemsTableComponent } from "./items-table.component";

ModuleRegistry.registerModules([AllCommunityModule]);

const mockItemService = {
  fetchByIds: jest.fn(),
};

const REQUIRED_INPUTS = {
  itemIds: [] as string[],
  projectId: "project-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ItemsTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: ItemService, useValue: mockItemService },
    ],
    providers: [provideRouter([])],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockItemService.fetchByIds.mockReturnValue(of([]));
});
```
