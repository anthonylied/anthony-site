// Turn on color fading just before the dark mode button switches the theme,
// then turn it off again so nothing else on the page animates.
;(() => {
  if (window.__themeFadeReady) return
  window.__themeFadeReady = true

  let timer
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest || !e.target.closest(".darkmode")) return
      const root = document.documentElement
      root.classList.add("theme-fading")
      clearTimeout(timer)
      timer = setTimeout(() => root.classList.remove("theme-fading"), 900)
    },
    true, // capture: runs before the button's own click handler
  )
  // On phones the dark mode button and © line only show once you reach the bottom of the page
  // (the CSS only uses this class on narrow screens).
  const root = document.documentElement
  const updateAtBottom = () => {
    const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 40
    root.classList.toggle("at-page-bottom", atBottom)
  }
  window.addEventListener("scroll", updateAtBottom, { passive: true })
  window.addEventListener("resize", updateAtBottom)
  window.addEventListener("load", updateAtBottom)
  document.addEventListener("nav", () => setTimeout(updateAtBottom, 100))
  // Images and fonts change the page height after load
  if (window.ResizeObserver) new ResizeObserver(updateAtBottom).observe(document.body)
  updateAtBottom()
})()
