import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";
import { SubServiceCustomLine } from "app/modules/sketch/data-models/sub-service-custom-line.model";

export class SubServiceLine {
  coordinate: LineCoordinate;
  extension: LineCoordinate;
  customLines: SubServiceCustomLine;
  thickness: number;
  customLineControlRadious: number;
  hasExtension: boolean;

  constructor() {
    this.coordinate = new LineCoordinate();
    this.extension = new LineCoordinate();
    this.customLines = new SubServiceCustomLine();
  }
}