import SmaHoPacketizer from "../../SmaHoPacketizer";
import MotionDetectorMode from "../MotionDetectorMode";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class MotionSensorChangedPacket extends PacketBase {
    private _MdsId: number;
    private _MdsState: MotionDetectorMode;
    private _CbMdsChange: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbInputChange: CallableFunction) {
        super(PacketType.MotionDetectionModeChange, 3, packetizer);

        this._CbMdsChange = cbInputChange;

        this._Cb = this.cbFun;
        this._MdsId = -1;
        this._MdsState = MotionDetectorMode.Unconfigured;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbMdsChange(this._MdsId, this._MdsState);
    }

    parsePacket(): boolean {
        const mdsId = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const mdsState = this._Packetizer.getByte(2);

        if (mdsId >= 16) {
            console.log("SmaHo Packet Error, invalid Motion Detector ID");
            return false;
        }
        // if (Object.values(Vehicle).includes('car')) {
        if (!Object.values(MotionDetectorMode).includes(mdsState)) {
            console.log("SmaHo Packet Error, invalid Motion Detector Value");
            return false;
        }

        this._MdsId = mdsId;
        this._MdsState = mdsState;

        // no further needed.
        return true;
    }
}

export = MotionSensorChangedPacket;
