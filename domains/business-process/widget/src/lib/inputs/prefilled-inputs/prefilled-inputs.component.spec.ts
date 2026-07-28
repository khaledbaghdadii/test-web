import { render, screen } from "@testing-library/angular";
import { PrefilledInputsComponent } from "./prefilled-inputs.component";
import { PrefilledSection } from "./prefilled-inputs.types";

async function renderComponent(
  sections: PrefilledSection[],
  loading?: boolean
) {
  return render(PrefilledInputsComponent, {
    inputs: { sections, loading },
  });
}

describe("PrefilledInputsComponent", () => {
  it("shows the section title, label and value of a single row", async () => {
    await renderComponent([
      {
        title: "Configuration Parameters",
        rows: [{ label: "Repository", value: "my-repo" }],
      },
    ]);

    expect(screen.getByText("Configuration Parameters")).toBeTruthy();
    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.getByText("my-repo")).toBeTruthy();
  });

  it("shows every section, row label and value", async () => {
    await renderComponent([
      {
        title: "Configuration Parameters",
        rows: [
          { label: "Repository", value: "my-repo" },
          { label: "Configuration Branch", value: "main" },
        ],
      },
      {
        title: "Infrastructure Parameters",
        rows: [{ label: "Build Infra Group", value: "grp-1" }],
      },
    ]);

    expect(screen.getByText("Configuration Parameters")).toBeTruthy();
    expect(screen.getByText("Repository")).toBeTruthy();
    expect(screen.getByText("my-repo")).toBeTruthy();
    expect(screen.getByText("Configuration Branch")).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Infrastructure Parameters")).toBeTruthy();
    expect(screen.getByText("grp-1")).toBeTruthy();
  });

  it("renders an array value as a comma-separated list", async () => {
    await renderComponent([
      {
        title: "Notifications",
        rows: [{ label: "Notifications", value: ["alice@x.com", "bob@x.com"] }],
      },
    ]);

    expect(screen.getByText("alice@x.com, bob@x.com")).toBeTruthy();
  });

  it("renders an object value as JSON rather than an opaque object string", async () => {
    await renderComponent([
      {
        title: "MX Parameters",
        rows: [{ label: "Factory Product", value: { id: "fp-1" } }],
      },
    ]);

    expect(screen.getByText('{"id":"fp-1"}')).toBeTruthy();
  });

  it("renders nothing when there are no sections", async () => {
    const { container } = await renderComponent([]);

    expect(container.querySelector("dl")).toBeNull();
  });

  it("shows a skeleton instead of the sections while loading", async () => {
    const { container } = await renderComponent(
      [
        {
          title: "Configuration Parameters",
          rows: [
            { label: "Repository", value: "my-repo" },
            { label: "Configuration Branch", value: "main" },
          ],
        },
      ],
      true
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText("Configuration Parameters")).toBeNull();
    expect(container.querySelectorAll("p-skeleton").length).toBe(4);
  });

  it("does not show a skeleton once loading is false", async () => {
    await renderComponent(
      [
        {
          title: "Configuration Parameters",
          rows: [{ label: "Repository", value: "my-repo" }],
        },
      ],
      false
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Repository")).toBeTruthy();
  });
});
