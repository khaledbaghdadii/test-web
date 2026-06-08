import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusinessProcessExecutionListComponent } from "./business-process-execution-list.component";
import { provideRouter } from "@angular/router";
import { DomTestUtils } from "@mxevolve/testing";
import { BusinessProcessUriFactoryPipe } from "../business-process-uri-factory-pipe/business-process-uri-factory.pipe";
import { MockModule, MockPipe } from "ng-mocks";
import { BusinessProcessUriFactoryPipeModule } from "@mxflow/features/business-process";

describe("BusinessProcessExecutionListComponent", () => {
  let component: BusinessProcessExecutionListComponent;
  let fixture: ComponentFixture<BusinessProcessExecutionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MockPipe(
          BusinessProcessUriFactoryPipe,
          (id) => `execution-details/${id}`
        ),
        MockModule(BusinessProcessUriFactoryPipeModule),
      ],
      imports: [BusinessProcessExecutionListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessProcessExecutionListComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display no links when businessProcessExecutions is empty", () => {
    component.businessProcessExecutions = [];
    component.projectId = "project-1";
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(fixture, "empty-state").getNativeElement()
        .textContent
    ).toBe("-");
  });

  it("should display execution names as links", () => {
    component.businessProcessExecutions = [
      { id: "1", name: "Execution 1" },
      { id: "2", name: "Execution 2" },
    ];
    component.projectId = "project-1";
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(fixture, "execution-link-1")
        .getNativeElement()
        .textContent?.trim()
    ).toBe("Execution 1");
    expect(
      DomTestUtils.getElementByTestId(fixture, "execution-link-2")
        .getNativeElement()
        .textContent?.trim()
    ).toBe("Execution 2");
  });

  it("should display commas between executions but not after the last one", () => {
    component.businessProcessExecutions = [
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
      { id: "3", name: "Third" },
    ];
    component.projectId = "project-1";
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(fixture, "separator-1").getNativeElement()
        .textContent
    ).toBe(", ");
    expect(
      DomTestUtils.getElementByTestId(fixture, "separator-2").getNativeElement()
        .textContent
    ).toBe(", ");
    expect(
      DomTestUtils.getElementByTestId(fixture, "separator-3").isRendered()
    ).toBeFalsy();
  });

  it("should not display comma when there is only one execution", () => {
    component.businessProcessExecutions = [{ id: "1", name: "Only One" }];
    component.projectId = "project-1";
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(fixture, "separator-1").isRendered()
    ).toBeFalsy();
  });

  it("should have correct routerLink url on execution link", () => {
    component.businessProcessExecutions = [
      { id: "exec-123", name: "Test Execution" },
      { id: "exec-456", name: "Another Execution" },
    ];
    component.projectId = "my-project";
    fixture.detectChanges();

    const linkElement = DomTestUtils.getElementByTestId(
      fixture,
      "execution-link-exec-456"
    ).getNativeElement();

    expect(linkElement.getAttribute("href")).toBe(
      "/app/my-project/business-process/execution-details/exec-456"
    );
    expect(linkElement.getAttribute("target")).toBe("_blank");
  });
});
