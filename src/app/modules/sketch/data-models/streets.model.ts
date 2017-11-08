import { ShapeCoordinate } from "app/modules/sketch/data-models/shape-coordinate.model";

export class Streets {
  mainStreet: ShapeCoordinate;
  sideStreet: ShapeCoordinate;
  horizontalWidth: number;
  verticalWidth: number;
  borderThickness: number;

  constructor() {
    this.mainStreet = new ShapeCoordinate();
    this.sideStreet = new ShapeCoordinate();
  }
}