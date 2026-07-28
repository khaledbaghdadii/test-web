import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TableCheckboxFilterComponent } from "./table-checkbox-filter.component";
import { FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { CommonModule } from "@angular/common";

describe("TableCheckboxFilterComponent (TestBed)", () => {
  let fixture: ComponentFixture<TableCheckboxFilterComponent>;
  let component: TableCheckboxFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        CheckboxModule,
        ButtonModule,
        SkeletonModule,
        TooltipModule,
        CommonModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCheckboxFilterComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should filter and emit an event on select", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = true;
    component.filter = jest.fn();
    const emitSpy = jest.spyOn(component.selectedChange, "emit");
    fixture.detectChanges();
    component.onSelect();
    expect(component.filter).toHaveBeenCalledWith(component.selected);
    expect(emitSpy).toHaveBeenCalledWith(component.selected);
  });

  it("should emit an event on select without filtering", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = true;
    component.filter = null;
    const emitSpy = jest.spyOn(component.selectedChange, "emit");
    fixture.detectChanges();
    component.onSelect();
    expect(emitSpy).toHaveBeenCalledWith(component.selected);
  });

  it("should empty the selected and filter and emit an event on clear", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = true;
    component.filter = jest.fn();
    const emitSpy = jest.spyOn(component.selectedChange, "emit");
    fixture.detectChanges();
    component.clearSelectedStatuses();
    expect(component.selected).toEqual([]);
    expect(component.filter).toHaveBeenCalledWith([]);
    expect(emitSpy).toHaveBeenCalledWith([]);
  });

  it("should empty the selected and emit an event on clear without filtering", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = true;
    component.filter = null;
    const emitSpy = jest.spyOn(component.selectedChange, "emit");
    fixture.detectChanges();
    component.clearSelectedStatuses();
    expect(component.selected).toEqual([]);
    expect(emitSpy).toHaveBeenCalledWith([]);
  });

  it("should display tooltip when limitWidth is true", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = true;
    fixture.detectChanges();
    const optionElements =
      fixture.nativeElement.querySelectorAll(".field-checkbox");
    expect(optionElements.length).toBe(2);
    optionElements[0].dispatchEvent(new Event("mouseenter"));
    fixture.detectChanges();

    const tooltip = document.body.querySelector(".p-tooltip-text");
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toBe("Option 1");
    const classes = optionElements[0].getAttribute("class");
    expect(classes).toContain("max-w-64");
  });

  it("should not display tooltip when limitWidth is false", () => {
    component.options = [
      { text: "Option 1", value: "option1" },
      { text: "Option 2", value: "option2" },
    ];
    component.selected = ["option1"];
    component.limitWidth = false;
    fixture.detectChanges();
    const optionElements =
      fixture.nativeElement.querySelectorAll(".field-checkbox");
    expect(optionElements.length).toBe(2);
    optionElements[0].dispatchEvent(new Event("mouseenter"));
    fixture.detectChanges();

    const tooltip = document.body.querySelector(".p-tooltip-text");
    expect(tooltip).toBeFalsy();
    const classes = optionElements[0].getAttribute("class");
    expect(classes).not.toContain("max-w-64");
  });
});
