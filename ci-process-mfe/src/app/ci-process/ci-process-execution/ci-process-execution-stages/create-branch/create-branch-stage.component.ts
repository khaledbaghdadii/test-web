import { Component, OnInit } from "@angular/core";
import { map, Observable } from "rxjs";

import { Store } from "@ngrx/store";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { BuildAndTestProcessCreateBranchStage } from "@mxflow/features/business-process";

@Component({
  selector: "mxflow-create-branch-stage",
  templateUrl: `create-branch-stage.component.html`,
  standalone: false,
})
export class CreateBranchStageComponent implements OnInit {
  stage$: Observable<BuildAndTestProcessCreateBranchStage>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.stage$ = this.store
      .pipe(getCiProcessExecution)
      .pipe(map((execution) => execution.createBranchStage));
  }
}
