import * as utils from "@iobroker/adapter-core";
import ConfigInputResponsePacket from "./Packets/Config/ConfigInputResponsePacket";
import ConfigMdsResponsePacket from "./Packets/Config/ConfigMdsResponsePacket";
import ConfigNameResponsePacket from "./Packets/Config/ConfigNameResponsePacket";
import ConfigOutputResponsePacket from "./Packets/Config/ConfigOutputResponsePacket";
import ConfType from "./Packets/Config/ConfType";
import InputType from "./Packets/Config/InputType";
import NameType from "./Packets/Config/NameType";
import MotionDetectorMode from "./Packets/MotionDetectorMode";
import PacketBase from "./Packets/PacketBase";
import SmaHo from "./SmaHo";
import SmaHoAdapter from "./SmaHoAdapter";
import SmaHoConf from "./SmaHoConf";
import SmaHoGroupConf from "./SmaHoGroupConf";
import SmaHoInputConf from "./SmaHoInputConf";
import SmaHoMdsConf from "./SmaHoMdsConf";
import SmaHoOutputConf from "./SmaHoOutputConf";

class SmaHoFbConfig {
    /* TODO-List:
        - MDS Implementation
        - Save Config
        - Remove unused Objects (such as unused output groups) from object tree -> maybe through timer/interval?
        - move Input name and output names to this class (from smahoadapter.ts)
        - implement "objects" for configuration and checking
    */

    private _Controller: SmaHo;
    private _Inputs: Array<SmaHoInputConf>;
    private _Outputs: Array<SmaHoOutputConf>;
    private _Groups: Array<SmaHoGroupConf>;
    private _MSensors: Array<SmaHoMdsConf>;
    private _Ioa: utils.AdapterInstance;

    private _Adapter: SmaHoAdapter;

    public constructor(ctrl: SmaHo, adapter: SmaHoAdapter) {
        this._Controller = ctrl;
        this._Inputs = [];
        this._Outputs = [];
        this._Groups = [];
        this._MSensors = [];
        this._Adapter = adapter;
        this._Ioa = adapter.getAdapterInstance();
        this.createBaseObjects();

        const me = this;

        this._Controller.setCfgReceivedNameHandler((p: ConfigNameResponsePacket) => {
            me.updatePortName(p);
        });

        this._Controller.setCfgReceivedHandler((p: PacketBase, ct: ConfType) => {
            me.updateConfObject(p, ct);
        });
    }

    private async updatePortName(p: ConfigNameResponsePacket): Promise<void> {
        this.setName(p.NameType(), p.getIndex(), p.getName(), true);
        this._Adapter.updatePortName(p.getIndex(), p.NameType(), p.getName());
    }

