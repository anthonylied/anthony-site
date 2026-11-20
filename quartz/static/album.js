// Albums: turns an album box in a post into a slideshow.
//
//   > [!album] my trip
//   > folder: japan              <- every photo in content/images/japan (quartz/util/albums.ts)
// or
//   > ![[photo1.jpg]]
//   > *optional caption for photo 1*
//   > ![[photo2.jpg]]
//
// One photo shows at a time, and the frame hugs that photo, so the arrows, counter and
// previews line up with the photo itself whatever its shape.
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

    const stage = el("div", "album-stage")
    stage.tabIndex = 0
    stage.setAttribute("aria-label", "Photo album. Use the arrow keys to move between photos.")

    imgs.forEach((img, i) => {
      // A caption is the first italic line after this photo, before the next photo
      for (let n = img.nextSibling; n && n.nodeName !== "IMG"; n = n.nextSibling) {
        if (n.nodeName === "EM") {
          img.dataset.caption = n.textContent
          break
        }
      }
      img.removeAttribute("width")
      img.removeAttribute("height")
      if (i > 0) img.loading = "lazy"
      stage.appendChild(img)
    })

    const caption = el("p", "album-caption")
    const album = el("div", "album")
    album.append(stage, caption)
    content.replaceChildren(album)

    const total = imgs.length
    let index = 0
    let afterShow = () => {}

    const show = (i) => {
      index = Math.max(0, Math.min(total - 1, i))
      imgs.forEach((img, j) => (img.hidden = j !== index))
      caption.textContent = imgs[index].dataset.caption ?? ""
      caption.hidden = !caption.textContent
      afterShow()
    }
    // Lets the enlarged view leave the album on the photo you stopped at
    stage.albumGo = show

    if (total > 1) {
      const prev = el("button", "album-prev", "‹")
      const next = el("button", "album-next", "›")
      const count = el("div", "album-count")
      prev.setAttribute("aria-label", "Previous photo")
      next.setAttribute("aria-label", "Next photo")
      stage.append(prev, next, count)

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
        thumb.addEventListener("click", () => show(i))
        thumbs.appendChild(thumb)
      })
      album.appendChild(thumbs)

      afterShow = () => {
        count.textContent = `${index + 1} / ${total}`
        prev.disabled = index === 0
        next.disabled = index === total - 1
        ;[...thumbs.children].forEach((thumb, j) => {
          thumb.classList.toggle("active", j === index)
          if (j === index) thumb.setAttribute("aria-current", "true")
          else thumb.removeAttribute("aria-current")
        })
        // Keep the current preview in view (scrolls only the row, never the page)
        const active = thumbs.children[index]
        if (thumbs.scrollWidth > thumbs.clientWidth) {
          thumbs.scrollTo({
            left: active.offsetLeft - thumbs.clientWidth / 2 + active.offsetWidth / 2,
            behavior: "smooth",
          })
        }
      }

      prev.addEventListener("click", () => show(index - 1))
      next.addEventListener("click", () => show(index + 1))
      stage.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") show(index - 1)
        if (e.key === "ArrowRight") show(index + 1)
      })

      // Swipe left/right. A swipe also ends in a click, which must not open the enlarged view.
      let startX = null
      let swiped = false
      stage.addEventListener("pointerdown", (e) => (startX = e.clientX))
      stage.addEventListener("pointerup", (e) => {
        if (startX === null) return
        const dx = e.clientX - startX
        startX = null
        if (Math.abs(dx) > 40) {
          swiped = true
          show(dx < 0 ? index + 1 : index - 1)
        }
      })
      stage.addEventListener(
        "click",
        (e) => {
          if (!swiped) return
          swiped = false
          e.stopPropagation()
        },
        true,
      )
    }

    show(0)
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
