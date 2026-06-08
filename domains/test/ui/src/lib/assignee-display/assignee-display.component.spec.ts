import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { AssigneeDisplayComponent } from "./assignee-display.component";

describe("AssigneeDisplayComponent", () => {
  let component: AssigneeDisplayComponent;
  let fixture: ComponentFixture<AssigneeDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssigneeDisplayComponent],
    })
      .overrideComponent(AssigneeDisplayComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AssigneeDisplayComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("displays dash when assignee is undefined", () => {
    fixture.componentRef.setInput("assigneeDisplayName", "");
    fixture.componentRef.setInput("assigneeEmail", "");
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("displays assignee name when provided", () => {
    fixture.componentRef.setInput("assigneeDisplayName", "John Doe");
    fixture.componentRef.setInput("assigneeEmail", "john@test.com");
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("John Doe");
  });
});
