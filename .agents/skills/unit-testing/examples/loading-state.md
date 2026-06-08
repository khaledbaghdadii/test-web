# Testing loading state

Use a `Subject` to control when the async operation completes. Assert the loading state before and after the subject emits.

```typescript
it("shows a loading state while the abort request is being processed", async () => {
  const abortSubject = new Subject<void>();
  mockAbortService.abort.mockReturnValue(abortSubject);
  const user = userEvent.setup();
  await renderComponent();

  await user.click(screen.getByRole("button", { name: "Abort business process" }));
  await user.click(screen.getByRole("button", { name: "Abort" }));

  expect(screen.getByRole("button", { name: "Abort business process" })).toBeDisabled();

  abortSubject.next();
  abortSubject.complete();

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Abort business process" })).not.toBeDisabled()
  );
});
```
