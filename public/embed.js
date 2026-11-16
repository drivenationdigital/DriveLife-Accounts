/*
 * CarEvents embed helper. Include once on any page that embeds a CarEvents
 * iframe (ticket checkout or application form):
 *
 *   <script src="https://account.carevents.com/embed.js" async></script>
 *
 * The embedded page reports its content height with postMessage; this
 * sets the matching iframe to that height so it never shows an inner
 * scrollbar. Only iframes whose window sent the message are touched.
 *
 * Site builders that put custom HTML in a frame of their own (Wix's
 * "Embed HTML" element, for one) leave the CarEvents iframe nested two
 * deep: host page > builder's frame > CarEvents iframe. The copy of this
 * script inside the builder's frame can only size the inner iframe, and
 * the builder's frame keeps the fixed height drawn in its editor. So when
 * this script runs inside a frame it also passes the new total height up
 * to its own parent, and a second copy of this script on the host page
 * itself (Wix: Settings > Custom Code) sizes the builder's frame to match.
 */
(function () {
  if (window.__ceEmbedListener) return;
  window.__ceEmbedListener = true;

  var MESSAGE_TYPE = "drivelife-embed:height";
  // Ceiling on any height we apply - a bad message can't blow the page up.
  var MAX_HEIGHT = 20000;
  // Covers the few pixels an inline iframe leaves under its baseline, so
  // the builder's frame never ends up a hair short and shows a scrollbar.
  var RELAY_SLACK = 8;

  var framed;
  try {
    framed = window.parent !== window;
  } catch (e) {
    framed = true;
  }
  var lastRelayed = -1;

  /*
   * Wix draws custom HTML in a <wix-iframe> whose iframe is absolutely
   * positioned inside a component box with a fixed CSS height. Sizing
   * the iframe alone would spill over whatever follows it; sizing the
   * box makes the section and the rest of the page move with it.
   */
  function sizeBuilderBox(frame, px) {
    if (!frame.closest) return;
    var wix = frame.closest("wix-iframe");
    if (!wix) return;
    var box = wix.closest('[id^="comp-"]');
    if (box) box.style.height = px;
  }

  /*
   * Height of this document's own content. Measured from the bottom edge
   * of the body's children, NOT from scrollHeight or the body box: both
   * are floored at the frame's viewport height (the body box too, in a
   * quirks-mode snippet with no doctype), so once the parent applied a
   * height they could never report a smaller one.
   */
  function contentHeight() {
    var body = document.body;
    if (!body) return 0;
    var bottom = 0;
    var kids = body.children;
    for (var i = 0; i < kids.length; i++) {
      var style = window.getComputedStyle(kids[i]);
      if (style.position === "fixed" || style.display === "none") continue;
      var rect = kids[i].getBoundingClientRect();
      if (rect.height > 0 && rect.bottom > bottom) bottom = rect.bottom;
    }
    if (bottom <= 0) return 0;
    var bodyStyle = window.getComputedStyle(body);
    return Math.ceil(
      bottom +
        (window.pageYOffset || 0) +
        (parseFloat(bodyStyle.marginBottom) || 0) +
        (parseFloat(bodyStyle.paddingBottom) || 0) +
        RELAY_SLACK
    );
  }

  /* Tell our own parent how tall this whole document now is. */
  function relayUp() {
    if (!framed) return;
    var height = Math.min(MAX_HEIGHT, contentHeight());
    if (height <= 0 || Math.abs(height - lastRelayed) < 2) return;
    lastRelayed = height;
    try {
      window.parent.postMessage({ type: MESSAGE_TYPE, height: height }, "*");
    } catch (e) {
      /* parent gone or not reachable - nothing to do */
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== MESSAGE_TYPE) return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0) return;
    var px = Math.min(MAX_HEIGHT, Math.ceil(height)) + "px";
    var matched = false;
    var frames = document.getElementsByTagName("iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.height = px;
        sizeBuilderBox(frames[i], px);
        matched = true;
      }
    }
    if (matched) relayUp();
  });
})();
