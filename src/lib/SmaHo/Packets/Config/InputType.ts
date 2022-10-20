enum InputType {
    Unconfigured = 0xff,
    // default output groups:
    Switch = 0x01,
    Button = 0x02,
    NegativeButton = 0x03,
    SwitchOffButton = 0x04,
    SwitchOnButton = 0x05,
    SwitchInverted = 0x06,
    // has MDS as "output group"
    MotionDetectionModeButton = 0x08,
    MotionDetectionSignal = 0x09,

    // Timergesteuert
    BlinkerButton = 0x0a,
    BlinkerSwitch = 0x0b,
    DelayButton = 0x0c,
}

export = InputType;
