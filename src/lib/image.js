// Shrink an uploaded image on a <canvas> so the base64 string stays small enough to commit to library.json
export function compressImage(file, { maxWidth = 400, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose an image file'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff' // JPEG has no alpha
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      // WebP where supported, JPEG otherwise
      let out = canvas.toDataURL('image/webp', quality)
      if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', quality)
      resolve(out)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    img.src = url
  })
}
