import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { RepositoryService } from "@mxflow/features/repository";
import { map, Observable } from "rxjs";
import { OptionField } from "../option-field/option-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { AsyncPipe } from "@angular/common";
import { Select } from "primeng/select";

@Component({
  selector: "mxevolve-business-process-repository-selector",
  templateUrl: "business-process-repository-selector.component.html",
  imports: [ReactiveFormsModule, AsyncPipe, Select],
  providers: [RepositoryService],
})
export class BusinessProcessRepositorySelectorComponent implements OnInit {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryIdFormControl: FormControl;
  @Input({ required: true }) repositoryIdFormControlName: string;
  @Output() repositoryChanged = new EventEmitter<void>();

  private readonly repositoryService: RepositoryService =
    inject(RepositoryService);

  options$: Observable<OptionField[]>;

  ngOnInit(): void {
    this.options$ = this.repositoryService
      .getTestRepositories(this.projectId)
      .pipe(
        map((repos) => {
          return repos.map((r) => {
            return { name: r.url, value: r.id } as OptionField;
          });
        })
      );
  }
}
