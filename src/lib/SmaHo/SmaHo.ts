import ConfType from "./Packets/Config/ConfType";
import ConfigInputReadPacket from "./Packets/Config/ConfigInputReadPacket";
import ConfigInputResponsePacket from "./Packets/Config/ConfigInputResponsePacket";
import ConfigInputWritePacket from "./Packets/Config/ConfigInputWritePacket";
import ConfigMdsReadPacket from "./Packets/Config/ConfigMdsReadPacket";
import ConfigMdsResponsePacket from "./Packets/Config/ConfigMdsResponsePacket";
import ConfigMdsWritePacket from "./Packets/Config/ConfigMdsWritePacket";
import ConfigNameReadPacket from "./Packets/Config/ConfigNameReadPacket";
import ConfigNameResponsePacket from "./Packets/Config/ConfigNameResponsePacket";
import ConfigNameWritePacket from "./Packets/Config/ConfigNameWritePacket";
import ConfigOutputReadPacket from "./Packets/Config/ConfigOutputReadPacket";
import ConfigOutputResponsePacket from "./Packets/Config/ConfigOutputResponsePacket";
import ConfigOutputWritePacket from "./Packets/Config/ConfigOutputWritePacket";
import InputType from "./Packets/Config/InputType";
import NameType from "./Packets/Config/NameType";
import InfoRequestPacket from "./Packets/InfoRequestPacket";
import InfoResponsePacket from "./Packets/InfoResponsePacket";
import InputChangedPacket from "./Packets/Io/InputChangedPacket";
import MotionSensorChangedPacket from "./Packets/Io/MotionSensorChangedPacket";
import MotionSensorModeSetPacket from "./Packets/Io/MotionSensorModeSetPacket";
import OutputChangedPacket from "./Packets/Io/OutputChangedPacket";
import SetOutputPacket from "./Packets/Io/SetOutputPacket";
import TriggerInputPacket from "./Packets/Io/TriggerInputPacket";
import MotionDetectorMode from "./Packets/MotionDetectorMode";
import PacketBase from "./Packets/PacketBase";
import PacketType from "./Packets/PacketType";
import PingPacket from "./Packets/PingPacket";
import SetSmartModePacket from "./Packets/SetSmartModePacket";
import SmartMeterDataPacket from "./Packets/SmartMeterDataPacket";
import StateRequestPacket from "./Packets/StateRequestPacket";
import StateResponsePacket from "./Packets/StateResponsePacket";
import StatusPacket from "./Packets/StatusPacket";
import SmaHoPacketizer from "./SmaHoPacketizer";
import SmartMeterInterface from "./SmartMeterInterface";

import * as net from "net";

class SmaHo {
    _Sckt: net.Socket;
    _NetHost: string;
    _NetPort: number;

    _Packetizer: SmaHoPacketizer;

    _Ping: PingPacket;
    _PingSchedule: NodeJS.Timeout;
    _PacketSender: NodeJS.Timeout;

    _InputChanged: CallableFunction;
    _OutputChanged: CallableFunction;
    _MdsModeChanged: CallableFunction;
    _InfoReceived: CallableFunction;
    _StateReceived: CallableFunction;
    _ResetHandler: CallableFunction;
    _CfgNameHandler: CallableFunction;
    _CfgHandler: CallableFunction;
    _PacketQueue: Array<PacketBase>;

    _Log: ioBroker.Logger;

    _SmartMeters: Array<SmartMeterInterface>;
    _SmartMeterStoreFb: CallableFunction;
    _ConLostCb: CallableFunction;

    /**
     * Serialportname e.g. COM3 or /dev/ttyS0
     * @param {string} portName
     */
    constructor(
        portName: string,
        baudRate: number,
        log: ioBroker.Logger,
        smlStoreFunc: CallableFunction,
        cbConnLost: CallableFunction,
    ) {
        this._Log = log;
        this._ConLostCb = cbConnLost;

        this._Packetizer = new SmaHoPacketizer();
        this._PingSchedule = null;
        this._PacketSender = null;
        this._Ping = new PingPacket();
        this._InputChanged = null;
        this._PacketQueue = [];
        this._SmartMeters = [];
        this._SmartMeterStoreFb = smlStoreFunc;

        if (portName.startsWith("tcp://")) {
            let port = "";

            const pPos = portName.lastIndexOf(":");
            this._NetHost = portName.substring(6, pPos);
            port = portName.substring(pPos + 1);

            this._NetPort = parseInt(port);

            if (this._NetPort > 1 && this._NetPort < 65535) {
                this.netConnect();
            } else {
                this._Log.error("Could not parse host/port-string");
            }
        } else {
            this._Log.error("ERROR no tcp url!");
        }

        this.startIdlePing();
        this.startSender();
        this._Log.info("initialized.");
    }

