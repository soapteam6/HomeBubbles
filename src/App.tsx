import { useEffect, useMemo, useState } from 'react'
import { PH_UsersService } from './generated/services/PH_UsersService'
import type { PH_UsersRead } from './generated/models/PH_UsersModel'

/* ===================== CONFIG ===================== */
const CONFIG = {
  maxUsers: 70, // how many bubbles to show
  minSize: 64, // smallest diameter (px)
  maxSize: 124, // largest diameter (px)
  minRiseSecs: 16,
  maxRiseSecs: 34,
  activeOnly: false, // when true, only render users with AccountEnabled !== false
  pageSize: 500, // rows per SharePoint page request
  maxPages: 8, // safety cap on paging
}

const PALETTE = ['#3b6df0', '#18b6c9', '#7b5ce0', '#e0588a', '#e09a3b', '#3bbf6f', '#d65b5b', '#5b8fd6']

/* ---------- helpers (ported from ais_homebubbles.html) ---------- */
const rand = (min: number, max: number) => min + Math.random() * (max - min)

function displayName(u: PH_UsersRead): string {
  if (u.DisplayName) return u.DisplayName
  if (u.Title) return u.Title
  if (u.Email) return u.Email.split('@')[0].replace(/[._]+/g, ' ')
  return '?'
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0].charAt(0) : p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase()
}
function colorFor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
/** SharePoint stores the photo as Base64 (with or without a data: prefix). */
function photoSrc(photo?: string): string | null {
  if (!photo) return null
  const v = photo.trim()
  if (!v) return null
  if (v.startsWith('data:')) return v
  if (v.startsWith('http')) return v
  return `data:image/jpeg;base64,${v}`
}

/* ---------- bubble descriptor (positions computed once per load) ---------- */
interface BubbleSpec {
  key: string
  name: string
  photo: string | null
  size: number
  left: number
  riseDur: number
  riseDelay: number
  swayDur: number
  swayDelay: number
}

function buildSpecs(users: PH_UsersRead[]): BubbleSpec[] {
  const total = users.length || 1
  return users.map((u, index) => {
    const size = rand(CONFIG.minSize, CONFIG.maxSize)
    const left = Math.max(0, Math.min(96, (index / total) * 100 + rand(-7, 7)))
    const riseDur = rand(CONFIG.minRiseSecs, CONFIG.maxRiseSecs)
    const swayDur = rand(3.5, 6.5)
    return {
      key: `${u.ID ?? 'x'}-${index}`,
      name: displayName(u),
      photo: photoSrc(u.Photo),
      size,
      left,
      riseDur,
      riseDelay: -rand(0, riseDur),
      swayDur,
      swayDelay: -rand(0, swayDur),
    }
  })
}

function Bubble({ spec }: { spec: BubbleSpec }) {
  const [imgOk, setImgOk] = useState(true)
  const showPhoto = spec.photo && imgOk
  return (
    <div
      className="bubble"
      style={{
        left: `${spec.left}%`,
        width: `${spec.size}px`,
        height: `${spec.size}px`,
        animationDuration: `${spec.riseDur}s`,
        animationDelay: `${spec.riseDelay}s`,
      }}
    >
      <div
        className="bubble-sway"
        style={{ animationDuration: `${spec.swayDur}s`, animationDelay: `${spec.swayDelay}s` }}
      >
        <div className="bubble-inner">
          {showPhoto ? (
            <img
              className="bubble-photo"
              src={spec.photo as string}
              alt={spec.name}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div
              className="bubble-initials"
              style={{ fontSize: `${Math.round(spec.size * 0.32)}px`, background: colorFor(spec.name) }}
            >
              {initials(spec.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [users, setUsers] = useState<PH_UsersRead[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const all: PH_UsersRead[] = []
        let skipToken: string | undefined
        for (let page = 0; page < CONFIG.maxPages; page++) {
          const result = await PH_UsersService.getAll({
            select: ['ID', 'DisplayName', 'Title', 'Email', 'Photo', 'AccountEnabled'],
            top: CONFIG.pageSize,
            maxPageSize: CONFIG.pageSize,
            skipToken,
          })
          if (!result.success) {
            console.error('[Home] PH_Users load failed:', result.error)
            break
          }
          all.push(...(result.data ?? []))
          skipToken = result.skipToken
          if (!skipToken || all.length >= CONFIG.maxUsers * 3) break
        }

        const filtered = all
          .filter((u) => !CONFIG.activeOnly || u.AccountEnabled !== false)
          // prefer people who actually have a photo, then fill remaining slots
          .sort((a, b) => (photoSrc(b.Photo) ? 1 : 0) - (photoSrc(a.Photo) ? 1 : 0))
          .slice(0, CONFIG.maxUsers)

        if (!cancelled) setUsers(filtered)
      } catch (err) {
        console.error('[Home] ' + err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const specs = useMemo(() => buildSpecs(users), [users])

  return (
    <>
      <div id="brandbar" />

      {/* background animated bubble field */}
      <div id="stage" aria-hidden="true">
        {specs.map((s) => (
          <Bubble key={s.key} spec={s} />
        ))}
      </div>

      {/* foreground page content */}
      <main id="content">
        <section className="hero">
          <span className="pill">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2l1.8 4.6L18 8l-4.2 1.4L12 14l-1.8-4.6L6 8l4.2-1.4L12 2z" fill="#C8102E" />
            </svg>
            Fresh new look
          </span>
          <h1>
            Your new CRM <span className="soap">SOAP</span>
          </h1>
        </section>

        <aside className="right">
          <div className="brand">
            <div className="ais">AIS</div>
            <div className="tag">ONE COMPANY, MANY SOLUTIONS</div>
          </div>
        </aside>
      </main>

      <div className="float-icon" title="SOAP">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="7" rx="8" ry="3.5" stroke="#fff" strokeWidth="1.6" />
          <path d="M4 7v10c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V7" stroke="#fff" strokeWidth="1.6" />
        </svg>
      </div>
    </>
  )
}
