/* Laadintro: alleen index.html, eenmaal per sessie, nooit bij verminderde
   beweging. Dit bestand zet alleen een klasse; de intro zelf is CSS en
   eindigt vanzelf. Faalt iets (geen opslag, geen JS), dan is er geen intro. */
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }
    if (window.sessionStorage.getItem("vox-intro")) { return; }
    window.sessionStorage.setItem("vox-intro", "1");
    document.documentElement.className += " intro-aan";
  } catch (e) {}
})();
