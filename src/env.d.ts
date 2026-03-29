/// <reference types="vite/client" />
/// <reference types="@ztools-center/ztools-api-types" />

// Preload services 类型声明（对应 public/preload/services.js）
interface Services {
  readFile: (file: string) => string
  writeTextFile: (text: string) => string
  writeImageFile: (base64Url: string) => string | undefined
  launchApp: (appPath: string) => boolean
  launchAppWithArgs: (appPath: string, args: string[]) => boolean
  runAsAdmin: (cmd: string) => boolean
  getAppIcon: (exePath: string) => string | null
}

declare global {
  interface Window {
    services: Services
  }
}

export {}
