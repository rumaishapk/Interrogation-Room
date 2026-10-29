import { fallbackLook, type SuspectLook } from "@/lib/game/suspect-look";

// Draws a cartoon head-and-shoulders portrait from a suspect's "look".
// Pure SVG: no image files, no AI calls, free and instant for every suspect.
// Cases without a look get a stable stand-in from fallbackLook().

type Props = {
  suspect: { id: string; name: string; description: string; look?: SuspectLook };
  className?: string;
};

const SKIN: Record<SuspectLook["skin"], [string, string]> = {
  porcelain: ["#f6dcc7", "#dcb39a"],
  fair: ["#eec3a1", "#d29d7b"],
  tan: ["#d9a273", "#b07b50"],
  olive: ["#c49565", "#9c7046"],
  brown: ["#9a6440", "#74472a"],
  deep: ["#6b4128", "#4e2d1b"],
};
const HAIR: Record<SuspectLook["hairColor"], string> = {
  black: "#1f1712",
  brown: "#5a3a22",
  auburn: "#8b3f1f",
  blonde: "#d8b25a",
  red: "#b5482a",
  grey: "#a9a39a",
  white: "#e8e2d6",
};
const CLOTH: Record<SuspectLook["outfitColor"], [string, string]> = {
  brown: ["#6b4a2e", "#4a321f"],
  navy: ["#2b3a57", "#1b263a"],
  green: ["#46633a", "#2f4426"],
  burgundy: ["#742636", "#4f1824"],
  grey: ["#666a70", "#45484d"],
  black: ["#2a2522", "#171412"],
  cream: ["#e6d3a8", "#c9b283"],
};

