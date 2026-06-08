# Mocking subcomponents

Use `MockComponent` from `ng-mocks` for every child component the component under test depends on. Add all mocked components to `MOCK_IMPORTS`, alongside any PrimeNG components that are used directly (not mocked).

```typescript
import { MockComponent } from "ng-mocks";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import { ExecutionAbortButtonComponent } from "@mxevolve/domains/business-process/widget";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";

const MOCK_IMPORTS = [
  MockComponent(ExecutionStatusTagComponent),
  MockComponent(ExecutionAbortButtonComponent),
  Divider,
  Card,
];
```
