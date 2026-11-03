/* Laadintro "sluiter": alleen index.html, eenmaal per sessie, nooit bij
   verminderde beweging en nooit zonder JS (zonder deze klasse is de laag uit).
   De animatie zelf is CSS (styles.css, blok "laadintro") en eindigt vanzelf;
   dit bestand zet alleen de klasse en ruimt de laag daarna op. De hero staat
   er al onder, dus de intro blokkeert niets. Faalt iets, dan is er geen intro. */
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }
    if (window.sessionStorage.getItem("vox-intro")) { return; }
    window.sessionStorage.setItem("vox-intro", "1");
    var de = document.documentElement;
    de.className += " intro-aan";
    /* De laag verdwijnt uit de DOM zodra de CSS-animatie klaar is (1,9 s
       vanaf eerste verf); het vangnet doet dat ook als animationend uitblijft. */
    var opruimen = function () {
      var laag = document.querySelector(".intro");
      if (laag && laag.parentNode) { laag.parentNode.removeChild(laag); }
    };
    document.addEventListener("animationend", function (e) {
      if (e.animationName === "intro-weg") { opruimen(); }
    });
    window.setTimeout(opruimen, 5000);
  } catch (e) {}
})();
