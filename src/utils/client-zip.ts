/**
 * Pure client-side zero-dependency ZIP archive creator.
 * Compatible with standard ZIP tools and .NET System.IO.Compression.ZipArchive.
 */

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface ZipFileInput {
  path: string;
  data: Uint8Array;
}

export function createZipArchive(files: ZipFileInput[], archiveName = "repository.zip"): File {
  const textEncoder = new TextEncoder();
  const localHeadersAndData: Uint8Array[] = [];
  const centralDirectoryEntries: Uint8Array[] = [];

  let currentOffset = 0;

  for (const file of files) {
    // Normalize path to use forward slashes and no leading slash
    const normalizedPath = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const encodedName = textEncoder.encode(normalizedPath);
    const fileBytes = file.data;
    const crc = calculateCrc32(fileBytes);
    const size = fileBytes.length;

    // Local Header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + encodedName.length);
    const lv = new DataView(localHeader.buffer);

    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);         // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true);     // General purpose bit flag (UTF-8)
    lv.setUint16(8, 0, true);          // Compression method (0 = Store)
    lv.setUint16(10, 0, true);         // File last mod time
    lv.setUint16(12, 0, true);         // File last mod date
    lv.setUint32(14, crc, true);       // CRC-32
    lv.setUint32(18, size, true);      // Compressed size
    lv.setUint32(22, size, true);      // Uncompressed size
    lv.setUint16(26, encodedName.length, true); // File name length
    lv.setUint16(28, 0, true);         // Extra field length
    localHeader.set(encodedName, 30);

    localHeadersAndData.push(localHeader);
    localHeadersAndData.push(fileBytes);

    // Central Directory Entry (46 bytes + name length)
    const cdEntry = new Uint8Array(46 + encodedName.length);
    const cv = new DataView(cdEntry.buffer);

    cv.setUint32(0, 0x02014b50, true); // Central file header signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed to extract
    cv.setUint16(8, 0x0800, true);     // UTF-8 flag
    cv.setUint16(10, 0, true);         // Compression method
    cv.setUint16(12, 0, true);         // File last mod time
    cv.setUint16(14, 0, true);         // File last mod date
    cv.setUint32(16, crc, true);       // CRC-32
    cv.setUint32(20, size, true);      // Compressed size
    cv.setUint32(24, size, true);      // Uncompressed size
    cv.setUint16(28, encodedName.length, true); // File name length
    cv.setUint16(30, 0, true);         // Extra field length
    cv.setUint16(32, 0, true);         // File comment length
    cv.setUint16(34, 0, true);         // Disk number start
    cv.setUint16(36, 0, true);         // Internal file attributes
    cv.setUint32(38, 0, true);         // External file attributes
    cv.setUint32(42, currentOffset, true); // Relative offset of local header
    cdEntry.set(encodedName, 46);

    centralDirectoryEntries.push(cdEntry);

    currentOffset += localHeader.length + fileBytes.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const entry of centralDirectoryEntries) {
    centralDirSize += entry.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true);          // Number of this disk
  ev.setUint16(6, 0, true);          // Disk with central directory
  ev.setUint16(8, files.length, true); // Total entries on this disk
  ev.setUint16(10, files.length, true); // Total entries
  ev.setUint32(12, centralDirSize, true); // Size of central directory
  ev.setUint32(16, centralDirOffset, true); // Offset of central directory
  ev.setUint16(20, 0, true);         // Comment length

  const allChunks = [
    ...localHeadersAndData,
    ...centralDirectoryEntries,
    eocd,
  ];

  return new File(allChunks as unknown as BlobPart[], archiveName, { type: "application/zip" });
}

/**
 * Filter out typical ignore directories like .git, node_modules, bin, obj
 */
export function shouldIgnorePath(relativePath: string): boolean {
  const parts = relativePath.split(/[/\\]/);
  const ignoredPatterns = new Set([
    ".git",
    "node_modules",
    "bin",
    "obj",
    ".vs",
    ".idea",
    ".vscode",
    "dist",
    "build",
    ".next",
  ]);

  for (const part of parts) {
    if (ignoredPatterns.has(part.toLowerCase())) {
      return true;
    }
  }
  return false;
}
