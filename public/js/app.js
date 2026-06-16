// Toasts + AJAX cart/wishlist actions.
// Forms tagged with `.js-action-form` are submitted via fetch so the user gets
// instant feedback (toast + live navbar badge) without a full page reload.
// If JavaScript is disabled, the same forms still POST normally and the server
// falls back to its flash-message + redirect behaviour.
(function () {
  'use strict'

  function ensureToastContainer() {
    var c = document.getElementById('toast-container')
    if (!c) {
      c = document.createElement('div')
      c.id = 'toast-container'
      c.className = 'toast-container position-fixed top-0 end-0 p-3'
      c.style.zIndex = '11000'
      document.body.appendChild(c)
    }
    return c
  }

  // Exposed globally so server-rendered pages can trigger toasts too if desired.
  window.showToast = function (message, type) {
    type = type || 'info'
    var bg =
      type === 'success' ? 'bg-success' :
      type === 'danger' ? 'bg-danger' :
      type === 'warning' ? 'bg-warning text-dark' :
      'bg-primary'

    var el = document.createElement('div')
    el.className = 'toast align-items-center text-white border-0 ' + bg
    el.setAttribute('role', 'alert')
    el.setAttribute('aria-live', 'assertive')
    el.setAttribute('aria-atomic', 'true')
    el.innerHTML =
      '<div class="d-flex">' +
        '<div class="toast-body fw-semibold"></div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
      '</div>'
    el.querySelector('.toast-body').textContent = message

    ensureToastContainer().appendChild(el)
    var toast = new bootstrap.Toast(el, { delay: 3500 })
    toast.show()
    el.addEventListener('hidden.bs.toast', function () { el.remove() })
  }

  function setBadge(id, count) {
    var badge = document.getElementById(id)
    if (!badge) return
    badge.textContent = count
    badge.classList.toggle('d-none', !count)
  }

  document.addEventListener('submit', function (e) {
    var form = e.target
    if (!form.classList || !form.classList.contains('js-action-form')) return
    e.preventDefault()

    var btn = form.querySelector('button[type="submit"]')
    var original = btn ? btn.innerHTML : null
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
    }

    fetch(form.action, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(new FormData(form)).toString()
    })
      .then(function (res) {
        // requireAuth redirects guests to /login — follow it.
        if (res.redirected) { window.location.href = res.url; return null }
        return res.json()
      })
      .then(function (data) {
        if (!data) return
        window.showToast(data.msg, data.type)
        if (typeof data.itemCount !== 'undefined') setBadge('cart-count', data.itemCount)
        if (typeof data.wishlistCount !== 'undefined') setBadge('wishlist-count', data.wishlistCount)
      })
      .catch(function () {
        window.showToast('Something went wrong. Please try again.', 'danger')
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = original }
      })
  })
})()

// ── Navbar search autocomplete ───────────────────────────────────────────────
(function () {
  'use strict'
  var input = document.getElementById('navbar-search')
  var box = document.getElementById('search-suggestions')
  if (!input || !box) return

  var timer = null
  var items = []
  var active = -1

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function hide() { box.style.display = 'none'; box.innerHTML = ''; items = []; active = -1 }

  function render(list) {
    items = list || []
    active = -1
    if (!items.length) { hide(); return }
    box.innerHTML = items.map(function (b, i) {
      return '<a href="/book/' + b.id + '" class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2" data-idx="' + i + '">' +
        '<img src="' + esc(b.cover) + '" alt="" width="28" height="40" style="object-fit:cover;border-radius:3px;flex:0 0 auto;" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="text-truncate"><span class="fw-semibold">' + esc(b.title) + '</span><br><small class="text-muted">' + esc(b.author) + '</small></span>' +
      '</a>'
    }).join('')
    box.style.display = 'block'
  }

  function highlight() {
    Array.prototype.forEach.call(box.children, function (el, i) { el.classList.toggle('active', i === active) })
  }

  input.addEventListener('input', function () {
    var q = input.value.trim()
    clearTimeout(timer)
    if (q.length < 2) { hide(); return }
    timer = setTimeout(function () {
      fetch('/search/suggest?q=' + encodeURIComponent(q))
        .then(function (r) { return r.json() })
        .then(render)
        .catch(hide)
    }, 200)
  })

  input.addEventListener('keydown', function (e) {
    if (box.style.display !== 'block' || !items.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; highlight() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; highlight() }
    else if (e.key === 'Enter') { if (active >= 0) { e.preventDefault(); window.location.href = '/book/' + items[active].id } }
    else if (e.key === 'Escape') { hide() }
  })

  // Delay so a click on a suggestion registers before the box hides.
  input.addEventListener('blur', function () { setTimeout(hide, 150) })
  document.addEventListener('click', function (e) {
    if (e.target !== input && !box.contains(e.target)) hide()
  })
})()

// ── Styled confirmation dialog (replaces native confirm() ) ──────────────────
// Any <form data-confirm="message"> is gated by the Bootstrap modal in the layout.
(function () {
  'use strict'
  var modalEl = document.getElementById('confirmModal')
  if (!modalEl || typeof bootstrap === 'undefined') return
  var modal = new bootstrap.Modal(modalEl)
  var msgEl = modalEl.querySelector('.confirm-message')
  var okBtn = modalEl.querySelector('.confirm-ok')
  var pending = null

  document.addEventListener('submit', function (e) {
    var form = e.target
    if (!form.hasAttribute || !form.hasAttribute('data-confirm')) return
    if (form.dataset.confirmed === 'yes') return // already confirmed → let it through
    e.preventDefault()
    pending = form
    msgEl.textContent = form.getAttribute('data-confirm') || 'Are you sure?'
    modal.show()
  })

  okBtn.addEventListener('click', function () {
    if (!pending) return
    var form = pending
    pending = null
    modal.hide()
    form.dataset.confirmed = 'yes'
    form.submit() // native submit() bypasses listeners (no re-prompt, no AJAX intercept)
  })
})()
