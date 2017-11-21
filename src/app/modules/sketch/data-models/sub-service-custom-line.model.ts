import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";

export class SubServiceCustomLine {
  customCoords: LineCoordinate[];
  customMeasurements: number[];
  customLines: any[];

  constructor() {
    this.customCoords = new Array<LineCoordinate>();
    this.customMeasurements = new Array<any>();
    this.customLines = new Array<any>();
  }
}