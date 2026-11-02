/* VOX Media House — 2026-09-23
   Alleen gebruikt als de automatische verzending naar Netlify Forms een
   keer niet lukt (zie de catch hieronder). */
var INFO_MAIL = "info@voxmediahouse.nl";

(function () {
  "use strict";

  var html = document.documentElement;
  var animOn = html.classList.contains("anim");

  /* ---------- jaartal ---------- */
  var jaar = document.getElementById("jaar");
  if (jaar) { jaar.textContent = String(new Date().getFullYear()); }

  /* ---------- contactformulier: gaat automatisch naar Netlify Forms ----------
     Geen eigen server nodig: Netlify herkent dit formulier aan
     data-netlify="true" en het verborgen form-name-veld, en levert de
     inhoud af als een POST naar de eigen site. De ontvanger stel je in bij
     Forms -> Submission notifications in het Netlify-dashboard; dat staat
     niet in deze code, dus die instelling overleeft een nieuwe uitrol.
     Eerst een gewone fetch-verzending zodat de pagina niet herlaadt. Lukt
     dat om wat voor reden dan ook niet (JavaScript uit, verbinding weg),
     dan blijft het reguliere formuliergedrag intact: data-netlify plus het
     verborgen form-name-veld werken ook zonder JavaScript. */
  var form = document.getElementById("sparform");
  var note = document.getElementById("formnote");
  if (form) {
    form.addEventListener("submit", function (e) {
      var naam = form.naam.value.trim();
      var mail = form.email.value.trim();
      if (!naam || !mail) {
        e.preventDefault();
        note.textContent = "Vul je naam en e-mailadres in.";
        note.classList.add("is-err");
        return;
      }
      e.preventDefault();
      note.classList.remove("is-err");
      note.textContent = "Bezig met versturen...";
      var data = new URLSearchParams(new FormData(form)).toString();
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data
      }).then(function (res) {
        if (!res.ok) { throw new Error("status " + res.status); }
        note.textContent = "Bedankt! We nemen binnen twee werkdagen contact op.";
        form.reset();
      }).catch(function () {
        note.textContent = "Versturen lukte niet. Mail ons direct op " + INFO_MAIL + ".";
        note.classList.add("is-err");
      });
    });
  }

  /* ---------- offerteknoppen vullen het formulier vast in ---------- */
  document.querySelectorAll("[data-pakket]").forEach(function (knop) {
    knop.addEventListener("click", function () {
      var vak = document.getElementById("f-bericht");
      if (!vak) { return; }
      vak.value = "Ik wil graag een offerte voor " +
        (knop.getAttribute("data-pakket") === "een losse opdracht"
          ? "een losse opdracht."
          : "het pakket " + knop.getAttribute("data-pakket") + ".");
    });
  });

  /* ---------- klantlogos in de merkenband ---------- */
  /* Zet in assets/logo/klanten/logos.json de bestandsnaam bij een merk en leg
     het bestand ernaast. Beide rijen wisselen dan vanzelf om; je hoeft niets
     in de HTML aan te passen. Staat er geen bestand, dan blijft de naam staan. */
  (function () {
    var band = document.querySelector(".merken");
    if (!band || !window.fetch) { return; }
    fetch("assets/logo/klanten/logos.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (lijst) {
        if (!lijst) { return; }
        var maten = lijst._maten || {};
        Object.keys(lijst).forEach(function (merk) {
          var bestand = lijst[merk];
          if (!bestand || typeof bestand !== "string") { return; }
          band.querySelectorAll("[data-merk=\"" + merk + "\"]").forEach(function (li) {
            var naam = li.textContent.trim();
            var img = document.createElement("img");
            img.alt = naam;
            /* Echte afmetingen (logos.json, _maten): geeft de browser de verhouding
               vooraf. De CSS-hoogte en -breedte blijven bepalend. */
            if (maten[bestand]) { img.width = maten[bestand][0]; img.height = maten[bestand][1]; }
            /* Niet lazy: de band staat boven de vouw en een logo met breedte
               auto heeft voor het laden nul oppervlak, waardoor de browser het
               laden eindeloos uitstelt. Samen zijn ze een paar honderd kB. */
            img.loading = "eager";
            img.onerror = function () { li.textContent = naam; };
            img.src = "assets/logo/klanten/" + bestand;
            li.textContent = "";
            li.appendChild(img);
          });
        });
      })
      .catch(function () {});
  })();

  /* ---------- navigatiebalk ---------- */
  var nav = document.getElementById("nav");
  var navKnop = document.getElementById("navknop");
  var navMenu = document.getElementById("navmenu");
  var vorige = 0;

  function menu(open) {
    if (!navKnop || !navMenu) { return; }
    navKnop.setAttribute("aria-expanded", open ? "true" : "false");
    navKnop.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
    navMenu.classList.toggle("is-open", open);
    /* Balk en paneel moeten als een dicht vlak lezen zodra het menu open is. */
    if (open && nav) { nav.classList.add("nav--solid"); }
  }
  function menuOpen() { return navKnop && navKnop.getAttribute("aria-expanded") === "true"; }

  if (navKnop && navMenu) {
    navKnop.addEventListener("click", function () { menu(!menuOpen()); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen()) { menu(false); navKnop.focus(); }
    });
    navMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu(false); });
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) { menu(false); } });
  }

  function navUpdate(y) {
    if (!nav) { return; }
    nav.classList.toggle("nav--solid", y > 40);
    /* De balk mag nooit wegschuiven terwijl het menu openstaat. */
    nav.classList.toggle("nav--hidden", y > 420 && y > vorige + 4 && !menuOpen());
    vorige = y;
  }
  navUpdate(window.scrollY || 0);

  /* ---------- hero-video: alleen laden als beweging gewenst is ---------- */
  var video = document.querySelector(".hero__video");
  /* De showreel is ruim 10 MB. Alleen bij databesparing of een trage
     verbinding laden we hem niet en blijft het posterbeeld staan. Op mobiel
     draait hij wel: Kaz wil dat de hero daar ook leeft. */
  var zuinig = navigator.connection && (navigator.connection.saveData ||
    /2g|slow-2g/.test(navigator.connection.effectiveType || ""));
  if (video && animOn && !zuinig) {
    var bron = video.getAttribute("data-src");
    /* Smal scherm: lichtere 720p-versie (ca. 4,5 MB) in plaats van de 1080p-bron. */
    if (bron && window.matchMedia && window.matchMedia("(max-width:768px)").matches) {
      bron = bron.replace(/\.mp4$/, "-720.mp4");
    }
    if (bron) {
      video.addEventListener("canplay", function () {
        video.classList.add("is-on");
        /* Pas afspelen als er echt beeld is; eerder wordt de belofte geweigerd. */
        var p = video.play();
        if (p && p.catch) { p.catch(function () {}); }
      }, { once: true });
      /* Browsers pauzeren beeld in een tabblad op de achtergrond. Komt de
         bezoeker terug, dan pakken we het weer op. */
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && video.src && video.paused) {
          var h = video.play(); if (h && h.catch) { h.catch(function () {}); }
        }
      });
      video.addEventListener("error", function () { video.removeAttribute("src"); }, { once: true });
      var start = function () { video.src = bron; video.load(); };
      if (window.requestIdleCallback) { window.requestIdleCallback(start, { timeout: 2500 }); }
      else { window.setTimeout(start, 900); }
      /* Buiten beeld pauzeren, zodat hero en footer niet tegelijk draaien. */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (items) {
          items.forEach(function (it) {
            if (!video.src) { return; }
            if (it.isIntersecting) { var h = video.play(); if (h && h.catch) { h.catch(function () {}); } }
            else { video.pause(); }
          });
        }).observe(video);
      }
    }
  }

  /* ---------- footer-video: pas laden als de footer dichtbij komt ----------
     Zelfde regels als de hero: niet bij databesparing, niet op een trage
     verbinding en niet bij verminderde beweging (dan ontbreekt .anim). */
  var voetVideo = document.querySelector(".foot__video");
  if (voetVideo && animOn && !zuinig && "IntersectionObserver" in window) {
    var voetBron = voetVideo.getAttribute("data-src");
    var voetGeladen = false;
    if (voetBron) {
      voetVideo.addEventListener("canplay", function () { voetVideo.classList.add("is-on"); }, { once: true });
      voetVideo.addEventListener("error", function () { voetVideo.removeAttribute("src"); }, { once: true });
      new IntersectionObserver(function (items) {
        items.forEach(function (it) {
          if (it.isIntersecting) {
            if (!voetGeladen) { voetGeladen = true; voetVideo.src = voetBron; voetVideo.load(); }
            var p = voetVideo.play(); if (p && p.catch) { p.catch(function () {}); }
          } else if (voetGeladen) {
            voetVideo.pause();
          }
        });
      }, { rootMargin: "400px 0px" }).observe(voetVideo.closest(".foot"));
    }
  }

  /* ---------- koppen: woord voor woord omhoog ----------
     Alleen met .anim (dus niet bij verminderde beweging). De woorden worden
     hier in spans gezet; zonder JavaScript blijft de kop gewone tekst. Elke
     kop schuift een keer in beeld zodra hij zichtbaar wordt. De hero-kop heeft
     zijn woorden al in de HTML en loopt via CSS, direct bij het laden. */
  if (animOn) {
    var koppen = document.querySelectorAll(
      ".sec__head h2, .ster__in h2, .castingband__in h2, .webbouw__in h2, .cta__txt h2, " +
      ".pillar__txt h3:not([data-words]), main h1:not(.hero__title)");
    var kopWoorden = function (el) {
      var n = 0;
      (function loop(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (deel) {
              if (!deel) { return; }
              if (/^\s+$/.test(deel)) { frag.appendChild(document.createTextNode(" ")); return; }
              var kw = document.createElement("span");
              kw.className = "kw";
              var bin = document.createElement("span");
              bin.style.setProperty("--i", n++);
              bin.textContent = deel;
              kw.appendChild(bin);
              frag.appendChild(kw);
            });
            node.replaceChild(frag, c);
          } else if (c.nodeType === 1) { loop(c); }
        });
      })(el);
      el.setAttribute("data-kop", "");
    };
    var kopObs = "IntersectionObserver" in window ? new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add("is-in"); kopObs.unobserve(it.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }) : null;
    Array.prototype.forEach.call(koppen, function (el) {
      kopWoorden(el);
      if (kopObs) { kopObs.observe(el); } else { el.classList.add("is-in"); }
    });
  }

  /* ---------- magnetische knoppen ----------
     Alleen met een muis (hover + fine pointer), en maar een paar pixels. */
  if (animOn && window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".btn"), function (knop) {
      var tx = 0, ty = 0;
      knop.addEventListener("mousemove", function (e) {
        var r = knop.getBoundingClientRect();
        tx = Math.max(-8, Math.min(8, (e.clientX - (r.left - tx + r.width / 2)) * 0.12));
        ty = Math.max(-5, Math.min(5, (e.clientY - (r.top - ty + r.height / 2)) * 0.2));
        knop.style.translate = tx.toFixed(1) + "px " + ty.toFixed(1) + "px";
      });
      knop.addEventListener("mouseleave", function () { tx = 0; ty = 0; knop.style.translate = "0 0"; });
    });
  }

  /* ---------- zonder animatie (of zonder GSAP): klaar ----------
     Ontbreekt GSAP of ScrollTrigger (blokkade, netwerkfout), dan gaat .anim
     eraf: anders blijft alles wat op .reveal wacht onzichtbaar. */
  if (!animOn || !window.gsap || !window.ScrollTrigger) {
    if (animOn) { html.classList.remove("anim"); }
    window.addEventListener("scroll", function () { navUpdate(window.scrollY || 0); }, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- ankerlinks ---------- */
  /* Altijd zelf de doelpositie uitrekenen. Een element doorgeven aan Lenis
     werkte niet betrouwbaar, en dan gebeurde er bij een klik helemaal niets. */
  function ankersKoppelen(schuif) {
    document.querySelectorAll("a[href^=\"#\"]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href === "#") { return; }
      a.addEventListener("click", function (ev) {
        var doel = document.querySelector(href);
        if (!doel) { return; }
        ev.preventDefault();
        var marge = parseFloat(window.getComputedStyle(doel).scrollMarginTop) || 70;
        var y = Math.max(0, doel.getBoundingClientRect().top + (window.scrollY || 0) - marge);
        if (schuif) {
          schuif(y);
          /* Vangnet: is er na een seconde niets gebeurd, spring dan alsnog. */
          var was = window.scrollY || 0;
          window.setTimeout(function () {
            if (Math.abs((window.scrollY || 0) - was) < 4) { window.scrollTo(0, y); }
          }, 1000);
        } else {
          window.scrollTo({ top: y, behavior: "smooth" });
        }
        if (history.replaceState) { history.replaceState(null, "", href); }
      });
    });
  }

  /* ---------- smooth scrolling ---------- */
  /* Testschakelaar: open de pagina met ?geenlenis=1 om het soepele scrollen
     uit te zetten en te vergelijken. */
  var lenisUit = window.location.search.indexOf("geenlenis") !== -1;
  var LenisCtor = lenisUit ? null : (window.Lenis || (window.lenis && window.lenis.default));
  var lenis = null;
  if (LenisCtor) {
    lenis = new LenisCtor({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", function (e) { ScrollTrigger.update(); navUpdate(e.scroll || window.scrollY || 0); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    ankersKoppelen(function (y) { lenis.scrollTo(y, { duration: 1.1 }); });
  } else {
    ankersKoppelen(null);
    window.addEventListener("scroll", function () { navUpdate(window.scrollY || 0); }, { passive: true });
  }

  /* ---------- reveals ----------
     Alleen de pakketkaarten en twee beelden komen één keer binnen; terug
     omhoog scrollen draait niets om. Eindwaarden exact 1 en 0. */
  gsap.utils.toArray(".packs").forEach(function (groep) {
    var leden = gsap.utils.toArray(".reveal", groep);
    if (!leden.length) { return; }
    ScrollTrigger.batch(leden, {
      start: "top 90%",
      once: true,
      onEnter: function (groepje) {
        gsap.to(groepje, { opacity: 1, y: 0, scale: 1, duration: .75, ease: "power3.out",
          stagger: .08, overwrite: true });
      }
    });
  });

  /* De overige blokken, een voor een. */
  gsap.utils.toArray(".reveal").forEach(function (el) {
    if (el.closest(".packs")) { return; }
    gsap.to(el, {
      opacity: 1, y: 0, scale: 1, duration: .8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none", once: true },
      onComplete: function () { gsap.set(el, { willChange: "auto" }); }
    });
  });

  /* De foto schuift binnen zijn kader mee met de scroll. Scrub volgt de
     scrollpositie, dus terugscrollen draait de beweging vanzelf om. */
  gsap.utils.toArray(".card__kader img, .pillar__img img").forEach(function (im) {
    gsap.fromTo(im, { yPercent: -5, scale: 1.11 }, {
      yPercent: 5, scale: 1.11, ease: "none",
      scrollTrigger: { trigger: im.parentNode, start: "top bottom", end: "bottom top", scrub: .8 }
    });
  });

  /* ---------- logoband ----------
     Eerder liep dit op CSS-keyframes en werd de duur bijgesteld om hem mee
     te laten lopen met de scroll. Dat sprong zichtbaar: bij een nieuwe duur
     rekent de browser de verstreken tijd opnieuw om en verspringt de band.
     Met een GSAP-tijdlijn verander je alleen het tempo, niet de positie. */
  var band0 = document.querySelector(".merken");
  if (band0) { band0.classList.add("merken--js"); }
  var rijen = gsap.utils.toArray(".merken__rij");
  var banden = [];
  rijen.forEach(function (rij) {
    var naarLinks = rij.classList.contains("merken__rij--links");
    var tijd = naarLinks ? 68 : 82;
    gsap.set(rij, { xPercent: naarLinks ? 0 : -50 });
    var band = gsap.to(rij, {
      xPercent: naarLinks ? -50 : 0,
      duration: tijd, ease: "none", repeat: -1
    });
    banden.push(band);
    rij.addEventListener("mouseenter", function () { gsap.to(band, { timeScale: 0, duration: .5 }); });
    rij.addEventListener("mouseleave", function () { gsap.to(band, { timeScale: 1, duration: .6 }); });
  });

  /* Scrollen geeft de band een zetje. Het tempo wordt naartoe getweend en
     zakt daarna terug, zodat er geen schokje in zit. */
  if (banden.length) {
    var rust = null;
    ScrollTrigger.create({
      trigger: "body", start: "top top", end: "bottom bottom",
      onUpdate: function (self) {
        var doel = Math.min(3, 1 + Math.abs(self.getVelocity()) / 1400);
        banden.forEach(function (b) { gsap.to(b, { timeScale: doel, duration: .25, overwrite: true }); });
        clearTimeout(rust);
        rust = setTimeout(function () {
          banden.forEach(function (b) { gsap.to(b, { timeScale: 1, duration: 1.1, ease: "power2.out", overwrite: true }); });
        }, 200);
      }
    });
  }

  /* ---------- voortgangslijn ----------
     Een dunne streep die meegroeit met hoe ver je bent. Scrub volgt de
     scrollpositie, dus omhoog scrollen laat hem vanzelf krimpen. */
  var lijn = document.querySelector(".voortgang");
  if (lijn) {
    gsap.to(lijn, {
      scaleX: 1, ease: "none",
      scrollTrigger: {
        trigger: document.body, start: "top top", end: "bottom bottom", scrub: .3,
        onUpdate: function (self) { lijn.classList.toggle("is-aan", self.progress > 0.004); }
      }
    });
  }

  /* ---------- welke sectie ben je ----------
     Het menu markeert waar je bent. Niet meer dan een streepje dat uitloopt;
     de link zelf verspringt niet, want dan verschuift de hele balk. */
  var menulinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  menulinks.forEach(function (link) {
    var doel = document.querySelector(link.getAttribute("href"));
    if (!doel) { return; }
    ScrollTrigger.create({
      trigger: doel, start: "top 45%", end: "bottom 45%",
      onToggle: function (self) { link.classList.toggle("is-hier", self.isActive); }
    });
  });

  /* ---------- hero ----------
     Alleen op pagina's met een hero (de homepage). Een pagina zonder .hero,
     zoals casting.html, heeft deze elementen niet -- zonder deze wacht gaf
     GSAP daar console-waarschuwingen ("GSAP target ... not found"). */
  if (document.querySelector(".hero")) {
    /* De kop zelf loopt via CSS (woord voor woord, zonder opacity, zodat de
       eerste verf direct leesbaar is); hier alleen merkteken, tekst en knoppen. */
    gsap.from(".hero__mark, .hero__sub, .hero__acts", {
      opacity: 0, y: 22, duration: .8, ease: "power3.out", stagger: .08, delay: .05,
      clearProps: "opacity,transform,willChange"
    });
    /* Het beeld in de hero schuift binnen zijn eigen kader, zodat er nooit een
       rand vrijkomt en er geen laag over de tekst heen ligt. */
    gsap.to(".hero__media", {
      yPercent: 7, scale: 1.03, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }
  /* De fade van de herotekst is eruit: een gebroken opacity op dit blok
     maakte er een aparte compositielaag van, en die werd tijdens het scrollen
     zachter hertekend. Dat gaf de gloed rond de knoppen. */

  /* ---------- statement: woord voor woord ---------- */
  var lead = document.querySelector("[data-words]");
  if (lead) {
    var woorden = lead.textContent.split(/(\s+)/);
    lead.textContent = "";
    var spans = [];
    woorden.forEach(function (w) {
      if (w.trim() === "") { lead.appendChild(document.createTextNode(w)); return; }
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      lead.appendChild(s);
      spans.push(s);
    });
    ScrollTrigger.create({
      trigger: lead, start: "top 78%", end: "bottom 58%", scrub: true,
      onUpdate: function (self) {
        var tot = Math.round(self.progress * spans.length);
        spans.forEach(function (s, i) { s.classList.toggle("on", i < tot); });
      }
    });
  }

  /* ---------- werkwijze: gepinde sectie ---------- */
  var stappen = gsap.utils.toArray(".flow .step");
  var dots = gsap.utils.toArray(".flow__dots li");
  if (stappen.length) {
    var zet = function (i) {
      stappen.forEach(function (s, n) { s.classList.toggle("on", n === i); });
      dots.forEach(function (d, n) { d.classList.toggle("on", n === i); });
    };
    zet(0);
    ScrollTrigger.create({
      trigger: ".flow", start: "top top", end: "bottom bottom",
      onUpdate: function (self) {
        var i = Math.min(stappen.length - 1, Math.floor(self.progress * stappen.length * 1.0001));
        zet(i);
      }
    });
  }

  ScrollTrigger.refresh();
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();

/* Netlify weigert een formulier boven 8 MB in zijn geheel; dan is alles wat
   iemand invulde weg. Daarom vooraf tegenhouden, met ruime marge. */
(function () {
  "use strict";
  var cform = document.querySelector('form[name="casting"]');
  var cnote = document.getElementById("castingnote");
  if (!cform || !cnote) { return; }
  cform.addEventListener("submit", function (e) {
    var totaal = 0;
    Array.prototype.forEach.call(cform.querySelectorAll('input[type="file"]'), function (f) {
      if (f.files && f.files[0]) { totaal += f.files[0].size; }
    });
    if (totaal > 7900000) {
      e.preventDefault();
      cnote.textContent = "Je foto's zijn samen groter dan 8 MB. Kies kleinere foto's en probeer het opnieuw.";
      cnote.classList.add("is-err");
    }
  });
})();

/* Reviewformulier: eerst een bevestigings-popup met de ingevulde tekst,
   pas na "Bevestigen en versturen" gaat het formulier echt naar Netlify.
   Dit is een controlestap voor de inzender zelf (typefouten, verkeerd
   aantal sterren) -- geen vervanging voor de inhoudelijke goedkeuring door
   Kaz/Duke voor publicatie: een reviewformulier komt altijd eerst in
   Netlify Forms terecht, en wordt pas met de hand op de site gezet. */
(function () {
  "use strict";
  var rform = document.getElementById("reviewform");
  var dialog = document.getElementById("revcheck");
  if (!rform || !dialog || typeof dialog.showModal !== "function") { return; }

  var html = document.documentElement;
  var animOn = html.classList.contains("anim");

  var sterrenTxt = document.getElementById("revcheck-sterren");
  var naamTxt = document.getElementById("revcheck-naam");
  var tekstTxt = document.getElementById("revcheck-tekst");
  var terugBtn = document.getElementById("revcheck-terug");
  var bevestigBtn = document.getElementById("revcheck-bevestig");
  var bevestigd = false;

  /* Sterren één voor één laten verschijnen (puur decoratief, het element
     staat al aria-hidden): elke ster een eigen span met een oplopende
     animatievertraging via CSS-variabele --i (styles.css, .revcheck__ster).
     Zonder .anim (reduced motion) blijft het platte tekst, zoals eerst. */
  function zetSterren(aantal) {
    if (!animOn) {
      sterrenTxt.textContent = "★".repeat(aantal) + "☆".repeat(5 - aantal);
      return;
    }
    sterrenTxt.textContent = "";
    for (var i = 0; i < 5; i++) {
      var ster = document.createElement("span");
      ster.className = "revcheck__ster";
      ster.style.setProperty("--i", i);
      ster.textContent = i < aantal ? "★" : "☆";
      sterrenTxt.appendChild(ster);
    }
  }

  /* Geanimeerd sluiten: eerst de sluit-klasse (CSS-animatie in styles.css),
     pas daarna dialog.close() -- anders is de dialoog al weg voor er iets
     te zien is. Een vangnet-timeout sluit ook door als animationend om wat
     voor reden dan ook niet vuurt. */
  function sluitenGeanimeerd() {
    if (!animOn) { dialog.close(); return; }
    dialog.classList.add("revcheck--sluit");
    var klaar = false;
    function afronden() {
      if (klaar) { return; }
      klaar = true;
      dialog.removeEventListener("animationend", afronden);
      dialog.classList.remove("revcheck--sluit");
      dialog.close();
    }
    dialog.addEventListener("animationend", afronden);
    window.setTimeout(afronden, 400);
  }

  rform.addEventListener("submit", function (e) {
    if (bevestigd) { return; }
    e.preventDefault();
    if (!rform.reportValidity()) { return; }

    var sterren = rform.querySelector('input[name="sterren"]:checked');
    var aantal = sterren ? Number(sterren.value) : 0;
    zetSterren(aantal);
    var bedrijf = rform.bedrijf.value.trim();
    naamTxt.textContent = rform.naam.value.trim() + (bedrijf ? " — " + bedrijf : "");
    tekstTxt.textContent = "“" + rform.review_tekst.value.trim() + "”";

    dialog.classList.remove("revcheck--sluit");
    dialog.showModal();
  });

  terugBtn.addEventListener("click", sluitenGeanimeerd);

  /* Esc geeft een annuleerbaar "cancel"-event vlak vóór de browser de
     dialoog zelf meteen dichtklapt; dat vangen we af zodat Esc ook
     geanimeerd sluit. */
  dialog.addEventListener("cancel", function (e) {
    e.preventDefault();
    sluitenGeanimeerd();
  });

  /* "Bevestigen en versturen" blijft ongewijzigd: meteen sluiten en
     versturen, geen animatie op dit kritieke pad. */
  bevestigBtn.addEventListener("click", function () {
    bevestigd = true;
    dialog.close();
    rform.requestSubmit();
  });
})();

/* Reviews: elke kaart ingekort tot vier regels met een eigen "Lees meer"-
   knop, en elke kaart klapt los van de andere open (verzoek Kaz,
   28-09-2026). Zonder JavaScript blijft de volledige tekst staan: het
   inkorten hangt aan .js-inkort, die pas hier gezet wordt. Een review die
   binnen vier regels past krijgt geen knop; dat wordt gemeten, ook
   opnieuw na draaien/verbreden van het scherm. */
(function () {
  "use strict";
  var grid = document.querySelector(".review-grid");
  if (!grid) { return; }

  var animOn = document.documentElement.classList.contains("anim");

  var items = [];
  Array.prototype.forEach.call(grid.querySelectorAll(".review"), function (kaart, i) {
    var tekst = kaart.querySelector("p:not(.review__sterren)");
    if (!tekst) { return; }
    if (!tekst.id) { tekst.id = "review-tekst-" + (i + 1); }
    tekst.classList.add("review__tekst");
    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "review__meer";
    knop.setAttribute("aria-controls", tekst.id);
    var item = { kaart: kaart, tekst: tekst, knop: knop, heeftKnop: false };
    knop.addEventListener("click", function () {
      openDichtAnimeren(item, !kaart.classList.contains("is-open"));
      if (window.ScrollTrigger) { window.ScrollTrigger.refresh(); }
    });
    zet(item, false);
    items.push(item);
  });
  if (!items.length) { return; }

  /* Open/dichtklappen animeert de hoogte van de reviewtekst zelf (FLIP:
     hoogte meten vóór de klasse-wissel, klasse wisselen, hoogte na de
     wissel meten, daartussen animeren met de Web Animations API). Zonder
     .anim (reduced motion) verandert alleen de klasse, precies zoals
     eerst -- geen tussenstap, geen animatie. */
  function openDichtAnimeren(item, openen) {
    var t = item.tekst;
    if (!animOn || typeof t.animate !== "function") {
      zet(item, openen);
      return;
    }
    var van = t.getBoundingClientRect().height;
    zet(item, openen);
    var naar = t.getBoundingClientRect().height;
    if (Math.abs(naar - van) < 1) { return; }

    if (t.getAnimations) {
      t.getAnimations().forEach(function (a) { a.cancel(); });
    }
    var vorigeOverflow = t.style.overflow;
    t.style.overflow = "hidden";
    var anim = t.animate(
      [{ height: van + "px" }, { height: naar + "px" }],
      { duration: 320, easing: "cubic-bezier(.22,.61,.36,1)" }
    );
    function opruimen() { t.style.overflow = vorigeOverflow; }
    anim.onfinish = opruimen;
    anim.oncancel = opruimen;
  }
  grid.classList.add("js-inkort");

  function zet(item, open) {
    item.kaart.classList.toggle("is-open", open);
    item.knop.setAttribute("aria-expanded", open ? "true" : "false");
    item.knop.textContent = open ? "Lees minder" : "Lees meer";
  }

  function meet() {
    items.forEach(function (it) {
      var t = it.tekst, teLang;
      if (it.kaart.classList.contains("is-open")) {
        teLang = t.scrollHeight > parseFloat(getComputedStyle(t).lineHeight) * 4 + 2;
      } else {
        teLang = t.scrollHeight > t.clientHeight + 1;
      }
      if (teLang && !it.heeftKnop) {
        t.parentNode.insertBefore(it.knop, t.nextSibling);
      } else if (!teLang && it.heeftKnop) {
        zet(it, false);
        it.knop.parentNode.removeChild(it.knop);
      }
      it.heeftKnop = teLang;
    });

    /* Kaarten per rij (zelfde offsetTop): eerst alles lezen, dan schrijven. */
    var rijen = {};
    items.forEach(function (it) {
      var top = it.kaart.offsetTop;
      (rijen[top] = rijen[top] || []).push(it);
    });
    Object.keys(rijen).forEach(function (top) {
      var rij = rijen[top];
      var meerdere = rij.length > 1;
      var metKnop = rij.some(function (it) { return it.heeftKnop; });
      rij.forEach(function (it) {
        it.kaart.classList.toggle("review--rij", meerdere);
        it.kaart.classList.toggle("review--plek-knop", meerdere && metKnop && !it.heeftKnop);
      });
    });
  }

  meet();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(meet); }
  var breedte = window.innerWidth, wacht = null;
  window.addEventListener("resize", function () {
    if (window.innerWidth === breedte) { return; }
    breedte = window.innerWidth;
    if (wacht) { window.cancelAnimationFrame(wacht); }
    wacht = window.requestAnimationFrame(function () { wacht = null; meet(); });
  });
})();
