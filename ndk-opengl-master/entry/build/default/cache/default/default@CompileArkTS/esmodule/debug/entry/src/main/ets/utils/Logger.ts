import hilog from "@ohos:hilog";
class LoggerModel {
    private domain: number;
    private prefix: string;
    private format: string = '%{public}s';
    constructor(prefix: string) {
        this.prefix = prefix;
        this.domain = 0xFF00;
    }
    debug(...args: string[]) {
        hilog.debug(this.domain, this.prefix, this.format, args);
    }
    info(...args: string[]) {
        hilog.info(this.domain, this.prefix, this.format, args);
    }
    warn(...args: string[]) {
        hilog.warn(this.domain, this.prefix, this.format, args);
    }
    error(...args: string[]) {
        hilog.error(this.domain, this.prefix, this.format, args);
    }
}
export let Logger = new LoggerModel('[Sample_OpenGL]');
