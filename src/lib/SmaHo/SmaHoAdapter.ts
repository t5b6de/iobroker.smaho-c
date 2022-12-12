import * as utils from "@iobroker/adapter-core";

import SmartmeterObis, { ObisLanguage, ObisMeasurement } from "smartmeter-obis";
import ConfType from "./Packets/Config/ConfType";
import NameType from "./Packets/Config/NameType";
import InfoResponsePacket from "./Packets/InfoResponsePacket";
import MotionDetectorMode from "./Packets/MotionDetectorMode";
import StateResponsePacket from "./Packets/StateResponsePacket";
import SmaHo from "./SmaHo";
import SmaHoFbConfig from "./SmaHoFbConfig";

interface Dictionary<ObisMeasurement> {
    [key: string]: ObisMeasurement;
}

class SmaHoAdapter {
    private _Adp: utils.AdapterInstance;
    private _Controller: SmaHo;
    private _Conf: SmaHoFbConfig;
    private _SmValues: Dictionary<ObisMeasurement>;

    constructor(adapter: utils.AdapterInstance) {
        this._Adp = adapter;

        this._Adp.log.info(
            "Using Serialport " + this._Adp.config.serialport + " with " + this._Adp.config.baudrate + "bd",
        );

        const me = this;

        this._Adp.log.info("Creating Instance of SmaHo...");
        this._Controller = new SmaHo(this._Adp.config.serialport, this._Adp.config.baudrate, this._Adp.log, function (
            vals: Dictionary<ObisMeasurement>,
        ) {
            me.onSmlArrived(vals);
        });
        this._Conf = new SmaHoFbConfig(this._Controller, this);
        this._SmValues = {};
    }

    public getAdapterInstance(): utils.AdapterInstance {
        return this._Adp;
    }

    public async Start(): Promise<void> {
        const me = this;
        this._Controller.setInputChangedHandler((a: number, b: boolean) => {
            me.setInState(a, b);
        });

        this._Controller.setOutputChangedHandler((a: number, b: boolean) => {
            me.setOutState(a, b, true);
        });

        this._Controller.setMdsChangedHandler((a: number, b: MotionDetectorMode) => {
            me.setMdsState(a, b, true);
        });

        this._Controller.setInfoReceivedHandler((p: InfoResponsePacket) => {
            this._Adp.log.info("information received.");
            me.updateControllerStatus(p);
        });

        this._Controller.setStateReceivedHandler((p: StateResponsePacket) => {
            me.initiatePorts(p);
        });

        this._Controller.setResetHandler(() => {
            me._Adp.log.warn("SmaHo Controller Board RESET OCCURED!");
            this.setSmartMode();
        });

        await this.initBaseObjects();

        this._Adp.log.info("SmaHo-C adapter initialized. Requesting device informations...");
        this._Controller.requestInfo();

        this.setSmartMode();
        this._Adp.subscribeStates("out.*");
        this._Adp.subscribeStates("in.*");
        this._Adp.subscribeStates("mds.*");
        this._Adp.subscribeStates("conf.*");
        this._Adp.subscribeStates("trigger");
    }

    private setSmartMode(): void {
        this._Adp.log.info((this._Adp.config.smartmode ? "en" : "dis") + "abling smart mode...");
        this._Controller.SetSmartMode(this._Adp.config.smartmode);
    }

    private async initiatePorts(p: StateResponsePacket): Promise<void> {
        const from = p.getPortRange();
        const to = from + 7;
        await this.addPortObjects(from, to, !p.isAvailable()); // TODO: request input/output Names if not exist.

        this._Adp.setStateChangedAsync(this.getStatusId(p.getExpanderIndex(), "avail"), {
            val: p.isAvailable() === true,
            ack: true,
        });
        this._Adp.setStateChangedAsync(this.getStatusId(p.getExpanderIndex(), "failed"), {
            val: p.isFailed() === true,
            ack: true,
        });

        if (p.isAvailable()) {
            const outStates = p.getOutStates();
            const inStates = p.getInStates();

            for (let i = 0; i < 8; i++) {
                this.setInState(from + i, inStates[i]);
                this.setOutState(from + i, outStates[i], true);
            }
        }
    }

