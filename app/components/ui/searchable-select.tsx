"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  kode?: string | null;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
  allowClear?: boolean;
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Ketik untuk mencari...",
  emptyMessage = "Tidak ada hasil ditemukan",
  disabled = false,
  className = "",
  allowClear = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected Option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Filtered Options
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(lower)) ||
        (opt.kode && opt.kode.toLowerCase().includes(lower))
    );
  }, [options, query]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setHighlightedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    }
  };

  // Scroll to highlighted item
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white border rounded-lg transition shadow-2xs outline-none ${
          isOpen
            ? "border-[#003399] ring-2 ring-[#003399]/20"
            : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-slate-900 cursor-pointer"}`}
      >
        <span className="block text-left whitespace-normal break-words leading-snug flex-1">
          {selectedOption ? (
            <span className="font-semibold text-slate-900">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-slate-500">
          {allowClear && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded text-xs font-bold"
              title="Hapus pilihan"
            >
              &times;
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#003399]" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white border-2 border-slate-300 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50">
            <div className="relative flex items-center">
              <svg
                className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/20 outline-none text-slate-900 font-medium placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-64 overflow-y-auto py-1 text-sm divide-y divide-slate-100"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-500 italic">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? "bg-blue-50/80 text-[#003399] font-bold border-l-4 border-[#003399]"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-950 font-medium"
                        : "text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <span className="block whitespace-normal break-words leading-relaxed text-sm">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <p className="text-xs text-slate-500 whitespace-normal break-words mt-0.5">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-[#003399] font-black text-sm shrink-0 ml-1">
                        ✓
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
