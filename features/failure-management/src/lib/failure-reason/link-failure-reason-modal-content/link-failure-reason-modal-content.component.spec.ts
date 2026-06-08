import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { LinkFailureReasonModalContentComponent } from "./link-failure-reason-modal-content.component";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  FailureReasonLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { signal } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { FailureReason } from "../failure-reason";
import { firstValueFrom } from "rxjs";

describe("LinkFailureReasonModalContentComponent", () => {
  let component: LinkFailureReasonModalContentComponent;
  let fixture: MockedComponentFixture<LinkFailureReasonModalContentComponent>;
  let failureReasonLinkingStateService: jest.Mocked<FailureReasonLinkingStateService>;

  beforeEach(async () => {
    failureReasonLinkingStateService = {
      isLinking: signal(false),
    } as unknown as jest.Mocked<FailureReasonLinkingStateService>;

    await MockBuilder(LinkFailureReasonModalContentComponent).mock(
      FailureReasonLinkingStateService,
      failureReasonLinkingStateService
    );

    fixture = MockRender(LinkFailureReasonModalContentComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("refresh$", () => {
    it("refresh should be behavioural subject with false initial value", async () => {
      const refresh = await firstValueFrom(component.refresh$);
      expect(refresh).toBeFalsy();
    });

    it("should emit a refresh event when isLinking changes to true", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      failureReasonLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not emit a refresh event when isLinking changes to false", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      failureReasonLinkingStateService.isLinking.set(true);
      failureReasonLinkingStateService.isLinking.set(false);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(component.refresh$.closed).toBe(false);
    }));
    it("should not refresh after component is destroyed", () => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      component.ngOnDestroy();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe("onFailureReasonSelectionChange", () => {
    it("should emit the selected failure reasons", () => {
      const selectedFailureReasons = [
        getFullySelectedFailureReason(getFirstFailureReason()),
      ];
      const emitSpy = jest.spyOn(
        component.selectedFailureReasonsChange,
        "emit"
      );
      component.onFailureReasonSelectionChange(selectedFailureReasons);
      expect(emitSpy).toHaveBeenCalledWith(selectedFailureReasons);
    });

    it("should be called on selectedFailureReasonsChange event", () => {
      const selectedFailureReasons = getFailureReasons();
      const handlerSpy = jest.spyOn(
        component,
        "onFailureReasonSelectionChange"
      );
      const outputEmitter = ngMocks.output(
        "mxevolve-failure-reason-selection-table",
        "selectedFailureReasonsChange"
      );
      outputEmitter.emit(selectedFailureReasons);
      expect(handlerSpy).toHaveBeenCalledWith(selectedFailureReasons);
    });
  });

  function getFailureReasons(): FailureReason[] {
    return [getFirstFailureReason(), getSecondFailureReason()];
  }

  function getFirstFailureReason(): FailureReason {
    return {
      id: "analysisObjectId1",
      title: "title1",
      description: "description1",
      isEnabled: true,
    };
  }

  function getSecondFailureReason(): FailureReason {
    return {
      id: "analysisObjectId2",
      title: "title2",
      description: "description2",
      isEnabled: true,
    };
  }

  function getFullySelectedFailureReason(
    failureReason: FailureReason
  ): AnalysisObjectSelectionState<FailureReason> {
    return {
      analysisObject: failureReason,
      selectionType: AnalysisObjectSelectionType.FULL,
      selectionMessage: undefined,
    };
  }
});
