# Mocking services

Define mock objects with `jest.fn()` for each method. Provide them via `componentProviders` (for `@Self` / component-level injection) or `providers` (for root-level injection). Reset mocks in `beforeEach`.

```typescript
const mockAbortService = {
  abort: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

async function renderComponent(inputs = {}) {
  return render(ExecutionAbortButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ExecutionAbortService, useValue: mockAbortService },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAbortService.abort.mockReturnValue(of(void 0));
});
```
