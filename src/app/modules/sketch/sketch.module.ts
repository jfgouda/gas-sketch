import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SketchComponent } from './sketch.component';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: SketchComponent },
  { path: 'sketch', component: SketchComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SketchComponent]
})
export class SketchModule { }
