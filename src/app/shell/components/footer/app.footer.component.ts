import { Component, OnInit } from '@angular/core';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './app.footer.component.html',
  styleUrls: ['./app.footer.component.css']
})
export class AppFooterComponent implements OnInit {
  public appVersion
  constructor() {
    this.appVersion = environment.version;
    console.log('%c   © 2017 Southern Company.     ', 'background: #eb1c24; color: white; font-size: 15px;');
    console.log('%c   NGR Sketch: ' + this.appVersion + '   ', 'background: #00bef6; color: black; font-size: 15px;');
  }
  ngOnInit() { }
}
