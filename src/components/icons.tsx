import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const Menu = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Phone = (p: P) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
export const Mail = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const Pin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const Clock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Calendar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const Wrench = (p: P) => (
  <svg {...base(p)}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></svg>
);
export const Bike = (p: P) => (
  <svg {...base(p)}><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5 9 10h5l4.5 6.5M14 10l-2-4h-2M15 6h3l1 3" /></svg>
);
export const Gear = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /><circle cx="12" cy="12" r="6.5" /></svg>
);
export const Helmet = (p: P) => (
  <svg {...base(p)}><path d="M3 15.5a9 9 0 0 1 18-1V18a1 1 0 0 1-1 1H8.5A5.5 5.5 0 0 1 3 15.5z" /><path d="M12 9.5h8.6M12 9.5V14h8.9" /></svg>
);
export const Drop = (p: P) => (
  <svg {...base(p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></svg>
);
export const Disc = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 5.5v.01M18.5 12h-.01M12 18.5v.01M5.5 12h.01M16.6 7.4h-.01M16.6 16.6h-.01M7.4 16.6h.01M7.4 7.4h.01" /></svg>
);
export const Chain = (p: P) => (
  <svg {...base(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);
export const Bolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
);
export const Battery = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="7" width="17" height="10" rx="2" /><path d="M21.5 10.5v3M7 12h4M9 10v4" /></svg>
);
export const Shield = (p: P) => (
  <svg {...base(p)}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Bag = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="7.5" width="17" height="12.5" rx="2" /><path d="M8.5 7.5V6a3.5 3.5 0 0 1 7 0v1.5M3.5 12.5h17" /></svg>
);
export const Lock = (p: P) => (
  <svg {...base(p)}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" /></svg>
);
export const Jacket = (p: P) => (
  <svg {...base(p)}><path d="M9 3.5h6l1.5 2L20 7.5V20h-4v-6.5M9 3.5 7.5 5.5 4 7.5V20h4v-6.5M9 3.5l3 4 3-4M12 7.5V20M8 13.5h8" /></svg>
);
export const Device = (p: P) => (
  <svg {...base(p)}><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
);
export const Eye = (p: P) => (
  <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const Chat = (p: P) => (
  <svg {...base(p)}><path d="M20.5 12a8 8 0 0 1-11.6 7.2L3.5 20.5l1.3-4.9A8 8 0 1 1 20.5 12z" /><path d="M8.5 11h7M8.5 14h4" /></svg>
);
export const Search = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const Filter = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const Alert = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>
);
export const Compare = (p: P) => (
  <svg {...base(p)}><path d="M8 3v18M16 3v18M3 8h5M16 16h5" /></svg>
);
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Trash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const Whatsapp = ({ size = 20, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...rest}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.93 9.93 0 1 0 12.04 2zm0 18.13a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.23 8.23 0 1 1 6.96 3.84zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.19-.54.06a6.72 6.72 0 0 1-3.36-2.94c-.25-.44.25-.4.72-1.34.08-.16.04-.3-.02-.42l-.76-1.83c-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.79 2.79 0 0 0-.87 2.07 4.85 4.85 0 0 0 1.01 2.57 11.1 11.1 0 0 0 4.25 3.76c1.58.68 2.2.74 2.99.62a2.55 2.55 0 0 0 1.68-1.18 2.08 2.08 0 0 0 .14-1.18c-.06-.11-.22-.17-.47-.29z" />
  </svg>
);
