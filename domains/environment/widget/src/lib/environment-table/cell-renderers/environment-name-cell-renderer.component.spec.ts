import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import type { EnvironmentNameCellRendererParams } from "./environment-name-cell-renderer.component";
import { EnvironmentNameCellRendererComponent } from "./environment-name-cell-renderer.component";

describe("EnvironmentNameCellRendererComponent", () => {
  let component: EnvironmentNameCellRendererComponent;
  let fixture: ComponentFixture<EnvironmentNameCellRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EnvironmentNameCellRendererComponent],
    }).overrideComponent(EnvironmentNameCellRendererComponent, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(EnvironmentNameCellRendererComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets environment id from params value", () => {
    component.agInit({
      value: "env-123",
      projectId: "project-1",
    } as EnvironmentNameCellRendererParams);

    expect(component.environmentId).toBe("env-123");
  });

  it("sets project id from params", () => {
    component.agInit({
      value: "env-123",
      projectId: "project-1",
    } as EnvironmentNameCellRendererParams);

    expect(component.projectId).toBe("project-1");
  });

  it("returns false from refresh", () => {
    expect(component.refresh()).toBe(false);
  });
});
