# Testing Tables — General patterns

Use `getByRole("columnheader", { name: "..." })` to assert that expected columns are present. Query data rows by filtering all `row` elements to those that contain `gridcell` children — this excludes the header row from the results.

Define a helper at the top of the describe block to retrieve only data rows:

```typescript
function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}
```

## Column headers

Write one test per column header:

```typescript
it("renders the ID column header", async () => {
  await renderComponent();

  expect(screen.getByRole("columnheader", { name: "ID" })).toBeTruthy();
});
```

## Data rows

Use `waitFor()` when asserting row counts because the data is loaded asynchronously:

```typescript
it("renders a row for each loaded item", async () => {
  mockService.fetchItems.mockReturnValue(of([MOCK_ITEM_1, MOCK_ITEM_2]));

  await renderComponent({ itemIds: ["item-1", "item-2"] });

  await waitFor(() => expect(getDataRows()).toHaveLength(2));
});

it("renders no data rows when the service returns an empty list", async () => {
  await renderComponent();

  await waitFor(() => expect(getDataRows()).toHaveLength(0));
});

it("renders no data rows when the service returns an error", async () => {
  mockService.fetchItems.mockReturnValue(throwError(() => new Error("error")));

  await renderComponent({ itemIds: ["item-1"] });

  await waitFor(() => expect(getDataRows()).toHaveLength(0));
});
```

## Accessing individual cells

Access cells by their zero-based column index within a row:

```typescript
it("shows the version value in the Version column", async () => {
  await waitFor(() => {
    const cells = within(getDataRows()[0]).getAllByRole("gridcell");
    expect(cells[2].textContent?.trim()).toBe("1.0.0");
  });
});

it("shows a dash when the version is not available", async () => {
  await waitFor(() => {
    const cells = within(getDataRows()[0]).getAllByRole("gridcell");
    expect(cells[2].textContent?.trim()).toBe("-");
  });
});
```

## Empty state

```typescript
it("shows a 'No items' message when there are no items", async () => {
  await renderComponent();

  await waitFor(() => expect(screen.getByText("No items")).toBeTruthy());
});

it("shows a 'No items' message when an error occurs while fetching items", async () => {
  mockService.fetchItems.mockReturnValue(throwError(() => new Error("error")));

  await renderComponent({ itemIds: ["item-1"] });

  await waitFor(() => expect(screen.getByText("No items")).toBeTruthy());
});
```

## Loading state

Use a `Subject` to hold the observable open and assert loading before emitting:

```typescript
it("shows a loading indicator while items are being fetched", async () => {
  const subject = new Subject<Item[]>();
  mockService.fetchItems.mockReturnValue(subject);

  await renderComponent({ itemIds: ["item-1"] });

  expect(screen.getByText("Loading...")).toBeTruthy();
});

it("hides the loading indicator after items are loaded", async () => {
  const subject = new Subject<Item[]>();
  mockService.fetchItems.mockReturnValue(subject);

  await renderComponent({ itemIds: ["item-1"] });

  subject.next([MOCK_ITEM]);
  subject.complete();

  await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
});

it("hides the loading indicator after a fetch error", async () => {
  const subject = new Subject<Item[]>();
  mockService.fetchItems.mockReturnValue(subject);

  await renderComponent({ itemIds: ["item-1"] });

  subject.error(new Error("Service error"));

  await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
});
```

## Link cells

Assert link text and the `href` attribute:

```typescript
it("renders a link with the item ID", async () => {
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "item-1" })).toBeTruthy()
  );
});

it("links to the item detail page", async () => {
  await waitFor(() => {
    const link = screen.getByRole("link", { name: "item-1" });
    expect(link.getAttribute("href")).toBe("/app/project-1/items/item-1");
  });
});
```
