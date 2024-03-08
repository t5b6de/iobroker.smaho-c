"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ConfType_1 = __importDefault(require("./Packets/Config/ConfType"));
const InputType_1 = __importDefault(require("./Packets/Config/InputType"));
const NameType_1 = __importDefault(require("./Packets/Config/NameType"));
const MotionDetectorMode_1 = __importDefault(require("./Packets/MotionDetectorMode"));
const SmaHoGroupConf_1 = __importDefault(require("./SmaHoGroupConf"));
const SmaHoInputConf_1 = __importDefault(require("./SmaHoInputConf"));
const SmaHoMdsConf_1 = __importDefault(require("./SmaHoMdsConf"));
const SmaHoOutputConf_1 = __importDefault(require("./SmaHoOutputConf"));
class SmaHoFbConfig {
    constructor(ctrl, adapter) {
        this._Controller = ctrl;
        this._Inputs = [];
        this._Outputs = [];
        this._Groups = [];
        this._MSensors = [];
        this._Adapter = adapter;
        this._Ioa = adapter.getAdapterInstance();
        this.createBaseObjects();
        const me = this;
        this._Controller.setCfgReceivedNameHandler((p) => {
            me.updatePortName(p);
        });
        this._Controller.setCfgReceivedHandler((p, ct) => {
            me.updateConfObject(p, ct);
        });
    }
    async updatePortName(p) {
        this.setName(p.NameType(), p.getIndex(), p.getName(), true);
        this._Adapter.updatePortName(p.getIndex(), p.NameType(), p.getName());
    }
    setName(nt, index, name, ack) {
        let ct;
        if (name == null)
            name = "";
        switch (nt) {
            case NameType_1.default.Input:
                ct = ConfType_1.default.Input;
                break;
            case NameType_1.default.Output:
                ct = ConfType_1.default.Output;
                break;
            case NameType_1.default.OutGroup:
                ct = ConfType_1.default.OutputGroup;
                break;
            case NameType_1.default.MotionDetection:
                ct = ConfType_1.default.MotionSensor;
                break;
        }
        const conf = this.getConf(ct, index);
        if (name != conf.Name && !ack) {
            this._Controller.setConfigName(index, nt, name);
        }
        if (ack) {
            conf.Name = name;
            this.updateConf(ct, index);
        }
    }
    async updateConf(ct, i) {
        const cfgId = this.getConfigId(ct, i);
        const obj = this.getConf(ct, i);
        this._Ioa.setStateChangedAsync(cfgId, { val: JSON.stringify(obj), ack: true });
    }
    getConfigId(ct, index) {
        let str = "conf.";
        const num = index.toString().padStart(3, "0");
        switch (ct) {
            case ConfType_1.default.Input:
                str += "in.i_";
                break;
            case ConfType_1.default.Output:
                str += "out.o_";
                break;
            case ConfType_1.default.OutputGroup:
                str += "grp.g_";
                break;
            case ConfType_1.default.MotionSensor:
                str += "mds.m_";
                break;
        }
        str += num;
        return str;
    }
    async createBaseObjects() {
        await this._Ioa.setObjectNotExistsAsync("conf", {
            type: "channel",
            common: {
                name: "Controller fallback configuration",
                role: "",
            },
            native: {},
        });
        await this._Ioa.setObjectNotExistsAsync("conf.in", {
            type: "channel",
            common: {
                name: "Input definitions",
                role: "",
            },
            native: {},
        });
        await this._Ioa.setObjectNotExistsAsync("conf.out", {
            type: "channel",
            common: {
                name: "Output names",
                role: "",
            },
            native: {},
        });
        await this._Ioa.setObjectNotExistsAsync("conf.mds", {
            type: "channel",
            common: {
                name: "Motion detection sensors definitions",
                role: "",
            },
            native: {},
        });
        await this._Ioa.setObjectNotExistsAsync("conf.grp", {
            type: "channel",
            common: {
                name: "Output port groupings and names",
                role: "",
            },
            native: {},
        });
    }
    async addInOutConfObject(i) {
        await this.addConfObject(i, ConfType_1.default.Input);
        await this.addConfObject(i, ConfType_1.default.Output);
        this._Controller.requestConfigInput(i);
        this._Controller.requestConfigName(i, NameType_1.default.Input);
        this._Controller.requestConfigName(i, NameType_1.default.Output);
    }
    getConf(ct, i) {
        let obj;
        switch (ct) {
            case ConfType_1.default.Input:
                obj = this._Inputs[i];
                if (obj == null) {
                    obj = new SmaHoInputConf_1.default();
                    obj.Index = i;
                    this._Inputs[i] = obj;
                }
                break;
            case ConfType_1.default.Output:
                obj = this._Outputs[i];
                if (obj == null) {
                    obj = new SmaHoOutputConf_1.default();
                    obj.Index = i;
                    this._Outputs[i] = obj;
                }
                break;
            case ConfType_1.default.OutputGroup:
                obj = this._Groups[i];
                if (obj == null) {
                    obj = new SmaHoGroupConf_1.default();
                    obj.Index = i;
                    this._Groups[i] = obj;
                }
                break;
            case ConfType_1.default.MotionSensor:
                obj = this._MSensors[i];
                if (obj == null) {
                    obj = new SmaHoMdsConf_1.default();
                    obj.Index = i;
                    this._MSensors[i] = obj;
                }
                break;
        }
        return obj;
    }
    async updateConfObject(pb, ct) {
        let p;
        let i = -1;
        let obj;
        switch (ct) {
            case ConfType_1.default.Input:
                p = pb;
                const g = p.getOutputGroup();
                const t = p.getInputType();
                i = p.getIndex();
                obj = this.getConf(ct, i);
                obj.InputType = t;
                obj.OutGroup = g;
                if (p.isMotionDetectonSensor()) {
                    await this.addConfObject(g, ConfType_1.default.MotionSensor);
                    this._Controller.requestConfigMds(g);
                    this._Controller.requestConfigName(g, NameType_1.default.MotionDetection);
                }
                else if (t != InputType_1.default.Unconfigured) {
                    await this.addConfObject(g, ConfType_1.default.OutputGroup);
                    this._Controller.requestConfigOutputGroup(g);
                    this._Controller.requestConfigName(g, NameType_1.default.OutGroup);
                }
                break;
            case ConfType_1.default.OutputGroup:
                p = pb;
                i = p.getIndex();
                obj = this.getConf(ct, i);
                const outs = p.getOutputs();
                const ton = p.getOnTime();
                const toff = p.getOffTime();
                obj.Outputs = outs;
                obj.OffTime = toff;
                obj.OnTime = ton;
                break;
            case ConfType_1.default.MotionSensor:
                p = pb;
                i = p.getIndex();
                const so = p.getSignalOut();
                const la = p.getLedAOut();
                const lk = p.getLedBOut();
                const im = p.getInitialMode();
                if (im != MotionDetectorMode_1.default.Unconfigured) {
                    await this.addConfObject(so, ConfType_1.default.OutputGroup);
                    this._Controller.requestConfigOutputGroup(so);
                    await this.addConfObject(la, ConfType_1.default.OutputGroup);
                    this._Controller.requestConfigOutputGroup(la);
                    await this.addConfObject(lk, ConfType_1.default.OutputGroup);
                    this._Controller.requestConfigOutputGroup(lk);
                }
                obj = this.getConf(ct, i);
                obj.InitalMode = im;
                obj.Output = so;
                obj.LedA = la;
                obj.LedB = lk;
                break;
        }
        if (i != -1) {
            this.updateConf(ct, i);
        }
    }
    async addInputObjects(cfgId, i) {
        if ((await this._Ioa.getObjectAsync(cfgId)) != null) {
            this._Ioa.extendObject(cfgId, {
                type: "state",
                common: {
                    name: "I." + i + " - InputDefition",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
            });
        }
        else {
            this._Ioa.setObjectNotExistsAsync(cfgId, {
                type: "state",
                common: {
                    // Duplicate code, variable creates compiler errors.
                    name: "I." + i + " - InputDefition",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
                native: {},
            });
        }
    }
    async addOutGroupObjects(cfgId, i) {
        if ((await this._Ioa.getObjectAsync(cfgId)) != null) {
            this._Ioa.extendObject(cfgId, {
                type: "state",
                common: {
                    name: "G." + i + " - Outputs",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
            });
        }
        else {
            this._Ioa.setObjectNotExistsAsync(cfgId, {
                type: "state",
                common: {
                    // Duplicate code, variable creates compiler errors.
                    name: "G." + i + " - Outputs",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
                native: {},
            });
        }
    }
    async addOutputObjects(cfgId, i) {
        if ((await this._Ioa.getObjectAsync(cfgId)) != null) {
            this._Ioa.extendObject(cfgId, {
                type: "state",
                common: {
                    name: "O." + i + " - Outputs",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
            });
        }
        else {
            this._Ioa.setObjectNotExistsAsync(cfgId, {
                type: "state",
                common: {
                    // Duplicate code, variable creates compiler errors.
                    name: "O." + i + " - Outputs",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
                native: {},
            });
        }
    }
    async addMdsObjects(cfgId, i) {
        if ((await this._Ioa.getObjectAsync(cfgId)) != null) {
            this._Ioa.extendObject(cfgId, {
                type: "state",
                common: {
                    name: "M." + i + " - Motion Sensor",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
            });
        }
        else {
            this._Ioa.setObjectNotExistsAsync(cfgId, {
                type: "state",
                common: {
                    // Duplicate code, variable creates compiler errors.
                    name: "M." + i + " - Motion Sensor",
                    type: "json",
                    role: "config",
                    read: true,
                    write: true,
                },
                native: {},
            });
        }
    }
    async addConfObject(i, ct) {
        const cfgId = this.getConfigId(ct, i);
        switch (ct) {
            case ConfType_1.default.Input:
                await this.addInputObjects(cfgId, i);
                break;
            case ConfType_1.default.Output:
                await this.addOutputObjects(cfgId, i);
                break;
            case ConfType_1.default.OutputGroup:
                await this.addOutGroupObjects(cfgId, i);
                break;
            case ConfType_1.default.MotionSensor:
                await this.addMdsObjects(cfgId, i);
                break;
        }
    }
    getName(i, ct) {
        const cfgId = this.getConf(ct, i);
        return cfgId.Name;
    }
    onStateChange(id, state) {
        this._Ioa.log.info("CONF id: " + id + " changed");
        if (state) {
            if (state.ack) {
                // already acknowledged.
                return;
            }
            const parts = id.split(".");
            // (5) ["smaho-c", "0", "conf", "in", "p_000"]
            if (parts.length == 5) {
                const stype = parts[3];
                const sindex = parts[4];
                let index = -1;
                let ct = null;
                let cfg;
                if (sindex.length == 5) {
                    index = parseInt(sindex.substr(2));
                    if (isNaN(index) || index > 255) {
                        return;
                    }
                }
                switch (stype) {
                    case "in":
                        ct = ConfType_1.default.Input;
                        cfg = this.getConf(ct, index);
                        try {
                            const nConf = JSON.parse(state.val);
                            const obj = new SmaHoInputConf_1.default();
                            obj.Index = nConf.Index;
                            obj.InputType = nConf.InputType;
                            obj.Name = nConf.Name;
                            obj.OutGroup = nConf.OutGroup;
                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }
                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType_1.default.Input, obj.Name);
                            }
                            if (cfg.InputType != obj.InputType || cfg.OutGroup != obj.OutGroup) {
                                if (InputType_1.default[obj.InputType] == null) {
                                    throw "invalid input type";
                                }
                                if (obj.OutGroup < 0 ||
                                    obj.OutGroup > 255 ||
                                    (obj.OutGroup > 15 && obj.isMotionDetectonSensor())) {
                                    throw "Output Group out of range";
                                }
                                this._Controller.cfgSetInput(index, obj.InputType, obj.OutGroup);
                            }
                        }
                        catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf input Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "out":
                        ct = ConfType_1.default.Output;
                        cfg = this.getConf(ct, index);
                        try {
                            const nConf = JSON.parse(state.val);
                            const obj = new SmaHoOutputConf_1.default();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;
                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }
                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType_1.default.Output, obj.Name);
                            }
                        }
                        catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "grp":
                        ct = ConfType_1.default.OutputGroup;
                        cfg = this.getConf(ct, index);
                        try {
                            const nConf = JSON.parse(state.val);
                            const obj = new SmaHoGroupConf_1.default();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;
                            obj.Outputs = nConf.Outputs;
                            obj.OnTime = nConf.OnTime;
                            obj.OffTime = nConf.OffTime;
                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }
                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType_1.default.OutGroup, obj.Name);
                            }
                            let oldArr = cfg.Outputs;
                            let newArr = obj.Outputs;
                            // filter duplicates and sort.
                            oldArr = oldArr
                                .filter((v, i) => oldArr.indexOf(v) === i)
                                .sort((a, b) => {
                                if (a > b)
                                    return 1;
                                if (b > a)
                                    return -1;
                                return 0;
                            });
                            newArr = newArr
                                .filter((v, i) => newArr.indexOf(v) === i)
                                .sort((a, b) => {
                                if (a > b)
                                    return 1;
                                if (b > a)
                                    return -1;
                                return 0;
                            });
                            if (cfg.OnTime != nConf.OnTime ||
                                cfg.OffTime != nConf.OffTime ||
                                oldArr.length != newArr.length ||
                                oldArr.filter((v, i) => oldArr[i] !== newArr[i]).length > 0) {
                                this._Controller.cfgSetOutGroup(index, newArr, nConf.OnTime, nConf.OffTime);
                            }
                            else {
                                this.updateConf(ct, index);
                                this._Ioa.log.info("SmaHoFb Conf nothing changed.");
                            }
                        }
                        catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output group Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "mds":
                        ct = ConfType_1.default.MotionSensor;
                        cfg = this.getConf(ct, index);
                        try {
                            const nConf = JSON.parse(state.val);
                            const obj = new SmaHoMdsConf_1.default();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;
                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }
                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType_1.default.MotionDetection, obj.Name);
                            }
                            obj.InitalMode = nConf.InitalMode;
                            obj.LedA = nConf.LedA;
                            obj.LedB = nConf.LedB;
                            obj.Output = nConf.Output;
                            if (cfg.InitalMode != obj.InitalMode ||
                                cfg.LedA != obj.LedA ||
                                cfg.LedB != obj.LedB ||
                                cfg.Output != obj.Output) {
                                if (MotionDetectorMode_1.default[obj.InitalMode] == null) {
                                    throw "invalid initial mode";
                                }
                                if (obj.LedA == obj.LedB || obj.Output == obj.LedA || obj.LedB == obj.Output) {
                                    throw "outs must not be equal";
                                }
                                this._Controller.cfgSetMds(index, obj.InitalMode, obj.Output, obj.LedA, obj.LedB);
                            }
                        }
                        catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output group Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                }
            }
        }
    }
}
module.exports = SmaHoFbConfig;
//# sourceMappingURL=SmaHoFbConfig.js.map