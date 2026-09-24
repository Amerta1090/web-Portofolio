import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Testimonial } from "../types/testimonials";
import TestimonialCarousel from "./TestimonialCarousel";

const samples: Testimonial[] = [
  {
    id: "t1",
    name: "Alice",
    role: "CTO",
    company: "Acme Inc",
    text: "Karya yang solid dan deterministik.",
  },
  {
    id: "t2",
    name: "Bob",
    role: "CEO",
    company: "Beta Co",
    text: "Sangat cepat memahami masalah.",
  },
];

describe("TestimonialCarousel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("merender testimoni aktif beserta penulisnya", () => {
    render(<TestimonialCarousel testimonials={samples} />);
    expect(screen.getByText(/Karya yang solid dan deterministik/)).toBeTruthy();
    expect(screen.getByText(/Karya yang solid dan deterministik/)).toHaveTextContent(
      "Karya yang solid dan deterministik.",
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("CTO — Acme Inc")).toBeTruthy();
  });

  it("menampilkan label posisi 'Testimoni i dari n' + aria-live", () => {
    render(<TestimonialCarousel testimonials={samples} />);
    const slide = screen.getByLabelText("Testimoni 1 dari 2");
    expect(slide.getAttribute("aria-live")).toBe("polite");
  });

  it("menavigasi ke testimoni berikutnya/sebelumnya", () => {
    render(<TestimonialCarousel testimonials={samples} />);
    fireEvent.click(screen.getByLabelText("Testimonial berikutnya"));
    expect(screen.getByText(/Sangat cepat memahami masalah/)).toBeTruthy();
    expect(screen.getByLabelText("Testimoni 2 dari 2")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Testimonial sebelumnya"));
    expect(screen.getByLabelText("Testimoni 1 dari 2")).toBeTruthy();
  });

  it("dot navigasi melompat ke testimoni tertentu dengan aria-current", () => {
    render(<TestimonialCarousel testimonials={samples} />);
    const dot1 = screen.getByLabelText("Ke testimonial 1");
    const dot2 = screen.getByLabelText("Ke testimonial 2");
    expect(dot1.getAttribute("aria-current")).toBe("true");
    fireEvent.click(dot2);
    expect(dot2.getAttribute("aria-current")).toBe("true");
    expect(screen.getByText(/Sangat cepat memahami masalah/)).toBeTruthy();
  });

  it("auto-play maju setelah interval dan jeda via tombol pause", () => {
    vi.useFakeTimers();
    render(<TestimonialCarousel testimonials={samples} interval={5000} />);
    expect(screen.getByLabelText("Testimoni 1 dari 2")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByLabelText("Testimoni 2 dari 2")).toBeTruthy();

    // Jeda → tidak maju lagi.
    fireEvent.click(screen.getByLabelText("Jeda putar otomatis"));
    expect(screen.getByLabelText("Lanjutkan putar otomatis")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByLabelText("Testimoni 2 dari 2")).toBeTruthy();
  });

  it("hover menjeda auto-play", () => {
    vi.useFakeTimers();
    render(<TestimonialCarousel testimonials={samples} interval={5000} />);
    const carousel = document.querySelector(".testimonial-carousel");
    expect(carousel).toBeTruthy();

    fireEvent.mouseEnter(carousel as Element);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByLabelText("Testimoni 1 dari 2")).toBeTruthy();

    fireEvent.mouseLeave(carousel as Element);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByLabelText("Testimoni 2 dari 2")).toBeTruthy();
  });

  it("reduced-motion mematikan auto-play (tetap bisa navigasi manual)", () => {
    vi.useFakeTimers();
    const impl = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn(impl),
    });

    render(<TestimonialCarousel testimonials={samples} interval={5000} />);
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByLabelText("Testimoni 1 dari 2")).toBeTruthy();

    // Manual nav tetap berfungsi.
    fireEvent.click(screen.getByLabelText("Testimonial berikutnya"));
    expect(screen.getByLabelText("Testimoni 2 dari 2")).toBeTruthy();
    (window as { matchMedia?: unknown }).matchMedia = undefined;
  });

  it("menampilkan empty-state saat tidak ada testimoni", () => {
    render(<TestimonialCarousel testimonials={[]} />);
    expect(screen.getByText(/Testimonials coming soon/)).toBeTruthy();
    expect(screen.queryByLabelText("Testimonial berikutnya")).toBeNull();
  });
});
