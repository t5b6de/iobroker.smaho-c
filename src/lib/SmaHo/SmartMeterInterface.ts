import SmartmeterObis from "smartmeter-obis/index";
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
    private _Logger: ioBroker.Logger;

    private reset(): void {
        this._DataLen = 0;
        this._CurChunk = -1;
        this._CurTransmission = -1;
        this._Buffer = null;
        this._CurPos = 0;
    }

    constructor(storeFunc: CallableFunction, logger: ioBroker.Logger) {
        this.reset();
        this._StoreCb = storeFunc;
        this._Logger = logger;
    }

    public addPacket(dp: SmartMeterDataPacket): void {
        if (dp.getChunkIndex() == 0) {
            this._DataLen = dp.getTransmissionSize();
            this._CurChunk = 0;
            if (this._DataLen <= 0) {
                return;
            }

            this._CurTransmission = dp.getTransmissionId();
            this._Buffer = Buffer.alloc(this._DataLen);
        } else {
            // Sanity Check:
            if (
                this._DataLen <= 0 ||
                this._CurTransmission != dp.getTransmissionId() ||
                this._CurChunk != dp.getChunkIndex() - 1
            ) {
                this.reset();
                return;
            }

            if (this._DataLen > 0) {
                const buf: Buffer = dp.getData();

                buf.copy(this._Buffer, this._CurPos, 4, dp.getSize() + 4);
                this._CurPos += dp.getSize();
                this._CurChunk++;

                if (this._CurPos >= this._DataLen) {
                    this._StoreCb(this.readList());
                    this.reset();
                }
            }
        }
    }

    private readList(): Dictionary<SmartmeterObis.ObisMeasurement> {
        try {
            const buff = new SmlBuffer(this._Buffer);
            this._Logger.debug(this._Buffer.toString("hex"));
            const list = SmlList.parse(buff);

            const result: Dictionary<SmartmeterObis.ObisMeasurement> = {};
            for (let i = 0; i < list.getLength(); i++) {
                const entry = list.getListEntryAt(i);
                try {
                    const obis = new SmartmeterObis.ObisMeasurement(entry.getObjName());

                    let value = entry.getValue();
                    const unit = entry.getUnit();
                    if (typeof value === "number" && entry.getScaler()) {
                        value *= Math.pow(10, entry.getScaler());
                    }
                    obis.addValue(value, unit);
                    result[obis.idToString()] = obis;
                } catch (err) {
                    this._Logger.error("Could not parse Value: " + err.toString());
                }
            }
            return result;
        } catch (err) {
            this._Logger.error("Could not decode List: " + err.toString());
        }

        return undefined;
    }
}

export = SmartMeterInterface;
