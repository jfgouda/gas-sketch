import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";

export class SubServiceCustomLine {
  customCoords: LineCoordinate[];
  customLines: any[];

  constructor() {
    this.customCoords = new Array<LineCoordinate>();
    this.customLines = new Array<any>();
  }
}