    private async initBaseObjects(): Promise<void> {
        await this._Adp.setObjectNotExistsAsync("in", {
            type: "channel",
            common: {
                name: "inputs",
                role: "",
            },
            native: {},
        });

        await this._Adp.setObjectNotExistsAsync("out", {
            type: "channel",
            common: {
                name: "outputs",
                role: "",
            },
            native: {},
        });

        await this._Adp.setObjectNotExistsAsync("mds", {
            type: "channel",
            common: {
                name: "motion detectors",
                role: "",
            },
            native: {},
        });

        await this._Adp.setObjectNotExistsAsync(this.getStatusId(-1, null), {
            type: "channel",
            common: {
                name: "controller information",
                role: "",
            },
            native: {},
        });

        await this._Adp.setObjectNotExistsAsync(this.getStatusId(-1, "version"), {
            type: "state",
            common: {
                name: "Version string",
                type: "string",
                role: "info",
                read: true,
                write: false,
            },
            native: {},
        });

        await this._Adp.setObjectNotExistsAsync("trigger", {
            type: "state",
            common: {
                name: "triggerinput",
                type: "string",
                role: "string",
                read: false,
                write: true,
            },
            native: {},
        });
    }

    private async addPortObjects(from: number, to: number, del: boolean): Promise<void> {
        for (let i = from; i <= to; i++) {
            const inId = this.getIoId(i, ConfType.Input);
            const outId = this.getIoId(i, ConfType.Output);

            if (del) {
                let obj = await this._Adp.getObjectAsync(inId);

                if (obj != null) {
                    this._Adp.log.info("deleting: " + inId);
                    await this._Adp.delObjectAsync(inId);
                }

                obj = await this._Adp.getObjectAsync(outId);

                if (obj != null) {
                    this._Adp.log.info("deleting: " + outId);
                    await this._Adp.delObjectAsync(outId);
                }
                // TODO Delete Conf-Objects!
            } else {
                let tmp = this.getName(i, NameType.Input, "");

                await this._Adp.setObjectNotExistsAsync(inId, {
                    type: "state",
                    common: {
                        name: tmp,
                        type: "boolean",
                        role: "switch",
                        read: true,
                        write: false,
                    },
                    native: {},
                });

                tmp = this.getName(i, NameType.Output, "");

                await this._Adp.setObjectNotExistsAsync(outId, {
                    type: "state",
                    common: {
                        name: tmp,
                        type: "boolean",
                        role: "switch",
                        read: true,
                        write: true,
                    },
                    native: {},
                });

                // add Conf Objects:
                this._Conf.addInOutConfObject(i);
            }
        }
    }

    public async updatePortName(index: number, nameType: NameType, name: string): Promise<void> {
        let id;

        switch (nameType) {
            case NameType.Input:
                id = this.getIoId(index, ConfType.Input);
                break;
            case NameType.Output:
                id = this.getIoId(index, ConfType.Output);
                break;
            case NameType.MotionDetection:
                id = this.getIoId(index, ConfType.MotionSensor);
                break;
            default:
                return;
        }

        const res = this.getName(index, nameType, name);

        await this._Adp.extendObjectAsync(id, {
            common: {
                name: res,
            },
        });
    }

    public getName(index: number, nameType: NameType, name: string): string {
        let pfx;
        let def;

        switch (nameType) {
            case NameType.Input:
                pfx = "I.";
                def = "input ";
                break;
            case NameType.Output:
                pfx = "O.";
                def = "output ";
                break;
            case NameType.MotionDetection:
                pfx = "M.";
                def = "motion detection sensor ";
                break;
            default:
                return;
        }

        pfx += index + " - ";
        def += index;

        return pfx + (name.length > 0 ? name : def);
    }

