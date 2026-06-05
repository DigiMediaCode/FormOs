export function SignatureCanvasBootstrapScript() {
  const script = `
    (() => {
      function canvasHeightFor(variant) {
        return variant === "initials" ? 120 : 180;
      }

      function initSignatureCanvas(canvas) {
        if (!canvas || canvas.dataset.formosSignatureReady === "true") return;

        const fieldId = canvas.dataset.signatureFieldId;
        const variant = canvas.dataset.signatureVariant || "signature";
        const hidden = fieldId
          ? document.querySelector('input[data-signature-input-id="' + fieldId + '"]')
          : null;

        if (!fieldId || !hidden) return;

        canvas.dataset.formosSignatureReady = "true";
        canvas.style.display = "block";
        canvas.style.touchAction = "none";
        canvas.style.webkitUserSelect = "none";
        canvas.style.userSelect = "none";
        canvas.style.webkitTouchCallout = "none";
        canvas.style.overscrollBehavior = "contain";
        canvas.style.height = canvasHeightFor(variant) + "px";

        let drawing = false;
        let mode = null;
        let context = null;
        let ratio = 1;
        let previousBodyOverflow = "";
        let previousBodyOverscroll = "";

        function lockPageScroll() {
          previousBodyOverflow = document.body.style.overflow;
          previousBodyOverscroll = document.body.style.overscrollBehavior;
          document.body.style.overflow = "hidden";
          document.body.style.overscrollBehavior = "none";
        }

        function unlockPageScroll() {
          document.body.style.overflow = previousBodyOverflow;
          document.body.style.overscrollBehavior = previousBodyOverscroll;
        }

        function sizeCanvas() {
          const existingValue = hidden.value;
          const rect = canvas.getBoundingClientRect();
          const width = Math.max(280, Math.round(rect.width || canvas.parentElement?.clientWidth || 300));
          const height = canvasHeightFor(variant);

          ratio = window.devicePixelRatio || 1;
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          canvas.style.height = height + "px";

          context = canvas.getContext("2d");
          if (!context) return;

          context.setTransform(ratio, 0, 0, ratio, 0, 0);
          context.lineCap = "round";
          context.lineJoin = "round";
          context.lineWidth = variant === "initials" ? 2 : 2.5;
          context.strokeStyle = "#0f172a";

          if (existingValue && existingValue.startsWith("data:image/png;base64,")) {
            drawDataUrl(existingValue);
          }
        }

        function point(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
        }

        function persistValue() {
          try {
            hidden.value = canvas.toDataURL("image/png");
            hidden.dispatchEvent(new Event("input", { bubbles: true }));
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
          } catch {}
        }

        function drawDataUrl(dataUrl) {
          if (!context || !dataUrl) return;

          const image = new Image();
          image.onload = () => {
            const rect = canvas.getBoundingClientRect();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, rect.width, canvasHeightFor(variant));
          };
          image.src = dataUrl;
        }

        function start(clientX, clientY) {
          if (!context) sizeCanvas();
          if (!context) return;

          const p = point(clientX, clientY);
          lockPageScroll();
          drawing = true;
          context.beginPath();
          context.moveTo(p.x, p.y);
        }

        function move(clientX, clientY) {
          if (!drawing || !context) return;

          const p = point(clientX, clientY);
          context.lineTo(p.x, p.y);
          context.stroke();
          persistValue();
        }

        function stop() {
          if (!drawing) return;
          drawing = false;
          mode = null;
          persistValue();
          unlockPageScroll();
        }

        function clear() {
          if (!context) sizeCanvas();
          if (!context) return;

          context.clearRect(0, 0, canvas.width, canvas.height);
          hidden.value = "";
          hidden.dispatchEvent(new Event("input", { bubbles: true }));
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
        }

        function pointerDown(event) {
          event.preventDefault();
          mode = "pointer";
          try { canvas.setPointerCapture(event.pointerId); } catch {}
          start(event.clientX, event.clientY);
        }

        function pointerMove(event) {
          if (mode !== "pointer") return;
          event.preventDefault();
          move(event.clientX, event.clientY);
        }

        function pointerStop(event) {
          if (mode !== "pointer") return;
          event.preventDefault();
          stop();
        }

        function touchStart(event) {
          const touch = event.touches[0] || event.changedTouches[0];
          if (!touch) return;
          if (mode === "pointer") {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          mode = "touch";
          start(touch.clientX, touch.clientY);
        }

        function touchMove(event) {
          const touch = event.touches[0] || event.changedTouches[0];
          if (mode === "pointer" && drawing) {
            event.preventDefault();
            return;
          }
          if (!touch || mode !== "touch") return;
          event.preventDefault();
          move(touch.clientX, touch.clientY);
        }

        function touchStop(event) {
          if (mode !== "touch") return;
          event.preventDefault();
          stop();
        }

        function mouseDown(event) {
          event.preventDefault();
          mode = "mouse";
          start(event.clientX, event.clientY);
        }

        function mouseMove(event) {
          if (mode !== "mouse") return;
          event.preventDefault();
          move(event.clientX, event.clientY);
        }

        function mouseStop() {
          if (mode !== "mouse") return;
          stop();
        }

        canvas.addEventListener("pointerdown", pointerDown, { passive: false });
        window.addEventListener("pointermove", pointerMove, { passive: false });
        window.addEventListener("pointerup", pointerStop, { passive: false });
        window.addEventListener("pointercancel", pointerStop, { passive: false });
        canvas.addEventListener("touchstart", touchStart, { passive: false });
        window.addEventListener("touchmove", touchMove, { passive: false });
        window.addEventListener("touchend", touchStop, { passive: false });
        window.addEventListener("touchcancel", touchStop, { passive: false });
        canvas.addEventListener("mousedown", mouseDown, { passive: false });
        window.addEventListener("mousemove", mouseMove, { passive: false });
        window.addEventListener("mouseup", mouseStop);
        document.addEventListener("touchmove", touchMove, { passive: false });
        document.addEventListener("touchend", touchStop, { passive: false });
        document.addEventListener("touchcancel", touchStop, { passive: false });
        document.addEventListener("pointermove", pointerMove, { passive: false });
        document.addEventListener("pointerup", pointerStop, { passive: false });
        document.addEventListener("pointercancel", pointerStop, { passive: false });
        window.addEventListener("resize", sizeCanvas);
        document
          .querySelectorAll('[data-signature-clear-id="' + fieldId + '"]')
          .forEach((button) => {
            button.addEventListener("click", clear);
          });
        window.addEventListener("formos:restore-signature", (event) => {
          if (event.detail?.fieldId === fieldId && event.detail?.value) {
            hidden.value = event.detail.value;
            drawDataUrl(event.detail.value);
          }
        });

        sizeCanvas();
      }

      function initAllSignatureCanvases() {
        document
          .querySelectorAll("canvas[data-signature-field-id]")
          .forEach(initSignatureCanvas);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAllSignatureCanvases, { once: true });
      } else {
        initAllSignatureCanvases();
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
