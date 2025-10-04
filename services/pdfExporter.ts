export interface PdfImageItem {
  blob: Blob;
  width: number;
  height: number;
}
export type PdfQuality = 'high' | 'medium' | 'low';

/**
 * Create a simple multi-page PDF from a list of images (JPEG preferred).
 * If an image isn't JPEG, it will be converted to JPEG using an offscreen canvas.
 */
export async function createPdfFromImages(items: PdfImageItem[], quality: PdfQuality = 'high'): Promise<Blob> {
  const objects: { offset: number; body: Uint8Array }[] = [];
  let pdfParts: Uint8Array[] = [];

  const encoder = new TextEncoder();
  const write = (s: string) => encoder.encode(s);

  let offset = 0;
  const push = (chunk: Uint8Array) => {
    objects.push({ offset, body: chunk });
    offset += chunk.length;
    pdfParts.push(chunk);
  };

  const header = write('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  push(header);

  const xrefIndex: number[] = []; // object offsets (1-based ids mapped later)

  const toJPEG = async (blob: Blob, w: number, h: number): Promise<Blob> => {
    if (blob.type === 'image/jpeg') return blob;
    const img = await blobToImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    const q = quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5;
    const jpeg = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('JPEG conversion failed')), 'image/jpeg', q));
    return jpeg;
  };

  const blobToImage = (blob: Blob): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });

  // Will assign IDs after creating all objects
  const imageObjIds: number[] = [];
  const contentObjIds: number[] = [];
  const pageObjIds: number[] = [];

  // Helper to add an object and return its id
  const addObject = (content: string | Uint8Array): number => {
    const id = xrefIndex.length + 1; // IDs start at 1
    const head = write(`${id} 0 obj\n`);
    const body = typeof content === 'string' ? write(content) : content;
    const tail = write('\nendobj\n');
    const combined = concat([head, body, tail]);
    xrefIndex.push(offset);
    push(combined);
    return id;
  };

  const addStreamObject = (dict: string, data: Uint8Array): number => {
    const id = xrefIndex.length + 1;
    const head = write(`${id} 0 obj\n${dict}\nstream\n`);
    const tail = write('\nendstream\nendobj\n');
    xrefIndex.push(offset);
    push(head);
    push(data);
    push(tail);
    return id;
  };

  const concat = (arr: Uint8Array[]): Uint8Array => {
    const total = arr.reduce((a, b) => a + b.length, 0);
    const out = new Uint8Array(total);
    let p = 0;
    for (const a of arr) { out.set(a, p); p += a.length; }
    return out;
  };

  // Build all image and page objects
  for (let i = 0; i < items.length; i++) {
    const { blob, width, height } = items[i];
    const jpegBlob = await toJPEG(blob, width, height);
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

    const imgDict = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`;
    const imgId = addStreamObject(imgDict, jpegBytes);
    imageObjIds.push(imgId);

    const contentStr = `q\n${width} 0 0 ${height} 0 0 cm\n/Im${i} Do\nQ`;
    const contentId = addStreamObject(`<< /Length ${contentStr.length} >>`, write(contentStr));
    contentObjIds.push(contentId);

    const pageDict = `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    // Parent updated later; use placeholder "0 0 R"
    const pageId = addObject(pageDict);
    pageObjIds.push(pageId);
  }

  // Pages object
  const kids = pageObjIds.map(id => `${id} 0 R`).join(' ');
  const pagesId = addObject(`<< /Type /Pages /Count ${pageObjIds.length} /Kids [ ${kids} ] >>`);

  // Update each page to point to pagesId by appending a small object that overrides Parent via reference is complex.
  // For simplicity, re-add page objects with correct Parent and keep the old ones unused is not ideal; instead we reference via /Parent at creation was placeholder.
  // A minimal approach: leave as-is is technically invalid; so rebuild the page objects properly.
  // Rebuild: remove the old entries by not referencing them anywhere is okay; but we already referenced them in Kids.
  // Alternative: we ensure /Parent is correct initially. Let's redo: This approach is complex in streaming builder.
  // Workaround: We'll create new correct page objects and point Kids to those. The old ones are unreferenced and harmless.
  const correctedPageObjIds: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const pageDict = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${items[i].width} ${items[i].height}] /Resources << /XObject << /Im${i} ${imageObjIds[i]} 0 R >> >> /Contents ${contentObjIds[i]} 0 R >>`;
    const pageId = addObject(pageDict);
    correctedPageObjIds.push(pageId);
  }

  // Correct pages kids list
  const correctedKids = correctedPageObjIds.map(id => `${id} 0 R`).join(' ');
  const pages2Id = addObject(`<< /Type /Pages /Count ${correctedPageObjIds.length} /Kids [ ${correctedKids} ] >>`);

  // Catalog object
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pages2Id} 0 R >>`);

  // XRef table
  const xrefStart = offset;
  const xrefHeader = write(`xref\n0 ${xrefIndex.length + 1}\n0000000000 65535 f \n`);
  push(xrefHeader);
  for (const off of xrefIndex) {
    const line = ('0000000000' + off).slice(-10) + ' 00000 n \n';
    push(write(line));
  }

  // Trailer
  const trailer = write(`trailer\n<< /Size ${xrefIndex.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  push(trailer);

  // Return blob
  const blob = new Blob(pdfParts, { type: 'application/pdf' });
  return blob;
}