    public setName(nt: NameType, index: number, name: string, ack: boolean): void {
        let ct: ConfType;

        if (name == null) name = "";

        switch (nt) {
            case NameType.Input:
                ct = ConfType.Input;
                break;
            case NameType.Output:
                ct = ConfType.Output;
                break;
            case NameType.OutGroup:
                ct = ConfType.OutputGroup;
                break;
            case NameType.MotionDetection:
                ct = ConfType.MotionSensor;
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

    private async updateConf(ct: ConfType, i: number): Promise<void> {
        const cfgId = this.getConfigId(ct, i);
        const obj = this.getConf(ct, i);
        this._Ioa.setStateChangedAsync(cfgId, { val: JSON.stringify(obj), ack: true });
    }

    private getConfigId(ct: ConfType, index: number): string {
        let str = "conf.";
        const num = index.toString().padStart(3, "0");

        switch (ct) {
            case ConfType.Input:
                str += "in.i_";
                break;
            case ConfType.Output:
                str += "out.o_";
                break;
            case ConfType.OutputGroup:
                str += "grp.g_";
                break;
            case ConfType.MotionSensor:
                str += "mds.m_";
                break;
        }

        str += num;

        return str;
    }

    private async createBaseObjects(): Promise<void> {
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

    public async addInOutConfObject(i: number): Promise<void> {
        await this.addConfObject(i, ConfType.Input);
        await this.addConfObject(i, ConfType.Output);
        this._Controller.requestConfigInput(i);
        this._Controller.requestConfigName(i, NameType.Input);
        this._Controller.requestConfigName(i, NameType.Output);
    }

    private getConf(ct: ConfType, i: number): SmaHoConf {
        let obj;
        switch (ct) {
            case ConfType.Input:
                obj = this._Inputs[i];
                if (obj == null) {
                    obj = new SmaHoInputConf();
                    obj.Index = i;
                    this._Inputs[i] = obj;
                }

                break;
            case ConfType.Output:
                obj = this._Outputs[i];
                if (obj == null) {
                    obj = new SmaHoOutputConf();
                    obj.Index = i;
                    this._Outputs[i] = obj;
                }
                break;
            case ConfType.OutputGroup:
                obj = this._Groups[i];
                if (obj == null) {
                    obj = new SmaHoGroupConf();
                    obj.Index = i;
                    this._Groups[i] = obj;
                }
                break;
            case ConfType.MotionSensor:
                obj = this._MSensors[i];
                if (obj == null) {
                    obj = new SmaHoMdsConf();
                    obj.Index = i;
                    this._MSensors[i] = obj;
                }
                break;
        }

        return obj;
    }

    private async updateConfObject(pb: PacketBase, ct: ConfType): Promise<void> {
        let p;
        let i = -1;
        let obj;

        switch (ct) {
            case ConfType.Input:
                p = pb as ConfigInputResponsePacket;
                const g = p.getOutputGroup();
                const t = p.getInputType();
                i = p.getIndex();

                obj = this.getConf(ct, i) as SmaHoInputConf;

                obj.InputType = t;
                obj.OutGroup = g;

                if (p.isMotionDetectonSensor()) {
                    await this.addConfObject(g, ConfType.MotionSensor);
                    this._Controller.requestConfigMds(g);
                    this._Controller.requestConfigName(g, NameType.MotionDetection);
                } else if (t != InputType.Unconfigured) {
                    await this.addConfObject(g, ConfType.OutputGroup);
                    this._Controller.requestConfigOutputGroup(g);
                    this._Controller.requestConfigName(g, NameType.OutGroup);
                }

                break;
            case ConfType.OutputGroup:
                p = pb as ConfigOutputResponsePacket;
                i = p.getIndex();
                obj = this.getConf(ct, i) as SmaHoGroupConf;

                const outs = p.getOutputs();
                const ton = p.getOnTime();
                const toff = p.getOffTime();
                obj.Outputs = outs;
                obj.OffTime = toff;
                obj.OnTime = ton;

                break;
            case ConfType.MotionSensor:
                p = pb as ConfigMdsResponsePacket;
                i = p.getIndex();

                const so = p.getSignalOut();
                const la = p.getLedAOut();
                const lk = p.getLedBOut();
                const im = p.getInitialMode();

                if (im != MotionDetectorMode.Unconfigured) {
                    await this.addConfObject(so, ConfType.OutputGroup);
                    this._Controller.requestConfigOutputGroup(so);

                    await this.addConfObject(la, ConfType.OutputGroup);
                    this._Controller.requestConfigOutputGroup(la);

                    await this.addConfObject(lk, ConfType.OutputGroup);
                    this._Controller.requestConfigOutputGroup(lk);
                }

                obj = this.getConf(ct, i) as SmaHoMdsConf;
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

    private async addInputObjects(cfgId: string, i: number): Promise<void> {
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
        } else {
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

    private async addOutGroupObjects(cfgId: string, i: number): Promise<void> {
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
        } else {
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

    private async addOutputObjects(cfgId: string, i: number): Promise<void> {
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
        } else {
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

    private async addMdsObjects(cfgId: string, i: number): Promise<void> {
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
        } else {
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

    private async addConfObject(i: number, ct: ConfType): Promise<void> {
        const cfgId = this.getConfigId(ct, i);

        switch (ct) {
            case ConfType.Input:
                await this.addInputObjects(cfgId, i);
                break;
            case ConfType.Output:
                await this.addOutputObjects(cfgId, i);
                break;
            case ConfType.OutputGroup:
                await this.addOutGroupObjects(cfgId, i);
                break;
            case ConfType.MotionSensor:
                await this.addMdsObjects(cfgId, i);
                break;
        }
    }

    public getName(i: number, ct: ConfType): string {
        const cfgId = this.getConf(ct, i);

        return cfgId.Name;
    }

    public onStateChange(id: string, state: ioBroker.State | null | undefined): void {
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
                        ct = ConfType.Input;
                        cfg = this.getConf(ct, index) as SmaHoInputConf;

                        try {
                            const nConf = JSON.parse(state.val as string) as SmaHoInputConf;
                            const obj = new SmaHoInputConf();
                            obj.Index = nConf.Index;
                            obj.InputType = nConf.InputType;
                            obj.Name = nConf.Name;
                            obj.OutGroup = nConf.OutGroup;

                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }

                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType.Input, obj.Name);
                            }

                            if (cfg.InputType != obj.InputType || cfg.OutGroup != obj.OutGroup) {
                                if (InputType[obj.InputType] == null) {
                                    throw "invalid input type";
                                }

                                if (
                                    obj.OutGroup < 0 ||
                                    obj.OutGroup > 255 ||
                                    (obj.OutGroup > 15 && obj.isMotionDetectonSensor())
                                ) {
                                    throw "Output Group out of range";
                                }

                                this._Controller.cfgSetInput(index, obj.InputType, obj.OutGroup);
                            }
                        } catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf input Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "out":
                        ct = ConfType.Output;
                        cfg = this.getConf(ct, index) as SmaHoOutputConf;

                        try {
                            const nConf = JSON.parse(state.val as string) as SmaHoOutputConf;
                            const obj = new SmaHoOutputConf();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;

                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }

                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType.Output, obj.Name);
                            }
                        } catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "grp":
                        ct = ConfType.OutputGroup;
                        cfg = this.getConf(ct, index) as SmaHoGroupConf;

                        try {
                            const nConf = JSON.parse(state.val as string) as SmaHoGroupConf;
                            const obj = new SmaHoGroupConf();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;
                            obj.Outputs = nConf.Outputs;
                            obj.OnTime = nConf.OnTime;
                            obj.OffTime = nConf.OffTime;

                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }

                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType.OutGroup, obj.Name);
                            }

                            let oldArr = cfg.Outputs;
                            let newArr = obj.Outputs;

                            // filter duplicates and sort.
                            oldArr = oldArr
                                .filter((v, i) => oldArr.indexOf(v) === i)
                                .sort((a, b) => {
                                    if (a > b) return 1;
                                    if (b > a) return -1;
                                    return 0;
                                });
                            newArr = newArr
                                .filter((v, i) => newArr.indexOf(v) === i)
                                .sort((a, b) => {
                                    if (a > b) return 1;
                                    if (b > a) return -1;
                                    return 0;
                                });

                            if (
                                cfg.OnTime != nConf.OnTime ||
                                cfg.OffTime != nConf.OffTime ||
                                oldArr.length != newArr.length ||
                                oldArr.filter((v, i) => oldArr[i] !== newArr[i]).length > 0
                            ) {
                                this._Controller.cfgSetOutGroup(index, newArr, nConf.OnTime, nConf.OffTime);
                            } else {
                                this.updateConf(ct, index);
                                this._Ioa.log.info("SmaHoFb Conf nothing changed.");
                            }
                        } catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output group Error: " + error);
                            this.updateConf(ct, index);
                        }
                        break;
                    case "mds":
                        ct = ConfType.MotionSensor;
                        cfg = this.getConf(ct, index) as SmaHoMdsConf;

