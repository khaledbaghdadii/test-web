import { NgModule } from "@angular/core";
import { TestExecutionWebEngineReportComponent } from "./test-execution-web-engine-report/test-execution-web-engine-report.component";
import { RepositoryService } from "@mxflow/features/repository";

@NgModule({
  exports: [TestExecutionWebEngineReportComponent],
  imports: [TestExecutionWebEngineReportComponent],
  providers: [RepositoryService],
})
export class TestExecutionReportingModule {}
