export interface NavItem {
  label: string;
  href: string;
}

export interface TeamMember {
  name: string;
  image: string;
  role: string;
  email: string;
  phone: string;
  university?: string;
}

export const SITE_NAME = "NagarSetu";

// export const GITHUB_URL = "https://github.com/Ritika0510/NagarSetu";
// process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Ritika0510/NagarSetu";


export const GITHUB_URL = "https://github.com/Ritika0510/NagarSetu";


// export const GITHUB_URL =
//   process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ||
//   "https://github.com/Ritika0510/NagarSetu";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "kk484868@gmail.com";
export const CONTACT_NAME = "Karan Kumar";
export const CONTACT_PHONE = "7518845351";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export const SITE_NAV: NavItem[] = [
  { label: "Sign in", href: "/signin" },
  { label: "Sign up", href: "/signup" },
  { label: "Use cases", href: "/use-cases" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

/** Add every real team member here. Only list roles that are true. */
export const TEAM: TeamMember[] = [
  {
    name: "Ritika Bansal",
    image: "/team/ritika-bansal-profile.png",
    role: "Team Leader · Product concept and UI/UX",
    email: "ritika193bansal@gmail.com",
    phone: "8091275686",
    university: "Rayat Bahra University",
  },
  {
    name: "Khushi",
    image: "/team/khushi-profile.png",
    role: "Retrieval and grounding",
    email: "kt4386993@gmail.com",
    phone: "8628071326",
    university: "Rayat Bahra University",
  },
  {
    name: "Karan Kumar",
    image: "/team/karan-kumar-profile.png",
    role: "Checklist workflow and UI",
    email: "kk484868@gmail.com",
    phone: "7518845351",
    university: "Rayat Bahra University",
  },
  {
    name: "Gulshan Singh",
    image: "/team/gulshan-singh.png",
    role: "Testing and demo",
    email: "gulshanbaudh0606@gmail.com",
    phone: "8284936742",
    university: "Rayat Bahra University",
  },
];

export const PRIMARY_BUTTON =
  "h-auto rounded-lg bg-brand-700 px-7 py-3.5 text-base font-bold text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-900 hover:shadow-md";

export const SECONDARY_BUTTON =
  "h-auto rounded-lg border border-slate-900 bg-white px-7 py-3.5 text-base font-bold text-slate-900 transition-colors duration-150 ease-out hover:bg-slate-100";
