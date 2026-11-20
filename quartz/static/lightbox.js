// Click an image in a post to see it full screen. Click anywhere or press Esc to close.
// One listener on the whole document, so it keeps working as Quartz swaps pages.
;(() => {
  if (window.__lightboxReady) return
  window.__lightboxReady = true

  let overlay = null

  function close() {
    if (!overlay) return
    overlay.remove()
    overlay = null
    document.documentElement.style.overflow = ""
  }

  function open(img) {
    overlay = document.createElement("div")
    overlay.className = "lightbox"
    overlay.setAttribute("role", "dialog")
    overlay.setAttribute("aria-label", "Enlarged image. Click or press Escape to close.")

    const big = document.createElement("img")
    big.src = img.currentSrc || img.src
    big.alt = img.alt
    overlay.appendChild(big)

    overlay.addEventListener("click", close)
    document.body.appendChild(overlay)
    document.documentElement.style.overflow = "hidden"
  }

  document.addEventListener("click", (e) => {
    const img = e.target.closest && e.target.closest("article img")
    // Leave images that are links alone, so clicking them still follows the link
    if (!img || img.closest("a")) return
    e.preventDefault()
    open(img)
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close()
  })

  // Close if the reader navigates to another page while it's open
  document.addEventListener("nav", close)
})()
