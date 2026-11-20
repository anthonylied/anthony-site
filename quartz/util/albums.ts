/**
 * Folder albums: inside an album box, `folder: <name>` is replaced with every photo in that
 * folder before the post is parsed, so the normal album slideshow (quartz/static/album.js)
 * takes it from there.
 *
 *   > [!album] japan trip
 *   > folder: japan
 *
 * The folder is looked up in content/images/<name>, then content/<name>.
 * Photos are sorted by filename (2 before 10). Captions come from:
 *   1. captions.txt in the folder, one per line:  IMG_4821.jpg: first night in tokyo
 *   2. otherwise the filename: "01 first night in tokyo.jpg" -> "first night in tokyo".
 *      Leading numbers only set the order. Camera names like IMG_4821.jpg get no caption.
 */
import fs from "fs"
import path from "path"

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".jxl"])
const CAMERA_NAME = /^(img|dsc|dscf|dscn|pxl|mvimg|gopr|dji|photo|screenshot|image)[\s_-]*\d/i
const ALBUM_START = /^>\s*\[!album\]/i
const FOLDER_LINE = /^>\s*folder:\s*(.+?)\s*$/i

export function captionFromFilename(file: string): string {
  const name = path.parse(file).name
  if (CAMERA_NAME.test(name)) return ""
  const caption = name
    .replace(/^\d+[\s._-]*/, "") // order number
    .replace(/_/g, " ")
    .trim()
  return /^[\d\s._-]*$/.test(caption) ? "" : caption
}

function readCaptionsFile(dir: string): Map<string, string> {
  const captions = new Map<string, string>()
  const file = path.join(dir, "captions.txt")
  if (!fs.existsSync(file)) return captions
  for (const line of fs.readFileSync(file, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^:#][^:]*?)\s*:\s*(.+?)\s*$/)
    if (match) captions.set(match[1].toLowerCase(), match[2])
  }
  return captions
}

// Keep caption text literal inside *italics*
function escapeMarkdown(text: string): string {
  return text.replace(/([\\*_[\]`])/g, "\\$1")
}

function albumLines(contentDir: string, folder: string): string[] {
  const clean = folder.replace(/^\/+|\/+$/g, "")
  const candidates = [path.join("images", clean), clean]
  const rel = candidates.find((c) => {
    const full = path.join(contentDir, c)
    return fs.existsSync(full) && fs.statSync(full).isDirectory()
  })
  if (!rel) {
    console.warn(`[albums] folder "${folder}" not found in content/images or content`)
    return [`> *album folder "${escapeMarkdown(folder)}" not found*`]
  }

  const dir = path.join(contentDir, rel)
  const captions = readCaptionsFile(dir)
  const files = fs.readdirSync(dir)
  const photos = files
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))

  const skipped = files.filter((f) => /\.hei[cf]$/i.test(f))
  if (skipped.length > 0) {
    console.warn(
      `[albums] skipped ${skipped.length} HEIC photo(s) in ${rel}: browsers can't show them, convert to JPG`,
    )
  }
  if (photos.length === 0) return [`> *album folder "${escapeMarkdown(folder)}" has no photos*`]

  const lines: string[] = []
  const linkDir = rel.split(path.sep).join("/")
  for (const photo of photos) {
    // Characters that would break a [[link]]
    if (/[#|[\]^]/.test(photo)) {
      console.warn(`[albums] skipped "${photo}": remove # | [ ] ^ from the filename`)
      continue
    }
    lines.push(`> ![[${linkDir}/${photo}]]`)
    const caption = captions.get(photo.toLowerCase()) ?? captionFromFilename(photo)
    if (caption) lines.push(`> *${escapeMarkdown(caption)}*`)
  }
  return lines
}

export function expandFolderAlbums(src: string, contentDir: string): string {
  if (!/\[!album\]/i.test(src) || !/folder:/i.test(src)) return src
  const out: string[] = []
  let inAlbum = false
  for (const line of src.split("\n")) {
    if (ALBUM_START.test(line)) inAlbum = true
    else if (!line.startsWith(">")) inAlbum = false

    const folder = inAlbum ? line.match(FOLDER_LINE) : null
    if (folder) out.push(...albumLines(contentDir, folder[1]))
    else out.push(line)
  }
  return out.join("\n")
}
