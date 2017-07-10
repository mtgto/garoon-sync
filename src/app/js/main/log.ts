import log from "electron-log";

// Configure logging
log.transports.console.level = "info";
log.transports.file.level = "info";

export default log;
