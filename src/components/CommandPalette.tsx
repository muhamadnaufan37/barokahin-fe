import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import { PublicCategory } from "../types";

interface CommandPaletteProps {
  open: boolean;
  categories: PublicCategory[];
  onClose: () => void;
}

interface CommandItem {
  label: string;
  description: string;
  icon: string;
  href: string;
  keywords: string;
}

const BASE_COMMANDS: CommandItem[] = [
  {
    label: "Beranda",
    description: "Kembali ke halaman utama",
    icon: "pi pi-home",
    href: "/",
    keywords: "home utama",
  },
  {
    label: "Jelajahi katalog",
    description: "Cari barang terkurasi",
    icon: "pi pi-shopping-bag",
    href: "/katalog",
    keywords: "barang produk cari",
  },
  {
    label: "Kegiatan dan dana",
    description: "Lihat laporan penggunaan dana",
    icon: "pi pi-chart-bar",
    href: "/kegiatan",
    keywords: "dampak charity laporan",
  },
  {
    label: "Ajukan donasi barang",
    description: "Mulai titipkan barang layak pakai",
    icon: "pi pi-gift",
    href: "/donasi-barang",
    keywords: "donasi donatur",
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  categories,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands = useMemo(() => {
    const categoryCommands = categories.map((category) => ({
      label: category.nama,
      description: "Lihat barang dalam kategori ini",
      icon: "pi pi-tag",
      href: `/katalog?kategori=${encodeURIComponent(category.slug)}`,
      keywords: `${category.slug} kategori`,
    }));
    return [...BASE_COMMANDS, ...categoryCommands];
  }, [categories]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return commands;
    const matches = commands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery)
    );
    return [
      {
        label: `Cari "${query.trim()}" di katalog`,
        description: "Tampilkan barang yang sesuai kata kunci",
        icon: "pi pi-search",
        href: `/katalog?q=${encodeURIComponent(query.trim())}`,
        keywords: "pencarian katalog",
      },
      ...matches,
    ];
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runCommand = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredCommands.length ? (index + 1) % filteredCommands.length : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredCommands.length
          ? (index - 1 + filteredCommands.length) % filteredCommands.length
          : 0
      );
    } else if (event.key === "Enter" && filteredCommands[activeIndex]) {
      event.preventDefault();
      runCommand(filteredCommands[activeIndex].href);
    } else if (event.key === "Tab") {
      const dialog = event.currentTarget;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), a[href]'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-title"
            className="command-dialog"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            onKeyDown={handleKeyDown}
          >
            <h2 id="command-title" className="sr-only">
              Pencarian cepat
            </h2>
            <div className="command-search">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Mau ke mana?"
                aria-label="Cari halaman atau kategori"
                aria-controls="command-results"
              />
              <kbd>Esc</kbd>
            </div>
            <p className="command-caption">
              {query ? "Hasil pencarian" : "Jelajahi Barokahinn"}
            </p>
            <ul id="command-results" className="command-results" role="listbox">
              {filteredCommands.length ? (
                filteredCommands.map((command, index) => (
                  <li key={command.href} role="option" aria-selected={index === activeIndex}>
                    <Button
                      type="button"
                      className={`command-option ${
                        index === activeIndex ? "is-active" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runCommand(command.href)}
                    >
                      <span className="command-option-icon" aria-hidden="true">
                        <i className={command.icon} />
                      </span>
                      <span className="command-option-copy">
                        <strong>{command.label}</strong>
                        <span>{command.description}</span>
                      </span>
                      <i className="pi pi-arrow-up-left command-option-enter" aria-hidden="true" />
                    </Button>
                  </li>
                ))
              ) : (
                <li className="command-empty">
                  Belum ada hasil. Coba kata kunci lain.
                </li>
              )}
            </ul>
            <div className="command-hint">
              <span><kbd>↑</kbd><kbd>↓</kbd> untuk memilih</span>
              <span><kbd>Enter</kbd> untuk membuka</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
