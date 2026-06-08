import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppendToBodyDirective } from "./append-to-body.directive";

@Component({
  template: `<div id="child" mxevolveAppendToBody>Test Content</div>`,
  standalone: true,
  imports: [AppendToBodyDirective],
})
class TestHostComponent {}

@Component({
  template: `<div id="child">Test Content</div>`,
  standalone: true,
})
class NoDirectiveComponent {}

describe("AppendToBodyDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  afterEach(() => {
    const childComponent = document.getElementById("child");
    if (childComponent && childComponent.parentElement === document.body) {
      document.body.removeChild(childComponent);
    }
  });

  it("should append the component to body when directive is used", () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const childComponent = document.getElementById("child") as HTMLElement;
    expect(childComponent).toBeTruthy();
    expect(childComponent.parentElement).toBe(document.body);
  });

  it("should not append component to body when directive is not used", () => {
    const noDirFixture = TestBed.createComponent(NoDirectiveComponent);
    noDirFixture.detectChanges();
    const childComponent = document.getElementById("child") as HTMLElement;
    expect(childComponent).toBeTruthy();
    expect(childComponent.parentElement).not.toBe(document.body);
  });

  it("should remove the component from body on destroy", () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const childComponent = document.getElementById("child") as HTMLElement;
    expect(childComponent.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.getElementById("child")).toBeNull();
  });

  it("should not remove the component from body on destroy if it does not exist", () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const childComponent = document.getElementById("child") as HTMLElement;
    expect(childComponent.parentElement).toBe(document.body);
    document.body.removeChild(childComponent);

    fixture.destroy();
    expect(document.getElementById("child")).toBeNull();
  });
});
