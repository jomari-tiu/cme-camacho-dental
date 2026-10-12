/**
 * Reads an uploaded image, downsizes it and returns a data URL small enough
 * to keep in browser storage. SVGs and GIFs are kept as-is.
 */
export async function fileToDataUrl(file: File, maxSize = 1600, quality = 0.85): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error("Could not read image"))
    i.src = raw
  })
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
  // webp keeps transparency (logos) and is much smaller than png
  const out = canvas.toDataURL("image/webp", quality)
  return out.startsWith("data:image/webp") ? out : canvas.toDataURL("image/png")
}
