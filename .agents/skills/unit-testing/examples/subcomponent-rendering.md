# Testing subcomponent rendering

Use `document.querySelector` with the component's CSS selector to assert presence, and `ngMocks.find` to assert inputs.

```typescript
it("shows the status tag when a status is provided", async () => {
  const { fixture } = await renderComponent();

  expect(document.querySelector("mxevolve-execution-status-tag")).toBeTruthy();
  const statusTag = ngMocks.find(fixture, ExecutionStatusTagComponent);
  expect(statusTag.componentInstance.status).toBe(ExecutionStatus.RUNNING);
});

it("does not show the expiry chip when no expiry date is provided", async () => {
  await renderComponent();

  expect(document.querySelector("mxevolve-expiry-chip")).toBeNull();
});
```
