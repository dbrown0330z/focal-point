import sharp from 'sharp'

/**
 * Computes a difference hash (dHash) of an image.
 * Resize to 9×8 grayscale, compare adjacent pixels row-wise → 64-bit hash as hex.
 * Two versions of the same image (resized, re-exported, lightly cropped) will produce
 * very similar hashes. Use hashSimilarity() to compare.
 */
export async function computeImageHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let hash = 0n
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left  = data[row * 9 + col]
      const right = data[row * 9 + col + 1]
      hash = (hash << 1n) | (left > right ? 1n : 0n)
    }
  }
  return hash.toString(16).padStart(16, '0')
}

/** Returns a 0–1 similarity score between two dHashes. 1.0 = identical. */
export function hashSimilarity(h1: string, h2: string): number {
  let xor = BigInt('0x' + h1) ^ BigInt('0x' + h2)
  let bits = 0
  while (xor > 0n) {
    if (xor & 1n) bits++
    xor >>= 1n
  }
  return (64 - bits) / 64
}
