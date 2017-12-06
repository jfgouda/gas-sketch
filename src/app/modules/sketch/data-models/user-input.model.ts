export class Customer {
    bcaNumber: string;
    requestDate: string;
    accountExecutive: string;
    customerName: string;
    contactNumber: string;
    customerEmail: string;
    streetAddress: string;
    county: string;
    town: string;
    zipCode: string;
}

export class Params {
    streetTemplate: number;
    buildingTemplate: number;
    meterLocation: number;
    controlPoints: number;
    tapLocation: number;
    mainLocation: number;
    tapLocationMerged: number;
}

export class Site {
    mainExtensionRequired: boolean;
    mainExtensionLength: number;
    nearestStreetName: string;
    preferredLocation: boolean;
    standardMeterSetback: number;    
    preferredMeterSetback: number;
    houseToCurb: number;
    streetWidth: number;
    distanceToNearesrStreet: number;
}

export class Main {
    mainSideWalk: boolean;
    mainSideWalkWidth: number;    
    mainStreetWidth: number;
    mainType: string;
    mainSize: string;
    mainSystemNOP: string;
    mainToCurb: number;
}

export class SideMain {
    sideStreetWidth: number;
    sideMainType: string;
    sideMainSize: string;
    sideSystemNOP: string;
    sideMainToCurb: number;
}

export class UserInput {
    isPopulated: boolean;
    customer: Customer;
    params: Params;
    site: Site;
    main: Main;
    sideMain: SideMain;

    constructor() {
        this.isPopulated = false;
        this.customer = new Customer();
        this.params = new Params();
        this.site = new Site();
        this.main = new Main();
        this.sideMain = new SideMain();
    }
}