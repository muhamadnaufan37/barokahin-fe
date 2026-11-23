import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "primereact/button";
import { Link } from "react-router-dom";
import { PublicCategory } from "../types";

interface CategoryPopoverProps {
  categories: PublicCategory[];
}

export const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  categories,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="category-popover-anchor" ref={rootRef}>
      <Button
        type="button"
        className={`nav-pill-button ${open ? "is-active" : ""}`}
        aria-expanded={open}
        aria-controls="category-popover"
        onClick={() => setOpen((value) => !value)}
      >
        Kategori
        <i className={`pi pi-angle-${open ? "up" : "down"}`} aria-hidden="true" />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="category-popover"
            className="category-popover"
            role="dialog"
            aria-label="Pilih kategori barang"
            initial={{ opacity: 0, y: 7, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
          >
            <div className="category-popover-heading">
              <strong>Temukan barang</strong>
              <span>Pilih kategori untuk mulai menjelajah.</span>
            </div>
            <div className="category-popover-list">
              {categories.length ? (
                categories.map((category) => (
                  <Link
                    key={category.uuid}
                    to={`/katalog?kategori=${encodeURIComponent(category.slug)}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="category-popover-icon" aria-hidden="true">
                      <i className="pi pi-tag" />
                    </span>
                    <span>{category.nama}</span>
                    <i className="pi pi-arrow-up-right" aria-hidden="true" />
                  </Link>
                ))
              ) : (
                <p className="category-popover-empty">
                  Kategori belum tersedia. Buka katalog untuk melihat semua barang.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
