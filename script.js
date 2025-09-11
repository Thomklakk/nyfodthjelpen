// Sett år i footer
var yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobilmeny toggle + a11y/resize
var menuToggle = document.getElementById("menuToggle");
var mobilMeny = document.getElementById("mobilMeny");
var MOBILE_BREAKPOINT = 900; // ma speile CSS

function setMenu(open){
  if (!mobilMeny || !menuToggle) return;
  mobilMeny.toggleAttribute("hidden", !open);
  menuToggle.setAttribute("aria-expanded", String(open));
}

if (menuToggle && mobilMeny) {
  menuToggle.addEventListener("click", function () {
    var open = mobilMeny.hasAttribute("hidden");
    setMenu(open);
    if (open) {
      var firstLink = mobilMeny.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  });
  mobilMeny.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.tagName === "A") setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > MOBILE_BREAKPOINT) setMenu(false);
  });
}

// Scrollspy - marker aktiv lenke i hoved- og mobilmeny
var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav a, .mobile-nav a"));
var sections = navLinks
  .map(function (a) { return document.querySelector(a.getAttribute("href")); })
  .filter(function (el) { return !!el; });

if (sections.length && navLinks.length){
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting){
        var id = "#" + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === id);
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });
  sections.forEach(function (sec) { obs.observe(sec); });
}

// Skjema - validering og tilbakemelding
var form = document.querySelector(".contact-form");
var feedback = document.getElementById("formFeedback");

function setFieldError(input, msg){
  var errId = input.getAttribute("aria-describedby");
  if (!errId) return;
  var errEl = document.getElementById(errId);
  if (!errEl) return;
  if (msg){
    input.setAttribute("aria-invalid", "true");
    errEl.textContent = msg;
  } else {
    input.removeAttribute("aria-invalid");
    errEl.textContent = "";
  }
}

function validate(){
  let ok = true;
  // Navn
  const navn = document.getElementById('fulltnavn');
  if (navn){
    const valid = navn.value.trim().length >= 2;
    setFieldError(navn, valid ? '' : 'Skriv fullt navn (minst 2 tegn).');
    ok = ok && valid;
  }
  // Mobil
  const mobil = document.getElementById('mobil');
  if (mobil){
    const re = /^\+?\d[\d\s\-]{7,11}$/;
    const valid = re.test(mobil.value.trim());
    setFieldError(mobil, valid ? '' : 'Skriv et gyldig telefonnummer.');
    ok = ok && valid;
  }
  // E-post
  const epost = document.getElementById('epost');
  if (epost){
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const valid = re.test(epost.value.trim());
    setFieldError(epost, valid ? '' : 'Skriv en gyldig e-postadresse.');
    ok = ok && valid;
  }
  // Ønsket dato/klokkeslett (ny)
  const onsket = document.getElementById('onsket');
  if (onsket){
    let valid = true;
    if (!onsket.value){
      valid = false;
      setFieldError(onsket, 'Velg dato og klokkeslett.');
    } else {
      // sjekk ikke fortid (tillat 2 min slingringsmonn)
      const sel = new Date(onsket.value);
      const now = new Date(Date.now() - 2*60*1000);
      valid = sel >= now;
      setFieldError(onsket, valid ? '' : 'Tidspunkt kan ikke være i fortid.');
    }
    ok = ok && valid;
  }
  return ok;
}

// FAQ som statisk liste (apne alle og gjores ikke-klikkbare - matcher designet)
Array.prototype.forEach.call(document.querySelectorAll(".faq-item"), function (item) {
  item.setAttribute("open", "");
});

// Sett starttid & csrf nar siden lastes
(function(){
  var started = document.getElementById("form_started_at");
  var csrf = document.getElementById("csrf_token");
  if (started) started.value = String(Date.now());
  if (csrf) csrf.value = Math.random().toString(36).slice(2) + Date.now().toString(36);
})();

(function(){
  var onsket = document.getElementById('onsket');
  if (!onsket || onsket.type !== 'datetime-local') return;

  function two(n){ return (n < 10 ? '0' : '') + n; }
  function localMinISO(){
    var d = new Date();
    // lokal tid uten sekunder, f.eks. 2025-09-07T14:30
    return d.getFullYear() + '-' + two(d.getMonth()+1) + '-' + two(d.getDate()) +
           'T' + two(d.getHours()) + ':' + two(d.getMinutes());
  }

  onsket.min = localMinISO();
})();

if (form && feedback) {
  // Valider fortlopende
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")){
      validate();
    }
  });

  // Innsending til Formspree m/ misbruksvern
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    // Honeypot
    var hp = document.getElementById("website");
    if (hp && hp.value && hp.value.trim() !== "") {
      feedback.textContent = "Noe gikk galt. Prov igjen.";
      return;
    }

    // Time-trap (minst 3 sekunder siden siden ble apnet)
    var startedEl = document.getElementById("form_started_at");
    var startedVal = startedEl ? Number(startedEl.value || "0") : 0;
    var spentMs = Date.now() - startedVal;
    if (spentMs < 3000) {
      feedback.textContent = "Skjema sendt litt for raskt - prov igjen.";
      return;
    }

    // Ekstra enkel innholds-sjekk for spam
    var fulltnavnEl = document.getElementById("fulltnavn");
    var mobilEl = document.getElementById("mobil");
    var epostEl = document.getElementById("epost");
    var onsketEl = document.getElementById("onsket");
    var meldingEl = document.getElementById("melding");

    var txt = [
      fulltnavnEl ? fulltnavnEl.value : "",
      mobilEl ? mobilEl.value : "",
      epostEl ? epostEl.value : "",
      onsketEl ? onsketEl.value : "",
      meldingEl ? meldingEl.value : ""
    ].join(" ").toLowerCase();

    if (/(viagra|porn|casino|loan|http:\/\/|https:\/\/)/i.test(txt)) {
      feedback.textContent = "Meldingen ble stoppet pga. uonsket innhold.";
      return;
    }

    // Bygg FormData av selve skjemaet (inkl. hidden feltene)
    var fd = new FormData(form);

    feedback.textContent = "Sender...";

    var endpoint = form.getAttribute("action"); // f.eks. https://formspree.io/f/XXXXYYYY
    if (!endpoint) {
      feedback.textContent = "Skjema mangler action-URL.";
      return;
    }

    fetch(endpoint, {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" }
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (data) {
          var msg = (data && data.errors && data.errors[0] && data.errors[0].message) || "Kunne ikke sende skjema";
          throw new Error(msg);
        }).catch(function () {
          throw new Error("Kunne ikke sende skjema");
        });
      }
      return res.json().catch(function(){ return {}; });
    })
    .then(function () {
      feedback.textContent = "Takk! Vi kontakter deg så snart vi kan.";
      form.reset();
      // Rydd feilmarkeringer
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (inp) {
        inp.removeAttribute("aria-invalid");
      });
      Array.prototype.forEach.call(form.querySelectorAll(".field-error"), function (el) {
        el.textContent = "";
      });
      // Ny starttid/CSRF for neste innsending
      var startedEl2 = document.getElementById("form_started_at");
      var csrfEl = document.getElementById("csrf_token");
      if (startedEl2) startedEl2.value = String(Date.now());
      if (csrfEl) csrfEl.value = Math.random().toString(36).slice(2) + Date.now().toString(36);
    })
    .catch(function (err) {
      console.error(err);
      feedback.textContent = "Noe gikk galt ved innsending. Prov igjen om et oyeblikk.";
    });
  });
}
