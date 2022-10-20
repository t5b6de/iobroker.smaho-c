enum PacketType {
    Status = 0xff,
    Ping = 0x01,
    Output = 0x02,
    OutputChange = 0xa2,
    InputChange = 0x03,
    StateRequest = 0x04,
    StateResponse = 0xa4,
    InfoRequest = 0x05,
    InfoResponse = 0xa5,

    MotionDetectionModeSet = 0x0c,
    MotionDetectionModeChange = 0xac,

    SetSmartMode = 0x0b,

    // Config:
    // Nameings:
    ConfigNameRead = 0x06,
    ConfigNameResponse = 0xa6,
    ConfigNameWrite = 0xb6,

    // Output-Groups:
    ConfigOutputRead = 0x07,
    ConfigOutputResponse = 0xa7,
    ConfigOutputWrite = 0xb7,

    // Input-Types:
    ConfigInputRead = 0x08,
    ConfigInputResponse = 0xa8,
    ConfigInputWrite = 0xb8,

    // Motion Detection Sensors:
    ConfigMdsRead = 0x09,
    ConfigMdsResponse = 0xa9,
    ConfigMdsWrite = 0xb9,

    // EEPROM Direktzugriff:
    EeDumpRead = 0x0a,
    EeDumpResponse = 0xaa,
    EeDumpWrite = 0xba,

    // Smart Meter Daten
    SmlData = 0x53,

    Undef = 0x100,
}

export = PacketType;
