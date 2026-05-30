"use client";

import { useEffect, useRef, useState } from "react";

type SignaturePadFieldProps = {
  fieldId: string;
  label: string;
  required: boolean;
  variant: "signature" | "initials";
};

function canvasHeightFor(variant: SignaturePadFieldProps["variant"]) {
  return variant === "initials" ? 120 : 180;
}

export function SignaturePadField({
  fieldId,
  label,
  required,
  variant,
}: SignaturePadFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [value, setValue] = useState("");

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

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-800" htmlFor={fieldId}>
          {label}
          {required ? <span className="ml-1 text-red-700">*</span> : null}
        </label>
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          onClick={clearCanvas}
          type="button"
        >
          Clear
        </button>
      </div>
      <canvas
        className="w-full touch-none rounded-md border border-slate-300 bg-white"
        id={fieldId}
        onPointerCancel={stopDrawing}
        onPointerDown={startDrawing}
        onPointerLeave={stopDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        ref={canvasRef}
      />
      <input name={fieldId} type="hidden" value={value} />
      <p className="text-xs text-slate-500">
        Draw your {variant === "initials" ? "initials" : "signature"} in the box.
      </p>
    </section>
  );
}
