/*
 * CarEvents embed helper. Include once on any page that embeds a CarEvents
 * iframe (ticket checkout or application form):
 *
 *   <script src="https://account.carevents.com/embed.js" async></script>
 *
 * The embedded page reports its content height with postMessage; this
 * sets the matching iframe to that height so it never shows an inner
 * scrollbar. Only iframes whose window sent the message are touched.
 */
(function () {
  if (window.__ceEmbedListener) return;
  window.__ceEmbedListener = true;
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "drivelife-embed:height") return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0) return;
    var frames = document.getElementsByTagName("iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.height = Math.ceil(height) + "px";
      }
    }
  });
})();
