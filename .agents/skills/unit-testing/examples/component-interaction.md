# Testing component interaction

Simulate user actions with `userEvent` and assert the resulting state, service calls, or DOM changes.

```typescript
it("shows a success toast after a successful abort", async () => {
  const user = userEvent.setup();
  await renderComponent();

  await user.click(screen.getByRole("button", { name: "Abort business process" }));
  await user.click(screen.getByRole("button", { name: "Abort" }));

  expect(mockToastService.showSuccess).toHaveBeenCalledWith(
    "Business process execution successfully aborted"
  );
});

it("does not abort the process when the user cancels the dialog", async () => {
  const user = userEvent.setup();
  await renderComponent();

  await user.click(screen.getByRole("button", { name: "Abort business process" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(mockAbortService.abort).not.toHaveBeenCalled();
});
```
