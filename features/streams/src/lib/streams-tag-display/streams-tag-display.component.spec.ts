import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StreamsTagDisplayComponent } from "./streams-tag-display.component";
import { StreamsService } from "../streams.service";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { of, Subject, throwError } from "rxjs";

const STREAMS = [
  {
    id: "1",
    name: "Stream 1",
    businessProcessChains: [
      {
        id: "bpc1",
        name: "",
      },
      {
        id: "bpc2",
        name: "",
      },
    ],
    owners: [],
  },
  {
    id: "2",
    name: "Stream 2",
    businessProcessChains: [
      {
        id: "bpc2",
        name: "",
      },
    ],
    owners: [],
  },
];
describe("StreamsTagDisplayComponent", () => {
  let component: StreamsTagDisplayComponent;
  let fixture: ComponentFixture<StreamsTagDisplayComponent>;
  let streamsService: jest.Mocked<StreamsService>;
  let store: jest.Mocked<Store>;

  beforeEach(async () => {
    streamsService = {
      getStreams: jest.fn(),
    } as unknown as jest.Mocked<StreamsService>;
    store = {
      select: jest.fn(),
    } as unknown as jest.Mocked<Store>;

    await TestBed.configureTestingModule({
      declarations: [StreamsTagDisplayComponent],
      providers: [
        { provide: StreamsService, useValue: streamsService },
        { provide: Store, useValue: store },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamsTagDisplayComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should load streams when initialized", () => {
    const projectId = "project123";
    const projectStoreSubject = new Subject();
    store.select.mockReturnValue(projectStoreSubject);
    streamsService.getStreams.mockReturnValue(of(STREAMS));
    expect(component.isLoadingStreams).toBeTruthy();

    component.ngOnInit();
    projectStoreSubject.next(projectId);

    expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
    expect(streamsService.getStreams).toHaveBeenCalledWith(projectId);
    expect(component.listOfAllStreams).toEqual(STREAMS);
    expect(component.isLoadingStreams).toBeFalsy();
  });

  it("should stop loading if failed to fetch streams", () => {
    const projectId = "project123";
    const projectStoreSubject = new Subject();
    store.select.mockReturnValue(projectStoreSubject);

    streamsService.getStreams.mockReturnValue(throwError(() => new Error()));
    expect(component.isLoadingStreams).toBeTruthy();
    expect(component.failedToFetchStreams).toBeFalsy();

    component.ngOnInit();
    projectStoreSubject.next(projectId);

    expect(component.isLoadingStreams).toBeFalsy();
    expect(component.failedToFetchStreams).toBeTruthy();
  });
  it("should filter selected streams when bpcIds change", () => {
    component.listOfAllStreams = STREAMS;
    component.bpcIds = ["bpc1", "bpc2"];

    expect(component.listOfSelectedStreams).toEqual([STREAMS[0], STREAMS[1]]);
  });

  it("should handle no selected streams when bpcIds change", () => {
    component.listOfAllStreams = STREAMS;
    component.bpcIds = ["unknownBPC"];

    expect(component.listOfSelectedStreams).toEqual([]);
  });

  it("should handle no selected streams when no streams loaded", () => {
    component.bpcIds = ["bpc1", "bpc2"];

    expect(component.listOfSelectedStreams).toEqual([]);
  });

  it("should update selected streams if bpcs were updated before fetching the list of streams is done", () => {
    component.bpcIds = ["bpc1", "bpc2"];

    component.listOfAllStreams = STREAMS;

    expect(component.listOfSelectedStreams).toEqual([STREAMS[0], STREAMS[1]]);
  });

  it("should unsubscribe from observables on component destruction", () => {
    const unsubscribeSpy = jest.spyOn(component["destroy$"], "next");

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
