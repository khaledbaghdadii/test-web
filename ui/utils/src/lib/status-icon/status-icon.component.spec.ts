import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatusIconComponent } from "./status-icon.component";
import { By } from "@angular/platform-browser";

describe("StatusIconComponent", () => {
  let fixture: ComponentFixture<StatusIconComponent>;
  let component: StatusIconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusIconComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusIconComponent);
    component = fixture.componentInstance;
  });

  it("should render green check when state is true", () => {
    component.state = true;
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css("i")).nativeElement;
    expect(icon.className).toContain("pi-check-circle");
    expect(icon.className).toContain("text-green-500");
  });

  it("should render red times when state is false", () => {
    component.state = false;
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css("i")).nativeElement;
    expect(icon.className).toContain("pi-times-circle");
    expect(icon.className).toContain("text-red-500");
  });
});
