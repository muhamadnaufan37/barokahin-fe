import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetIso: string;
  compact?: boolean;
}

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: "Berakhir", hours: 0, mins: 0 };
  const totalMins = Math.floor(diff / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  const secs = Math.floor((diff % 60000) / 1000);

  if (days > 0) {
    return { expired: false, text: `${days}h ${hours}j lagi`, hours, mins };
  }
  if (hours > 0) {
    return { expired: false, text: `${hours}j ${mins}m lagi`, hours, mins };
  }
  return { expired: false, text: `${mins}m ${secs}d lagi`, hours, mins };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetIso, compact }) => {
  const [rem, setRem] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    let timer: number | undefined;

    const tick = () => setRem(getRemaining(targetIso));

    const start = () => {
      tick();
      timer = window.setInterval(tick, 1000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (timer) window.clearInterval(timer);
      } else {
        start();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [targetIso]);

  return (
    <span
      aria-live="off"
      aria-label={`Sisa waktu ${rem.text}`}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      } ${
        rem.expired
          ? "bg-slate-200 text-slate-600"
          : "bg-orange-100 text-orange-800 border border-orange-200"
      }`}
    >
      <i className="pi pi-clock text-[11px]" aria-hidden="true" />
      <span>{rem.text}</span>
    </span>
  );
};