    private reConnect(): boolean {
        try {
            this._Sckt.end();
            this._Sckt.destroy();
        } catch (error) {}

        if (this.netConnect()) {
            this._ConLostCb();
            return true;
        }
        return false;
    }

    private netConnect(): boolean {
        const me = this;

        try {
            this._Sckt = net.connect(this._NetPort, this._NetHost);
            this._Sckt.on("data", (d) => {
                me.readBytes(d);
            });

            this._Sckt.on("error", (err) => {
                this._Log.error(err.stack);
            });
        } catch (er: any) {
            this._Log.error(er);
            return false;
        }
        return true;
    }

    private stopIdlePing(): void {
        if (this._PingSchedule == null) return;

        clearInterval(this._PingSchedule);
        this._PingSchedule = null;
    }

    private startIdlePing(): void {
        const me = this;
        if (this._PingSchedule == null) {
            this._PingSchedule = setInterval(() => {
                me.pingController();
            }, 8000); // 10000ms is limit, two seconds should be okay.
        }
    }

    private startSender(): void {
        if (this._PacketSender == null) {
            const me = this;
            this._PacketSender = setInterval(() => {
                me.sendPackets();
            }, 25);
        }
    }

    private stopSender(): void {
        if (this._PacketSender == null) return;

        clearInterval(this._PacketSender);
        this._PacketSender = null;
    }

    private sendPackets(): void {
        let p: PacketBase;

        if (this._PacketQueue.length) {
            if (this._Sckt != undefined) {
                if (this._Sckt.readyState == "open") {
                    p = this._PacketQueue.splice(0, 1)[0];
                    //this._Log.info("recv CMD: " + p.getPacketType());
                    try {
                        p.sendNetworkPacket(this._Sckt);
                    } catch (err: any) {
                        this._Log.error("Err Sending Packet. requeue.");
                        this._PacketQueue.unshift(p);
                    }
                }

                if (this._Sckt.readyState == "closed") {
                    this._Log.error("Cannot send packets, stopping sender and try reconnect...");
                    this.stopSender();

                    if (!this.reConnect()) {
                        this._Log.error("Reconnect failed");
                        return;
                    }
                }
            }
        } else {
            this.stopSender();
        }
    }

    private sendPacket(p: PacketBase): void {
        this._PacketQueue.push(p);
        this.startSender();
    }

    private pingController(): void {
        this.sendPacket(this._Ping);
    }

    readBytes(data: Buffer): void {
        let i: number;

        for (i = 0; i < data.length; i++) {
            if (this._Packetizer.addByte(data[i])) {
                this.parsePacket(this._Packetizer);
                this._Packetizer = new SmaHoPacketizer();
            }
        }
    }

    async parsePacket(packet: SmaHoPacketizer): Promise<void> {
        let p = null;
        const me = this;

        //this._Log.info("recv CMD: " + packet.getPacketType() + ", len: " + packet.getPacketLen());

        switch (packet.getPacketType()) {
            case PacketType.Status:
                p = new StatusPacket(this._Packetizer, this._Log);
                p.setResetCallback((a: InfoResponsePacket) => {
                    if (me._ResetHandler != null) me._ResetHandler(a);
                });
                break;
            case PacketType.InfoResponse:
                p = new InfoResponsePacket(this._Packetizer, (a: InfoResponsePacket) => {
                    if (me._InfoReceived != null) me._InfoReceived(a);
                });

                break;
            case PacketType.InputChange:
                p = new InputChangedPacket(this._Packetizer, (a: number, b: boolean) => {
                    if (me._InputChanged != null) me._InputChanged(a, b);
                });
                break;

            case PacketType.OutputChange:
                p = new OutputChangedPacket(this._Packetizer, (a: number, b: boolean) => {
                    if (me._OutputChanged != null) me._OutputChanged(a, b);
                });
                break;

            case PacketType.MotionDetectionModeChange:
                p = new MotionSensorChangedPacket(this._Packetizer, (a: number, b: MotionDetectorMode) => {
                    if (me._MdsModeChanged != null) me._MdsModeChanged(a, b);
                });
                break;

            case PacketType.StateResponse:
                p = new StateResponsePacket(this._Packetizer, (a: StateResponsePacket) => {
                    if (me._StateReceived != null) me._StateReceived(a);
                });
                break;

            case PacketType.ConfigNameResponse:
                p = new ConfigNameResponsePacket(this._Packetizer, (a: ConfigNameResponsePacket) => {
                    if (me._CfgNameHandler != null) me._CfgNameHandler(a);
                });
                break;

            case PacketType.ConfigOutputResponse:
                p = new ConfigOutputResponsePacket(this._Packetizer, (a: ConfigOutputResponsePacket) => {
                    if (me._CfgHandler != null) me._CfgHandler(a, ConfType.OutputGroup);
                });
                break;

            case PacketType.ConfigInputResponse:
                p = new ConfigInputResponsePacket(this._Packetizer, (a: ConfigInputResponsePacket) => {
                    if (me._CfgHandler != null) me._CfgHandler(a, ConfType.Input);
                });
                break;

            case PacketType.ConfigMdsResponse:
                p = new ConfigMdsResponsePacket(this._Packetizer, (a: ConfigMdsResponsePacket) => {
                    if (me._CfgHandler != null) me._CfgHandler(a, ConfType.MotionSensor);
                });
                break;

            case PacketType.SmlData:
                p = new SmartMeterDataPacket(this._Packetizer, (a: SmartMeterDataPacket) => {
                    if (this._SmartMeters[a.getMeterIndex()] == null) {
                        this._SmartMeters[a.getMeterIndex()] = new SmartMeterInterface(
                            this._SmartMeterStoreFb,
                            this._Log,
                        );
                    }
                    this._SmartMeters[a.getMeterIndex()].addPacket(a);
                });
                break;

            default:
                this._Log.warn(
                    "SmaHo Packet Error, unknown Packet (CMD): 0x" +
                        packet.getPacketType().toString(16).padStart(2, "0"),
                );
        }

        if (p != null && p.isOkay()) {
            p.runCallback();
        }
    }

