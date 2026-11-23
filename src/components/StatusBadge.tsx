import React from "react";
import { ItemPublicStatus } from "../types";
import { ITEM_STATUS_META } from "../utils/format";

interface StatusBadgeProps {
  status: ItemPublicStatus;
  label?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "sm",
}) => {
  const meta = ITEM_STATUS_META[status] || ITEM_STATUS_META.terbit;
  const text = label || meta.label;
  const sizeClass =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pil border font-semibold ${meta.badgeClass} ${sizeClass}`}
    >
      <i className={`${meta.icon} text-[10px]`} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
};
