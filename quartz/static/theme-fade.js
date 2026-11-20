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
      timer = setTimeout(() => root.classList.remove("theme-fading"), 500)
    },
    true, // capture: runs before the button's own click handler
  )
})()
