import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusinessProcessChainSelectInputComponent } from "./business-process-chain-select-input.component";
import { of } from "rxjs";
import { StreamsService } from "../streams.service";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { BusinessProcessChain } from "../business-process-chain";
import { MultiSelect, MultiSelectChangeEvent } from "primeng/multiselect";

describe("BusinessProcessChainSelectInputComponent", () => {
  let component: BusinessProcessChainSelectInputComponent;
  let fixture: ComponentFixture<BusinessProcessChainSelectInputComponent>;
  let streamsService: jest.Mocked<StreamsService>;
  let store: jest.Mocked<Store>;

  beforeEach(async () => {
    streamsService = {
      getListOfBpcsByProjectId: jest.fn(),
    } as unknown as jest.Mocked<StreamsService>;
    store = {
      select: jest.fn(),
    } as unknown as jest.Mocked<Store>;

    await TestBed.configureTestingModule({
      declarations: [BusinessProcessChainSelectInputComponent],
      providers: [
        { provide: StreamsService, useValue: streamsService },
        { provide: Store, useValue: store },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessProcessChainSelectInputComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch list of BPCs on initialization", () => {
    const projectId = "project123";
    const listOfBpcs: BusinessProcessChain[] = [
      { id: "1", name: "BPC 1" },
      { id: "2", name: "BPC 2" },
    ];
    store.select.mockReturnValue(of(projectId));
    streamsService.getListOfBpcsByProjectId.mockReturnValue(of(listOfBpcs));

    component.ngOnInit();

    expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
    expect(streamsService.getListOfBpcsByProjectId).toHaveBeenCalledWith(
      projectId
    );
    component.listOfBpcs$.subscribe((bpcs) => {
      expect(bpcs).toEqual(listOfBpcs);
    });
  });

  it("should emit selected BPCs on selection change", () => {
    const selectedBpcs: BusinessProcessChain[] = [
      { id: "1", name: "BPC 1" },
      { id: "2", name: "BPC 2" },
    ];
    const expectedIds = ["1", "2"];
    const emitSpy = jest.spyOn(component.selectBpcEvent, "emit");

    component.onBpcSelect({ value: selectedBpcs } as MultiSelectChangeEvent);

    expect(emitSpy).toHaveBeenCalledWith(expectedIds);
  });

  it("should unsubscribe from observables on component destruction", () => {
    const unsubscribeSpy = jest.spyOn(component["destroy$"], "next");

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it("should call remove option and emit and event upon removing a bpc", () => {
    const multiSelect = {
      removeOption: jest.fn(),
      value: [{ id: "1", name: "BPC 1" }],
    } as unknown as MultiSelect;
    const event = {} as MouseEvent;
    const option = { id: "2", name: "BPC 2" };
    const multiSelectRemoveOption = jest.spyOn(multiSelect, "removeOption");
    const componentEventEmitter = jest.spyOn(component.selectBpcEvent, "emit");
    component.onBpcRemove(multiSelect, option, event);
    expect(multiSelectRemoveOption).toHaveBeenCalledWith(option, event);
    expect(componentEventEmitter).toHaveBeenCalledWith(["1"]);
  });

  it("should emit an empty list when clearing", () => {
    const componentEventEmitter = jest.spyOn(component.selectBpcEvent, "emit");
    component.onClear();
    expect(componentEventEmitter).toHaveBeenCalledWith([]);
  });
});
