import { SketchTemplateService } from './services/sketch-template.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { ShellModule } from 'app/shell/shell.module';
import { AppShellComponent } from 'app/shell/components/shell/app.shell.component';

@NgModule({
  declarations: [],
  imports: [BrowserModule, FormsModule, HttpModule, ShellModule],
  providers: [SketchTemplateService],
  bootstrap: [AppShellComponent]
})
export class AppModule { }