// The explorer opens the folder holding the current page using the url in the "nav"/"render"
// event. The encrypted-pages plugin fires a bare "render" event (no url) after a page loads,
// which made the explorer forget where we are and collapse the open folder. Give those events
// the current page's slug so the folder stays open.
;(() => {
  if (window.__explorerKeepOpenReady) return
  window.__explorerKeepOpenReady = true

  window.addEventListener(
    "render",
    (e) => {
      if (e.detail && e.detail.url) return
      const slug = document.body && document.body.dataset.slug
      if (!slug) return
      e.stopImmediatePropagation()
      document.dispatchEvent(new CustomEvent("render", { detail: { url: slug } }))
    },
    true, // capture on window: runs before any listener on document
  )
})()
