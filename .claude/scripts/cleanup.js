const fs = require('fs')
const path = process.argv[2]
if (!path) { console.error('Usage: node cleanup.js <file>'); process.exit(1) }
fs.unlinkSync(path)