                        try {
                            const nConf = JSON.parse(state.val as string) as SmaHoMdsConf;
                            const obj = new SmaHoMdsConf();
                            obj.Index = nConf.Index;
                            obj.Name = nConf.Name;

                            if (obj.Index != cfg.Index) {
                                throw "unallowed diff (index)";
                            }

                            if (cfg.Name != obj.Name.substr(0, 60)) {
                                this._Controller.setConfigName(index, NameType.MotionDetection, obj.Name);
                            }

                            obj.InitalMode = nConf.InitalMode;
                            obj.LedA = nConf.LedA;
                            obj.LedB = nConf.LedB;
                            obj.Output = nConf.Output;

                            if (
                                cfg.InitalMode != obj.InitalMode ||
                                cfg.LedA != obj.LedA ||
                                cfg.LedB != obj.LedB ||
                                cfg.Output != obj.Output
                            ) {
                                if (MotionDetectorMode[obj.InitalMode] == null) {
                                    throw "invalid initial mode";
                                }

                                if (obj.LedA == obj.LedB || obj.Output == obj.LedA || obj.LedB == obj.Output) {
                                    throw "outs must not be equal";
                                }

                                this._Controller.cfgSetMds(index, obj.InitalMode, obj.Output, obj.LedA, obj.LedB);
                            }
                        } catch (error) {
                            this._Ioa.log.warn("SmaHoFb Conf output group Error: " + error);
                            this.updateConf(ct, index);
                        }

                        break;
                }
            }
        }
    }
}

export = SmaHoFbConfig;
