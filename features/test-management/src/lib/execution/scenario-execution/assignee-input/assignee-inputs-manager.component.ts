import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
} from "@angular/core";

import { AssigneeInputComponent } from "./assignee-input.component";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "mxevolve-assignee-inputs-manager-component",
  standalone: true,
  imports: [],
  template: "",
  styles: "",
})
export class AssigneeInputsManagerComponent
  implements OnDestroy, AfterViewInit
{
  private changeDetector = inject(ChangeDetectorRef);

  protected readonly destroy$ = new Subject();

  @ViewChildren(AssigneeInputComponent)
  assigneeInputComponents: QueryList<AssigneeInputComponent>;
  assigneeComponentsLoading = true;

  ngAfterViewInit(): void {
    this.assigneeInputComponents.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.assigneeComponentsLoading = true;
        this.changeDetector.detectChanges();
      });
  }

  handleAssigneeFinishedLoading() {
    const numberOfAssigneeComponentsStillLoading =
      this.assigneeInputComponents.filter(
        (component) => component.isLoadingUsers
      ).length;
    if (numberOfAssigneeComponentsStillLoading === 0) {
      this.assigneeComponentsLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
