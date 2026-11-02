/* =====================================================================
   Forms — quote section, quote pop-up and review pop-up.
   The original export showed "Received!" after a 600 ms timer without
   sending anything. This file replaces that with:
     • inline validation and a progress indicator
     • drag-and-drop photo areas with file checks
     • real delivery to the endpoint in assets/js/config.js
     • an honest fallback (pre-filled WhatsApp / email) when no endpoint
       is configured or delivery fails — success is only shown after the
       server confirms it.
   ===================================================================== */
(() => {
  'use strict';
  const CFG = Object.assign({ endpoint: '', accessKey: '', uploadFiles: false, maxFileMB: 15, email: '' },
    (window.DPI_CONFIG && window.DPI_CONFIG.forms) || {});
  const WA = (window.DPI_CONFIG && window.DPI_CONFIG.whatsapp) || '64220910008';
  const $ = id => document.getElementById(id);
  const val = el => (el && el.value ? el.value.trim() : '');

  if (!CFG.endpoint) console.warn('[DPI] Forms are not connected to a delivery service yet. Add an endpoint in assets/js/config.js — until then visitors are offered WhatsApp instead.');

  /* ---------- validation helpers ---------- */
  const rules = {
    name: v => v.length >= 2 || 'Please enter your name.',
    phone: v => { const d = v.replace(/[^\d]/g, ''); return (d.length >= 7 && d.length <= 15) || 'Please enter a phone number we can call or WhatsApp.'; },
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Please enter a valid email address.',
    suburb: v => v.length >= 2 || 'Please tell us your suburb or street.',
    select: v => !!v || 'Please choose an option.',
    review: v => v.length >= 10 || 'Please write a few words about the work (10+ characters).'
  };
  const errFor = el => {
    let e = el.parentNode.querySelector(':scope > .qf-err[data-for="' + el.id + '"]');
    if (!e) {
      e = document.createElement('span');
      e.className = 'qf-err'; e.dataset.for = el.id; e.id = el.id + '-err'; e.hidden = true;
      e.setAttribute('role', 'alert');
      el.insertAdjacentElement('afterend', e);
      el.setAttribute('aria-describedby', e.id);
    }
    return e;
  };
  const check = (el, rule, show = true) => {
    const r = rules[rule](val(el));
    const ok = r === true;
    if (show) {
      const e = errFor(el);
      el.setAttribute('aria-invalid', String(!ok));
      e.hidden = ok; e.textContent = ok ? '' : r;
    }
    return ok;
  };
  const wire = (spec) => spec.forEach(([el, rule]) => {
    if (!el) return;
    el.required = rule !== undefined;
    if (!el.getAttribute('aria-label') && el.placeholder) el.setAttribute('aria-label', el.placeholder.replace(/\s*\*$/, ''));
    el.addEventListener('blur', () => { if (val(el) || el.getAttribute('aria-invalid')) check(el, rule); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el, rule); });
    el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') check(el, rule); });
  });
  const validateAll = (spec, extra) => {
    let first = null;
    spec.forEach(([el, rule]) => { if (el && !check(el, rule) && !first) first = el; });
    if (extra) { const x = extra(); if (x && !first) first = x; }
    if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return !first;
  };

  /* ---------- file drop areas ---------- */
  const files = new Map(); // input id -> File[]
  const fmt = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const setupDrop = (zoneId, inputId, labelId, accept) => {
    const zone = $(zoneId), input = $(inputId), label = $(labelId);
    if (!zone || !input) return;
    const origLabel = label ? label.textContent : '';
    zone.classList.add('qf-drop');
    zone.setAttribute('role', 'button'); zone.tabIndex = 0;
    zone.setAttribute('aria-label', (origLabel || 'Add photos') + ' — opens file picker');
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    const list = document.createElement('ul'); list.className = 'qf-files'; list.setAttribute('aria-live', 'polite');
    zone.insertAdjacentElement('afterend', list);
    files.set(inputId, []);
    const render = () => {
      const arr = files.get(inputId);
      list.innerHTML = '';
      arr.forEach((f, i) => {
        const li = document.createElement('li');
        if (f._bad) li.className = 'bad';
        li.innerHTML = '<span class="nm"></span><span class="sz"></span><button type="button" aria-label="Remove file">×</button>';
        li.querySelector('.nm').textContent = f.name + (f._bad ? ' — ' + f._bad : '');
        li.querySelector('.sz').textContent = fmt(f.size);
        li.querySelector('button').addEventListener('click', () => { arr.splice(i, 1); render(); });
        list.appendChild(li);
      });
      const good = arr.filter(f => !f._bad).length;
      if (label) label.textContent = good ? good + ' file' + (good > 1 ? 's' : '') + ' ready' : origLabel;
      zone.style.borderColor = ''; zone.style.background = '';
      if (good && CFG.endpoint && !CFG.uploadFiles) {
        const li = document.createElement('li');
        li.innerHTML = '<span class="nm" style="white-space:normal">Photos aren’t sent through this form yet — after you submit, you can send them to us on WhatsApp.</span>';
        list.appendChild(li);
      }
    };
    const add = fl => {
      const arr = files.get(inputId);
      Array.from(fl).forEach(f => {
        const okType = accept.some(a => a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a || f.name.toLowerCase().endsWith(a));
        if (!okType) f._bad = 'unsupported type';
        else if (f.size > CFG.maxFileMB * 1048576) f._bad = 'over ' + CFG.maxFileMB + ' MB';
        if (!arr.some(x => x.name === f.name && x.size === f.size)) arr.push(f);
      });
      render();
    };
    input.addEventListener('change', () => { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('drag'); }));
    ['dragleave', 'dragend', 'drop'].forEach(t => zone.addEventListener(t, () => zone.classList.remove('drag')));
    zone.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files.length) add(e.dataTransfer.files); });
    return { reset: () => { files.set(inputId, []); render(); } };
  };

  /* ---------- status panel ---------- */
  const statusFor = anchor => {
    let s = anchor.querySelector(':scope > .qf-status');
    if (!s) { s = document.createElement('div'); s.className = 'qf-status'; s.setAttribute('role', 'status'); s.setAttribute('aria-live', 'polite'); s.hidden = true; anchor.appendChild(s); }
    return s;
  };
  const showFallback = (anchor, { title, text, message, subject, error }) => {
    const s = statusFor(anchor);
    s.className = 'qf-status' + (error ? ' error' : '');
    const wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
    s.innerHTML = '<strong></strong><span class="tx"></span><div class="qf-alt">' +
      '<a class="wa" target="_blank" rel="noopener" href="' + wa + '">Send on WhatsApp</a>' +
      (CFG.email ? '<a class="em" href="mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message) + '">Send by email</a>' : '') +
      '<button type="button" class="cp">Copy details</button></div>';
    s.querySelector('strong').textContent = title;
    s.querySelector('.tx').textContent = text;
    s.querySelector('.cp').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(message); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Copy not available'; }
    });
    s.hidden = false;
    s.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const hideStatus = anchor => { const s = anchor.querySelector(':scope > .qf-status'); if (s) s.hidden = true; };

  /* ---------- delivery ---------- */
  const busy = (btn, on, label) => {
    if (!btn) return;
    if (on) { btn._html = btn.innerHTML; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<span class="qf-spin" aria-hidden="true"></span><span>' + label + '</span>'; }
    else { btn.disabled = false; btn.removeAttribute('aria-busy'); if (btn._html) btn.innerHTML = btn._html; }
  };
  const deliver = async (subject, fields, fileList) => {
    const fd = new FormData();
    if (CFG.accessKey) fd.append('access_key', CFG.accessKey);
    fd.append('subject', subject); fd.append('_subject', subject);
    fd.append('from_name', 'Discount Property Improvements website');
    Object.entries(fields).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (CFG.uploadFiles) (fileList || []).filter(f => !f._bad).forEach(f => fd.append('attachment', f, f.name));
    const res = await fetch(CFG.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    let json = {};
    try { json = await res.json(); } catch { /* non-JSON is fine if status is 2xx */ }
    if (!res.ok || json.success === false || json.ok === false) throw new Error(json.message || json.error || ('HTTP ' + res.status));
    return true;
  };
  const honeypot = form => {
    const hp = document.createElement('input');
    hp.type = 'text'; hp.name = '_gotcha'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(hp);
    return () => hp.value !== '';
  };
  const waMessage = (intro, pairs, hasFiles) =>
    intro + '\n' + pairs.filter(([, v]) => v).map(([k, v]) => k + ': ' + v).join('\n') + (hasFiles ? '\n\nI have photos of the space — I’ll send them in this chat.' : '');

  const handle = async ({ form, anchor, btn, sendingLabel, subject, fields, pairs, intro, fileKey, onSuccess, notConnectedText }) => {
    hideStatus(anchor);
    const fl = fileKey ? files.get(fileKey) || [] : [];
    const message = waMessage(intro, pairs, fl.some(f => !f._bad));
    if (!CFG.endpoint) {
      showFallback(anchor, { title: 'Online sending isn’t switched on yet', text: notConnectedText, message, subject });
      return;
    }
    busy(btn, true, sendingLabel);
    try {
      await deliver(subject, fields, fl);
      onSuccess();
    } catch (err) {
      console.error('[DPI] form delivery failed:', err);
      showFallback(anchor, { title: 'We couldn’t send that just now', text: 'Nothing was lost — your details are still in the form. Please try again, or send them straight to us on WhatsApp:', message, subject, error: true });
    } finally { busy(btn, false); }
  };

  /* =================== A. QUOTE SECTION FORM =================== */
  (() => {
    const form = $('section-quote-form'); if (!form) return;
    form.noValidate = true;
    const success = $('section-quote-success'), reset = $('section-quote-reset-btn'), btn = $('section-submit-btn');
    const f = { name: $('quote-name'), phone: $('quote-phone'), email: $('quote-email'), suburb: $('quote-suburb'),
      room: $('quote-room-type'), dims: $('quote-dimensions'), time: $('quote-timeline'), notes: $('quote-notes') };
    const spec = [[f.name, 'name'], [f.phone, 'phone'], [f.email, 'email'], [f.suburb, 'suburb']];
    wire(spec);
    const boxes = Array.from(form.querySelectorAll('input[name="services"]'));
    const chipWrap = boxes[0] && boxes[0].closest('label').parentNode;
    let svcErr;
    if (chipWrap) {
      chipWrap.setAttribute('role', 'group'); chipWrap.setAttribute('aria-label', 'Services required');
      svcErr = document.createElement('span'); svcErr.className = 'qf-err'; svcErr.hidden = true; svcErr.setAttribute('role', 'alert');
      svcErr.textContent = 'Please choose at least one service.';
      chipWrap.insertAdjacentElement('afterend', svcErr);
    }
    const services = () => boxes.filter(b => b.checked).map(b => b.value);
    const checkSvc = () => { const ok = services().length > 0; if (svcErr) svcErr.hidden = ok; return ok ? null : boxes[0]; };
    boxes.forEach(b => b.addEventListener('change', () => { if (svcErr && !svcErr.hidden) checkSvc(); progress(); }));

    // progress indicator
    const prog = form.querySelector('.qf-progress');
    const progress = () => {
      if (!prog) return;
      const done = {
        service: services().length > 0,
        project: !!(val(f.room) || val(f.dims) || val(f.notes)),
        contact: spec.every(([el, r]) => rules[r](val(el)) === true)
      };
      prog.querySelectorAll('li').forEach(li => li.classList.toggle('done', !!done[li.dataset.step]));
    };
    form.addEventListener('input', progress); form.addEventListener('change', progress); progress();

    const drop = setupDrop('section-photo-dropzone', 'section-file-input', 'section-dropzone-label', ['image/*', 'application/pdf', '.pdf']);
    const isBot = honeypot(form);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateAll(spec, checkSvc) || isBot()) return;
      const pairs = [['Services', services().join(', ')], ['Room / location', val(f.room)], ['Size', val(f.dims)], ['Timeframe', val(f.time)],
        ['Name', val(f.name)], ['Phone', val(f.phone)], ['Email', val(f.email)], ['Suburb', val(f.suburb)], ['Notes', val(f.notes)]];
      handle({
        form, anchor: form, btn, sendingLabel: 'Sending…',
        subject: 'Quote request — ' + (services()[0] || 'website') + ' — ' + val(f.suburb),
        fields: { form: 'Quote request (page form)', name: val(f.name), email: val(f.email), phone: val(f.phone), suburb: val(f.suburb),
          services: services().join(', '), room: val(f.room), dimensions: val(f.dims), timeframe: val(f.time), notes: val(f.notes) },
        pairs, intro: 'Hi Discount Property Improvements, I’d like a quote.', fileKey: 'section-file-input',
        notConnectedText: 'Nothing has been sent yet. Tap below to send these same details to us on WhatsApp — they’re already filled in.',
        onSuccess: () => {
          form.style.display = 'none';
          success.style.display = 'block'; success.classList.add('qf-success-anim');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          form.reset(); drop && drop.reset(); progress();
        }
      });
    });
    if (reset) reset.addEventListener('click', () => { success.style.display = 'none'; form.style.display = 'flex'; hideStatus(form); });
  })();

  /* =================== B. QUOTE POP-UP =================== */
  (() => {
    const form = $('modal-quote-form'); if (!form) return;
    form.noValidate = true;
    const success = $('quote-modal-success-state'), btn = $('submit-quote-modal-btn');
    const f = { svc: $('modal-quote-service'), dims: $('modal-quote-dims'), time: $('modal-quote-timeline'), name: $('modal-quote-name'),
      phone: $('modal-quote-phone'), email: $('modal-quote-email'), suburb: $('modal-quote-suburb'), notes: $('modal-quote-details') };
    const spec = [[f.svc, 'select'], [f.name, 'name'], [f.phone, 'phone'], [f.email, 'email'], [f.suburb, 'suburb']];
    wire(spec);
    const drop = setupDrop('modal-photo-dropzone', 'modal-photo-input', 'modal-dropzone-label', ['image/*']);
    const isBot = honeypot(form);
    // reset stale status/errors whenever the pop-up is reopened
    const modal = $('quote-modal');
    if (modal) new MutationObserver(() => { if (modal.style.display === 'block') { hideStatus(form); } }).observe(modal, { attributes: true, attributeFilter: ['style'] });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateAll(spec) || isBot()) return;
      const pairs = [['Service', val(f.svc)], ['Size', val(f.dims)], ['Timeframe', val(f.time)], ['Name', val(f.name)],
        ['Phone', val(f.phone)], ['Email', val(f.email)], ['Suburb', val(f.suburb)], ['Details', val(f.notes)]];
      handle({
        form, anchor: form, btn, sendingLabel: 'Sending…',
        subject: 'Quote request — ' + val(f.svc) + ' — ' + val(f.suburb),
        fields: { form: 'Quote request (pop-up)', name: val(f.name), email: val(f.email), phone: val(f.phone), suburb: val(f.suburb),
          service: val(f.svc), dimensions: val(f.dims), timeframe: val(f.time), details: val(f.notes) },
        pairs, intro: 'Hi Discount Property Improvements, I’d like a quote.', fileKey: 'modal-photo-input',
        notConnectedText: 'Nothing has been sent yet. Tap below to send these same details to us on WhatsApp — they’re already filled in.',
        onSuccess: () => { form.style.display = 'none'; success.style.display = 'block'; success.classList.add('qf-success-anim'); form.reset(); drop && drop.reset(); }
      });
    });
  })();

  /* =================== C. REVIEW POP-UP =================== */
  (() => {
    const form = $('review-submission-form'); if (!form) return;
    form.noValidate = true;
    const success = $('review-success-state'), btn = $('submit-review-btn');
    const f = { rating: $('review-rating-value'), name: $('rev-name'), suburb: $('rev-suburb'), cat: $('rev-category'), text: $('rev-text') };
    const spec = [[f.name, 'name'], [f.suburb, 'suburb'], [f.cat, 'select'], [f.text, 'review']];
    wire(spec);
    const drop = setupDrop('photo-dropzone', 'photo-file-input', 'dropzone-label', ['image/*']);
    const isBot = honeypot(form);
    const modal = $('review-modal');
    if (modal) new MutationObserver(() => { if (modal.style.display === 'block') hideStatus(form); }).observe(modal, { attributes: true, attributeFilter: ['style'] });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateAll(spec) || isBot()) return;
      const stars = '★'.repeat(+val(f.rating) || 5);
      const pairs = [['Rating', stars + ' (' + (val(f.rating) || 5) + '/5)'], ['Name', val(f.name)], ['Suburb', val(f.suburb)], ['Service', val(f.cat)], ['Review', val(f.text)]];
      handle({
        form, anchor: form, btn, sendingLabel: 'Sending…',
        subject: 'New review submitted — ' + val(f.name) + ' (' + (val(f.rating) || 5) + '/5)',
        fields: { form: 'Review submission (needs checking before publishing)', name: val(f.name), suburb: val(f.suburb), service: val(f.cat), rating: val(f.rating) || '5', review: val(f.text) },
        pairs, intro: 'Hi Discount Property Improvements, here’s my review of your work:', fileKey: 'photo-file-input',
        notConnectedText: 'Nothing has been sent yet. Tap below to send your review to us on WhatsApp — it’s already written in.',
        onSuccess: () => {
          form.style.display = 'none'; success.style.display = 'block'; success.classList.add('qf-success-anim');
          form.reset(); drop && drop.reset();
          if (window.DPI_resetReviewStars) window.DPI_resetReviewStars();
        }
      });
    });
  })();
})();
