import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Tooltip } from "primeng/tooltip";

import { CommitIdDisplayComponent } from "./commit-id-display.component";

describe("CommitIdDisplayComponent", () => {
  let component: CommitIdDisplayComponent;
  let fixture: ComponentFixture<CommitIdDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitIdDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommitIdDisplayComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should shorten commit id to 10 characters", () => {
    fixture.componentRef.setInput("commitId", "abc1234567890def");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe("abc1234567");
  });

  it("should display dash when commit id is undefined", () => {
    fixture.componentRef.setInput("commitId", undefined);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("should display full commit id when shorter than 10 characters", () => {
    fixture.componentRef.setInput("commitId", "abc");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe("abc");
  });

  it("should have tooltip with full commit id", () => {
    fixture.componentRef.setInput("commitId", "abc1234567890def");
    fixture.detectChanges();
    const tooltipDirective = fixture.debugElement.query(By.directive(Tooltip));
    expect(tooltipDirective).toBeTruthy();
    expect(tooltipDirective.injector.get(Tooltip).content).toBe(
      "abc1234567890def"
    );
  });
});