const INK = "#2a1f17";
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export default function SuspectPortrait({ suspect, className = "" }: Props) {
  const look = suspect.look ?? fallbackLook(suspect);
  const [skin, skinShade] = SKIN[look.skin];
  const hair = look.age === "older" && !["white", "blonde"].includes(look.hairColor) ? HAIR.grey : HAIR[look.hairColor];
  const [cloth, clothShade] = CLOTH[look.outfitColor];
  const feminine = look.presentation === "feminine";
  const hatOn = look.headwear !== "none";

  return (
    <svg
      viewBox="0 0 300 300"
      role="img"
      aria-label={`Portrait of ${suspect.name}`}
      className={`block bg-paper-200 ${className}`}
    >
      {/* Soft light behind the head */}
      <circle cx="150" cy="120" r="140" fill="#faf3e2" opacity="0.7" />

      <HairBack style={look.hairStyle} color={hair} />
      <Outfit outfit={look.outfit} cloth={cloth} shade={clothShade} />

      {/* Neck and head */}
      <path d="M130 180 L130 222 L170 222 L170 180 Z" fill={skin} {...line} />
      <path d="M130 196 Q150 206 170 196 L170 186 L130 186 Z" fill={skinShade} opacity="0.6" />
      <ellipse cx="88" cy="134" rx="10" ry="15" fill={skin} {...line} />
      <ellipse cx="212" cy="134" rx="10" ry="15" fill={skin} {...line} />
      <path d="M90 120 C90 60 120 46 150 46 C180 46 210 60 210 120 C210 172 184 196 150 196 C116 196 90 172 90 120 Z" fill={skin} {...line} />
      <path d="M98 150 C108 188 192 188 202 150 C194 178 172 190 150 190 C128 190 106 178 98 150 Z" fill={skinShade} opacity="0.45" />

      {/* Rosy cheeks for younger faces; lines for older ones */}
      {look.age === "young" && (
        <g fill="#e8857a" opacity="0.25">
          <ellipse cx="114" cy="152" rx="11" ry="7" />
          <ellipse cx="186" cy="152" rx="11" ry="7" />
        </g>
      )}
      {look.age === "older" && (
        <g fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round">
          <path d="M126 78 Q150 72 174 78" />
          <path d="M104 132 L110 136 M196 132 L190 136" />
          <path d="M124 166 Q130 172 128 178 M176 166 Q170 172 172 178" />
        </g>
      )}

      {/* Eyes and eyebrows */}
      <g>
        <ellipse cx="126" cy="128" rx="8.5" ry="10" fill="#fff" {...line} strokeWidth={2.5} />
        <ellipse cx="174" cy="128" rx="8.5" ry="10" fill="#fff" {...line} strokeWidth={2.5} />
        <circle cx="127" cy="130" r="5" fill={INK} />
        <circle cx="175" cy="130" r="5" fill={INK} />
        <circle cx="129" cy="128" r="1.6" fill="#fff" />
        <circle cx="177" cy="128" r="1.6" fill="#fff" />
        {feminine && (
          <path d="M116 120 L113 117 M136 119 L139 116 M164 119 L161 116 M184 120 L187 117" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        )}
        <path d="M112 110 Q126 102 140 108" fill="none" stroke={hair === HAIR.white ? "#8f887d" : hair} strokeWidth="6" strokeLinecap="round" />
        <path d="M160 108 Q174 102 188 110" fill="none" stroke={hair === HAIR.white ? "#8f887d" : hair} strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Nose */}
      <path d="M150 134 Q144 152 150 156 Q155 157 158 154" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />

      {/* Mouth, then facial hair on top */}
      {feminine ? (
        <path d="M136 170 Q150 180 164 170 Q150 174 136 170 Z" fill="#a8383b" {...line} strokeWidth={2} />
      ) : (
        <path d="M137 171 Q150 178 163 171" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
      )}
      {look.facialHair === "mustache" && (
        <path d="M130 164 C138 156 146 158 150 162 C154 158 162 156 170 164 C162 166 156 166 150 164 C144 166 138 166 130 164 Z" fill={hair} {...line} strokeWidth={2} />
      )}
      {look.facialHair === "beard" && (
        <path
          d="M92 136 C92 186 118 206 150 206 C182 206 208 186 208 136 C200 160 186 176 172 178 C166 168 158 164 150 166 C142 164 134 168 128 178 C114 176 100 160 92 136 Z"
          fill={hair}
          {...line}
        />
      )}

      {/* Glasses */}
      {look.glasses !== "none" && (
        <g fill="#ffffff" fillOpacity="0.18" stroke={INK} strokeWidth="4">
          {look.glasses === "round" ? (
            <>
              <circle cx="126" cy="129" r="17" />
              <circle cx="174" cy="129" r="17" />
            </>
          ) : (
            <>
              <rect x="106" y="114" width="40" height="30" rx="6" />
              <rect x="154" y="114" width="40" height="30" rx="6" />
            </>
          )}
          <path d="M143 127 Q150 122 157 127" fill="none" />
          <path d="M106 126 L92 122 M194 126 L208 122" fill="none" />
        </g>
      )}

      <HairFront style={look.hairStyle} color={hair} hatOn={hatOn} />
      <Headwear kind={look.headwear} cloth={cloth} shade={clothShade} />
    </svg>
  );
}

function HairBack({ style, color }: { style: SuspectLook["hairStyle"]; color: string }) {
  if (style === "long")
    return <path d="M84 110 C76 170 82 228 100 252 L200 252 C218 228 224 170 216 110 C210 60 184 34 150 34 C116 34 90 60 84 110 Z" fill={color} {...line} />;
  if (style === "bob")
    return <path d="M82 112 C78 156 84 192 104 204 L196 204 C216 192 222 156 218 112 C212 62 184 38 150 38 C116 38 88 62 82 112 Z" fill={color} {...line} />;
  if (style === "curly")
    return (
      <g fill={color} {...line}>
        {[[96, 96], [84, 132], [92, 168], [204, 96], [216, 132], [208, 168]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="22" />
        ))}
      </g>
    );
  if (style === "bun") return <circle cx="150" cy="40" r="24" fill={color} {...line} />;
  return null;
}

