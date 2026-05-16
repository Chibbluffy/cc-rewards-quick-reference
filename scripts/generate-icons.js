// Generates PWA icons without external dependencies (uses built-in zlib for PNG)
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  const rowLen = 1 + size * 3
  const raw = Buffer.alloc(size * rowLen)

  // Colors (zinc-950 bg, zinc-800 card, zinc-700 stripe, emerald-500 chip)
  const BG    = [9, 9, 11]
  const CARD  = [39, 39, 42]
  const STRIPE= [63, 63, 70]
  const CHIP  = [16, 185, 129]

  const m = Math.round(size * 0.13)
  const cw = size - m * 2
  const ch = Math.round(cw * 0.63)
  const cx = m
  const cy = Math.round((size - ch) / 2)

  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      let [r, g, b] = BG
      if (x >= cx && x < cx + cw && y >= cy && y < cy + ch) {
        ;[r, g, b] = CARD
        // magnetic stripe band
        if (y >= cy + Math.round(ch * 0.28) && y < cy + Math.round(ch * 0.52))
          ;[r, g, b] = STRIPE
        // chip (bottom-left of card)
        const chipX = cx + Math.round(cw * 0.08)
        const chipY = cy + Math.round(ch * 0.60)
        const chipW = Math.round(cw * 0.22)
        const chipH = Math.round(ch * 0.20)
        if (x >= chipX && x < chipX + chipW && y >= chipY && y < chipY + chipH)
          ;[r, g, b] = CHIP
      }
      const off = y * rowLen + 1 + x * 3
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
    }
  }

  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

writeFileSync('public/icons/icon-192.png', makePNG(192))
writeFileSync('public/icons/icon-512.png', makePNG(512))
console.log('✓ public/icons/icon-192.png')
console.log('✓ public/icons/icon-512.png')
