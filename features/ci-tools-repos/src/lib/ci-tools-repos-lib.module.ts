import {ModuleWithProviders, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProjectService} from './service/project.service';

@NgModule({
  imports: [CommonModule],
})
export class CiToolsReposLibModule {
  static forFeature(): ModuleWithProviders<CiToolsReposLibModule> {
    return {
      ngModule: CiToolsReposLibModule,
      providers:[
        ProjectService
      ]
    }
  }
}