function HairFront({ style, color, hatOn }: { style: SuspectLook["hairStyle"]; color: string; hatOn: boolean }) {
  if (style === "bald") {
    // Just a little hair at the sides, and a shine.
    return (
      <g>
        <path d="M90 118 C90 104 96 96 102 92 L104 124 Z M210 118 C210 104 204 96 198 92 L196 124 Z" fill={color} {...line} strokeWidth={2} />
        {!hatOn && <ellipse cx="132" cy="66" rx="16" ry="7" fill="#fff" opacity="0.35" />}
      </g>
    );
  }
  if (style === "curly")
    return (
      <g fill={color} {...line}>
        {[[110, 70], [134, 56], [160, 54], [186, 66], [100, 94], [200, 94]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="20" />
        ))}
      </g>
    );
  if (style === "slicked")
    return <path d="M90 116 C88 64 118 44 152 44 C188 44 212 64 210 114 C198 90 178 78 150 76 C122 76 102 90 90 116 Z" fill={color} {...line} />;
  if (style === "short")
    return <path d="M90 112 C86 62 118 42 150 42 C186 42 214 62 210 112 C204 92 190 84 176 86 C170 76 150 74 136 82 C116 80 98 92 90 112 Z" fill={color} {...line} />;
  // bob, long, bun: a side-swept fringe
  return <path d="M88 122 C84 64 118 42 152 42 C188 42 216 66 212 122 C196 96 170 78 140 80 C118 82 100 98 88 122 Z" fill={color} {...line} />;
}

function Outfit({ outfit, cloth, shade }: { outfit: SuspectLook["outfit"]; cloth: string; shade: string }) {
  const shoulders = "M30 300 C34 240 84 214 150 214 C216 214 266 240 270 300 Z";
  const white = "#f6efe0";
  switch (outfit) {
    case "chef":
      return (
        <g>
          <path d={shoulders} fill={white} {...line} />
          <path d="M112 218 L150 300 L188 218" fill="none" stroke={INK} strokeWidth="2" />
          {[244, 266, 288].map((y) => (
            <g key={y} fill={INK}>
              <circle cx="132" cy={y} r="3" />
              <circle cx="168" cy={y} r="3" />
            </g>
          ))}
          <path d="M126 214 Q150 236 174 214 L168 228 Q150 240 132 228 Z" fill="#9e2a2b" {...line} strokeWidth={2} />
        </g>
      );
    case "lab-coat":
      return (
        <g>
          <path d={shoulders} fill={white} {...line} />
          <path d="M122 216 L150 268 L178 216 Z" fill={cloth} {...line} />
          <path d="M144 226 L156 226 L160 262 L150 272 L140 262 Z" fill="#9e2a2b" {...line} strokeWidth={2} />
          <path d="M112 216 L150 300 M188 216 L150 300" stroke={INK} strokeWidth="2.5" />
          <rect x="196" y="252" width="30" height="8" rx="2" fill="#c9b283" {...line} strokeWidth={2} />
        </g>
      );
    case "uniform":
      return (
        <g>
          <path d={shoulders} fill={cloth} {...line} />
          <path d="M126 214 L150 240 L174 214" fill={shade} {...line} />
          <rect x="54" y="236" width="44" height="10" rx="3" fill="#b8893b" {...line} strokeWidth={2} transform="rotate(14 76 241)" />
          <rect x="202" y="236" width="44" height="10" rx="3" fill="#b8893b" {...line} strokeWidth={2} transform="rotate(-14 224 241)" />
          <path d="M198 262 L206 254 L214 262 L210 274 L202 274 Z" fill="#dcb877" {...line} strokeWidth={2} />
          <circle cx="150" cy="262" r="3.5" fill="#dcb877" stroke={INK} strokeWidth="1.5" />
          <circle cx="150" cy="284" r="3.5" fill="#dcb877" stroke={INK} strokeWidth="1.5" />
        </g>
      );
    case "dress":
      return (
        <g>
          <path d={shoulders} fill={cloth} {...line} />
          <path d="M118 216 Q150 252 182 216" fill="#f6dcc7" fillOpacity="0" stroke={INK} strokeWidth="3" />
          <path d="M120 222 Q150 248 180 222" fill="none" stroke="#faf3e2" strokeWidth="5" strokeDasharray="1 9" strokeLinecap="round" />
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d={shoulders} fill={cloth} {...line} />
          <path d="M120 216 Q150 236 180 216" fill="none" stroke={shade} strokeWidth="9" />
          <path d="M132 216 L150 232 L168 216" fill={white} {...line} strokeWidth={2} />
          <path d="M70 262 L70 300 M230 262 L230 300" stroke={shade} strokeWidth="3" />
        </g>
      );
    case "apron":
      return (
        <g>
          <path d={shoulders} fill={white} {...line} />
          <path d="M112 300 L116 236 L184 236 L188 300 Z" fill={cloth} {...line} />
          <path d="M116 236 L124 214 M184 236 L176 214" stroke={cloth} strokeWidth="7" />
          <rect x="136" y="256" width="28" height="18" rx="2" fill={shade} {...line} strokeWidth={2} />
        </g>
      );
    case "trench-coat":
      return (
        <g>
          <path d={shoulders} fill={cloth} {...line} />
          <path d="M100 222 L136 214 L150 258 L120 300 L98 300 L112 258 Z" fill={shade} {...line} />
          <path d="M200 222 L164 214 L150 258 L180 300 L202 300 L188 258 Z" fill={shade} {...line} />
          <path d="M136 214 L150 258 L164 214 Z" fill={white} {...line} strokeWidth={2} />
        </g>
      );
    default: // suit
      return (
        <g>
          <path d={shoulders} fill={cloth} {...line} />
          <path d="M122 214 L150 270 L178 214 Z" fill={white} {...line} />
          <path d="M144 224 L156 224 L160 262 L150 274 L140 262 Z" fill="#9e2a2b" {...line} strokeWidth={2} />
          <path d="M122 214 L108 236 L140 262 L150 270 Z" fill={shade} {...line} />
          <path d="M178 214 L192 236 L160 262 L150 270 Z" fill={shade} {...line} />
          <path d="M196 252 L214 248 L212 258 Z" fill="#faf3e2" stroke={INK} strokeWidth="1.5" />
        </g>
      );
  }
}

