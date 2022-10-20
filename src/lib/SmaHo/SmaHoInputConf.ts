import InputType from "./Packets/Config/InputType";
import SmaHoConf from "./SmaHoConf";

class SmaHoInputConf extends SmaHoConf {
    public InputType: InputType;
    public OutGroup: number;

    constructor() {
        super();
        this.InputType = InputType.Unconfigured;
        this.OutGroup = -1;
    }

    public isMotionDetectonSensor(): boolean {
        return (
            this.InputType == InputType.MotionDetectionModeButton || this.InputType == InputType.MotionDetectionSignal
        );
    }
}

export = SmaHoInputConf;