    private setInState(port: number, state: boolean): void {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType.Input), { val: state === true, ack: true });
    }

    private setOutState(port: number, state: boolean, ack: boolean): void {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType.Output), { val: state === true, ack: ack });
    }

    private setMdsState(port: number, state: MotionDetectorMode, ack: boolean): void {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType.MotionSensor), { val: state, ack: ack });
    }

    private getIoId(index: number, type: ConfType): string {
        const num = index.toString();

        switch (type) {
            case ConfType.Input:
                return "in.p_" + num.padStart(3, "0");
            case ConfType.Output:
                return "out.p_" + num.padStart(3, "0");
            case ConfType.MotionSensor:
                return "mds.m_" + num.padStart(2, "0");
            default:
                return null;
        }
    }

    private getStatusId(expander: number, prop: string): string {
        let str = "status";

        if (expander >= 0) {
            const num = expander.toString().padStart(2, "0");
            str += ".exp_" + num;
            if (prop != null) {
                str += "." + prop;
            }
        } else if (prop != null) {
            str += "." + prop;
        }

        return str;
    }

    private getPortNum(portId: string): number {
        return parseInt(portId.substr(2));
    }

    private async updateControllerStatus(p: InfoResponsePacket): Promise<void> {
        this._Adp.setStateChangedAsync(this.getStatusId(-1, "version"), { val: p.getVersionString(), ack: true });

        for (let i = 0; i < 32; i++) {
            await this._Adp.setObjectNotExistsAsync(this.getStatusId(i, null), {
                type: "channel",
                common: {
                    name: "GPIO Expander " + i + " status",
                    role: "info",
                },
                native: {},
            });

            await this._Adp.setObjectNotExistsAsync(this.getStatusId(i, "avail"), {
                type: "state",
                common: {
                    name: "GPIO Expander " + i + " available",
                    role: "info",
                    type: "boolean",
                    read: true,
                    write: false,
                },
                native: {},
            });

            await this._Adp.setObjectNotExistsAsync(this.getStatusId(i, "failed"), {
                type: "state",
                common: {
                    name: "GPIO Expander " + i + " failed",
                    role: "info",
                    type: "boolean",
                    read: true,
                    write: false,
                },
                native: {},
            });
        }

        for (let i = 0; i < 16; i++) {
            await this._Adp.setObjectNotExistsAsync(this.getIoId(i, ConfType.MotionSensor), {
                type: "state",
                common: {
                    name: this.getName(i, NameType.MotionDetection, ""),
                    role: "info",
                    type: "number",
                    read: true,
                    write: true,
                },
                native: {},
            });
        }

        this._Controller.requestState();
        this._Adp.log.info("Requesting expander states...");
    }

    private getStateTypeByType(type: string): ioBroker.CommonType {
        switch (type) {
            case "string":
                return "string";
            case "number":
            case "bigint":
                return "number";
            case "boolean":
                return "boolean";
            case "symbol":
            case "undefined":
                return "mixed";
            case "object":
                return "object";
        }
    }

    public async onSmlArrived(obisResult: Dictionary<ObisMeasurement>): Promise<void> {
        if (obisResult == null || obisResult == undefined) {
            this._Adp.log.warn("Could not set Values: Empty");
            return;
        }

        await this._Adp.setObjectNotExistsAsync("meter", {
            type: "channel",
            common: {
                name: "Smart Meter values",
                role: "info",
            },
            native: {},
        });

        const obisLang: ObisLanguage = "de";
        let updateCount = 0;
        try {
            for (const obisId in obisResult) {
                if (!obisResult.hasOwnProperty(obisId)) continue;

                this._Adp.log.debug(
                    obisResult[obisId].idToString() +
                        ": " +
                        SmartmeterObis.ObisNames.resolveObisName(
                            obisResult[obisId],
                            obisLang /*this._Adp.config.obisNameLanguage*/,
                        ).obisName +
                        " = " +
                        obisResult[obisId].valueToString(),
                );
                let i;
                // todo: meter durchnummerieren, problematisch bei mehreren metern.
                const rawChannelId = obisResult[obisId].idToString();
                let ioChannelId = rawChannelId.replace(/[\]\[*,;'"`<>\\?]/g, "__");
                ioChannelId = "meter." + ioChannelId.replace(/\./g, "_");
                if (!this._SmValues[obisId]) {
                    const ioChannelName = SmartmeterObis.ObisNames.resolveObisName(
                        obisResult[obisId],
                        obisLang,
                    ).obisName;
                    this._Adp.log.debug("Create Channel " + ioChannelId + " with name " + ioChannelName);
                    try {
                        await this._Adp.setObjectNotExistsAsync(ioChannelId, {
                            type: "channel",
                            common: {
                                name: ioChannelName,
                            },
                            native: {},
                        });
                    } catch (err) {
                        this._Adp.log.error("Error creating Channel: " + err);
                    }

                    if (obisResult[obisId].getRawValue() !== undefined) {
                        this._Adp.log.debug("Create State " + ioChannelId + ".rawvalue");
                        try {
                            await this._Adp.setObjectNotExistsAsync(ioChannelId + ".rawvalue", {
                                type: "state",
                                common: {
                                    name: rawChannelId, //ioChannelId + ".rawvalue",
                                    type: "string",
                                    read: true,
                                    role: "value",
                                    write: false,
                                },
                                native: {
                                    id: ioChannelId + ".rawvalue",
                                },
                            });
                        } catch (err) {
                            this._Adp.log.error("Error creating State: " + err);
                        }
                    }

                    this._Adp.log.debug("Create State " + ioChannelId + ".value");
                    try {
                        await this._Adp.setObjectNotExistsAsync(ioChannelId + ".value", {
                            type: "state",
                            common: {
                                name: rawChannelId, //ioChannelId + ".value",
                                type: this.getStateTypeByType(typeof obisResult[obisId].getValue(0).value),
                                read: true,
                                unit: obisResult[obisId].getValue(0).unit,
                                role: "value",
                                write: false,
                            },
                            native: {
                                id: ioChannelId + ".value",
                            },
                        });
                    } catch (err) {
                        this._Adp.log.error("Error creating State: " + err);
                    }

                    if (obisResult[obisId].getValueLength() > 1) {
                        for (i = 1; i < obisResult[obisId].getValueLength(); i++) {
                            this._Adp.log.debug("Create State " + ioChannelId + ".value" + (i + 1));
                            try {
                                await this._Adp.setObjectNotExistsAsync(ioChannelId + ".value" + (i + 1), {
                                    type: "state",
                                    common: {
                                        name: rawChannelId + " (" + (i + 1) + ")", //ioChannelId + ".value" + (i + 1),
                                        type: this.getStateTypeByType(typeof obisResult[obisId].getValue(i).value),
                                        read: true,
                                        unit: obisResult[obisId].getValue(i).unit,
                                        role: "value",
                                        write: false,
                                    },
                                    native: {
                                        id: ioChannelId + ".value" + (i + 1),
                                    },
                                });
                            } catch (err) {
                                this._Adp.log.error("Error creating State: " + err);
                            }
                        }
                    }
                }
                if (
                    !this._SmValues[obisId] ||
                    this._SmValues[obisId].valueToString() !== obisResult[obisId].valueToString()
                ) {
                    if (obisResult[obisId].getRawValue() !== undefined) {
                        this._Adp.log.debug(
                            "Set State " + ioChannelId + ".rawvalue = " + obisResult[obisId].getRawValue(),
                        );
                        await this._Adp.setStateAsync(ioChannelId + ".rawvalue", {
                            ack: true,
                            val: obisResult[obisId].getRawValue(),
                        });
                    }

                    this._Adp.log.debug(
                        "Set State " + ioChannelId + ".value = " + obisResult[obisId].getValue(0).value,
                    );
                    await this._Adp.setStateAsync(ioChannelId + ".value", {
                        ack: true,
                        val: obisResult[obisId].getValue(0).value,
                    });

                    if (obisResult[obisId].getValueLength() > 1) {
                        for (i = 1; i < obisResult[obisId].getValueLength(); i++) {
                            this._Adp.log.debug(
                                "Set State " +
                                    ioChannelId +
                                    ".value" +
                                    (i + 1) +
                                    " = " +
                                    obisResult[obisId].getValue(i).value,
                            );
                            await this._Adp.setStateAsync(ioChannelId + ".value" + (i + 1), {
                                ack: true,
                                val: obisResult[obisId].getValue(i).value,
                            });
                        }
                    }
                    this._SmValues[obisId] = obisResult[obisId];
                    updateCount++;
                } else {
                    this._Adp.log.debug("Data for " + ioChannelId + " unchanged");
                }
            }
        } catch (err) {
            this._Adp.log.error("Could not set Values: " + err.toString());
        }

        this._Adp.log.debug("Received " + Object.keys(obisResult).length + " values, " + updateCount + " updated");
    }

    private logPortChange(
        p: number,
        ct: ConfType,
        val: ioBroker.StateValue,
        triggered: boolean,
        handled: boolean,
    ): void {
        let str; // = triggered ? "Trigger: " : "Change: ";
        let pName = this._Conf.getName(p, ct);

        if (handled) {
            if (triggered) {
                str = "ignore: "; // should not happen, this will not be covered by this module.
            } else {
                str = "notify: ";
            }
        } else {
            if (triggered) {
                str = "trigger: ";
            } else {
                str = "set: ";
            }
        }

        const mdsModeStr = ["auto", "output on", "output off"];

        if (pName != "" && pName != undefined) {
            pName = " (" + pName + ")";
        }

        let vStr;
        const pStr = p.toString();
        switch (ct) {
            case ConfType.Input:
                vStr = (val as boolean) ? "closed" : "open";
                //pStr = pStr.padStart(3, "0");
                str += `I.${pStr}${pName}: ${vStr}`;
                break;
            case ConfType.Output:
                vStr = (val as boolean) ? "on" : "off";
                //pStr = pStr.padStart(3, "0");
                str += `O.${pStr}${pName}: ${vStr}`;
                break;
            case ConfType.MotionSensor:
                vStr = mdsModeStr[val as number];
                //pStr = pStr.padStart(2, "0");
                str += `M.${pStr}${pName}: ${vStr}`;
                break;
        }

        this._Adp.log.info(str);
    }

    public onStateChange(id: string, state: ioBroker.State): void {
        const parts = id.split(".");
        // (4) ["smaho-c", "0", "out", "p_000"]

        let handled = state.ack;

        if (parts.length == 4) {
            const dir = parts[2];
            const p = parts[3];
            const num = this.getPortNum(p);

            if (!isNaN(num)) {
                let ct;
                switch (dir) {
                    case "in":
                        // TODO: simulate button press
                        // DONE: See Input trigger below
                        ct = ConfType.Input;
                        break;
                    case "out":
                        ct = ConfType.Output;
                        if (!handled) this._Controller.setOutput(num, state.val as boolean);
                        handled = true;
                        break;
                    case "mds":
                        ct = ConfType.MotionSensor;
                        if (!handled) this._Controller.setMdsMode(num, state.val as MotionDetectorMode);
                        handled = true;
                        break;
                }

                this.logPortChange(num, ct, state.val, false, state.ack);
            }
        } else if (parts[2] == "conf") {
            if (!state.ack) this._Conf.onStateChange(id, state);
            handled = true;
        } else if (parts[2] == "trigger") {
            if (!handled) {
                const trg = state.val.toString().split(",");

                if (trg.length == 2 || trg.length == 3) {
                    const inp = parseInt(trg[0]);
                    const stateVal = parseInt(trg[1]);
                    let time = 0;

                    if (trg.length == 3) {
                        time = parseInt(trg[2]);
                    }

                    if (inp < 0 || inp > 255 || stateVal < 0 || stateVal > 1 || time < 0 || time > 5000) {
                        this._Adp.log.warn("not able to handle trigger, input or state out of range");
                    } else {
                        const me = this;
                        let st = stateVal != 0;
                        me._Controller.TriggerInput(inp, st);
                        this.logPortChange(inp, ConfType.Input, st, true, state.ack);
                        handled = true;

                        if (time > 0) {
                            setTimeout(() => {
                                st = stateVal == 0;
                                me._Controller.TriggerInput(inp, st);
                                this.logPortChange(inp, ConfType.Input, st, true, state.ack);
                            }, time);
                        }
                    }
                } else {
                    this._Adp.log.warn("not able to handle trigger, invalid syntax. (0-255),(0-1)[,(0-5000)]");
                }
                this._Adp.setStateChangedAsync("trigger", { val: "", ack: true });
            }
        }

        if (!handled) this._Adp.log.warn(`not able to handle state ${id}`);
    }

    public onUnload(): void {
        this._Controller.onUnload();
    }
}

export = SmaHoAdapter;
