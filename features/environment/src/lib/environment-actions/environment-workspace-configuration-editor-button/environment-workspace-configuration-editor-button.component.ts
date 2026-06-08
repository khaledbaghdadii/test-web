import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { Button } from "primeng/button";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { Tooltip } from "primeng/tooltip";
import {
  EnvironmentsState,
  selectEnvironment,
  Environment,
  EnvironmentStatus,
} from "@mxflow/features/environment";
import { ProjectUrlPipe } from "@mxflow/features/project";

@Component({
  selector: "mxevolve-environment-workspace-configuration-editor-button",
  standalone: true,
  imports: [Button, Tooltip],
  providers: [ProjectUrlPipe],
  templateUrl:
    "./environment-workspace-configuration-editor-button.component.html",
})
export class EnvironmentWorkspaceConfigurationEditorButtonComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject<void>();

  @Input() projectId!: string;
  @Input() environmentId!: string;

  disabled: boolean = true;
  displayToolTip: string | undefined;

  store = inject<Store<EnvironmentsState>>(Store);
  private readonly projectUrlPipe = inject(ProjectUrlPipe);

  ngOnInit(): void {
    this.store
      .select(
        selectEnvironment({
          projectId: this.projectId,
          environmentId: this.environmentId,
        })
      )
      .pipe(
        skipWhile((env) => env === undefined),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (env: Environment | undefined) => {
          if (env?.status === EnvironmentStatus.READY) {
            this.disabled = false;
          } else {
            this.displayToolTip = "Environment is not in a ready state.";
          }
        },
      });
  }

  openConfigurationEditor(): void {
    if (!this.projectId || !this.environmentId) {
      return;
    }
    window.open(this.getConfigurationEditorUrl(), "_blank");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getConfigurationEditorUrl() {
    return (
      this.projectUrlPipe.transform(this.projectId) +
      "/environments/" +
      this.environmentId +
      "/configuration-editor"
    );
  }
}
