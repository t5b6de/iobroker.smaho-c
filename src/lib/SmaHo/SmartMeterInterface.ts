import { ObisMeasurement } from "smartmeter-obis/lib/ObisMeasurement";
import SmlBuffer from "../Sml/SmlBuffer";
import SmlList from "../Sml/SmlList";
import SmartMeterDataPacket from "./Packets/SmartMeterDataPacket";

interface Dictionary<ObisMeasurement> {
    [key: string]: ObisMeasurement;
}

class SmartMeterInterface {
    private _DataLen: number;
    private _CurChunk: number;
    private _CurTransmission: number;
    private _Buffer: Buffer;
    private _CurPos: number;
    private _StoreCb: CallableFunction;

    private reset(): void {
        this._DataLen = 0;
        this._CurChunk = -1;
        this._CurTransmission = -1;
        this._Buffer = null;
        this._CurPos = 0;
    }

    constructor(storeFunc: CallableFunction) {
        this.reset();
        this._StoreCb = storeFunc;
    }

    public addPacket(dp: SmartMeterDataPacket): void {
        if (dp.getChunkIndex() == 0) {
            this._CurTransmission = dp.getTransmissionId();
            this._DataLen = dp.getTransmissionSize();
            this._Buffer = Buffer.alloc(this._DataLen);
        } else {
            // Sanity Check:
            if (this._CurTransmission != dp.getTransmissionId() || this._CurChunk != dp.getChunkIndex() - 1) {
                this.reset();
            }

            if (this._DataLen > 0) {
                const buf: Buffer = dp.getData();
                buf.copy(this._Buffer, this._CurPos, 0, buf.length);
                this._CurPos += buf.length;
                this._CurChunk++;
            }

            if (this._CurPos >= this._DataLen) {
                this._StoreCb(this.readList());
            }
        }
    }

    private readList(): Dictionary<ObisMeasurement> {
        try {
            const buff = new SmlBuffer(this._Buffer);
            const list = SmlList.parse(buff);

            const result: Dictionary<ObisMeasurement> = {};
            for (let i = 0; i < list.getLength(); i++) {
                const entry = list.getListEntryAt(i);
                try {
                    const obis = new ObisMeasurement(entry.getObjName());
                    let value = entry.getValue();
                    const unit = entry.getUnit();
                    if (typeof value === "number" && entry.getScaler()) {
                        value *= Math.pow(10, entry.getScaler());
                    }
                    obis.addValue(value, unit);
                    result[obis.idToString()] = obis;
                } catch (err) {}
            }
            return result;
        } catch (err) {}

        return undefined;
    }
}

export = SmartMeterInterface;
