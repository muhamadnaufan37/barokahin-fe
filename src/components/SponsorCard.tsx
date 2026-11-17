import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { SponsorSlot } from "../types";
import { useApp } from "../context/AppContext";

interface SponsorCardProps {
  sponsor: SponsorSlot;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor }) => {
  const navigate = useNavigate();
  const { trackSponsorClick } = useApp();

  if (!sponsor.active) return null;

  const handleClick = () => {
    trackSponsorClick(sponsor.id);
    if (sponsor.linkUrl.startsWith("/")) {
      navigate(sponsor.linkUrl);
    } else {
      window.open(sponsor.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <aside
      aria-label={`Sponsor: ${sponsor.sponsorName}`}
      className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          <i className="pi pi-info-circle text-[10px]" aria-hidden="true" />
          Didukung oleh · Disponsori
        </span>
        <span className="text-xs font-semibold text-slate-600">{sponsor.sponsorName}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">{sponsor.headline}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{sponsor.description}</p>
        </div>
        <Button
          label={sponsor.ctaLabel}
          size="small"
          outlined
          severity="secondary"
          className="shrink-0 touch-target"
          onClick={handleClick}
        />
      </div>
    </aside>
  );
};
