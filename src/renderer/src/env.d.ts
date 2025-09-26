/// <reference types="vite/client" />

declare module '*.png' {
  const src: string
  export default src
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: unknown[]) => void
        on: (channel: string, func: (...args: unknown[]) => void) => () => void
        once: (channel: string, func: (...args: unknown[]) => void) => void
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      }
    }
    api: {
      readImageMetadata: (filePath: string) => Promise<Record<string, unknown>>
      writeImageMetadata: (
        filePath: string,
        data: { UserComment?: string }
      ) => Promise<{ status: string; message: string }>
      listFiles: (directoryPath: string) => Promise<{ name: string; isDirectory: boolean }[]>
    }
  }
}
