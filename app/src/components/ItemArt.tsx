import { useId, type Ref, type SVGProps } from 'react'
import type { Art } from '../data/menu'

type Props = { art: Art; ref?: Ref<SVGSVGElement> } & Omit<SVGProps<SVGSVGElement>, 'viewBox'>

/** Hand-drawn product illustrations, so the app ships no third-party photos. */
export function ItemArt({ art, ...svgProps }: Props) {
  const { kind, fill, top = '#fff6ea' } = art
  // Unique per instance: several illustrations share the page.
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`

  return (
    <svg viewBox="0 0 200 220" role="img" aria-hidden="true" {...svgProps}>
      <defs>
        {/* Cylindrical shading laid over any body */}
        <linearGradient id={id('round')} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.18" stopColor="#000" stopOpacity="0.04" />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        {/* Liquid gets deeper towards the bottom */}
        <linearGradient id={id('depth')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={id('floor')}>
          <stop offset="0" stopColor="#3a2a1e" stopOpacity="0.32" />
          <stop offset="1" stopColor="#3a2a1e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('bake')} cx="0.45" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#5a2e10" stopOpacity="0.35" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="206" rx="74" ry="9" fill={url('floor')} />

      {kind === 'cup' && (
        <g>
          <path d="M50 50 L150 50 L139 196 Q100 206 61 196 Z" fill={fill} />
          <path d="M50 50 L150 50 L139 196 Q100 206 61 196 Z" fill={url('depth')} />
          <path d="M50 50 L150 50 L148 80 Q100 88 52 80 Z" fill={top} />
          <path d="M52 80 Q100 88 148 80" stroke="#000" strokeOpacity="0.06" strokeWidth="3" fill="none" />
          <path d="M50 50 L150 50 L139 196 Q100 206 61 196 Z" fill={url('round')} />
          <ellipse cx="100" cy="50" rx="50" ry="10" fill={top} />
          <ellipse cx="100" cy="50" rx="50" ry="10" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
          <path d="M100 58 C88 50 84 44 92 42 C96 41 99 44 100 46 C101 44 104 41 108 42 C116 44 112 50 100 58 Z" fill={fill} opacity="0.45" />
        </g>
      )}

      {kind === 'mug' && (
        <g>
          <ellipse cx="100" cy="194" rx="82" ry="14" fill="#efe9e1" />
          <ellipse cx="100" cy="191" rx="82" ry="12" fill="#fbf8f4" />
          <ellipse cx="100" cy="190" rx="48" ry="7" fill="#e7e0d6" />
          <path d="M150 104 C188 100 190 156 146 162" fill="none" stroke="#f3eee7" strokeWidth="13" strokeLinecap="round" />
          <path d="M150 104 C188 100 190 156 146 162" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="13" strokeLinecap="round" transform="translate(2 3)" />
          <path d="M40 92 L160 92 L150 176 Q100 196 50 176 Z" fill="#fbf8f4" />
          <path d="M40 92 L160 92 L150 176 Q100 196 50 176 Z" fill={url('round')} />
          <ellipse cx="100" cy="92" rx="60" ry="12" fill="#ece5db" />
          <ellipse cx="100" cy="93" rx="53" ry="9.5" fill={top} />
          <ellipse cx="100" cy="93" rx="53" ry="9.5" fill="none" stroke={fill} strokeOpacity="0.5" strokeWidth="3" />
          <path d="M100 99 C90 93 87 89 93 87.5 C96 87 99 89 100 90.5 C101 89 104 87 107 87.5 C113 89 110 93 100 99 Z" fill={fill} opacity="0.65" />
          <path d="M100 99 L100 103" stroke={fill} strokeOpacity="0.5" strokeWidth="1.5" />
        </g>
      )}

      {kind === 'iced' && (
        <g>
          <path d="M57 74 L143 74 L135 196 Q100 204 65 196 Z" fill={fill} />
          <path d="M57 74 L143 74 L135 196 Q100 204 65 196 Z" fill={url('depth')} />
          <path d="M57 74 L143 74 L141 104 Q100 112 59 104 Z" fill={top} opacity="0.92" />
          <path d="M59 104 Q80 98 100 108 Q120 116 141 104 L140 116 Q100 126 60 116 Z" fill={top} opacity="0.35" />
          {[
            [68, 76, -12, 0.75],
            [104, 82, 14, 0.6],
            [76, 116, 8, 0.45],
            [110, 132, -10, 0.35],
            [82, 156, 18, 0.25],
          ].map(([x, y, r, o]) => (
            <g key={`${x}-${y}`} transform={`rotate(${r} ${x + 12} ${y + 12})`} opacity={o}>
              <rect x={x} y={y} width="26" height="24" rx="5" fill="#fff" />
              <rect x={x + 4} y={y + 3} width="8" height="4" rx="2" fill="#fff" />
            </g>
          ))}
          <rect x="110" y="6" width="8" height="96" rx="4" fill="#2a2522" transform="rotate(13 114 54)" />
          <rect x="111.5" y="8" width="2" height="90" rx="1" fill="#fff" opacity="0.25" transform="rotate(13 114 54)" />
          <path d="M52 40 L148 40 L136 198 Q100 208 64 198 Z" fill={url('glass')} />
          <path d="M52 40 L148 40 L136 198 Q100 208 64 198 Z" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
          <ellipse cx="100" cy="40" rx="48" ry="7" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" />
          {[
            [64, 150],
            [70, 172],
            [132, 160],
            [128, 136],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#fff" opacity="0.6" />
          ))}
        </g>
      )}

      {kind === 'tea' && (
        <g>
          <path d="M150 112 C182 110 184 160 146 164" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="9" strokeLinecap="round" />
          <path d="M52 92 L148 92 L141 194 Q100 204 59 194 Z" fill={fill} />
          <path d="M52 92 L148 92 L141 194 Q100 204 59 194 Z" fill={url('depth')} />
          <g opacity="0.85">
            <circle cx="86" cy="142" r="18" fill="#f6b84a" />
            <circle cx="86" cy="142" r="14" fill="#ffd27a" />
            {[0, 60, 120].map((r) => (
              <path key={r} d="M72 142 L100 142" stroke="#f6b84a" strokeWidth="1.5" transform={`rotate(${r} 86 142)`} />
            ))}
          </g>
          <circle cx="120" cy="168" r="5" fill="#fff" opacity="0.3" />
          <circle cx="110" cy="120" r="3" fill="#fff" opacity="0.3" />
          <path d="M48 66 L152 66 L142 196 Q100 206 58 196 Z" fill={url('glass')} />
          <path d="M48 66 L152 66 L142 196 Q100 206 58 196 Z" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
          <ellipse cx="100" cy="66" rx="52" ry="7" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" />
          <path d="M82 52 C72 40 92 32 82 18 M106 50 C96 38 116 30 106 16" stroke="#fff" strokeWidth="4" fill="none" opacity="0.55" strokeLinecap="round" />
        </g>
      )}

      {kind === 'croissant' && (
        <g>
          {/* Overlapping laminated segments, tips first so the centre sits on top */}
          <ellipse cx="38" cy="160" rx="24" ry="15" fill={fill} transform="rotate(-38 38 160)" />
          <ellipse cx="162" cy="160" rx="24" ry="15" fill={fill} transform="rotate(38 162 160)" />
          <ellipse cx="58" cy="132" rx="30" ry="22" fill={fill} transform="rotate(-28 58 132)" />
          <ellipse cx="142" cy="132" rx="30" ry="22" fill={fill} transform="rotate(28 142 132)" />
          <ellipse cx="100" cy="118" rx="40" ry="34" fill={fill} />
          <g fill="none" stroke="#7a3f12" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round">
            <path d="M44 146 C50 136 58 132 64 132" />
            <path d="M136 132 C142 132 150 136 156 146" />
            <path d="M74 104 C82 96 92 94 100 94" />
            <path d="M68 128 C78 118 92 116 100 116" />
            <path d="M100 116 C108 116 122 118 132 128" />
          </g>
          <ellipse cx="100" cy="118" rx="40" ry="34" fill={url('bake')} />
          <ellipse cx="58" cy="132" rx="30" ry="22" fill={url('bake')} transform="rotate(-28 58 132)" />
          <ellipse cx="142" cy="132" rx="30" ry="22" fill={url('bake')} transform="rotate(28 142 132)" />
          {art.top && (
            <g fill={art.top}>
              {[
                [84, 98, -20],
                [104, 92, 10],
                [118, 104, 30],
                [72, 118, -10],
                [128, 122, 20],
                [96, 112, 0],
              ].map(([x, y, r]) => (
                <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="3.5" transform={`rotate(${r} ${x} ${y})`} />
              ))}
            </g>
          )}
        </g>
      )}

      {kind === 'sandwich' && (
        <g>
          <path d="M28 168 L100 70 L172 168 Z" fill="#f4dfb4" />
          <path d="M28 168 L100 70 L172 168" fill="none" stroke={fill} strokeWidth="9" strokeLinejoin="round" />
          <path d="M44 152 Q56 140 66 150 Q76 138 88 150 Q100 138 112 150 Q124 138 134 150 Q146 140 156 152 L160 160 L40 160 Z" fill="#8cbf5f" />
          <rect x="38" y="158" width="124" height="10" rx="4" fill={art.top} />
          <rect x="34" y="168" width="132" height="8" rx="3" fill="#f6d36b" />
          <path d="M30 176 L170 176 L166 190 Q100 196 34 190 Z" fill={fill} />
          <path d="M30 176 L170 176 L166 190 Q100 196 34 190 Z" fill={url('bake')} />
          <g fill="#fff" opacity="0.35">
            <circle cx="88" cy="110" r="2.5" />
            <circle cx="110" cy="126" r="2" />
            <circle cx="96" cy="136" r="1.8" />
          </g>
        </g>
      )}

      {kind === 'cake' && (
        <g>
          {/* Wedge: front face, side face, top */}
          <path d="M26 128 L150 104 L150 182 L26 196 Z" fill={fill} />
          <path d="M26 152 L150 136 L150 142 L26 158 Z" fill={art.top} opacity="0.8" />
          <path d="M26 182 L150 168 L150 182 L26 196 Z" fill="#b5773d" />
          <path d="M150 104 L176 112 L176 180 L150 182 Z" fill={fill} />
          <path d="M150 104 L176 112 L176 180 L150 182 Z" fill="#000" opacity="0.12" />
          <path d="M26 128 L150 104 L176 112 L54 138 Z" fill={art.top} />
          <path d="M26 128 L150 104 L176 112 L54 138 Z" fill="#fff" opacity="0.2" />
          <path d="M26 128 L150 104 L150 182 L26 196 Z" fill={url('bake')} opacity="0.6" />
          <circle cx="120" cy="108" r="9" fill="#c4324a" />
          <circle cx="117" cy="105" r="2.5" fill="#fff" opacity="0.5" />
          <path d="M122 99 q4 -8 10 -8" stroke="#5a8a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )}

      {kind === 'cookie' && (
        <g>
          <circle cx="100" cy="132" r="68" fill={fill} />
          <circle cx="100" cy="132" r="68" fill={url('bake')} />
          <path d="M64 102 l14 10 l-4 16 M126 150 l14 -8 l8 10 M96 168 l10 -12" stroke="#7a4a20" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[
            [70, 110, 10],
            [118, 98, -15],
            [92, 146, 25],
            [136, 140, 5],
            [62, 156, -20],
            [108, 124, 40],
            [80, 84, 12],
          ].map(([x, y, r]) => (
            <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
              <rect x={x - 7} y={y - 6} width="14" height="12" rx="3" fill={art.top} />
              <rect x={x - 5} y={y - 5} width="5" height="3" rx="1.5" fill="#fff" opacity="0.25" />
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

/** Small round "bowl" used for ingredient tiles. */
export function IngredientArt({ color, ...svgProps }: { color: string; ref?: Ref<SVGSVGElement> } & Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'color'>) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...svgProps}>
      <defs>
        <radialGradient id={`bowl-${uid}`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="#e9e4dc" />
      <circle cx="24" cy="24" r="23" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18" fill={color} />
      {[
        [17, 18, 2],
        [29, 16, 1.6],
        [30, 29, 2.2],
        [20, 31, 1.7],
        [25, 23, 1.4],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#000" opacity="0.1" />
      ))}
      <circle cx="24" cy="24" r="18" fill={`url(#bowl-${uid})`} />
    </svg>
  )
}
