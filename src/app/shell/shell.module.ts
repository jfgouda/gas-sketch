import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from 'app/shell/shell.routing';

// Load Shell module and components also the eagerly loaded module TemplateModule
import { AppShellComponent } from 'app/shell/components/shell/app.shell.component';
import { AppHeaderComponent } from 'app/shell/components/header/app.header.component';
import { AppFooterComponent } from 'app/shell/components/footer/app.footer.component';
import { AppNavigationComponent } from 'app/shell/components/navigation/app.navigation.component';
import { TemplateModule } from 'app/modules/template/template.module';

import { throwIfAlreadyLoaded } from 'app/shell/shell-import-guard';

@NgModule({
  imports: [CommonModule, AppRoutingModule, TemplateModule],
  declarations: [AppShellComponent, AppNavigationComponent, AppHeaderComponent, AppFooterComponent],
  exports: [AppShellComponent]
})
export class ShellModule {
  constructor( @Optional() @SkipSelf() parentModule: ShellModule) {
    throwIfAlreadyLoaded(parentModule, 'ShellModule');
  }
}