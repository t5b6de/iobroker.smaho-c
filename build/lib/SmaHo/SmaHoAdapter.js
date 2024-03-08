"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const smartmeter_obis_1 = __importDefault(require("smartmeter-obis"));
const ConfType_1 = __importDefault(require("./Packets/Config/ConfType"));
const NameType_1 = __importDefault(require("./Packets/Config/NameType"));
const SmaHo_1 = __importDefault(require("./SmaHo"));
const SmaHoFbConfig_1 = __importDefault(require("./SmaHoFbConfig"));
class SmaHoAdapter {
    constructor(adapter) {
        this._Adp = adapter;
        if (this._Adp.config.serialport.startsWith("tcp://")) {
            this._Adp.log.info("Using network adapter " + this._Adp.config.serialport);
        }
        else {
            this._Adp.log.info("Using serialport " + this._Adp.config.serialport + " with " + this._Adp.config.baudrate + "bd");
        }
        const me = this;
        this._Adp.log.info("Creating instance of SmaHo...");
        this._Controller = new SmaHo_1.default(this._Adp.config.serialport, this._Adp.config.baudrate, this._Adp.log, function (vals, meterIdx) {
            me.onSmlArrived(vals, meterIdx);
        }, () => {
            adapter.log.warn("Reconnected, running reinit for safety.");
            me.reInit();
        });
        this._Conf = new SmaHoFbConfig_1.default(this._Controller, this);
        this._SmValues = {};
        this._ExpAvail = [];
        this._ExpFailed = [];
        // Add vals for expander states, states are flag based, max 32 Expanders = 4 bytes.
        for (let i = 0; i < 4; i++) {
            this._ExpAvail[i] = 0;
            this._ExpFailed[i] = 0;
        }
    }
    getAdapterInstance() {
        return this._Adp;
    }
    async Start() {
        const me = this;
        this._Controller.setInputChangedHandler((a, b) => {
            me.setInState(a, b);
        });
        this._Controller.setOutputChangedHandler((a, b) => {
            me.setOutState(a, b, true);
        });
        this._Controller.setMdsChangedHandler((a, b) => {
            me.setMdsState(a, b, true);
        });
        this._Controller.setInfoReceivedHandler((p) => {
            this._Adp.log.info("Information received.");
            me.updateControllerStatus(p);
        });
        this._Controller.setStateReceivedHandler((p) => {
            me.initiatePorts(p);
        });
        this._Controller.setResetHandler(() => {
            me._Adp.log.warn("SmaHo controller board RESET OCCURED!");
            this.setSmartMode();
        });
        await this.initBaseObjects();
        this._Adp.log.info("SmaHo-C adapter initialized. Requesting device informations...");
        this.reInit();
        this._Adp.subscribeStates("out.*");
        this._Adp.subscribeStates("in.*");
        this._Adp.subscribeStates("mds.*");
        this._Adp.subscribeStates("conf.*");
        this._Adp.subscribeStates("trigger");
    }
    reInit() {
        this._Controller.requestInfo();
        this.setSmartMode();
    }
    setSmartMode() {
        this._Adp.log.info((this._Adp.config.smartmode ? "En" : "Dis") + "abling smart mode...");
        this._Controller.SetSmartMode(this._Adp.config.smartmode);
    }
    async setHwStatus() {
        this._Adp.setStateChangedAsync("hw_status", {
            val: JSON.stringify({
                avail: this._ExpAvail,
                failed: this._ExpFailed,
            }),
            ack: true,
        });
    }
    async initiatePorts(p) {
        const from = p.getPortRange();
        const to = from + 7;
        await this.addPortObjects(from, to, !p.isAvailable());
        let expId = p.getExpanderIndex();
        let expIdM = expId & 0x07;
        expId = expId >> 3;
        expIdM = 1 << expIdM;
        if (p.isAvailable() === true) {
            this._ExpAvail[expId] |= expIdM;
        }
        else {
            this._ExpAvail[expId] &= ~expIdM;
        }
        if (p.isFailed() === true) {
            this._ExpFailed[expId] |= expIdM;
        }
        else {
            this._ExpFailed[expId] &= ~expIdM;
        }
        this.setHwStatus();
        if (p.isAvailable()) {
            const outStates = p.getOutStates();
            const inStates = p.getInStates();
            for (let i = 0; i < 8; i++) {
                this.setInState(from + i, inStates[i]);
                this.setOutState(from + i, outStates[i], true);
            }
        }
    }
    async initBaseObjects() {
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
        await this._Adp.setObjectNotExistsAsync("hw_version", {
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
        await this._Adp.setObjectNotExistsAsync("hw_status", {
            type: "state",
            common: {
                name: "Hardware Statusdata",
                type: "json",
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
    async addPortObjects(from, to, del) {
        // if there are e.g. 4 modules there are only 4x8 ports.
        // the other ports can be used to trigger something, most usefule for inputs
        // so we allow to configure to use all ports, instead of only
        // the physical available:
        const useAllPorts = !this._Adp.config.hideNonAvailIo;
        for (let i = from; i <= to; i++) {
            const inId = this.getIoId(i, ConfType_1.default.Input);
            const outId = this.getIoId(i, ConfType_1.default.Output);
            if (del && !useAllPorts) {
                let obj = await this._Adp.getObjectAsync(inId);
                if (obj != null) {
                    this._Adp.log.info("Deleting: " + inId);
                    await this._Adp.delObjectAsync(inId);
                }
                obj = await this._Adp.getObjectAsync(outId);
                if (obj != null) {
                    this._Adp.log.info("Deleting: " + outId);
                    await this._Adp.delObjectAsync(outId);
                }
                // TODO Delete Conf-Objects!
            }
            else {
                let tmp = this.getName(i, NameType_1.default.Input, "");
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
                tmp = this.getName(i, NameType_1.default.Output, "");
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
    async updatePortName(index, nameType, name) {
        let id;
        switch (nameType) {
            case NameType_1.default.Input:
                id = this.getIoId(index, ConfType_1.default.Input);
                break;
            case NameType_1.default.Output:
                id = this.getIoId(index, ConfType_1.default.Output);
                break;
            case NameType_1.default.MotionDetection:
                id = this.getIoId(index, ConfType_1.default.MotionSensor);
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
    getName(index, nameType, name) {
        let pfx;
        let def;
        switch (nameType) {
            case NameType_1.default.Input:
                pfx = "I.";
                def = "input ";
                break;
            case NameType_1.default.Output:
                pfx = "O.";
                def = "output ";
                break;
            case NameType_1.default.MotionDetection:
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
    setInState(port, state) {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType_1.default.Input), { val: state === true, ack: true });
    }
    setOutState(port, state, ack) {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType_1.default.Output), { val: state === true, ack: ack });
    }
    setMdsState(port, state, ack) {
        this._Adp.setStateChangedAsync(this.getIoId(port, ConfType_1.default.MotionSensor), { val: state, ack: ack });
    }
    getIoId(index, type) {
        const num = index.toString();
        switch (type) {
            case ConfType_1.default.Input:
                return "in.p_" + num.padStart(3, "0");
            case ConfType_1.default.Output:
                return "out.p_" + num.padStart(3, "0");
            case ConfType_1.default.MotionSensor:
                return "mds.m_" + num.padStart(2, "0");
            default:
                return null;
        }
    }
    getPortNum(portId) {
        return parseInt(portId.substr(2));
    }
    async updateControllerStatus(p) {
        this._Adp.setStateChangedAsync("hw_version", { val: p.getVersionString(), ack: true });
        for (let i = 0; i < 16; i++) {
            await this._Adp.setObjectNotExistsAsync(this.getIoId(i, ConfType_1.default.MotionSensor), {
                type: "state",
                common: {
                    name: this.getName(i, NameType_1.default.MotionDetection, ""),
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
    getStateTypeByType(type) {
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
    async onSmlArrived(obisResult, meterIdx) {
        if (obisResult == null || obisResult == undefined) {
            this._Adp.log.warn("Could not set values: Empty");
            return;
        }
        const meterRoot = "meter_" + meterIdx;
        await this._Adp.setObjectNotExistsAsync(meterRoot, {
            type: "channel",
            common: {
                name: "Smart meter values",
                role: "info",
            },
            native: {},
        });
        const obisLang = "de";
        let updateCount = 0;
        try {
            for (const obisId in obisResult) {
                if (!obisResult.hasOwnProperty(obisId))
                    continue;
                this._Adp.log.debug(obisResult[obisId].idToString() +
                    ": " +
                    smartmeter_obis_1.default.ObisNames.resolveObisName(obisResult[obisId], obisLang /*this._Adp.config.obisNameLanguage*/).obisName +
                    " = " +
                    obisResult[obisId].valueToString());
                let i;
                // todo: meter durchnummerieren, problematisch bei mehreren metern.
                const rawChannelId = obisResult[obisId].idToString();
                let ioChannelId = rawChannelId.replace(/[\]\[*,;'"`<>\\?]/g, "__");
                ioChannelId = meterRoot + "." + ioChannelId.replace(/\./g, "_");
                if (!this._SmValues[obisId]) {
                    const ioChannelName = smartmeter_obis_1.default.ObisNames.resolveObisName(obisResult[obisId], obisLang).obisName;
                    this._Adp.log.debug("Create channel " + ioChannelId + " with name " + ioChannelName);
                    try {
                        await this._Adp.setObjectNotExistsAsync(ioChannelId, {
                            type: "channel",
                            common: {
                                name: ioChannelName,
                            },
                            native: {},
                        });
                    }
                    catch (err) {
                        this._Adp.log.error("Error creating channel: " + err);
                    }
                    if (obisResult[obisId].getRawValue() !== undefined) {
                        this._Adp.log.debug("Create state " + ioChannelId + ".rawvalue");
                        try {
                            await this._Adp.setObjectNotExistsAsync(ioChannelId + ".rawvalue", {
                                type: "state",
                                common: {
                                    name: rawChannelId,
                                    type: "string",
                                    read: true,
                                    role: "value",
                                    write: false,
                                },
                                native: {
                                    id: ioChannelId + ".rawvalue",
                                },
                            });
                        }
                        catch (err) {
                            this._Adp.log.error("Error creating state: " + err);
                        }
                    }
                    this._Adp.log.debug("Create state " + ioChannelId + ".value");
                    try {
                        await this._Adp.setObjectNotExistsAsync(ioChannelId + ".value", {
                            type: "state",
                            common: {
                                name: rawChannelId,
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
                    }
                    catch (err) {
                        this._Adp.log.error("Error creating state: " + err);
                    }
                    if (obisResult[obisId].getValueLength() > 1) {
                        for (i = 1; i < obisResult[obisId].getValueLength(); i++) {
                            this._Adp.log.debug("Create state " + ioChannelId + ".value" + (i + 1));
                            try {
                                await this._Adp.setObjectNotExistsAsync(ioChannelId + ".value" + (i + 1), {
                                    type: "state",
                                    common: {
                                        name: rawChannelId + " (" + (i + 1) + ")",
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
                            }
                            catch (err) {
                                this._Adp.log.error("Error creating state: " + err);
                            }
                        }
                    }
                }
                if (!this._SmValues[obisId] ||
                    this._SmValues[obisId].valueToString() !== obisResult[obisId].valueToString()) {
                    if (obisResult[obisId].getRawValue() !== undefined) {
                        this._Adp.log.debug("Set State " + ioChannelId + ".rawvalue = " + obisResult[obisId].getRawValue());
                        await this._Adp.setStateAsync(ioChannelId + ".rawvalue", {
                            ack: true,
                            val: obisResult[obisId].getRawValue(),
                        });
                    }
                    this._Adp.log.debug("Set state " + ioChannelId + ".value = " + obisResult[obisId].getValue(0).value);
                    await this._Adp.setStateAsync(ioChannelId + ".value", {
                        ack: true,
                        val: obisResult[obisId].getValue(0).value,
                    });
                    if (obisResult[obisId].getValueLength() > 1) {
                        for (i = 1; i < obisResult[obisId].getValueLength(); i++) {
                            this._Adp.log.debug("Set state " +
                                ioChannelId +
                                ".value" +
                                (i + 1) +
                                " = " +
                                obisResult[obisId].getValue(i).value);
                            await this._Adp.setStateAsync(ioChannelId + ".value" + (i + 1), {
                                ack: true,
                                val: obisResult[obisId].getValue(i).value,
                            });
                        }
                    }
                    this._SmValues[obisId] = obisResult[obisId];
                    updateCount++;
                }
                else {
                    this._Adp.log.debug("Data for " + ioChannelId + " unchanged");
                }
            }
        }
        catch (err) {
            this._Adp.log.error("Could not set values: " + err.toString());
        }
        this._Adp.log.debug("Received " + Object.keys(obisResult).length + " values, " + updateCount + " updated");
    }
    logPortChange(p, ct, val, triggered, handled) {
        let str; // = triggered ? "Trigger: " : "Change: ";
        let pName = this._Conf.getName(p, ct);
        if (handled) {
            if (triggered) {
                str = "ignore: "; // should not happen, this will not be covered by this module.
            }
            else {
                str = "notify: ";
            }
        }
        else {
            if (triggered) {
                str = "trigger: ";
            }
            else {
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
            case ConfType_1.default.Input:
                vStr = val ? "closed" : "open";
                //pStr = pStr.padStart(3, "0");
                str += `I.${pStr}${pName}: ${vStr}`;
                break;
            case ConfType_1.default.Output:
                vStr = val ? "on" : "off";
                //pStr = pStr.padStart(3, "0");
                str += `O.${pStr}${pName}: ${vStr}`;
                break;
            case ConfType_1.default.MotionSensor:
                vStr = mdsModeStr[val];
                //pStr = pStr.padStart(2, "0");
                str += `M.${pStr}${pName}: ${vStr}`;
                break;
        }
        this._Adp.log.info(str);
    }
    onStateChange(id, state) {
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
                        ct = ConfType_1.default.Input;
                        break;
                    case "out":
                        ct = ConfType_1.default.Output;
                        if (!handled)
                            this._Controller.setOutput(num, state.val);
                        handled = true;
                        break;
                    case "mds":
                        ct = ConfType_1.default.MotionSensor;
                        if (!handled)
                            this._Controller.setMdsMode(num, state.val);
                        handled = true;
                        break;
                }
                this.logPortChange(num, ct, state.val, false, state.ack);
            }
        }
        else if (parts[2] == "conf") {
            if (!state.ack)
                this._Conf.onStateChange(id, state);
            handled = true;
        }
        else if (parts[2] == "trigger") {
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
                    }
                    else {
                        const me = this;
                        let st = stateVal != 0;
                        me._Controller.TriggerInput(inp, st);
                        this.logPortChange(inp, ConfType_1.default.Input, st, true, state.ack);
                        handled = true;
                        if (time > 0) {
                            setTimeout(() => {
                                st = stateVal == 0;
                                me._Controller.TriggerInput(inp, st);
                                this.logPortChange(inp, ConfType_1.default.Input, st, true, state.ack);
                            }, time);
                        }
                    }
                }
                else {
                    this._Adp.log.warn("not able to handle trigger, invalid syntax. (0-255),(0-1)[,(0-5000)]");
                }
                this._Adp.setStateChangedAsync("trigger", { val: "", ack: true });
            }
        }
        if (!handled)
            this._Adp.log.warn(`not able to handle state ${id}`);
    }
    onUnload() {
        this._Controller.onUnload();
    }
}
module.exports = SmaHoAdapter;
//# sourceMappingURL=SmaHoAdapter.js.map