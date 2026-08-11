import { getCommand } from './common';

export const MAX_RECEIPT_IMAGE_SIZE = 10 * 1024 * 1024;

const SUPPORTED_RECEIPT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

export type ScannedReceiptItem = {
  name: string;
  price: number;
  quantity?: number;
};

export type ScannedReceipt = {
  total: number | null;
  currency: string | null;
  items: ScannedReceiptItem[];
};

export class ReceiptScanError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ReceiptScanError';
    this.status = status;
    Object.setPrototypeOf(this, ReceiptScanError.prototype);
  }
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new ReceiptScanError('Could not read this image. Please choose another photo.'));
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== 'string' || !result.includes(',')) {
      reject(new ReceiptScanError('Could not read this image. Please choose another photo.'));
      return;
    }
    resolve(result.slice(result.indexOf(',') + 1));
  };
  reader.readAsDataURL(file);
});

export const scanReceipt = async (file: File): Promise<ScannedReceipt> => {
  if (!SUPPORTED_RECEIPT_IMAGE_TYPES.has(file.type)) {
    throw new ReceiptScanError('Choose a JPEG or PNG image.');
  }
  if (!file.size) {
    throw new ReceiptScanError('The selected image is empty.');
  }
  if (file.size > MAX_RECEIPT_IMAGE_SIZE) {
    throw new ReceiptScanError('The receipt image must not exceed 10 MB.');
  }

  const imageBase64 = await fileToBase64(file);
  const response = await fetch(getCommand('receipts/scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: file.type,
    }),
  });

  let payload: any;
  try {
    payload = await response.json();
  } catch (_) {
    throw new ReceiptScanError('Receipt scanning returned an invalid response.', response.status);
  }

  if (!response.ok) {
    throw new ReceiptScanError(payload?.error || 'Receipt scanning failed. Please try again.', response.status);
  }
  if (!payload?.receipt || !Array.isArray(payload.receipt.items)) {
    throw new ReceiptScanError('Receipt scanning returned an invalid response.', response.status);
  }

  return payload.receipt as ScannedReceipt;
};
