import { render } from "@testing-library/angular";
import { BusinessProcessContentContainerComponent } from "./business-process-content-container.component";

describe("BusinessProcessContentContainerComponent", () => {
  it("renders card template by default", async () => {
    await render(BusinessProcessContentContainerComponent, {
      inputs: {},
    });

    expect(document.querySelector("p-card")).toBeTruthy();
  });

  it("renders clearBackground template when clearBackground is true", async () => {
    await render(BusinessProcessContentContainerComponent, {
      inputs: { clearBackground: true },
    });

    expect(document.querySelector("p-card")).toBeFalsy();
    expect(document.querySelector("p-panel")).toBeFalsy();
  });

  it("renders panel template when collapsable is true", async () => {
    await render(BusinessProcessContentContainerComponent, {
      inputs: { collapsable: true, header: "Test Header" },
    });

    expect(document.querySelector("p-panel")).toBeTruthy();
  });

  it("displays the header text in panel mode", async () => {
    await render(BusinessProcessContentContainerComponent, {
      inputs: { collapsable: true, header: "My Panel" },
    });

    expect(document.body.textContent).toContain("My Panel");
  });

  it("projects headerExtra content into panel header", async () => {
    await render(
      `<mxevolve-business-process-content-container [collapsable]="true" header="Title">
        <span headerExtra class="test-chip">Chip</span>
      </mxevolve-business-process-content-container>`,
      {
        imports: [BusinessProcessContentContainerComponent],
      }
    );

    expect(document.querySelector(".test-chip")).toBeTruthy();
    expect(document.querySelector(".test-chip")!.textContent).toBe("Chip");
  });
});
