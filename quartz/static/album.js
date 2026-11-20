// Albums: turns an album box in a post into a swipeable slideshow.
//
//   > [!album] my trip
//   > ![[photo1.jpg]]
//   > *optional caption for photo 1*
//   > ![[photo2.jpg]]
//
// Swiping and scrolling are the browser's own scroll-snap, so it stays smooth on phones.
;(() => {
  if (window.__albumReady) return
  window.__albumReady = true

  function el(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text) node.textContent = text
    return node
  }

  function build(callout) {
    if (callout.dataset.albumReady) return
    const content = callout.querySelector(":scope > .callout-content")
    if (!content) return
    const imgs = [...content.querySelectorAll("img")]
    if (imgs.length === 0) return
    callout.dataset.albumReady = "true"

    const track = el("div", "album-track")
    track.tabIndex = 0
    track.setAttribute("aria-label", "Photo album. Use the arrow keys to move between photos.")

    imgs.forEach((img, i) => {
      // A caption is the first italic line after this photo, before the next photo
      let caption = null
      for (let n = img.nextSibling; n && n.nodeName !== "IMG"; n = n.nextSibling) {
        if (n.nodeName === "EM") {
          caption = n.textContent
          break
        }
      }
      const slide = el("figure", "album-slide")
      img.removeAttribute("width")
      img.removeAttribute("height")
      if (i > 0) img.loading = "lazy"
      slide.appendChild(img)
      if (caption) slide.appendChild(el("figcaption", null, caption))
      track.appendChild(slide)
    })

    const album = el("div", "album")
    album.appendChild(track)
    content.replaceChildren(album)

    const total = imgs.length
    if (total > 1) {
      const prev = el("button", "album-prev", "‹")
      const next = el("button", "album-next", "›")
      const count = el("div", "album-count")
      prev.setAttribute("aria-label", "Previous photo")
      next.setAttribute("aria-label", "Next photo")
      // Row of small previews under the slideshow; click one to jump to it
      const thumbs = el("div", "album-thumbs")
      imgs.forEach((img, i) => {
        const thumb = el("button", "album-thumb")
        thumb.setAttribute("aria-label", `Show photo ${i + 1}`)
        const small = document.createElement("img")
        small.src = img.getAttribute("src")
        small.alt = ""
        small.decoding = "async"
        thumb.appendChild(small)
        thumb.addEventListener("click", () => go(i))
        thumbs.appendChild(thumb)
      })
      album.append(prev, next, count, thumbs)

      const current = () =>
        track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0
      const go = (i, smooth = true) =>
        track.scrollTo({
          left: Math.max(0, Math.min(total - 1, i)) * track.clientWidth,
          behavior: smooth ? "smooth" : "instant",
        })
      const update = () => {
        const i = current()
        count.textContent = `${i + 1} / ${total}`
        prev.disabled = i === 0
        next.disabled = i === total - 1
        ;[...thumbs.children].forEach((thumb, j) => {
          thumb.classList.toggle("active", j === i)
          if (j === i) thumb.setAttribute("aria-current", "true")
          else thumb.removeAttribute("aria-current")
        })
        // Keep the current preview in view (scrolls only the row, never the page)
        const active = thumbs.children[i]
        if (active && thumbs.scrollWidth > thumbs.clientWidth) {
          thumbs.scrollTo({
            left: active.offsetLeft - thumbs.clientWidth / 2 + active.offsetWidth / 2,
            behavior: "smooth",
          })
        }
      }

      let frame = 0
      track.addEventListener("scroll", () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(update)
      })
      prev.addEventListener("click", () => go(current() - 1))
      next.addEventListener("click", () => go(current() + 1))
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") go(current() - 1)
        if (e.key === "ArrowRight") go(current() + 1)
      })
      // Lets the enlarged view leave the album on the photo you stopped at
      track.albumGo = (i) => go(i, false)
      update()
    }
  }

  function init() {
    document.querySelectorAll('.callout[data-callout="album"]').forEach(build)
  }

  // Quartz swaps pages without a full reload and fires "nav" each time
  document.addEventListener("nav", init)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
