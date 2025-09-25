import { ElectronAPI } from '@electron-toolkit/preload'

export interface IpcApi {
  listFiles: (directoryPath: string) => Promise<{ name: string; isDirectory: boolean }[]>
  readImageMetadata: (filePath: string) => Promise<Record<string, unknown>>
  writeImageMetadata: (
    filePath: string,
    data: { UserComment?: string }
  ) => Promise<{ status: string; message: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IpcApi
  }
}
