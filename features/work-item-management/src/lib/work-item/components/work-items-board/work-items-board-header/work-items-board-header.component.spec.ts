import { ComponentFixture, TestBed } from "@angular/core/testing";
import { computed } from "@angular/core";
import { WorkItemsBoardHeaderComponent } from "./work-items-board-header.component";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import { WorkItemBoardColumnConfig } from "../model/work-item-board-column-config.model";
import { WorkItemStatus } from "../../../model/work-item";
import { APP_CONFIG } from "@mxflow/config";
import { provideHttpClient } from "@angular/common/http";

describe("WorkItemsBoardHeaderComponent", () => {
  let component: WorkItemsBoardHeaderComponent;
  let fixture: ComponentFixture<WorkItemsBoardHeaderComponent>;

  const mockColumnConfigs: WorkItemBoardColumnConfig[] = [
    { id: "open", title: "Open", status: WorkItemStatus.OPEN },
    { id: "assigned", title: "Assigned", status: WorkItemStatus.ASSIGNED },
    { id: "underway", title: "Underway", status: WorkItemStatus.UNDERWAY },
  ];

  beforeEach(async () => {
    const workItemBoardStateSpy = {
      columnConfigs: computed(() => mockColumnConfigs),
    } as unknown as jest.Mocked<WorkItemBoardStateService>;

    await TestBed.configureTestingModule({
      imports: [WorkItemsBoardHeaderComponent],
      providers: [
        provideHttpClient(),
        { provide: WorkItemBoardStateService, useValue: workItemBoardStateSpy },
        {
          provide: APP_CONFIG,
          useValue: { gatewayUrl: "https://api-gateway/" },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkItemsBoardHeaderComponent);
    component = fixture.componentInstance;
  });

  describe("Component Initialization", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should inject WorkItemBoardStateService", () => {
      expect(component["workItemState"]).toBeDefined();
    });
  });

  describe("Computed Properties", () => {
    describe("columns", () => {
      it("should return column configurations from state service", () => {
        const columns = component.columns();

        expect(columns).toEqual(mockColumnConfigs);
      });

      it("should be reactive to changes in columnConfigs", () => {
        const columns = component.columns();
        expect(columns).toEqual(mockColumnConfigs);
        expect(columns.length).toBe(3);
        expect(columns[0].id).toBe("open");
        expect(columns[1].id).toBe("assigned");
        expect(columns[2].id).toBe("underway");
      });

      it("should handle different column configurations", () => {
        const columns = component.columns();
        expect(columns).toBeDefined();
        expect(Array.isArray(columns)).toBe(true);
      });
    });
  });

  describe("Track By Functions", () => {
    describe("trackByColumnId", () => {
      it("should return column id for tracking", () => {
        const column = { id: "test-column-id", title: "Test Column" };
        const index = 0;

        const result = component.trackByColumnId(index, column);

        expect(result).toBe("test-column-id");
      });

      it("should work with different column objects", () => {
        const columns = [
          { id: "open", title: "Open" },
          { id: "assigned", title: "Assigned" },
          { id: "done", title: "Done" },
        ];

        columns.forEach((column, index) => {
          const result = component.trackByColumnId(index, column);
          expect(result).toBe(column.id);
        });
      });

      it("should ignore index parameter and only use column id", () => {
        const column = { id: "unique-id", title: "Test" };

        const result1 = component.trackByColumnId(0, column);
        const result2 = component.trackByColumnId(99, column);

        expect(result1).toBe("unique-id");
        expect(result2).toBe("unique-id");
        expect(result1).toBe(result2);
      });
    });
  });
});
