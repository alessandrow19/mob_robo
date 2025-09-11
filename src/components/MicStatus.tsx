"use client";

import { useEffect, useState } from "react";

export default function MicStatus() {
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!mounted) return;
        const track = stream.getAudioTracks()[0];
        if (track && track.readyState === "live") {
          setStatus("ok");
        } else {
          setStatus("error");
        }
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => setStatus("error"));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed top-2 right-2 text-xs select-none">
      {status === "pending" && (
        <span className="text-neutral-400">Checando microfone…</span>
      )}
      {status === "ok" && (
        <span className="text-emerald-500">Microfone OK</span>
      )}
      {status === "error" && (
        <span className="text-red-500">Microfone indisponível</span>
      )}
    </div>
  );
}

