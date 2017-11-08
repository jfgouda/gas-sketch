import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";
import { ShapeCoordinate } from "app/modules/sketch/data-models/shape-coordinate.model";

export class MainServiceLine {
  coordinate: LineCoordinate;
  tap: ShapeCoordinate;
  thickness: number;
  measurementLineThickness: number;

  constructor() {
    this.coordinate = new LineCoordinate();
    this.tap = new ShapeCoordinate();
  }
}