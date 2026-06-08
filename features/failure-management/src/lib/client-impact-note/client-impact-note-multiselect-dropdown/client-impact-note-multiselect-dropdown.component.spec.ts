import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ClientImpactNoteMultiSelectDropdownComponent } from "./client-impact-note-multiselect-dropdown.component";
import {
  ClientImpactNoteOption,
  ClientImpactNoteService,
  ClientImpactNoteFieldType,
} from "@mxevolve/domains/test/data-access";
import { BehaviorSubject, of, Subject } from "rxjs";
import { By } from "@angular/platform-browser";

describe("ClientImpactNoteMultiSelectDropdownComponent", () => {
  let fixture: ComponentFixture<ClientImpactNoteMultiSelectDropdownComponent>;
  let component: ClientImpactNoteMultiSelectDropdownComponent;

  const options: ClientImpactNoteOption[] = [
    { name: "Note A", id: "A" },
    { name: "Note B", id: "B" },
    { name: "Note C", id: "C" },
  ];

  let clientImpactNoteService: ClientImpactNoteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientImpactNoteMultiSelectDropdownComponent],
    }).compileComponents();

    clientImpactNoteService = {
      fetch: jest.fn().mockReturnValue(of(options)),
    } as unknown as ClientImpactNoteService;
    TestBed.overrideProvider(ClientImpactNoteService, {
      useValue: clientImpactNoteService,
    });

    fixture = TestBed.createComponent(
      ClientImpactNoteMultiSelectDropdownComponent
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

  it("should keep valid prefilled values and remove invalid ones when prefilling happens before fetching options", () => {
    const fetchSubject = new Subject<ClientImpactNoteOption[]>();
    clientImpactNoteService.fetch = jest
      .fn()
      .mockReturnValue(fetchSubject.asObservable());
    component.ngOnInit();
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.writeValue(["A", "Z"]);

    fixture.detectChanges();

    fetchSubject.next(options);
    fetchSubject.complete();

    fixture.detectChanges();

    expect(component.selectedDropdownValues).toEqual(["A"]);
    expect(onChangeSpy).toHaveBeenCalledWith(["A"]);
  });

  it("should keep valid prefilled values and remove invalid ones when prefilling happens after fetching options", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.ngOnInit();

    fixture.detectChanges();

    component.writeValue(["A", "Z"]);

    fixture.detectChanges();

    expect(component.selectedDropdownValues).toEqual(["A"]);
    expect(onChangeSpy).toHaveBeenCalledWith(["A"]);
  });

  it("should not notify of a change in case the prefilled fields are all valid", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.ngOnInit();

    fixture.detectChanges();

    component.writeValue(["A", "B"]);

    fixture.detectChanges();

    expect(component.selectedDropdownValues).toEqual(["A", "B"]);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it("should stop validating and updating value from parent form on destroy", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);

    component.ngOnInit();
    fixture.detectChanges();

    component.writeValue(["A"]);
    fixture.detectChanges();
    expect(component.selectedDropdownValues).toEqual(["A"]);

    component.ngOnDestroy();

    component.validateAndUpdateValueFromParentForm.next(["B"]);
    fixture.detectChanges();
    expect(component.selectedDropdownValues).toEqual(["A"]);
    expect(onChangeSpy).not.toHaveBeenCalledWith(["B"]);
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

    const multiselect = fixture.debugElement.query(By.css("p-multiselect"));

    multiselect.triggerEventHandler("ngModelChange", ["B", "C"]);
    fixture.detectChanges();

    expect(component.selectedDropdownValues).toEqual(["B", "C"]);
    expect(onChangeSpy).toHaveBeenCalledWith(["B", "C"]);
  });

  it("should call onTouched when the multiselect loses focus", () => {
    const onTouchedSpy = jest.fn();
    component.registerOnTouched(onTouchedSpy);

    component.ngOnInit();
    fixture.detectChanges();

    const multiselect = fixture.debugElement.query(By.css("p-multiselect"));
    expect(multiselect).toBeTruthy();

    multiselect.triggerEventHandler("onBlur", null);
    fixture.detectChanges();

    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it("should display skeleton when loading is true and hide the multiselect", () => {
    component.ngOnInit();

    fixture.detectChanges();

    component.loading = true;

    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css("p-skeleton"));
    const multiselect = fixture.debugElement.query(By.css("p-multiselect"));
    expect(skeleton).toBeTruthy();
    expect(multiselect).toBeNull();
  });

  it("should set value to empty list when form value is reset to null", () => {
    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);
    component.ngOnInit();
    fixture.detectChanges();

    component.writeValue(["A", "Z"]);
    fixture.detectChanges();

    component.writeValue(null);
    fixture.detectChanges();

    expect(component.selectedDropdownValues).toEqual([]);
  });
});
