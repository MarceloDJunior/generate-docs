const fs = require('fs')
const target = process.argv[2]
if (!target) { console.error('Usage: node cleanup.js <file-or-dir>'); process.exit(1) }
const stat = fs.statSync(target)
if (stat.isDirectory()) {
  fs.rmSync(target, { recursive: true, force: true })
} else {
  fs.unlinkSync(target)
}
