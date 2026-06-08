import { UpdateReferenceTableComponent } from "./update-reference-table.component";
import { UpdateReferenceService } from "../update-reference.service";
import {
  BinaryImpactService,
  ConfigurationImpactService,
  DetectionUriBuilderPipe,
  LiteBinaryImpact,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { delay, of, throwError } from "rxjs";
import { UpdateReference, UpdateReferenceStatus } from "../update-reference";
import { ComponentFixture, TestBed } from "@angular/core/testing";

const configurationImpactUrl1 = "config/impact1/url";
const configurationImpactId1 = "configurationImpactId1";
const configurationImpactTitle1 = "configuration impact1 title";
const configurationImpactUrl2 = "config/impact2/url";
const configurationImpactId2 = "configurationImpactId2";
const configurationImpactTitle2 = "configuration impact2 title";
const configurationImpactUrl3 = "config/impact3/url/";
const configurationImpactId3 = "configurationImpactId3";
const configurationImpactTitle3 = "configuration impact3 title";

const configurationImpacts = [
  {
    id: configurationImpactId1,
    title: configurationImpactTitle1,
  },
  {
    id: configurationImpactId2,
    title: configurationImpactTitle2,
  },
  {
    id: configurationImpactId3,
    title: configurationImpactTitle3,
  },
];

const binaryImpactId1 = "binary impact id 1";
const upgradeImpactId1 = "upgradeImpactId1";
const upgradeImpactLink1 = "upgrade impact link 1";

const binaryImpactId2 = "binary impact id 2";
const upgradeImpactId2 = "upgradeImpactId2";
const upgradeImpactLink2 = "upgrade impact link 2";

const binaryImpactId3 = "binary impact id 3";
const upgradeImpactId3 = "upgradeImpactId3";
const upgradeImpactLink3 = "upgrade impact link 3";

const binaryImpacts = [
  {
    id: binaryImpactId1,
    upgradeImpact: {
      externalIssue: {
        id: upgradeImpactId1,
        link: upgradeImpactLink1,
      },
    },
  },
  {
    id: binaryImpactId2,
    upgradeImpact: {
      externalIssue: {
        id: upgradeImpactId2,
        link: upgradeImpactLink2,
      },
    },
  },
  {
    id: binaryImpactId3,
    upgradeImpact: {
      externalIssue: {
        id: upgradeImpactId3,
        link: upgradeImpactLink3,
      },
    },
  },
] as LiteBinaryImpact[];

const updateReferenceId1 = "updateReferenceId1";
const projectId = "projectId";
const testExecutionId = "testExecutionId";
const updateReferencePath1 = "update/ref/path/1";
const commitMessage1 = "commit message 1";
const commitId1 = "commit id 1";
const updateReference = {
  id: updateReferenceId1,
  projectId: projectId,
  testExecutionId: testExecutionId,
  path: updateReferencePath1,
  commitMessage: commitMessage1,
  status: UpdateReferenceStatus.PASSED,
  commitId: commitId1,
  linkedConfigurationImpactsIds: new Set([
    configurationImpactId1,
    configurationImpactId2,
  ]),
  linkedBinaryImpactsIds: new Set([binaryImpactId1, binaryImpactId2]),
};
const updateReferenceRow = {
  path: updateReferencePath1,
  commitMessage: commitMessage1,
  status: UpdateReferenceStatus.PASSED,
  commitId: commitId1,
  linkedImpacts: [
    {
      displayText: upgradeImpactId1,
      link: upgradeImpactLink1,
    },
    {
      displayText: upgradeImpactId2,
      link: upgradeImpactLink2,
    },
    {
      displayText: configurationImpactTitle1,
      link: configurationImpactUrl1,
    },
    {
      displayText: configurationImpactTitle2,
      link: configurationImpactUrl2,
    },
  ],
};
const updateReferenceId2 = "updateReferenceId2";
const updateReferencePath2 = "update/ref/path/2";
const commitMessage2 = "commit message 2";
const commitId2 = "commit id 2";
const updateReference2 = {
  id: updateReferenceId2,
  projectId: projectId,
  testExecutionId: testExecutionId,
  path: updateReferencePath2,
  commitMessage: commitMessage2,
  status: UpdateReferenceStatus.FAILED,
  commitId: commitId2,
  linkedConfigurationImpactsIds: new Set([configurationImpactId3]),
  linkedBinaryImpactsIds: new Set([binaryImpactId3]),
};

const updateReferenceRow2 = {
  path: updateReferencePath2,
  commitMessage: commitMessage2,
  status: UpdateReferenceStatus.FAILED,
  commitId: commitId2,
  linkedImpacts: [
    {
      displayText: upgradeImpactId3,
      link: upgradeImpactLink3,
    },
    {
      displayText: configurationImpactTitle3,
      link: configurationImpactUrl3,
    },
  ],
};
const updateReferences = [
  updateReference,
  updateReference2,
] as UpdateReference[];

describe("UpdateReferenceTableComponent", () => {
  let component: UpdateReferenceTableComponent;
  let fixture: ComponentFixture<UpdateReferenceTableComponent>;
  let updateReferenceService: UpdateReferenceService;
  let binaryImpactService: BinaryImpactService;
  let configImpactService: ConfigurationImpactService;
  let detectionUriBuilder: DetectionUriBuilderPipe;

  function mockBinaryImpactServiceToThrow() {
    binaryImpactService.fetchByIds = jest.fn(() =>
      throwError(() => new Error("error message"))
    );
  }

  beforeEach(async () => {
    updateReferenceService = {
      fetch: jest.fn(() => of(updateReferences)),
    } as unknown as UpdateReferenceService;

    binaryImpactService = {
      fetchByIds: jest.fn(() => of(binaryImpacts)),
    } as unknown as BinaryImpactService;

    configImpactService = {
      fetchByIds: jest.fn(() => of(configurationImpacts)),
    } as unknown as ConfigurationImpactService;

    detectionUriBuilder = {
      transform: jest
        .fn()
        .mockImplementationOnce(() => configurationImpactUrl1)
        .mockImplementationOnce(() => configurationImpactUrl2)
        .mockImplementationOnce(() => configurationImpactUrl3),
    } as unknown as DetectionUriBuilderPipe;
    TestBed.configureTestingModule({
      imports: [UpdateReferenceTableComponent],
    }).overrideComponent(UpdateReferenceTableComponent, {
      set: {
        providers: [
          { provide: UpdateReferenceService, useValue: updateReferenceService },
          { provide: BinaryImpactService, useValue: binaryImpactService },
          {
            provide: ConfigurationImpactService,
            useValue: configImpactService,
          },
          { provide: DetectionUriBuilderPipe, useValue: detectionUriBuilder },
        ],
      },
    });
    fixture = TestBed.createComponent(UpdateReferenceTableComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
    component.testExecutionId = testExecutionId;
  });

  it("isLoading should have a default value of false", () => {
    expect(component.isLoading).toBeFalsy();
  });
  it("should set is loading flag to true on init", () => {
    updateReferenceService.fetch = jest.fn(() => of([]).pipe(delay(3000)));
    component.ngOnInit();
    expect(component.isLoading).toBeTruthy();
  });
  it("should keep loading if update references were fetched but binary impacts are still being fetched", () => {
    binaryImpactService.fetchByIds = jest.fn(() => of([]).pipe(delay(3000)));
    component.ngOnInit();
    expect(component.isLoading).toBeTruthy();
  });
  it("should set loading to false if all resources are fetched successfully", () => {
    component.ngOnInit();
    expect(component.isLoading).toBeFalsy();
  });
  it("should set is loading to false if update references failed to fetch", () => {
    updateReferenceService.fetch = jest.fn(() =>
      throwError(() => new Error("error message"))
    );
    component.ngOnInit();
    expect(component.isLoading).toBeFalsy();
  });

  it("should fetch update references for the correct test execution", () => {
    component.ngOnInit();
    expect(updateReferenceService.fetch).toHaveBeenCalledWith(
      projectId,
      testExecutionId
    );
  });

  describe("fetching config impacts", () => {
    it("should keep loading if update references were fetched but config impacts are still being fetched", () => {
      configImpactService.fetchByIds = jest.fn(() => of([]).pipe(delay(3000)));
      component.ngOnInit();
      expect(component.isLoading).toBeTruthy();
    });
    it("should set is loading to false if config impacts failed to fetch", () => {
      jest
        .spyOn(configImpactService, "fetchByIds")
        .mockReturnValue(throwError(() => new Error("error message")));
      component.ngOnInit();
      expect(component.isLoading).toBeFalsy();
    });
    it("should fetch the config impacts linked to the update reference", () => {
      component.ngOnInit();
      expect(configImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        configurationImpactId1,
        configurationImpactId2,
        configurationImpactId3,
      ]);
    });

    it("should not try to fetch config impacts if update references does not have config impacts", () => {
      updateReferenceService.fetch = jest.fn(() =>
        of([
          {
            ...updateReference,
            linkedConfigurationImpactsIds: new Set([]),
          },
        ])
      );
      component.ngOnInit();
      expect(configImpactService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should fetch the configuration impact only once if it is linked to multiple update references", () => {
      updateReferenceService.fetch = jest.fn(() =>
        of([
          updateReference,
          {
            ...updateReference,
            id: "id2",
            linkedConfigurationImpactsIds: new Set([configurationImpactId1]),
          },
        ])
      );
      component.ngOnInit();
      expect(configImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        configurationImpactId1,
        configurationImpactId2,
      ]);
    });
    it("should show empty list of linked impacts if the fetched config impacts dont contain the linked ones", () => {
      binaryImpactService.fetchByIds = jest.fn(() => of([]));
      configImpactService.fetchByIds = jest.fn(() =>
        of([configurationImpacts[0] as unknown as LiteConfigurationImpact])
      );
      updateReferenceService.fetch = jest.fn(() =>
        of([
          {
            ...updateReference,
            linkedBinaryImpactsIds: new Set([]),
            linkedConfigurationImpactsIds: new Set([
              configurationImpactId1,
              configurationImpactId2,
              configurationImpactId2,
            ]),
          },
        ])
      );
      component.ngOnInit();
      expect(component.updateReferences).toEqual([
        {
          ...updateReferenceRow,
          linkedImpacts: [
            {
              displayText: configurationImpactTitle1,
              link: configurationImpactUrl1,
            },
          ],
        },
      ]);
    });
  });

  describe("fetching binary impacts", () => {
    it("should set is loading to false if binary impacts failed to fetch", () => {
      mockBinaryImpactServiceToThrow();
      component.ngOnInit();
      expect(component.isLoading).toBeFalsy();
    });

    it("should fetch the binary impacts linked to the update reference", () => {
      component.ngOnInit();
      expect(binaryImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        binaryImpactId1,
        binaryImpactId2,
        binaryImpactId3,
      ]);
    });

    it("should not try to fetch binary impacts if update references does not have binary impacts", () => {
      updateReferenceService.fetch = jest.fn(() =>
        of([{ ...updateReference, linkedBinaryImpactsIds: new Set([]) }])
      );
      component.ngOnInit();
      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should fetch the binary impact only once if it is linked to multiple update references", () => {
      updateReferenceService.fetch = jest.fn(() =>
        of([
          updateReference,
          {
            ...updateReference,
            id: "id2",
            linkedBinaryImpactsIds: new Set([binaryImpactId2]),
          },
        ])
      );
      component.ngOnInit();
      expect(binaryImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        binaryImpactId1,
        binaryImpactId2,
      ]);
    });
    it("should return only one upgrade impact if both binary impacts linked inherit the same upgrade impact", () => {
      binaryImpactService.fetchByIds = jest.fn(() =>
        of([
          binaryImpacts[0],
          {
            ...binaryImpacts[1],
            upgradeImpact: binaryImpacts[0].upgradeImpact,
          },
        ] as unknown[] as LiteBinaryImpact[])
      );
      configImpactService.fetchByIds = jest.fn(() => of([]));
      updateReferenceService.fetch = jest.fn(() =>
        of([
          {
            ...updateReference,
            linkedConfigurationImpactsIds: new Set([]),
            linkedBinaryImpactsIds: new Set([binaryImpactId1, binaryImpactId2]),
          },
        ])
      );
      component.ngOnInit();
      expect(component.updateReferences).toEqual([
        {
          ...updateReferenceRow,
          linkedImpacts: [
            { displayText: upgradeImpactId1, link: upgradeImpactLink1 },
          ],
        },
      ]);
    });

    it("should return update references without any binary impacts linked in case the binary impact does not inherit an upgrade impact", () => {
      binaryImpactService.fetchByIds = jest.fn(() =>
        of([
          {
            ...binaryImpacts[0],
            upgradeImpact: undefined,
          },
        ] as unknown[] as LiteBinaryImpact[])
      );
      configImpactService.fetchByIds = jest.fn(() => of([]));
      updateReferenceService.fetch = jest.fn(() =>
        of([
          {
            ...updateReference,
            linkedConfigurationImpactsIds: new Set([]),
            linkedBinaryImpactsIds: new Set([binaryImpactId1, binaryImpactId2]),
          },
        ])
      );
      component.ngOnInit();
      expect(component.updateReferences).toEqual([
        {
          ...updateReferenceRow,
          linkedImpacts: [],
        },
      ]);
    });

    it("should show empty list of linked impacts if the fetched binary impacts dont contain the linked ones", () => {
      binaryImpactService.fetchByIds = jest.fn(() =>
        of([binaryImpacts[0]] as unknown[] as LiteBinaryImpact[])
      );
      configImpactService.fetchByIds = jest.fn(() => of([]));
      updateReferenceService.fetch = jest.fn(() =>
        of([
          {
            ...updateReference,
            linkedConfigurationImpactsIds: new Set([]),
            linkedBinaryImpactsIds: new Set([
              binaryImpactId1,
              binaryImpactId2,
              binaryImpactId3,
            ]),
          },
        ])
      );
      component.ngOnInit();
      expect(component.updateReferences).toEqual([
        {
          ...updateReferenceRow,
          linkedImpacts: [
            { displayText: upgradeImpactId1, link: upgradeImpactLink1 },
          ],
        },
      ]);
    });
  });

  it("should construct the update references with their linked impact titles and urls", () => {
    updateReferenceService.fetch = jest.fn(() => of(updateReferences));
    component.ngOnInit();
    expect(component.updateReferences).toEqual([
      updateReferenceRow,
      updateReferenceRow2,
    ]);
  });

  it("should construct the update references correctly if no linked impacts exist", () => {
    detectionUriBuilder.transform = jest.fn(() => configurationImpactUrl3);
    updateReferenceService.fetch = jest.fn(() =>
      of([
        {
          ...updateReference,
          linkedBinaryImpactsIds: new Set([]),
          linkedConfigurationImpactsIds: new Set([]),
        },
        updateReference2,
      ])
    );
    component.ngOnInit();
    expect(component.updateReferences).toEqual([
      { ...updateReferenceRow, linkedImpacts: [] },
      updateReferenceRow2,
    ]);
  });

  describe("template tests", () => {
    it("should comma separate linked impacts", () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const linkedImpacts = compiled.querySelectorAll(
        "#update-reference-table-linked-impacts"
      );
      expect(linkedImpacts[0].textContent).toContain(
        `${upgradeImpactId1} , ${upgradeImpactId2} , ${configurationImpactTitle1} , ${configurationImpactTitle2}`
      );
      expect(linkedImpacts[1].textContent).toContain(
        `${upgradeImpactId3} , ${configurationImpactTitle3}`
      );
    });
    it("should show a dash if commit id is not defined", () => {
      fixture.detectChanges();
      component.updateReferences = [
        {
          ...updateReferenceRow,
          commitId: undefined as unknown as string,
        },
      ];
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const commitIdElement = compiled.querySelector(
        "#update-reference-table-commit-id"
      );
      expect(commitIdElement?.textContent).toBe(" - ");
    });
  });
});
