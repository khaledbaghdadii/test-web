# mxevolve-dropdown

Reusable dropdown components for MXEvolve.

## Components

### Multi-Select Dropdown

`MxevolveMultiselectDropdownComponent` — a multi-select dropdown built on PrimeNG `MultiSelect`.

Extend `BaseMultiselectDropdown` in your feature component and provide a state provider.

### Single-Select Dropdown

`MxevolveSingleSelectDropdownComponent` — a single-select dropdown built on PrimeNG `Select`.

Extend `BaseSingleSelectDropdown` in your feature component and provide a state provider.

## State Providers

### Multi-Select

| Provider | Use Case |
|---|---|
| `MxevolveMultiselectDropdownBackendStateProvider` | Paginated backend with server-side filtering |
| `MxevolveMultiselectFrontendStateProvider` | Non-paginated backend with client-side filtering |

### Single-Select

| Provider | Use Case |
|---|---|
| `MxevolveSingleSelectFrontendStateProvider` | Non-paginated backend with client-side filtering |

## Usage Example (Frontend State Provider)

```typescript
@Component({
  selector: "my-multi-select",
  imports: [MxevolveMultiselectDropdownComponent],
  providers: [
    ...BaseMultiselectDropdown.createProviders(MyMultiSelectComponent),
    MyDataService,
  ],
  template: `
    <mxevolve-multiselect-dropdown
      #dropdown
      [stateProvider]="stateProvider"
      [dataParams]="{ projectId: projectId() }"
      [config]="dropdownConfig()"
      (errorEvent)="onError($event)"
      (selectionChange)="onSelectionChange($event)"
    />
  `,
})
export class MyMultiSelectComponent extends BaseMultiselectDropdown<MyItem, { projectId: string }> {
  projectId = input.required<string>();

  protected stateProvider: MxEvolveDropdownState<MyItem, { projectId: string }>;

  @ViewChild("dropdown")
  declare dropdownComponent?: MxevolveMultiselectDropdownComponent<MyItem, { projectId: string }>;

  dropdownConfig = computed(() => ({
    placeholder: "Select items",
    maxSelectedLabels: 3,
  }));

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    const dataService = inject(MyDataService);
    const dataProvider = new MyDataProvider(dataService);
    this.stateProvider = new MxevolveMultiselectFrontendStateProvider(dataProvider, destroyRef);
  }
}
```

## Data Provider Interface

For the frontend state providers, implement `MxEvolveSingleSelectDataProvider<T, TParams>`:

```typescript
export class MyDataProvider implements MxEvolveSingleSelectDataProvider<MyItem, { projectId: string }> {
  constructor(private myService: MyDataService) {}

  fetchData(params: { projectId: string }): Observable<MyItem[]> {
    return this.myService.getItems(params.projectId);
  }

  toDropdownOption(item: MyItem): DropdownOption {
    return { label: item.name, value: item };
  }

  getItemId(item: MyItem): string {
    return item.id;
  }
}
```

## Running unit tests

Run `npx nx test mxevolve-dropdown` to execute the unit tests via [Jest](https://jestjs.io).
