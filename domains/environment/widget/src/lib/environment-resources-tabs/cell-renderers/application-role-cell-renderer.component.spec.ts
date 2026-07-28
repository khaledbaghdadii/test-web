import { TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import type { ICellRendererParams } from "ag-grid-community";
import { ApplicationRoleCellRendererComponent } from "./application-role-cell-renderer.component";

function createComponent(): ApplicationRoleCellRendererComponent {
  TestBed.configureTestingModule({
    imports: [ApplicationRoleCellRendererComponent],
  }).overrideComponent(ApplicationRoleCellRendererComponent, {
    set: {
      imports: [],
      schemas: [NO_ERRORS_SCHEMA],
    },
  });

  return TestBed.createComponent(ApplicationRoleCellRendererComponent)
    .componentInstance;
}

describe("ApplicationRoleCellRendererComponent", () => {
  it("sets isPrimary to true when data has isPrimary true", () => {
    const component = createComponent();

    component.agInit({ data: { isPrimary: true } } as ICellRendererParams);

    expect(component.isPrimary()).toBe(true);
  });

  it("sets isPrimary to false when data has isPrimary false", () => {
    const component = createComponent();

    component.agInit({ data: { isPrimary: false } } as ICellRendererParams);

    expect(component.isPrimary()).toBe(false);
  });

  it("defaults isPrimary to undefined when data is undefined", () => {
    const component = createComponent();

    component.agInit({ data: undefined } as ICellRendererParams);

    expect(component.isPrimary()).toBe(undefined);
  });

  it("returns false from refresh", () => {
    const component = createComponent();

    expect(component.refresh()).toBe(false);
  });
});
