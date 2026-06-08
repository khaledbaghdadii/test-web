import { ScenarioExecutionCommitIdComponent } from "./scenario-execution-commit-id.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CommitIdPipeModule, CommitIdShortnerPipe } from "@mxflow/pipe";
import { MockModule, MockPipe } from "ng-mocks";
import { By } from "@angular/platform-browser";

const COMMIT_ID = "aVeryLongCommitIdThatNeedsToBeShortenedSomehowByAnyMeans";
const SHORTENED_COMMIT_ID = "shortenedCommitId";
describe("scenario execution commit id component", () => {
  let component: ScenarioExecutionCommitIdComponent;
  let fixture: ComponentFixture<ScenarioExecutionCommitIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScenarioExecutionCommitIdComponent,
        MockModule(CommitIdPipeModule),
      ],
      declarations: [MockPipe(CommitIdShortnerPipe, () => SHORTENED_COMMIT_ID)],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionCommitIdComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    component.commitId = COMMIT_ID;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it("should display the shortened commit id", () => {
    component.commitId = COMMIT_ID;
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(
      By.css("#scenario-execution-commit-id")
    );

    expect(spanElement.nativeElement.textContent.trim()).toBe(
      SHORTENED_COMMIT_ID
    );
  });
});
