import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MachineStatusComponent } from "./machine-status.component";
import { TagModule } from "primeng/tag";
import { By } from "@angular/platform-browser";

describe("MachineStatusComponent", () => {
  let component: MachineStatusComponent;
  let fixture: ComponentFixture<MachineStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagModule, MachineStatusComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MachineStatusComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  const states = [
    "powered_on",
    "powered_off",
    "powering_on",
    "decommissioning",
    "decommissioned",
    "under_maintenance",
    "expired",
  ];

  states.forEach((state) => {
    it(`should display correct info for state: ${state}`, () => {
      component.state = state;
      fixture.detectChanges();
      const expected = component.machineStates[state];
      expect(expected).toBeDefined();
      const tagEl = fixture.debugElement.query(By.css("p-tag"));
      expect(tagEl.componentInstance.value).toContain(expected.text);
      expect(tagEl.componentInstance.severity).toBe(expected.severity);
    });
  });
});
