import outdent from 'outdent'
import logUpdate from 'log-update'

export enum LoggerStatus {
  Started = 'started',
  Completed = 'completed',
}

interface LoggerInfo {
  key: string
  message: string
  status: LoggerStatus
}

class BasicLogger {
  private static readonly infos: LoggerInfo[] = []

  protected static log() {
    logUpdate(
      this.infos.reduce(
        (result, { message, status }) => outdent`
      ${result}
      ${message} [${status}]
    `,
        '',
      ),
    )
  }

  protected static updateInfos(info: LoggerInfo) {
    const index = this.infos.findIndex(({ key }) => key === info.key)

    if (index !== -1) {
      this.infos[index] = info
    } else {
      this.infos.push(info)
    }

    this.log()
  }
}

export class Logger extends BasicLogger {
  constructor(private readonly key: string) {
    super()
  }

  log(message: string, status: LoggerStatus) {
    Logger.updateInfos({ key: this.key, message, status })
  }
}
