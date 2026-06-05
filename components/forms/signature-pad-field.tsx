"use client";

import { useEffect, useRef, useState } from "react";
import { RESTORE_SIGNATURE_EVENT } from "@/components/forms/public-form-client";

const FIRST_SIGNATURE_EVENT = "formos:first-signature-changed";

type SignaturePadFieldProps = {
  fieldId: string;
  label: string;
  required: boolean;
  variant: "signature" | "initials";
  firstSignatureFieldId?: string | null;
  isFirstSignature?: boolean;
};

function canvasHeightFor(variant: SignaturePadFieldProps["variant"]) {
  return variant === "initials" ? 120 : 180;
}

declare global {
  interface Window {
    formosFirstSignatureValue?: string;
  }
}

export function SignaturePadField({
  fieldId,
  label,
  required,
  variant,
  firstSignatureFieldId,
  isFirstSignature = false,
}: SignaturePadFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const activeInputRef = useRef<"pointer" | "touch" | null>(null);
  const [value, setValue] = useState("");
  const [firstSignatureValue, setFirstSignatureValue] = useState("");
  const canReuseFirstSignature =
    variant === "signature" && Boolean(firstSignatureFieldId) && !isFirstSignature;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(canvasHeightFor(variant) * ratio);
    canvas.style.height = `${canvasHeightFor(variant)}px`;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = variant === "initials" ? 2 : 2.5;
    context.strokeStyle = "#0f172a";

    const restoredValue = hiddenInputRef.current?.value;

    if (restoredValue?.startsWith("data:image/png;base64,")) {
      drawDataUrl(restoredValue);
    }
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const drawingCanvas = canvas;

    function start(clientX: number, clientY: number) {
      const context = drawingCanvas.getContext("2d");

      if (!context) {
        return;
      }

      const point = pointForClient(clientX, clientY);
      isDrawingRef.current = true;
      context.beginPath();
      context.moveTo(point.x, point.y);
    }

    function move(clientX: number, clientY: number) {
      const context = drawingCanvas.getContext("2d");

      if (!context || !isDrawingRef.current) {
        return;
      }

      const point = pointForClient(clientX, clientY);
      context.lineTo(point.x, point.y);
      context.stroke();
      syncValue();
    }

    function stop() {
      if (!isDrawingRef.current) {
        return;
      }

      isDrawingRef.current = false;
      activeInputRef.current = null;
      syncValue();
    }

    function handlePointerDown(event: PointerEvent) {
      event.preventDefault();
      activeInputRef.current = "pointer";

      try {
        drawingCanvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is not guaranteed on every mobile browser.
      }

      start(event.clientX, event.clientY);
    }

    function handlePointerMove(event: PointerEvent) {
      if (activeInputRef.current !== "pointer") {
        return;
      }

      event.preventDefault();
      move(event.clientX, event.clientY);
    }

    function handlePointerStop(event: PointerEvent) {
      if (activeInputRef.current !== "pointer") {
        return;
      }

      event.preventDefault();
      stop();
    }

    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch || activeInputRef.current === "pointer") {
        return;
      }

      event.preventDefault();
      activeInputRef.current = "touch";
      start(touch.clientX, touch.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch || activeInputRef.current !== "touch") {
        return;
      }

      event.preventDefault();
      move(touch.clientX, touch.clientY);
    }

    function handleTouchStop(event: TouchEvent) {
      if (activeInputRef.current !== "touch") {
        return;
      }

      event.preventDefault();
      stop();
    }

    function handleMouseDown(event: MouseEvent) {
      event.preventDefault();
      activeInputRef.current = "pointer";
      start(event.clientX, event.clientY);
    }

    function handleMouseMove(event: MouseEvent) {
      if (activeInputRef.current !== "pointer") {
        return;
      }

      event.preventDefault();
      move(event.clientX, event.clientY);
    }

    drawingCanvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
    drawingCanvas.addEventListener("pointermove", handlePointerMove, { passive: false });
    drawingCanvas.addEventListener("pointerup", handlePointerStop, { passive: false });
    drawingCanvas.addEventListener("pointercancel", handlePointerStop, { passive: false });
    drawingCanvas.addEventListener("pointerleave", handlePointerStop, { passive: false });
    drawingCanvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    drawingCanvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    drawingCanvas.addEventListener("touchend", handleTouchStop, { passive: false });
    drawingCanvas.addEventListener("touchcancel", handleTouchStop, { passive: false });
    drawingCanvas.addEventListener("mousedown", handleMouseDown, { passive: false });
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerStop, { passive: false });
    window.addEventListener("pointercancel", handlePointerStop, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchStop, { passive: false });
    window.addEventListener("touchcancel", handleTouchStop, { passive: false });
    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", stop);

    return () => {
      drawingCanvas.removeEventListener("pointerdown", handlePointerDown);
      drawingCanvas.removeEventListener("pointermove", handlePointerMove);
      drawingCanvas.removeEventListener("pointerup", handlePointerStop);
      drawingCanvas.removeEventListener("pointercancel", handlePointerStop);
      drawingCanvas.removeEventListener("pointerleave", handlePointerStop);
      drawingCanvas.removeEventListener("touchstart", handleTouchStart);
      drawingCanvas.removeEventListener("touchmove", handleTouchMove);
      drawingCanvas.removeEventListener("touchend", handleTouchStop);
      drawingCanvas.removeEventListener("touchcancel", handleTouchStop);
      drawingCanvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerStop);
      window.removeEventListener("pointercancel", handlePointerStop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchStop);
      window.removeEventListener("touchcancel", handleTouchStop);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  useEffect(() => {
    if (isFirstSignature) {
      window.formosFirstSignatureValue = value;
      window.dispatchEvent(
        new CustomEvent(FIRST_SIGNATURE_EVENT, {
          detail: {
            fieldId,
            value,
          },
        }),
      );
    }
  }, [fieldId, isFirstSignature, value]);

  useEffect(() => {
    if (!canReuseFirstSignature) {
      return;
    }

    setFirstSignatureValue(window.formosFirstSignatureValue ?? "");

    function handleFirstSignatureChange(event: Event) {
      const detail = (event as CustomEvent<{ fieldId?: string; value?: string }>).detail;

      if (!firstSignatureFieldId || detail?.fieldId !== firstSignatureFieldId) {
        return;
      }

      setFirstSignatureValue(detail.value ?? "");
    }

    window.addEventListener(FIRST_SIGNATURE_EVENT, handleFirstSignatureChange);

    return () => {
      window.removeEventListener(FIRST_SIGNATURE_EVENT, handleFirstSignatureChange);
    };
  }, [canReuseFirstSignature, firstSignatureFieldId]);

  useEffect(() => {
    function handleRestoreSignature(event: Event) {
      const detail = (event as CustomEvent<{ fieldId?: string; value?: string }>).detail;

      if (detail?.fieldId !== fieldId || !detail.value) {
        return;
      }

      drawDataUrl(detail.value);
    }

    window.addEventListener(RESTORE_SIGNATURE_EVENT, handleRestoreSignature);

    return () => {
      window.removeEventListener(RESTORE_SIGNATURE_EVENT, handleRestoreSignature);
    };
  }, [fieldId]);

  function pointForClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function syncValue() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = dataUrl;
    }

    setValue(dataUrl);
  }

  function drawDataUrl(dataUrl: string) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || !dataUrl) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const rect = canvas.getBoundingClientRect();

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, rect.width, canvasHeightFor(variant));

      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = dataUrl;
      }

      setValue(dataUrl);
    };
    image.src = dataUrl;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }

    setValue("");
  }

  function reuseFirstSignature() {
    if (!firstSignatureValue) {
      return;
    }

    drawDataUrl(firstSignatureValue);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-900" htmlFor={fieldId}>
            {label}
            {required ? <span className="ml-1 text-blue-700">*</span> : null}
          </label>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Draw your {variant === "initials" ? "initials" : "signature"} below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReuseFirstSignature ? (
            <button
              className="rounded-md border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:opacity-70 disabled:hover:bg-white"
              disabled={!firstSignatureValue}
              onClick={reuseFirstSignature}
              type="button"
            >
              Use first signature
            </button>
          ) : null}
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            data-signature-clear-id={fieldId}
            onClick={clearCanvas}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
        <canvas
          className="w-full touch-none rounded-lg border border-slate-200 bg-white shadow-inner"
          data-signature-field-id={fieldId}
          data-signature-variant={variant}
          id={fieldId}
          ref={canvasRef}
          style={{
            display: "block",
            pointerEvents: "auto",
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            overscrollBehavior: "contain",
            userSelect: "none",
          }}
        />
      </div>
      <input
        data-signature-input-id={fieldId}
        defaultValue=""
        name={fieldId}
        ref={hiddenInputRef}
        type="hidden"
      />
      {canReuseFirstSignature && !firstSignatureValue ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          Sign the first signature field first to reuse it here.
        </p>
      ) : null}
    </section>
  );
}
