import { Router } from '@angular/router';
import { SketchTemplateService } from '../../services/sketch-template.service';
import { selector } from 'rxjs/operator/publish';
import { Component, OnInit } from '@angular/core';
import { UserInput } from '../sketch/data-models/user-input.model';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.css']
})
export class TemplateComponent implements OnInit {
  public userInput = new UserInput();
  public streetTemplatesOptions: any = [
    {
      id: 1, val: "Street Right (1)-SR", meterLocations: [
        { id: 5, val: "Standard Right (5)-SR" }
      ]
    },
    {
      id: 2, val: "Street Left (2)-SL", meterLocations: [
        { id: 4, val: "Standard Left (4)-SL" }
      ]
    },
    {
      id: 3, val: "Street Front (3)-SF", meterLocations: [
        { id: 1, val: "Front (1)-F" },
        { id: 4, val: "Standard Left (4)-SL" },
        { id: 5, val: "Standard Right (5)-SR" }
      ]
    }
  ];
  public meterLocationOptions: any = [];

  constructor(private sketchTemplateService: SketchTemplateService, private router: Router) {
    if (this.sketchTemplateService.getSketchTemplateUserInput() === null) { // Check if userInput loaded before to avoid initial valus and maintain the state
      this.mockUserInput();
    } else {
      this.userInput = this.sketchTemplateService.getSketchTemplateUserInput();
    }

    this.processMeterLocation(this.userInput.params.streetTemplate, this.userInput.site.preferredLocation);
  }

  public ngOnInit() { }

  public generateSketch() {
    this.fixFieldCompatibility();
    this.sketchTemplateService.setSketchTemplateUserInput(this.userInput);
    this.router.navigate(['sketch']);
  }

  public onStreetTemplateChange(index: any) {
    this.processMeterLocation(this.userInput.params.streetTemplate, this.userInput.site.preferredLocation);
    this.userInput.params.meterLocation = this.meterLocationOptions[0].id;
  }

  public onPreferredLocationChange(target: any) {
    this.processMeterLocation(this.userInput.params.streetTemplate, this.userInput.site.preferredLocation);
    this.userInput.params.meterLocation = this.meterLocationOptions[0].id;
  }

  public processMeterLocation(streetTemplate: number, isPreferredLocation: boolean) {
    switch (streetTemplate) {
      case (1): // Right
        this.streetTemplatesOptions[0].meterLocations = [{ id: 5, val: "Standard Right (5)-SR" }];

        if (isPreferredLocation)
          this.streetTemplatesOptions[0].meterLocations.push({ id: 6, val: "Custom (6)-CU" });

        this.meterLocationOptions = this.streetTemplatesOptions[0].meterLocations;
        break;
      case (2): // Left      
        this.streetTemplatesOptions[1].meterLocations = [{ id: 4, val: "Standard Left (4)-SL" }];

        if (isPreferredLocation)
          this.streetTemplatesOptions[1].meterLocations.push({ id: 6, val: "Custom (6)-CU" });

        this.meterLocationOptions = this.streetTemplatesOptions[1].meterLocations;
        break;
      case (3): // Front
        this.streetTemplatesOptions[2].meterLocations = [];

        if (isPreferredLocation) {
          this.streetTemplatesOptions[2].meterLocations.push({ id: 2, val: "Preferred Left (2)-PL" });
          this.streetTemplatesOptions[2].meterLocations.push({ id: 3, val: "Preferred Right (3)-PR" });
        } else {
          this.streetTemplatesOptions[2].meterLocations.push({ id: 4, val: "Standard Left (4)-SL" });
          this.streetTemplatesOptions[2].meterLocations.push({ id: 5, val: "Standard Right (5)-SR" });          
        }

        this.streetTemplatesOptions[2].meterLocations.push({ id: 1, val: "Front (1)-F" });        

        if (isPreferredLocation) {
          this.streetTemplatesOptions[2].meterLocations.push({ id: 6, val: "Custom (6)-CU" });          
        }

        this.meterLocationOptions = this.streetTemplatesOptions[2].meterLocations;
        break;
    }
  }

  private fixFieldCompatibility() {
    // This is a temporary fix to merge (Tap Location) & (Main Location) into one DDL named (Tap Location)
    // The code should be reworked to reflect the merge.
    const ml = this.userInput.params.tapLocationMerged;
    this.userInput.params.mainLocation = (ml === 1 || ml === 2) ? 1 : 2;
    this.userInput.params.tapLocation = (ml === 1 || ml === 3) ? 1 : 2;
  }

  private mockUserInput() {
    this.userInput.customer.bcaNumber = '1709-005-14407';
    this.userInput.customer.requestDate = '2018-01-01';
    this.userInput.customer.accountExecutive = 'John Cody';
    this.userInput.customer.customerName = 'John Smith';
    this.userInput.customer.contactNumber = '123-456-7890';
    this.userInput.customer.customerEmail = 'name@domain.com';
    this.userInput.customer.streetAddress = '123 JFK Blvd';
    this.userInput.customer.county = 'Hunterdon';
    this.userInput.customer.town = 'Carteret';
    this.userInput.customer.zipCode = '30301';

    this.userInput.params.streetTemplate = 3;
    this.userInput.params.buildingTemplate = 3;
    this.userInput.params.tapLocationMerged = 3;
    this.userInput.params.meterLocation = 4;
    this.userInput.params.controlPoints = 2;

    this.userInput.site.mainExtensionRequired = false;
    this.userInput.site.mainExtensionLength = 100;
    this.userInput.site.nearestStreetName = 'Main Street';
    this.userInput.site.preferredLocation = false;
    this.userInput.site.standardMeterSetback = 5;
    this.userInput.site.preferredMeterSetback = 10;
    this.userInput.site.houseToCurb = 100;
    this.userInput.site.streetWidth = 36;
    this.userInput.site.distanceToNearesrStreet = 285;

    this.userInput.main.mainStreetWidth = 38;
    this.userInput.main.mainType = 'Plastic';
    this.userInput.main.mainSize = '4';
    this.userInput.main.mainSystemNOP = 'LP';
    this.userInput.main.mainToCurb = 2;

    this.userInput.sideMain.sideStreetWidth = 36;
    this.userInput.sideMain.sideMainType = 'Plastic';
    this.userInput.sideMain.sideMainSize = '4';
    this.userInput.sideMain.sideSystemNOP = 'LP';
    this.userInput.sideMain.sideMainToCurb = 2;
  }
}
