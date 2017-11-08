import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateComponent } from './template.component';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


const routes: Routes = [
  { path: '', component: TemplateComponent },
  { path: 'template', component: TemplateComponent }  
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [TemplateComponent]
})
export class TemplateModule { }