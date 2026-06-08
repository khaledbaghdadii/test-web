import { TestBed } from "@angular/core/testing";
import { TechnicalReseedComponent } from "./technical-reseed.component";
import { Store } from "@ngrx/store";
import { ExecutionGroupsState } from "../store/execution-group/execution-group.state";
import {
  dropExecutionGroupDetails,
  retrieveExecutionGroup,
} from "../store/execution-group/execution-groups.action";

const PROJECT_ID = "projectId";
const EXECUTION_GROUP_ID = "executionGroupId";
const INFRA_GROUP = "infraGroup";
const TARGET_BRANCH = "targetBranch";

describe("TechnicalReseedComponent", () => {
  let component: TechnicalReseedComponent;
  let store: Store<ExecutionGroupsState>;

  beforeEach(async () => {
    store = {
      dispatch: jest.fn(),
    } as unknown as Store<ExecutionGroupsState>;

    await TestBed.configureTestingModule({
      providers: [
        TechnicalReseedComponent,
        { provide: Store<ExecutionGroupsState>, useValue: store },
      ],
    }).compileComponents();

    component = TestBed.inject(TechnicalReseedComponent);
    component.projectId = PROJECT_ID;
    component.infraGroup = INFRA_GROUP;
    component.executionGroupId = EXECUTION_GROUP_ID;
    component.targetBranch = TARGET_BRANCH;
  });

  it("should retrieve the execution group details on init", () => {
    component.ngOnInit();
    expect(store.dispatch).toHaveBeenCalledWith(
      retrieveExecutionGroup({
        projectId: PROJECT_ID,
        executionGroupId: EXECUTION_GROUP_ID,
      })
    );
  });

  it("should drop the execution group details from the store before closing the component", () => {
    component.ngOnDestroy();

    expect(store.dispatch).toHaveBeenCalledWith(
      dropExecutionGroupDetails({ executionGroupId: EXECUTION_GROUP_ID })
    );
  });

  it("should emit a reseed successful event once received", () => {
    const spy = jest.spyOn(component.reseedLaunchedSuccessfully, "emit");
    component.handleSuccessfulReseed();
    expect(spy).toHaveBeenCalled();
  });
});