    public requestInfo(): void {
        this.sendPacket(new InfoRequestPacket());
    }

    public requestState(): void {
        this.sendPacket(new StateRequestPacket());
    }

    public requestConfigName(index: number, nt: NameType): void {
        this.sendPacket(new ConfigNameReadPacket(nt, index));
    }

    public requestConfigInput(index: number): void {
        const p = new ConfigInputReadPacket(index);
        this.sendPacket(p);
    }

    public requestConfigOutputGroup(index: number): void {
        this.sendPacket(new ConfigOutputReadPacket(index));
    }

    public requestConfigMds(index: number): void {
        this.sendPacket(new ConfigMdsReadPacket(index));
    }

    public setConfigName(index: number, nt: NameType, name: string): void {
        const pack = new ConfigNameWritePacket(nt, index, name);
        this.sendPacket(pack);
    }

    public setOutput(id: number, state: boolean): void {
        const pack = new SetOutputPacket(id, state);
        this.sendPacket(pack);
    }

    public setMdsMode(id: number, state: MotionDetectorMode): void {
        const pack = new MotionSensorModeSetPacket(id, state);
        this.sendPacket(pack);
    }

    public setInputChangedHandler(cb: CallableFunction): void {
        this._InputChanged = cb;
    }

    public setOutputChangedHandler(cb: CallableFunction): void {
        this._OutputChanged = cb;
    }

    public setMdsChangedHandler(cb: CallableFunction): void {
        this._MdsModeChanged = cb;
    }

    public setInfoReceivedHandler(cb: CallableFunction): void {
        this._InfoReceived = cb;
    }

    public setResetHandler(cb: CallableFunction): void {
        this._ResetHandler = cb;
    }

    public setStateReceivedHandler(cb: CallableFunction): void {
        this._StateReceived = cb;
    }

    public setCfgReceivedNameHandler(cb: CallableFunction): void {
        this._CfgNameHandler = cb;
    }

    public setCfgReceivedHandler(cb: CallableFunction): void {
        this._CfgHandler = cb;
    }

    public onUnload(): void {
        this.stopIdlePing();
        this.stopSender();
    }

    public cfgSetInput(index: number, it: InputType, og: number): void {
        this.sendPacket(new ConfigInputWritePacket(index, it, og));
    }

    public TriggerInput(index: number, state: boolean): void {
        this.sendPacket(new TriggerInputPacket(index, state));
    }

    public cfgSetOutGroup(index: number, outs: Array<number>, onTime: number, offTime: number): void {
        this.sendPacket(new ConfigOutputWritePacket(index, outs, onTime, offTime));
    }

    public cfgSetMds(index: number, im: MotionDetectorMode, out: number, ledA: number, ledK: number): void {
        this.sendPacket(new ConfigMdsWritePacket(index, im, out, ledA, ledK));
    }

    public SetSmartMode(enable: boolean): void {
        this.sendPacket(new SetSmartModePacket(enable));
    }
}

export = SmaHo;
