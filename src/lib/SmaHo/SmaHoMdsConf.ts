import MotionDetectorMode from "./Packets/MotionDetectorMode";
import SmaHoConf from "./SmaHoConf";

class SmaHoMdsConf extends SmaHoConf {
    public LedB: number;
    public LedA: number;
    public Output: number;
    public InitalMode: MotionDetectorMode;
    constructor() {
        super();
        this.InitalMode = MotionDetectorMode.Auto;
        this.LedB = 255;
        this.LedA = 255;
        this.Output = 255;
    }
}

export = SmaHoMdsConf;
