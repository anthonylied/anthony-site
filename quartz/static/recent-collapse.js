// Turns the "recent posts" box into a collapsible one, closed by default, with an arrow like the
// explorer's. Quartz rebuilds the page on every navigation, so it is set up again each time;
// whether it was left open is remembered in between.
;(() => {
  if (window.__recentCollapseReady) return
  window.__recentCollapseReady = true

  let open = false

  const setup = () => {
    document.querySelectorAll(".recent-notes").forEach((box) => {
      if (box.dataset.collapsible) return
      const heading = box.querySelector(":scope > h3")
      if (!heading) return
      box.dataset.collapsible = "true"
      heading.setAttribute("role", "button")
      heading.setAttribute("tabindex", "0")

      const apply = () => {
        box.classList.toggle("collapsed", !open)
        heading.setAttribute("aria-expanded", String(open))
      }
      const toggle = () => {
        open = !open
        apply()
      }
      heading.addEventListener("click", toggle)
      heading.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          toggle()
        }
      })
      apply()
    })
  }

  document.addEventListener("nav", setup)
  document.addEventListener("render", setup)
  if (document.readyState !== "loading") setup()
  else document.addEventListener("DOMContentLoaded", setup)
})()
