const fs = require('node:fs')
const path = require('node:path')
const { spawn, execSync } = require('node:child_process')

window.services = {
  readFile(file) {
    return fs.readFileSync(file, { encoding: 'utf-8' })
  },
  writeTextFile(text) {
    const filePath = path.join(window.ztools.getPath('downloads'), Date.now().toString() + '.txt')
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' })
    return filePath
  },
  writeImageFile(base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url)
    if (!matchs) return
    const filePath = path.join(
      window.ztools.getPath('downloads'),
      Date.now().toString() + '.' + matchs[1]
    )
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' })
    return filePath
  },
  launchApp(appPath) {
    try {
      spawn(appPath, [], { detached: true, shell: true })
      return true
    } catch (err) {
      return false
    }
  },
  launchAppWithArgs(appPath, args) {
    try {
      spawn(appPath, args, { detached: true, shell: true })
      return true
    } catch (err) {
      return false
    }
  },
  runAsAdmin(cmd) {
    try {
      spawn('cmd', ['/c', cmd], { detached: true, shell: true })
      return true
    } catch (err) {
      return false
    }
  },
  getAppIcon(exePath) {
    try {
      const tempDir = path.join(window.ztools.getPath('temp'), 'icons')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      const iconName = 'icon_' + Date.now() + '.png'
      const iconPath = path.join(tempDir, iconName)
      
      const escapedPath = exePath.replace(/'/g, "''")
      const escapedIconPath = iconPath.replace(/\\/g, '\\\\').replace(/'/g, "''")
      
      const cmd = 'powershell -Command "Add-Type -AssemblyName System.Drawing; $icon = [System.Drawing.Icon]::ExtractAssociatedIcon(\'' + escapedPath + '\'); if ($icon) { $bmp = $icon.ToBitmap(); $bmp.Save(\'' + escapedIconPath + '\', [System.Drawing.Imaging.ImageFormat]::Png); $icon.Dispose(); $bmp.Dispose(); Write-Output \'OK\' }"'
      
      const result = execSync(cmd, { encoding: 'utf-8' })
      if (result.includes('OK') && fs.existsSync(iconPath)) {
        const imgBuffer = fs.readFileSync(iconPath)
        const base64 = imgBuffer.toString('base64')
        fs.unlinkSync(iconPath)
        return 'data:image/png;base64,' + base64
      }
    } catch (err) {
      console.error('Get icon failed:', err)
    }
    return null
  }
}