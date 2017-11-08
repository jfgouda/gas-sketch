import { ShapeCoordinate } from "app/modules/sketch/data-models/shape-coordinate.model";

export class Buildings {
  main: ShapeCoordinate;
  garage: ShapeCoordinate;

  constructor() {
    this.main = new ShapeCoordinate();
    this.garage = new ShapeCoordinate();
  }
}