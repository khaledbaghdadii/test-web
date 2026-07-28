import { lastValueFrom, of } from "rxjs";
import { BusinessProcessRepositorySelectorComponent } from "@mxflow/ui/inputs";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RepositoryService } from "@mxflow/features/repository";
import { By } from "@angular/platform-browser";
import { FormControl } from "@angular/forms";

const PROJECT_ID = "PROJECT_ID";
describe("Business process repository selector", () => {
  let fixture: ComponentFixture<BusinessProcessRepositorySelectorComponent>;
  let component: BusinessProcessRepositorySelectorComponent;

  const repoService = {
    getTestRepositories: jest.fn(() =>
      of([{ id: "repo1", url: "firstRepoUrl" }])
    ),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BusinessProcessRepositorySelectorComponent],
      providers: [
        {
          provide: RepositoryService,
          useValue: repoService,
        },
      ],
    }).overrideComponent(BusinessProcessRepositorySelectorComponent, {
      set: {
        providers: [],
      },
    });
    fixture = TestBed.createComponent(
      BusinessProcessRepositorySelectorComponent
    );
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
  });

  it("should get test repositories by project id on init", async () => {
    component.ngOnInit();

    await lastValueFrom(component.options$);

    expect(repoService.getTestRepositories).toHaveBeenCalledWith(PROJECT_ID);
  });

  it("should populate the repository options", async () => {
    component.ngOnInit();

    const options = await lastValueFrom(component.options$);

    expect(options.length).toEqual(1);
  });

  it("should populate repository url in options correctly", async () => {
    component.ngOnInit();

    const options = await lastValueFrom(component.options$);

    expect(options[0].name).toEqual("firstRepoUrl");
  });

  it("should populate repository ids in options correctly", async () => {
    component.ngOnInit();

    const options = await lastValueFrom(component.options$);

    expect(options[0].value).toEqual("repo1");
  });

  it("given the user changed the repository id input an event should be announced for consumers to react", async () => {
    component.repositoryIdFormControl = new FormControl(null);
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.repositoryChanged, "emit");

    const pSelectDe = fixture.debugElement.query(By.css("p-select"));
    pSelectDe.triggerEventHandler("onChange", null);
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
  });
});
