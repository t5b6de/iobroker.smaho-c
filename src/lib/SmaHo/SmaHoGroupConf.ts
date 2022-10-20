import SmaHoConf from "./SmaHoConf";

class SmaHoGroupConf extends SmaHoConf {
    public Outputs: Array<number>;
    public OnTime: number;
    public OffTime: number;

    constructor() {
        super();
        this.Outputs = [];
        this.OnTime = 0;
        this.OffTime = 0;
    }
}

export = SmaHoGroupConf;
