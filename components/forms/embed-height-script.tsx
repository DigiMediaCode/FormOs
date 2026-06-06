export function EmbedHeightScript({ formId }: { formId: string }) {
  const script = `
    (() => {
      const formId = ${JSON.stringify(formId)};
      let lastHeight = 0;

      function measure() {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0,
          html ? html.clientHeight : 0,
          html ? html.scrollHeight : 0,
          html ? html.offsetHeight : 0
        );
      }

      function postHeight() {
        const height = Math.min(5000, Math.max(320, measure()));
        if (Math.abs(height - lastHeight) < 8) return;
        lastHeight = height;
        window.parent.postMessage({
          type: "FORMOS_EMBED_HEIGHT",
          formId,
          height
        }, "*");
      }

      window.addEventListener("load", postHeight);
      window.addEventListener("resize", postHeight);
      setInterval(postHeight, 500);

      if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(postHeight);
        observer.observe(document.documentElement);
        if (document.body) observer.observe(document.body);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", postHeight, { once: true });
      } else {
        postHeight();
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
