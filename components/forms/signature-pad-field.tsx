"use client";

import { useEffect, useRef, useState } from "react";

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
  const isDrawingRef = useRef(false);
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
  }, [variant]);

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

  function pointFor(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function syncValue() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setValue(canvas.toDataURL("image/png"));
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
      setValue(dataUrl);
    };
    image.src = dataUrl;
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = pointFor(event);
    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");

    if (!context || !isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    const point = pointFor(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    syncValue();
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    isDrawingRef.current = false;
    syncValue();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
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
          id={fieldId}
          onPointerCancel={stopDrawing}
          onPointerDown={startDrawing}
          onPointerLeave={stopDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          ref={canvasRef}
        />
      </div>
      <input name={fieldId} type="hidden" value={value} />
      {canReuseFirstSignature && !firstSignatureValue ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          Sign the first signature field first to reuse it here.
        </p>
      ) : null}
    </section>
  );
}
