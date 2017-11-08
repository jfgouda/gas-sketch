import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { TemplateComponent } from 'app/modules/template/template.component';

const routes: Routes = [
  { path: '', redirectTo: '/template', pathMatch: 'full' },
  { path: 'template', component: TemplateComponent },
  { path: 'sketch', loadChildren: 'app/modules/sketch/sketch.module#SketchModule' },
  { path: '**', redirectTo: '/template' },
];

@NgModule({
  // All lazy loaded modules will be downloaded when app finish bootstrapping. 
  // To load modules on demand, remove PreloadAllModules or implement custom preloadingStrategy
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })], //useHash: true
  exports: [RouterModule],
})
export class AppRoutingModule { }