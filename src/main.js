import { optimise as optimisePng } from '@jsquash/oxipng';

import { decode, encode } from '@jsquash/jpeg';
const input = document.getElementById('fileInput');
const original = document.getElementById('originalPreview');
const compressed = document.getElementById('compressedPreview');


export async function compressJpeg(file, quality = 75) {
  const arrayBuffer = await file.arrayBuffer();

  const decoded = await decode(new Uint8Array(arrayBuffer));
  const encoded = await encode(decoded, { quality });

  return new Blob([encoded], { type: 'image/jpeg' });
}

input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  original.src = URL.createObjectURL(file);
  const arrayBuffer = await file.arrayBuffer();

  let compressedBuffer, mime;

  if (file.type === 'image/png') {
    compressedBuffer = await optimisePng(arrayBuffer, { level: 3 });
    mime = 'image/png';
  } else if (file.type === 'image/jpeg') {
    compressedBuffer = await compressJpeg(file, 75);
    mime = 'image/jpeg';
  } else {
    alert('Unsupported file type');
    return;
  }

  const blob = new Blob([compressedBuffer], { type: mime });
  compressed.src = URL.createObjectURL(blob);
});
