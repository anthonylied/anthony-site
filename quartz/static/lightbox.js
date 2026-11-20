// Click an image in a post to see it full screen. Click anywhere or press Esc to close.
// Photos in an album get arrows (and arrow keys / swiping) to flip through the album.
// One listener on the whole document, so it keeps working as Quartz swaps pages.
;(() => {
  if (window.__lightboxReady) return
  window.__lightboxReady = true

  let overlay = null
  let photos = [] // the images you can flip through: one, or a whole album
  let index = 0
  let track = null // the album's slideshow, to sync it when closing

  function close() {
    if (!overlay) return
    overlay.remove()
    overlay = null
    document.documentElement.style.overflow = ""
    if (track && track.albumGo) track.albumGo(index)
    track = null
  }

  function show(i) {
    index = (i + photos.length) % photos.length
    const src = photos[index]
    const big = overlay.querySelector(".lightbox-img")
    big.src = src.currentSrc || src.src
    big.alt = src.alt
    const caption = src.closest("figure")?.querySelector("figcaption")?.textContent ?? ""
    const cap = overlay.querySelector(".lightbox-caption")
    cap.textContent = caption
    cap.hidden = !caption
    const count = overlay.querySelector(".lightbox-count")
    if (count) count.textContent = `${index + 1} / ${photos.length}`
  }

  function button(className, label, text, onClick) {
    const b = document.createElement("button")
    b.className = className
    b.setAttribute("aria-label", label)
    b.textContent = text
    b.addEventListener("click", (e) => {
      e.stopPropagation() // don't let the click close the overlay
      onClick()
    })
    return b
  }

  function open(img) {
    track = img.closest(".album-track")
    photos = track ? [...track.querySelectorAll("img")] : [img]

    overlay = document.createElement("div")
    overlay.className = "lightbox"
    overlay.setAttribute("role", "dialog")
    overlay.setAttribute("aria-label", "Enlarged image. Click or press Escape to close.")

    const big = document.createElement("img")
    big.className = "lightbox-img"
    const cap = document.createElement("div")
    cap.className = "lightbox-caption"
    overlay.append(big, cap)

    if (photos.length > 1) {
      const count = document.createElement("div")
      count.className = "lightbox-count"
      overlay.append(
        button("lightbox-prev", "Previous photo", "‹", () => show(index - 1)),
        button("lightbox-next", "Next photo", "›", () => show(index + 1)),
        count,
      )
      // Swipe left/right on phones
      let startX = null
      overlay.addEventListener("pointerdown", (e) => (startX = e.clientX))
      overlay.addEventListener("pointerup", (e) => {
        if (startX === null) return
        const dx = e.clientX - startX
        startX = null
        if (Math.abs(dx) > 50) {
          overlay.dataset.swiped = "true"
          show(dx < 0 ? index + 1 : index - 1)
        }
      })
    }

    overlay.addEventListener("click", () => {
      // A swipe also ends in a click; only a real tap closes
      if (overlay.dataset.swiped) {
        delete overlay.dataset.swiped
        return
      }
      close()
    })

    document.body.appendChild(overlay)
    document.documentElement.style.overflow = "hidden"
    show(photos.indexOf(img))
  }

  document.addEventListener("click", (e) => {
    if (overlay) return
    const img = e.target.closest && e.target.closest("article img")
    // Leave images that are links alone, so clicking them still follows the link
    if (!img || img.closest("a")) return
    // Album previews jump the slideshow instead of enlarging
    if (img.closest(".album-thumb")) return
    e.preventDefault()
    open(img)
  })

  document.addEventListener("keydown", (e) => {
    if (!overlay) return
    if (e.key === "Escape") close()
    if (photos.length > 1 && e.key === "ArrowLeft") show(index - 1)
    if (photos.length > 1 && e.key === "ArrowRight") show(index + 1)
  })

  // Close if the reader navigates to another page while it's open
  document.addEventListener("nav", close)
})()
