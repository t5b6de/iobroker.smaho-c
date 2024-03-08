"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
//const SerialPort = require("serialport");
const serialport_1 = __importDefault(require("serialport"));
const ConfType_1 = __importDefault(require("./Packets/Config/ConfType"));
const ConfigInputReadPacket_1 = __importDefault(require("./Packets/Config/ConfigInputReadPacket"));
const ConfigInputResponsePacket_1 = __importDefault(require("./Packets/Config/ConfigInputResponsePacket"));
const ConfigInputWritePacket_1 = __importDefault(require("./Packets/Config/ConfigInputWritePacket"));
const ConfigMdsReadPacket_1 = __importDefault(require("./Packets/Config/ConfigMdsReadPacket"));
const ConfigMdsResponsePacket_1 = __importDefault(require("./Packets/Config/ConfigMdsResponsePacket"));
const ConfigMdsWritePacket_1 = __importDefault(require("./Packets/Config/ConfigMdsWritePacket"));
const ConfigNameReadPacket_1 = __importDefault(require("./Packets/Config/ConfigNameReadPacket"));
const ConfigNameResponsePacket_1 = __importDefault(require("./Packets/Config/ConfigNameResponsePacket"));
const ConfigNameWritePacket_1 = __importDefault(require("./Packets/Config/ConfigNameWritePacket"));
const ConfigOutputReadPacket_1 = __importDefault(require("./Packets/Config/ConfigOutputReadPacket"));
const ConfigOutputResponsePacket_1 = __importDefault(require("./Packets/Config/ConfigOutputResponsePacket"));
const ConfigOutputWritePacket_1 = __importDefault(require("./Packets/Config/ConfigOutputWritePacket"));
const InfoRequestPacket_1 = __importDefault(require("./Packets/InfoRequestPacket"));
const InfoResponsePacket_1 = __importDefault(require("./Packets/InfoResponsePacket"));
const InputChangedPacket_1 = __importDefault(require("./Packets/Io/InputChangedPacket"));
const MotionSensorChangedPacket_1 = __importDefault(require("./Packets/Io/MotionSensorChangedPacket"));
const MotionSensorModeSetPacket_1 = __importDefault(require("./Packets/Io/MotionSensorModeSetPacket"));
const OutputChangedPacket_1 = __importDefault(require("./Packets/Io/OutputChangedPacket"));
const SetOutputPacket_1 = __importDefault(require("./Packets/Io/SetOutputPacket"));
const TriggerInputPacket_1 = __importDefault(require("./Packets/Io/TriggerInputPacket"));
const PacketType_1 = __importDefault(require("./Packets/PacketType"));
const PingPacket_1 = __importDefault(require("./Packets/PingPacket"));
const SetSmartModePacket_1 = __importDefault(require("./Packets/SetSmartModePacket"));
const SmartMeterDataPacket_1 = __importDefault(require("./Packets/SmartMeterDataPacket"));
const StateRequestPacket_1 = __importDefault(require("./Packets/StateRequestPacket"));
const StateResponsePacket_1 = __importDefault(require("./Packets/StateResponsePacket"));
const StatusPacket_1 = __importDefault(require("./Packets/StatusPacket"));
const SmaHoPacketizer_1 = __importDefault(require("./SmaHoPacketizer"));
const SmartMeterInterface_1 = __importDefault(require("./SmartMeterInterface"));
const net = __importStar(require("net"));
class SmaHo {
    /**
     * Serialportname e.g. COM3 or /dev/ttyS0
     * @param {string} portName
     */
    constructor(portName, baudRate, log, smlStoreFunc, cbConnLost) {
        const me = this;
        this._Log = log;
        this._ConLostCb = cbConnLost;
        this._Packetizer = new SmaHoPacketizer_1.default();
        this._PingSchedule = null;
        this._PacketSender = null;
        this._Ping = new PingPacket_1.default();
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
            }
            else {
                this._Log.error("Could not parse host/port-string");
            }
        }
        else {
            this._Port = new serialport_1.default(portName, { baudRate: baudRate });
            this._Port.on("data", (d) => {
                me.readBytes(d);
            });
        }
        this.startIdlePing();
        this.startSender();
        this._Log.info("initialized.");
    }
    reConnect() {
        try {
            this._Sckt.end();
            this._Sckt.destroy();
        }
        catch (error) { }
        if (this.netConnect()) {
            this._ConLostCb();
            return true;
        }
        return false;
    }
    netConnect() {
        const me = this;
        try {
            this._Sckt = net.connect(this._NetPort, this._NetHost);
            this._Sckt.on("data", (d) => {
                me.readBytes(d);
            });
            this._Sckt.on("error", (err) => {
                this._Log.error(err.stack);
            });
        }
        catch (er) {
            this._Log.error(er);
            return false;
        }
        return true;
    }
    stopIdlePing() {
        if (this._PingSchedule == null)
            return;
        clearInterval(this._PingSchedule);
        this._PingSchedule = null;
    }
    startIdlePing() {
        const me = this;
        if (this._PingSchedule == null) {
            this._PingSchedule = setInterval(() => {
                me.pingController();
            }, 8000); // 10000ms is limit, two seconds should be okay.
        }
    }
    startSender() {
        if (this._PacketSender == null) {
            const me = this;
            this._PacketSender = setInterval(() => {
                me.sendPackets();
            }, 25);
        }
    }
    stopSender() {
        if (this._PacketSender == null)
            return;
        clearInterval(this._PacketSender);
        this._PacketSender = null;
    }
    sendPackets() {
        let p;
        if (this._PacketQueue.length) {
            if (this._Sckt != undefined) {
                if (this._Sckt.readyState == "open") {
                    p = this._PacketQueue.splice(0, 1)[0];
                    //this._Log.info("recv CMD: " + p.getPacketType());
                    try {
                        p.sendNetworkPacket(this._Sckt);
                    }
                    catch (err) {
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
            else {
                if (!this._Port.isOpen) {
                    this._Log.error("Cannot send packets");
                    return;
                }
                p = this._PacketQueue.splice(0, 1)[0];
                //this._Log.info("recv CMD: " + p.getPacketType());
                p.sendPacket(this._Port);
            }
        }
        else {
            this.stopSender();
        }
    }
    sendPacket(p) {
        this._PacketQueue.push(p);
        this.startSender();
    }
    pingController() {
        this.sendPacket(this._Ping);
    }
    readBytes(data) {
        let i;
        for (i = 0; i < data.length; i++) {
            if (this._Packetizer.addByte(data[i])) {
                this.parsePacket(this._Packetizer);
                this._Packetizer = new SmaHoPacketizer_1.default();
            }
        }
    }
    async parsePacket(packet) {
        let p = null;
        const me = this;
        //this._Log.info("recv CMD: " + packet.getPacketType() + ", len: " + packet.getPacketLen());
        switch (packet.getPacketType()) {
            case PacketType_1.default.Status:
                p = new StatusPacket_1.default(this._Packetizer, this._Log);
                p.setResetCallback((a) => {
                    if (me._ResetHandler != null)
                        me._ResetHandler(a);
                });
                break;
            case PacketType_1.default.InfoResponse:
                p = new InfoResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._InfoReceived != null)
                        me._InfoReceived(a);
                });
                break;
            case PacketType_1.default.InputChange:
                p = new InputChangedPacket_1.default(this._Packetizer, (a, b) => {
                    if (me._InputChanged != null)
                        me._InputChanged(a, b);
                });
                break;
            case PacketType_1.default.OutputChange:
                p = new OutputChangedPacket_1.default(this._Packetizer, (a, b) => {
                    if (me._OutputChanged != null)
                        me._OutputChanged(a, b);
                });
                break;
            case PacketType_1.default.MotionDetectionModeChange:
                p = new MotionSensorChangedPacket_1.default(this._Packetizer, (a, b) => {
                    if (me._MdsModeChanged != null)
                        me._MdsModeChanged(a, b);
                });
                break;
            case PacketType_1.default.StateResponse:
                p = new StateResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._StateReceived != null)
                        me._StateReceived(a);
                });
                break;
            case PacketType_1.default.ConfigNameResponse:
                p = new ConfigNameResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._CfgNameHandler != null)
                        me._CfgNameHandler(a);
                });
                break;
            case PacketType_1.default.ConfigOutputResponse:
                p = new ConfigOutputResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._CfgHandler != null)
                        me._CfgHandler(a, ConfType_1.default.OutputGroup);
                });
                break;
            case PacketType_1.default.ConfigInputResponse:
                p = new ConfigInputResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._CfgHandler != null)
                        me._CfgHandler(a, ConfType_1.default.Input);
                });
                break;
            case PacketType_1.default.ConfigMdsResponse:
                p = new ConfigMdsResponsePacket_1.default(this._Packetizer, (a) => {
                    if (me._CfgHandler != null)
                        me._CfgHandler(a, ConfType_1.default.MotionSensor);
                });
                break;
            case PacketType_1.default.SmlData:
                p = new SmartMeterDataPacket_1.default(this._Packetizer, (a) => {
                    if (this._SmartMeters[a.getMeterIndex()] == null) {
                        this._SmartMeters[a.getMeterIndex()] = new SmartMeterInterface_1.default(this._SmartMeterStoreFb, this._Log);
                    }
                    this._SmartMeters[a.getMeterIndex()].addPacket(a);
                });
                break;
            default:
                this._Log.warn("SmaHo Packet Error, unknown Packet (CMD): 0x" +
                    packet.getPacketType().toString(16).padStart(2, "0"));
        }
        if (p != null && p.isOkay()) {
            p.runCallback();
        }
    }
    requestInfo() {
        this.sendPacket(new InfoRequestPacket_1.default());
    }
    requestState() {
        this.sendPacket(new StateRequestPacket_1.default());
    }
    requestConfigName(index, nt) {
        this.sendPacket(new ConfigNameReadPacket_1.default(nt, index));
    }
    requestConfigInput(index) {
        const p = new ConfigInputReadPacket_1.default(index);
        this.sendPacket(p);
    }
    requestConfigOutputGroup(index) {
        this.sendPacket(new ConfigOutputReadPacket_1.default(index));
    }
    requestConfigMds(index) {
        this.sendPacket(new ConfigMdsReadPacket_1.default(index));
    }
    setConfigName(index, nt, name) {
        const pack = new ConfigNameWritePacket_1.default(nt, index, name);
        this.sendPacket(pack);
    }
    setOutput(id, state) {
        const pack = new SetOutputPacket_1.default(id, state);
        this.sendPacket(pack);
    }
    setMdsMode(id, state) {
        const pack = new MotionSensorModeSetPacket_1.default(id, state);
        this.sendPacket(pack);
    }
    setInputChangedHandler(cb) {
        this._InputChanged = cb;
    }
    setOutputChangedHandler(cb) {
        this._OutputChanged = cb;
    }
    setMdsChangedHandler(cb) {
        this._MdsModeChanged = cb;
    }
    setInfoReceivedHandler(cb) {
        this._InfoReceived = cb;
    }
    setResetHandler(cb) {
        this._ResetHandler = cb;
    }
    setStateReceivedHandler(cb) {
        this._StateReceived = cb;
    }
    setCfgReceivedNameHandler(cb) {
        this._CfgNameHandler = cb;
    }
    setCfgReceivedHandler(cb) {
        this._CfgHandler = cb;
    }
    onUnload() {
        this.stopIdlePing();
        this.stopSender();
    }
    cfgSetInput(index, it, og) {
        this.sendPacket(new ConfigInputWritePacket_1.default(index, it, og));
    }
    TriggerInput(index, state) {
        this.sendPacket(new TriggerInputPacket_1.default(index, state));
    }
    cfgSetOutGroup(index, outs, onTime, offTime) {
        this.sendPacket(new ConfigOutputWritePacket_1.default(index, outs, onTime, offTime));
    }
    cfgSetMds(index, im, out, ledA, ledK) {
        this.sendPacket(new ConfigMdsWritePacket_1.default(index, im, out, ledA, ledK));
    }
    SetSmartMode(enable) {
        this.sendPacket(new SetSmartModePacket_1.default(enable));
    }
}
module.exports = SmaHo;
//# sourceMappingURL=SmaHo.js.map