function Headwear({ kind, cloth, shade }: { kind: SuspectLook["headwear"]; cloth: string; shade: string }) {
  switch (kind) {
    case "fedora":
      return (
        <g>
          <ellipse cx="150" cy="70" rx="96" ry="17" fill="#3d2c20" {...line} />
          <path d="M94 70 C92 26 114 12 150 12 C186 12 208 26 206 70 Z" fill="#4a3a2c" {...line} />
          <path d="M136 20 Q150 30 164 20" fill="none" stroke={INK} strokeWidth="2" />
          <rect x="95" y="54" width="110" height="12" fill="#9e2a2b" />
        </g>
      );
    case "flat-cap":
      return (
        <g>
          <path d="M86 92 C84 50 116 30 150 30 C190 30 218 50 216 88 C190 78 120 78 86 92 Z" fill={shade} {...line} />
          <path d="M86 92 C110 98 150 100 176 92 C150 86 110 86 86 92 Z" fill={cloth} {...line} />
          <path d="M110 46 Q150 38 196 52" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.5" />
        </g>
      );
    case "beret":
      return (
        <g>
          <path d="M84 84 C80 46 120 30 160 32 C204 34 228 58 214 80 C190 92 110 92 84 84 Z" fill="#742636" {...line} />
          <circle cx="156" cy="32" r="5" fill="#4f1824" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "cloche":
      return (
        <g>
          <path d="M84 110 C80 52 114 30 150 30 C186 30 220 52 216 110 C196 96 104 96 84 110 Z" fill={cloth} {...line} />
          <path d="M88 96 C120 84 180 84 212 96" fill="none" stroke={shade} strokeWidth="8" />
          <circle cx="196" cy="88" r="7" fill="#dcb877" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "chef-hat":
      return (
        <g fill="#f6efe0" {...line}>
          <rect x="104" y="58" width="92" height="30" rx="4" />
          <circle cx="116" cy="40" r="24" />
          <circle cx="150" cy="28" r="28" />
          <circle cx="184" cy="40" r="24" />
          <rect x="106" y="46" width="88" height="20" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}
