const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r = 76, g = 175, b = 80) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8); // 8 bit depth
    ihdr.writeUInt8(2, 9); // Truecolor (RGB)
    ihdr.writeUInt8(0, 10); // Compression method
    ihdr.writeUInt8(0, 11); // Filter method
    ihdr.writeUInt8(0, 12); // Interlace method

    function makeChunk(type, data) {
        const typeBuf = Buffer.from(type);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);

        // CRC32 calculation
        let crc = 0xFFFFFFFF;
        for (const byte of Buffer.concat([typeBuf, data])) {
            crc ^= byte;
            for (let k = 0; k < 8; k++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
            }
        }
        crc = (crc ^ 0xFFFFFFFF) >>> 0;
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc, 0);

        return Buffer.concat([len, typeBuf, data, crcBuf]);
    }

    const ihdrChunk = makeChunk('IHDR', ihdr);

    // IDAT chunk (raw scanlines)
    const scanlines = [];
    for (let y = 0; y < height; y++) {
        const line = Buffer.alloc(1 + width * 3);
        line[0] = 0; // Filter: None
        for (let x = 0; x < width; x++) {
            line[1 + x * 3] = r;
            line[1 + x * 3 + 1] = g;
            line[1 + x * 3 + 2] = b;
        }
        scanlines.push(line);
    }
    const rawData = Buffer.concat(scanlines);
    const compressed = zlib.deflateSync(rawData);
    const idatChunk = makeChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '../frontend/assets/icons');
fs.mkdirSync(iconsDir, { recursive: true });

const png192 = createPng(192, 192, 76, 175, 80);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

const png512 = createPng(512, 512, 76, 175, 80);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

console.log('✅ Generated exact 192x192 and 512x512 PNG icons successfully!');
