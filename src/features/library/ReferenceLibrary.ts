export type LibraryCategory = "portraits" | "anatomy" | "animals" | "landscapes" | "master_studies";

export type ReferenceItem = {
  id: string;
  title: string;
  category: LibraryCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  suggestedTools: Array<"loomis" | "tracing" | "grid" | "shading">;
  aspectRatio: number;
  uri: string; // Remote CDN URI
  fallbackSvgUri: string; // Guaranteed offline vector data URI
  tags: string[];
};

// Procedural SVG vector templates optimized for offline tracing and Loomis head studies
function makeSvgDataUri(svgContent: string): string {
  const clean = svgContent.replace(/"/g, "'").replace(/[\r\n\t]/g, " ");
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

export const REFERENCE_LIBRARY: ReferenceItem[] = [
  // --- PORTRAITS ---
  {
    id: "ref-portrait-01",
    title: "Classical Roman Bust (Three-Quarter)",
    category: "portraits",
    difficulty: "beginner",
    description: "Clear planar lighting and distinct 3/4 turn. Ideal for Andrew Loomis 8-stage cranium construction.",
    suggestedTools: ["loomis", "shading", "grid"],
    aspectRatio: 0.75,
    uri: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
        <rect width="600" height="800" fill="#F8F6F0"/>
        <!-- Cranium Sphere -->
        <circle cx="320" cy="280" r="140" fill="#EAE5D8" stroke="#28594B" stroke-width="4"/>
        <!-- Side Plane Disc -->
        <ellipse cx="380" cy="280" rx="45" ry="95" fill="#E0D9C8" stroke="#28594B" stroke-width="3" stroke-dasharray="6,4"/>
        <!-- Brow Line & Axis -->
        <path d="M 200 280 Q 300 295 420 270" stroke="#CB7857" stroke-width="4" fill="none"/>
        <!-- Vertical Centerline -->
        <path d="M 280 180 Q 295 300 270 460" stroke="#CB7857" stroke-width="4" fill="none"/>
        <!-- Jaw & Chin Wedge -->
        <path d="M 200 310 L 250 480 L 320 480 L 390 340" stroke="#28594B" stroke-width="4" fill="none"/>
        <!-- Facial Thirds -->
        <line x1="210" y1="350" x2="360" y2="340" stroke="#9E9581" stroke-width="2" stroke-dasharray="4,4"/>
        <line x1="230" y1="410" x2="340" y2="405" stroke="#9E9581" stroke-width="2" stroke-dasharray="4,4"/>
        <!-- Neck & Torso Pedestal -->
        <path d="M 270 480 L 260 580 L 180 660 L 440 660 L 360 580 L 340 480" stroke="#28594B" stroke-width="3" fill="#EAE5D8"/>
        <!-- Study Annotation -->
        <text x="300" y="740" font-family="sans-serif" font-size="20" font-weight="bold" fill="#28594B" text-anchor="middle">CLASSICAL BUST · THREE-QUARTER STUDY</text>
      </svg>
    `),
    tags: ["sculpture", "bust", "three-quarter", "classical"],
  },
  {
    id: "ref-portrait-02",
    title: "Side Profile with Dramatic Rim Light",
    category: "portraits",
    difficulty: "intermediate",
    description: "High-contrast side profile with clear nasal bridge keystone and ear placement.",
    suggestedTools: ["loomis", "tracing", "shading"],
    aspectRatio: 0.8,
    uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#1C211D"/>
        <!-- Profile Silhouette in Rim Light -->
        <path d="M 320 160 C 220 160 170 230 170 310 C 170 330 175 345 185 355 L 170 380 L 210 385 C 200 405 190 415 195 430 L 225 435 C 215 455 205 470 230 485 L 260 485 C 290 530 330 570 330 630 L 420 630 C 420 540 440 470 440 310 C 440 210 390 160 320 160 Z" fill="#28322B" stroke="#D5A844" stroke-width="3"/>
        <!-- Ear placement marker -->
        <ellipse cx="330" cy="370" rx="20" ry="32" fill="none" stroke="#CB7857" stroke-width="3"/>
        <text x="300" y="700" font-family="sans-serif" font-size="18" font-weight="bold" fill="#D5A844" text-anchor="middle">SIDE PROFILE · RIM LIGHT SILHOUETTE</text>
      </svg>
    `),
    tags: ["profile", "rim-light", "silhouette"],
  },

  // --- ANATOMY & FIGURE ---
  {
    id: "ref-anatomy-01",
    title: "Classical Torso & Contrapposto Pose",
    category: "anatomy",
    difficulty: "intermediate",
    description: "Canonical contrapposto with tilted pelvic basin and opposing shoulder line.",
    suggestedTools: ["grid", "tracing", "shading"],
    aspectRatio: 0.7,
    uri: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" width="600" height="850">
        <rect width="600" height="850" fill="#F8F6F0"/>
        <!-- Spine of action -->
        <path d="M 300 120 Q 320 300 285 450 Q 270 560 290 750" stroke="#CB7857" stroke-width="4" stroke-dasharray="6,4" fill="none"/>
        <!-- Opposing Shoulder Tilt -->
        <line x1="160" y1="230" x2="440" y2="200" stroke="#28594B" stroke-width="5"/>
        <!-- Opposing Pelvic Tilt (Contrapposto) -->
        <line x1="190" y1="460" x2="410" y2="495" stroke="#28594B" stroke-width="5"/>
        <!-- Thoracic Ribcage -->
        <ellipse cx="305" cy="310" rx="95" ry="110" fill="#EAE5D8" stroke="#28594B" stroke-width="3"/>
        <!-- Pelvic Bucket -->
        <polygon points="210,470 390,490 360,570 240,560" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <text x="300" y="800" font-family="sans-serif" font-size="18" font-weight="bold" fill="#28594B" text-anchor="middle">CONTRAPPOSTO CANON · OPPOSING AXES</text>
      </svg>
    `),
    tags: ["contrapposto", "torso", "figure", "musculature"],
  },
  {
    id: "ref-anatomy-02",
    title: "Hand Study in Dynamic Grip",
    category: "anatomy",
    difficulty: "advanced",
    description: "Foreshortened fingers and palm planes. Excellent for testing line confidence.",
    suggestedTools: ["grid", "tracing"],
    aspectRatio: 0.85,
    uri: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="600" height="700">
        <rect width="600" height="700" fill="#F8F6F0"/>
        <!-- Palm Wedge -->
        <polygon points="220,380 380,360 410,500 240,510" fill="#EAE5D8" stroke="#28594B" stroke-width="4"/>
        <!-- Thumb Column -->
        <path d="M 230 400 L 160 380 L 140 320 L 180 300 L 240 350" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <!-- 4 Finger Arcs -->
        <path d="M 250 370 L 260 240 L 280 235 L 285 365" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <path d="M 290 365 L 305 210 L 330 205 L 330 362" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <path d="M 335 362 L 350 230 L 370 230 L 368 360" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <path d="M 372 360 L 390 270 L 405 275 L 398 362" fill="#E0D9C8" stroke="#28594B" stroke-width="3"/>
        <text x="300" y="650" font-family="sans-serif" font-size="18" font-weight="bold" fill="#28594B" text-anchor="middle">HAND ANATOMY · PALM PLANES & ARCS</text>
      </svg>
    `),
    tags: ["hands", "foreshortening", "gesture"],
  },

  // --- ANIMALS ---
  {
    id: "ref-animal-01",
    title: "Arabian Stallion Head in Profile",
    category: "animals",
    difficulty: "beginner",
    description: "Geometric muzzle block, large cranial sphere, and arched cervical vertebrae.",
    suggestedTools: ["grid", "tracing"],
    aspectRatio: 0.75,
    uri: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
        <rect width="600" height="800" fill="#F8F6F0"/>
        <!-- Cranial Sphere -->
        <circle cx="360" cy="270" r="110" fill="#EAE5D8" stroke="#28594B" stroke-width="4"/>
        <!-- Muzzle Box -->
        <polygon points="310,320 200,430 160,420 180,380 280,260" fill="#E0D9C8" stroke="#28594B" stroke-width="4"/>
        <!-- Arched Neck Column -->
        <path d="M 420 190 Q 520 280 500 550" stroke="#CB7857" stroke-width="5" fill="none"/>
        <path d="M 330 380 Q 360 480 340 560" stroke="#28594B" stroke-width="4" fill="none"/>
        <text x="300" y="720" font-family="sans-serif" font-size="18" font-weight="bold" fill="#28594B" text-anchor="middle">EQUINE ANATOMY · CRANIUM & MUZZLE WEDGE</text>
      </svg>
    `),
    tags: ["horse", "wildlife", "profile"],
  },
  {
    id: "ref-animal-02",
    title: "Bengal Tiger Gaze",
    category: "animals",
    difficulty: "intermediate",
    description: "Symmetrical feline facial planes with striking stripe patterns for grid mapping.",
    suggestedTools: ["grid", "shading"],
    aspectRatio: 0.8,
    uri: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
        <rect width="600" height="750" fill="#F8F6F0"/>
        <!-- Symmetrical Feline Mask -->
        <polygon points="300,160 440,240 460,430 380,540 300,560 220,540 140,430 160,240" fill="#EAE5D8" stroke="#28594B" stroke-width="4"/>
        <!-- Muzzle Diamond -->
        <polygon points="300,340 350,440 300,500 250,440" fill="#E0D9C8" stroke="#CB7857" stroke-width="3"/>
        <!-- Eyes -->
        <ellipse cx="230" cy="330" rx="24" ry="16" fill="#D5A844" stroke="#1C211D" stroke-width="3"/>
        <ellipse cx="370" cy="330" rx="24" ry="16" fill="#D5A844" stroke="#1C211D" stroke-width="3"/>
        <text x="300" y="680" font-family="sans-serif" font-size="18" font-weight="bold" fill="#28594B" text-anchor="middle">FELINE HEAD PLANES · SYMMETRIC MASK</text>
      </svg>
    `),
    tags: ["tiger", "feline", "symmetry"],
  },

  // --- LANDSCAPES & ARCHITECTURE ---
  {
    id: "ref-landscape-01",
    title: "Venetian Canal in One-Point Perspective",
    category: "landscapes",
    difficulty: "intermediate",
    description: "Direct central vanishing point with converging architectural facades and reflections.",
    suggestedTools: ["grid", "tracing"],
    aspectRatio: 0.75,
    uri: "https://images.unsplash.com/photo-1523906834658-6e2b32c840bf?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
        <rect width="600" height="800" fill="#F8F6F0"/>
        <!-- Central Horizon & VP -->
        <line x1="0" y1="360" x2="600" y2="360" stroke="#CB7857" stroke-width="3"/>
        <circle cx="300" cy="360" r="8" fill="#CB7857"/>
        <!-- Converging Facade Orthogonals -->
        <line x1="300" y1="360" x2="0" y2="100" stroke="#28594B" stroke-width="3"/>
        <line x1="300" y1="360" x2="600" y2="100" stroke="#28594B" stroke-width="3"/>
        <!-- Canal Waterline -->
        <line x1="300" y1="360" x2="140" y2="800" stroke="#596A94" stroke-width="4"/>
        <line x1="300" y1="360" x2="460" y2="800" stroke="#596A94" stroke-width="4"/>
        <text x="300" y="740" font-family="sans-serif" font-size="18" font-weight="bold" fill="#28594B" text-anchor="middle">ONE-POINT PERSPECTIVE · CANAL CONVERGENCE</text>
      </svg>
    `),
    tags: ["venice", "perspective", "architecture", "canal"],
  },

  // --- MASTER STUDIES ---
  {
    id: "ref-master-01",
    title: "Leonardo Da Vinci Drapery Study",
    category: "master_studies",
    difficulty: "advanced",
    description: "Classical chiaroscuro with cast shadows, pipe folds, and diaper folds.",
    suggestedTools: ["shading", "tracing"],
    aspectRatio: 0.7,
    uri: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80",
    fallbackSvgUri: makeSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" width="600" height="850">
        <rect width="600" height="850" fill="#EDE7DC"/>
        <!-- Pipe Folds & Chiaroscuro Masses -->
        <path d="M 200 180 C 220 340 180 520 160 720 L 260 740 C 270 540 280 360 260 180 Z" fill="#D3C9B8" stroke="#4A3F35" stroke-width="3"/>
        <path d="M 280 180 C 310 350 300 540 290 730 L 380 740 C 380 540 370 340 340 180 Z" fill="#BDB09D" stroke="#4A3F35" stroke-width="3"/>
        <path d="M 370 200 C 430 380 440 560 450 720 L 510 700 C 490 530 470 350 430 200 Z" fill="#998A78" stroke="#4A3F35" stroke-width="3"/>
        <text x="300" y="800" font-family="sans-serif" font-size="18" font-weight="bold" fill="#4A3F35" text-anchor="middle">LEONARDO DRAPERY · 5-VALUE CHIAROSCURO</text>
      </svg>
    `),
    tags: ["drapery", "chiaroscuro", "renaissance"],
  },
];

/**
 * Resolves safe image URI: returns the remote URI if online, or immediately returns the offline SVG template.
 */
export function getReferenceImageUri(item: ReferenceItem, preferOffline = false): string {
  if (preferOffline) return item.fallbackSvgUri;
  return item.uri || item.fallbackSvgUri;
}
