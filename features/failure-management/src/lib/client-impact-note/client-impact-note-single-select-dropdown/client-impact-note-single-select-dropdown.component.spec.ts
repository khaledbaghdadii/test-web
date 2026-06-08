import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of, Subject } from "rxjs";
import { ClientImpactNoteSingleSelectDropdownComponent } from "./client-impact-note-single-select-dropdown.component";
import {
  ClientImpactNoteService,
  ClientImpactNoteFieldType,
  ClientImpactNoteOption,
} from "@mxevolve/domains/test/data-access";
import { By } from "@angular/platform-browser";

describe("ClientImpactNoteSingleSelectDropdownComponent", () => {
  let fixture: ComponentFixture<ClientImpactNoteSingleSelectDropdownComponent>;
  let component: ClientImpactNoteSingleSelectDropdownComponent;

  const options: ClientImpactNoteOption[] = [
    { name: "Note A", id: "A" },
    { name: "Note B", id: "B" },
    { name: "Note C", id: "C" },
  ];

  let clientImpactNoteService: ClientImpactNoteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientImpactNoteSingleSelectDropdownComponent],
    }).compileComponents();

    clientImpactNoteService = {
      fetch: jest.fn().mockReturnValue(of(options)),
    } as unknown as ClientImpactNoteService;
    TestBed.overrideProvider(ClientImpactNoteService, {
      useValue: clientImpactNoteService,
    });

    fixture = TestBed.createComponent(
      ClientImpactNoteSingleSelectDropdownComponent
    );
    component = fixture.componentInstance;
    component.fieldType = ClientImpactNoteFieldType.RESOLUTION_TYPE;
  });

  it("should initialize options with client impact note field values fetched based on the provided type", () => {
    component.fieldType = ClientImpactNoteFieldType.RESOLUTION_TYPE;
    component.ngOnInit();

    fixture.detectChanges();

    expect(clientImpactNoteService.fetch).toHaveBeenCalledWith(
      ClientImpactNoteFieldType.RESOLUTION_TYPE
    );
    expect(component.options).toEqual(options);
  });

  it("should toggle loading to true before fetching client impact note field values then false after fetch completes successfully", () => {
    const fetchSubject = new Subject<ClientImpactNoteOption[]>();
    clientImpactNoteService.fetch = jest
      .fn()
      .mockReturnValue(fetchSubject.asObservable());
    component.ngOnInit();

    expect(component.loading).toBe(true);

    fetchSubject.next([]);
    fetchSubject.complete();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
  });

  it("should toggle loading to false after failing to fetch client impact note field values, keeping options unchanged", () => {
    const initialOptions = component.options;
    const fetchSubject = new Subject<ClientImpactNoteOption[]>();
    clientImpactNoteService.fetch = jest
      .fn()
      .mockReturnValue(fetchSubject.asObservable());

    component.ngOnInit();

    fetchSubject.error(new Error("network error"));
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.options).toEqual(initialOptions);
  });

  it("should set value to null if invalid when prefilling happens before fetching options", () => {
    const fetchSubject = new Subject<ClientImpactNoteOption[]>();
    clientImpactNoteService.fetch = jest
      .fn()
      .mockReturnValue(fetchSubject.asObservable());
    component.ngOnInit();
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.writeValue("Z");

    fixture.detectChanges();

    fetchSubject.next(options);
    fetchSubject.complete();

    fixture.detectChanges();

    expect(component.selectedValue).toEqual(null);
    expect(onChangeSpy).toHaveBeenCalledWith(null);
  });

  it("should set value to null if invalid when prefilling happens after fetching options", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.ngOnInit();

    fixture.detectChanges();

    component.writeValue("Z");

    fixture.detectChanges();

    expect(component.selectedValue).toEqual(null);
    expect(onChangeSpy).toHaveBeenCalledWith(null);
  });

  it("should not notify of a change in case the prefilled field is valid", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.ngOnInit();

    fixture.detectChanges();

    component.writeValue("A");

    fixture.detectChanges();

    expect(component.selectedValue).toEqual("A");
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it("should stop validating and updating value from parent form on destroy", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);

    component.ngOnInit();
    fixture.detectChanges();

    component.writeValue("A");
    fixture.detectChanges();
    expect(component.selectedValue).toEqual("A");

    component.ngOnDestroy();

    component.validateAndUpdateValueFromParentForm.next("B");
    fixture.detectChanges();
    expect(component.selectedValue).toEqual("A");
    expect(onChangeSpy).not.toHaveBeenCalledWith("B");
  });

  it("should stop fetching dropdown options on destroy", () => {
    const fetchSubject = new BehaviorSubject<ClientImpactNoteOption[]>(options);
    clientImpactNoteService.fetch = jest
      .fn()
      .mockReturnValue(fetchSubject.asObservable());

    component.ngOnInit();
    component.ngOnDestroy();

    fetchSubject.next([{ name: "jdeed jdeed", id: "new option" }]);
    fetchSubject.complete();
    fixture.detectChanges();

    expect(component.options).toEqual(options);
  });

  it("should update value and notify change when user changes selection in dropdown", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);

    clientImpactNoteService.fetch = jest.fn().mockReturnValue(of(options));
    component.ngOnInit();
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css("p-select"));

    select.triggerEventHandler("ngModelChange", "B");
    fixture.detectChanges();

    expect(component.selectedValue).toEqual("B");
    expect(onChangeSpy).toHaveBeenCalledWith("B");
  });

  it("should call onTouched when the dropdown loses focus", () => {
    const onTouchedSpy = jest.fn();
    component.registerOnTouched(onTouchedSpy);

    component.ngOnInit();
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css("p-select"));
    expect(select).toBeTruthy();

    select.triggerEventHandler("onBlur", null);
    fixture.detectChanges();

    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it("should display skeleton when loading is true and hide the dropdown", () => {
    component.ngOnInit();

    fixture.detectChanges();

    component.loading = true;

    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css("p-skeleton"));
    const dropdown = fixture.debugElement.query(By.css("p-select"));
    expect(skeleton).toBeTruthy();
    expect(dropdown).toBeNull();
  });
});
