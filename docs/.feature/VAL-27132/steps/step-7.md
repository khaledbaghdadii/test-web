# Step 7: Migrate definitions data-access service (+ contract test)

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** none
**AC:** AC-9, AC-16

## Summary
Migrate the legacy `BusinessProcessDefinitionService` (Available Processes / templates) into new-arch
`data-access` with unit + Pact contract tests. Returns the full (non-paginated) definitions list for
`extendable=false&executable=true`; UI filtering by family/sub-family happens in the dialog (Step 8).

## Files
- `web/libs/domains/business-process/data-access/src/lib/definition/business-process-definition.service.ts` (new)
- `web/libs/domains/business-process/data-access/src/lib/definition/business-process-definition.model.ts` (new — `DefinitionApiModel` incl. `family.id`, `sourceDefinitionId`, `processName`, `providedInputs`)
- `web/libs/domains/business-process/data-access/src/lib/definition/business-process-definition.service.spec.ts` (new — unit)
- `web/libs/domains/business-process/data-access/src/lib/definition/business-process-definition.service.pact.spec.ts` (new — contract)
- `web/libs/domains/business-process/data-access/src/index.ts` (mod — export service + models)

## Implementation Details
- Source: legacy `web/libs/features/business-process/src/lib/business-process-definition/business-process-definition.service.ts`.
- `getBusinessProcessDefinitions({ projectId, extendable, executable })` →
  `GET projects/{projectId}/business-process/definitions?extendable=&executable=` →
  `Observable<DefinitionApiModel[]>`. **Not paginated** (backend returns a `List`). `@Injectable({ providedIn:
  "root" })`, inject `GATEWAY_CONFIG` + `HttpClient`.
- Model carries: `id, name, description, processName, family: { id, name }, sourceDefinitionId,
  providedInputs: ProvidedInputApiModel[], extendable, executable`.
- Legacy service stays for legacy consumers (additive).
- **Pact contract test**: assert the consumer interaction for `extendable=false&executable=true` returning
  a list with the family/sourceDefinitionId fields (provider: `business-process-definition-service`
  `DefinitionController`). See local-pact-verify skill.

## Code Shape
```typescript
export interface DefinitionApiModel {
  id: string; name: string; description?: string; processName: string;
  family: { id: string; name: string };
  sourceDefinitionId: string | null;
  providedInputs: ProvidedInputApiModel[];
  extendable: boolean; executable: boolean;
}
@Injectable({ providedIn: "root" })
export class BusinessProcessDefinitionService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly http = inject(HttpClient);
  getBusinessProcessDefinitions(req: GetDefinitionsRequest): Observable<DefinitionApiModel[]> {
    const params = new HttpParams()
      .set("extendable", String(req.extendable ?? false))
      .set("executable", String(req.executable ?? true));
    return this.http.get<DefinitionApiModel[]>(
      `${this.config.gatewayUrl}projects/${req.projectId}/business-process/definitions`, { params });
  }
}
```

## Sub-steps
- [ ] 7a. Create service + models in data-access; export from barrel.
- [ ] 7b. Unit spec (params, URL, mapping).
- [ ] 7c. Pact **consumer** contract test for the definitions interaction.
- [ ] 7d. eslint on data-access folder.

## Tests
- Unit + contract.

## Test Obligations
- Production files: definitions service + models.
- Required tests: unit + pact spec.
- Targeted test command: Nx Jest for `domains-business-process-data-access`; contract via local-pact-verify.

## Template
Legacy `BusinessProcessDefinitionService`; new-arch data-access pattern + existing pact specs in data-access.

## Manual Verification
Service returns the full definitions list; one network call per dialog open.

## Risk
High — crosses the definition-service boundary (contract); must mirror the response shape exactly (family.id, sourceDefinitionId, providedInputs).
