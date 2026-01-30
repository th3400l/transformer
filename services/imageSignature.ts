const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const DIGITAL_ID_KEYWORD = 'handwriting.id';

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = createCrcTable();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const index = (crc ^ bytes[i]) & 0xff;
    crc = (crc >>> 8) ^ CRC_TABLE[index];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function embedPngDigitalId(buffer: ArrayBuffer, digitalId: string): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8 || !arraysEqual(bytes.subarray(0, 8), PNG_SIGNATURE)) {
    return bytes;
  }

  const keywordBuffer = new TextEncoder().encode(`${DIGITAL_ID_KEYWORD}\0${digitalId}`);
  const chunkType = new TextEncoder().encode('tEXt');
  const chunkLength = keywordBuffer.length;

  const chunk = new Uint8Array(12 + chunkLength);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, chunkLength);
  chunk.set(chunkType, 4);
  chunk.set(keywordBuffer, 8);

  const crc = crc32(chunk.subarray(4, 8 + chunkLength));
  view.setUint32(8 + chunkLength, crc);

  // Insert before IEND chunk
  let offset = 8;
  while (offset < bytes.length) {
    const length = new DataView(bytes.buffer, offset, 4).getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (type === 'IEND') {
      break;
    }

    offset += 12 + length;
  }

  const result = new Uint8Array(bytes.length + chunk.length);
  result.set(bytes.subarray(0, offset), 0);
  result.set(chunk, offset);
  result.set(bytes.subarray(offset), offset + chunk.length);

  return result;
}

function embedJpegDigitalId(buffer: ArrayBuffer, digitalId: string): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  const commentText = `X-Handwriting-ID:${digitalId}`;
  const commentBytes = new TextEncoder().encode(commentText);
  const segmentLength = commentBytes.length + 2; // includes length bytes

  const segment = new Uint8Array(4 + commentBytes.length);
  segment[0] = 0xff;
  segment[1] = 0xfe; // COM marker
  segment[2] = (segmentLength >> 8) & 0xff;
  segment[3] = segmentLength & 0xff;
  segment.set(commentBytes, 4);

  const result = new Uint8Array(bytes.length + segment.length);
  result.set(bytes.subarray(0, 2), 0); // SOI
  result.set(segment, 2);
  result.set(bytes.subarray(2), 2 + segment.length);

  return result;
}

export async function embedDigitalSignature(blob: Blob, digitalId: string, format: string): Promise<Blob> {
  try {
    const lowerFormat = (format || 'png').toLowerCase();
    const buffer = await blob.arrayBuffer();

    if (lowerFormat.includes('png')) {
      const modified = embedPngDigitalId(buffer, digitalId);
      return new Blob([modified], { type: blob.type || 'image/png' });
    }

    if (lowerFormat.includes('jpeg') || lowerFormat.includes('jpg')) {
      const modified = embedJpegDigitalId(buffer, digitalId);
      return new Blob([modified], { type: blob.type || 'image/jpeg' });
    }

    // Unknown format; return original
    return blob;
  } catch (error) {
    console.warn('Failed to embed digital signature:', error);
    return blob;
  }
}

