import React from "react";
import { Tag } from "primereact/tag";
import { ItemPublicStatus } from "../types";
import { ITEM_STATUS_META } from "../utils/format";

interface StatusBadgeProps {
  status: ItemPublicStatus;
  label?: string;
  size?: "sm" | "md";
}

const STATUS_SEVERITY: Record<
  ItemPublicStatus,
  "success" | "warning" | "secondary"
> = {
  terbit: "success",
  dipesan: "warning",
  terjual: "secondary",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "sm",
}) => {
  const meta = ITEM_STATUS_META[status] || ITEM_STATUS_META.terbit;
  const text = label || meta.label;

  return (
    <Tag
      value={text}
      icon={meta.icon}
      severity={STATUS_SEVERITY[status] || "info"}
      rounded
      className={size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"}
    />
  );
};
