import PeopleOrbit, { type Person } from "@/components/visuals/PeopleOrbit";

// Photo assignment is matched by inspecting each source photo's apparent
// gender/ethnicity against the name it's assigned to (not just filled in
// array order) — kept consistent with Leadership.tsx, which reuses these
// same six people, so swap both files together if a photo needs
// reassigning. user-2.avif is left unused — 7 photos, 6 people.
const TEAM: Person[] = [
  { name: "Dr. Elena Marsh", role: "Chief Scientific Officer", avatarSrc: "/user-7.avif" },
  { name: "James Okafor", role: "Chief Executive Officer", avatarSrc: "/user-3.avif" },
  { name: "Priya Raman", role: "VP Regulatory Affairs", avatarSrc: "/user-5.avif" },
  { name: "Wei Zhang", role: "VP Manufacturing", avatarSrc: "/user-6.avif" },
  { name: "Sofia Delgado", role: "Head of Clinical Operations", avatarSrc: "/user-4.avif" },
  { name: "Marcus Villanueva", role: "VP Business Development", avatarSrc: "/user-1.avif" },
];

// Partners are companies, not people — the logo-1..6.avif stock templates
// (own baked-in placeholder text, not these partner names) didn't fit, so
// this falls back to PersonAvatar's plain initials-circle for now.
const PARTNERS: Person[] = [
  { name: "Halvern Therapeutics", role: "Biologics Partner" },
  { name: "Whitfield Respiratory", role: "Clinical Partner" },
  { name: "Northbridge Consulting", role: "Regulatory Partner" },
  { name: "Larkspur Biomanufacturing", role: "Manufacturing Partner" },
  { name: "Coastal Clinical Research", role: "Trial Site Partner" },
  { name: "Breathe Forward Alliance", role: "Patient Advocacy Partner" },
];

export default function TeamAndPartners() {
  return (
    <PeopleOrbit
      id="team"
      centerLabel="Aerin Bio"
      team={TEAM}
      partners={PARTNERS}
      teamCopy={{
        eyebrow: "Our team",
        heading: "The people behind the platform.",
        description:
          "Scientists, engineers, and operators who've spent careers getting inhaled biologics to work.",
      }}
      partnersCopy={{
        eyebrow: "Our partners",
        heading: "Built alongside people who share the bet.",
        description:
          "Clinical, regulatory, and manufacturing partners carrying inhaled biologics from bench to patient.",
      }}
    />
  );
}
