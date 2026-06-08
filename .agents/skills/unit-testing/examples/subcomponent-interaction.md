# Testing subcomponent interaction

Trigger an output event on a mocked child component via `.emit()` and then assert the expected side-effect on the parent.

```typescript
it("emits aborted when the abort button fires its event", async () => {
  const { fixture } = await renderComponent({ status: ExecutionStatus.RUNNING });
  const spy = jest.fn();
  fixture.componentInstance.aborted.subscribe(spy);

  ngMocks
    .find(fixture, ExecutionAbortButtonComponent)
    .componentInstance.aborted.emit();

  await waitFor(() => expect(spy).toHaveBeenCalled());
});
```
