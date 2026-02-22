import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { useLang } from '../state/LanguageContext.jsx'

const features = (t) => [
  { icon: '👥', title: t('landing.f1Title'), desc: t('landing.f1Desc') },
  { icon: '📅', title: t('landing.f2Title'), desc: t('landing.f2Desc') },
  { icon: '🧪', title: t('landing.f3Title'), desc: t('landing.f3Desc') },
  { icon: '🧾', title: t('landing.f4Title'), desc: t('landing.f4Desc') },
  { icon: '📦', title: t('landing.f5Title'), desc: t('landing.f5Desc') },
  { icon: '📊', title: t('landing.f6Title'), desc: t('landing.f6Desc') },
]

const team = [
  { initials: 'AK', name: 'Dr. Arben Krasniqi', role: 'Kardiologji', color: 'var(--color-primary, #2563eb)' },
  { initials: 'MG', name: 'Dr. Mimoza Gashi',   role: 'Pediatri',    color: 'var(--color-teal, #0d9488)' },
  { initials: 'LB', name: 'Dr. Liridon Berisha', role: 'Neurologji',  color: '#7c3aed' },
  { initials: 'ER', name: 'Dr. Enis Rama',       role: 'Kirurgji',    color: 'var(--color-danger, #dc2626)' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const { t, lang, switchLang } = useLang()
  const featureList = features(t)

  return (
    <>
      <style>{`
        .lp-root { font-family: 'Inter', -apple-system, sans-serif; color: #0f172a; background: #fff; min-height: 100vh; }

        /* Navbar */
        .lp-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,0.97); backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 60px; gap: 1rem;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; color: #0f172a;
          font-weight: 700; font-size: 1.05rem;
          flex-shrink: 0;
        }
        .lp-logo:hover { opacity: 0.85; }
        .lp-logo img { width: 36px; height: 36px; border-radius: 8px; }
        .lp-nav-actions { display: flex; align-items: center; gap: 8px; }
        .lp-lang-btn {
          background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px;
          padding: 4px 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
          color: #475569; transition: background 0.15s;
        }
        .lp-lang-btn:hover { background: #e2e8f0; }
        .lp-btn-ghost { color: #475569; padding: 6px 14px; border-radius: 7px; font-weight: 500; text-decoration: none; font-size: 0.9rem; transition: background 0.15s; }
        .lp-btn-ghost:hover { background: #f1f5f9; }
        .lp-btn-primary { background: #2563eb; color: #fff; padding: 6px 16px; border-radius: 7px; font-weight: 600; text-decoration: none; font-size: 0.9rem; transition: background 0.15s; }
        .lp-btn-primary:hover { background: #1d4ed8; }

        /* Hero */
        .lp-hero {
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdfa 60%, #f8fafc 100%);
          padding: 5rem 2rem 4rem; text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .lp-hero-inner { max-width: 720px; margin: 0 auto; }
        .lp-hero-logo {
          width: 88px; height: 88px; border-radius: 22px;
          margin: 0 auto 1.25rem;
          display: block;
          box-shadow: 0 8px 32px rgba(37,99,235,0.18), 0 2px 8px rgba(0,0,0,0.08);
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #dbeafe; color: #1d4ed8; border-radius: 999px;
          padding: 4px 14px; font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.04em; margin-bottom: 1.5rem;
          border: 1px solid #bfdbfe;
        }
        .lp-hero h1 { font-size: clamp(1.9rem, 4.5vw, 2.8rem); font-weight: 800; line-height: 1.18; margin-bottom: 1.25rem; color: #0f172a; }
        .lp-hero h1 span { background: linear-gradient(90deg, #2563eb 0%, #0d9488 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .lp-hero p { font-size: 1.05rem; color: #475569; line-height: 1.75; max-width: 560px; margin: 0 auto 2.25rem; }
        .lp-hero-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .lp-btn-hero-primary { background: #2563eb; color: #fff; padding: 0.7rem 1.75rem; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.95rem; transition: background 0.15s; }
        .lp-btn-hero-primary:hover { background: #1d4ed8; }
        .lp-btn-hero-outline { background: #fff; color: #2563eb; border: 1.5px solid #93c5fd; padding: 0.7rem 1.75rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.95rem; transition: border-color 0.15s; }
        .lp-btn-hero-outline:hover { border-color: #2563eb; }

        /* Mockup */
        .lp-mockup {
          max-width: 820px; margin: 3.5rem auto 0;
          background: #fff; border-radius: 14px;
          box-shadow: 0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
          border: 1px solid #e2e8f0; overflow: hidden;
          text-align: left;
        }
        .lp-mockup-bar {
          background: #f8fafc; padding: 9px 14px;
          display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        .lp-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .lp-mockup-url { margin-left: 8px; color: #94a3b8; font-size: 0.72rem; }
        .lp-mockup-body { display: grid; grid-template-columns: 190px 1fr; }
        .lp-mockup-sidebar { background: #0f172a; padding: 12px 8px; display: flex; flex-direction: column; gap: 3px; }
        .lp-sidebar-item { color: #94a3b8; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 500; }
        .lp-sidebar-item.active { color: #fff; background: #2563eb; }
        .lp-mockup-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .lp-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .lp-stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; border-left-width: 3px; border-left-style: solid; }
        .lp-stat-val { font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .lp-stat-lbl { font-size: 0.68rem; color: #64748b; margin-top: 3px; }
        .lp-progress-row { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
        .lp-progress-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .lp-progress-fill { width: 67%; height: 100%; background: linear-gradient(90deg, #2563eb, #0d9488); border-radius: 999px; }
        .lp-progress-label { font-size: 0.68rem; color: #64748b; white-space: nowrap; }

        /* Stats strip */
        .lp-stats { background: #2563eb; padding: 3rem 2rem; }
        .lp-stats-grid { max-width: 880px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 2rem; text-align: center; }
        .lp-stat-big-val { font-size: 2.25rem; font-weight: 800; color: #fff; line-height: 1; }
        .lp-stat-big-lbl { font-size: 0.82rem; color: #bfdbfe; margin-top: 6px; }

        /* Features */
        .lp-features { padding: 5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .lp-section-header { text-align: center; margin-bottom: 2.75rem; }
        .lp-section-header h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800; margin-bottom: 0.6rem; color: #0f172a; }
        .lp-section-header p { color: #64748b; font-size: 0.95rem; max-width: 500px; margin: 0 auto; }
        .lp-features-grid { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(272px, 1fr)); gap: 1.25rem; }
        .lp-feature-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .lp-feature-card:hover { box-shadow: 0 8px 28px rgba(37,99,235,0.1); border-color: #93c5fd; }
        .lp-feature-icon { font-size: 1.75rem; margin-bottom: 0.75rem; }
        .lp-feature-card h3 { font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 0.4rem; }
        .lp-feature-card p { color: #64748b; font-size: 0.84rem; line-height: 1.65; margin: 0; }

        /* About */
        .lp-about { padding: 5rem 2rem; background: #fff; border-top: 1px solid #e2e8f0; }
        .lp-about-inner { max-width: 960px; margin: 0 auto; }
        .lp-about-body { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; margin-bottom: 3rem; }
        .lp-about-text h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800; color: #0f172a; margin-bottom: 0.6rem; }
        .lp-about-text .lp-about-sub { color: #64748b; font-size: 0.95rem; margin-bottom: 1.25rem; }
        .lp-about-text p { color: #475569; font-size: 0.88rem; line-height: 1.75; margin-bottom: 0.85rem; }
        .lp-about-image { background: linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%); border-radius: 14px; border: 1px solid #e2e8f0; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .lp-about-stat { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
        .lp-about-stat-icon { font-size: 1.5rem; flex-shrink: 0; }
        .lp-about-stat-val { font-size: 1.2rem; font-weight: 800; color: #0f172a; line-height: 1; }
        .lp-about-stat-lbl { font-size: 0.72rem; color: #64748b; }
        .lp-about-values { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .lp-about-val-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; border-top: 3px solid; }
        .lp-about-val-card:nth-child(1) { border-top-color: #2563eb; }
        .lp-about-val-card:nth-child(2) { border-top-color: #0d9488; }
        .lp-about-val-card:nth-child(3) { border-top-color: #7c3aed; }
        .lp-about-val-card h4 { font-weight: 700; font-size: 0.92rem; color: #0f172a; margin-bottom: 0.4rem; }
        .lp-about-val-card p { font-size: 0.82rem; color: #64748b; line-height: 1.65; margin: 0; }
        @media (max-width: 768px) {
          .lp-about-body { grid-template-columns: 1fr; gap: 1.5rem; }
          .lp-about-values { grid-template-columns: 1fr; }
        }

        /* Team */
        .lp-team { padding: 5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .lp-team-grid { max-width: 880px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem; }
        .lp-team-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.75rem 1rem; text-align: center; }
        .lp-team-avatar { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.15rem; margin: 0 auto 1rem; }
        .lp-team-name { font-weight: 700; font-size: 0.88rem; color: #0f172a; }
        .lp-team-role { font-size: 0.76rem; color: #64748b; margin-top: 3px; }

        /* CTA */
        .lp-cta { background: linear-gradient(135deg, #1e40af 0%, #0d9488 100%); padding: 4.5rem 2rem; text-align: center; }
        .lp-cta h2 { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; color: #fff; margin-bottom: 0.85rem; }
        .lp-cta p { color: #bfdbfe; font-size: 0.95rem; max-width: 460px; margin: 0 auto 2.25rem; }
        .lp-cta-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .lp-btn-cta-white { background: #fff; color: #1d4ed8; padding: 0.7rem 1.75rem; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.95rem; }
        .lp-btn-cta-white:hover { background: #f0f9ff; }
        .lp-btn-cta-outline { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 0.7rem 1.75rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.95rem; }
        .lp-btn-cta-outline:hover { background: rgba(255,255,255,0.2); }

        /* Footer */
        .lp-footer { background: #0f172a; color: #94a3b8; padding: 2.5rem 2rem; text-align: center; }
        .lp-footer-logo { display: flex; align-items: center; justify-content: center; gap: 9px; margin-bottom: 1.25rem; }
        .lp-footer-logo img { width: 30px; height: 30px; border-radius: 6px; }
        .lp-footer-logo span { color: #fff; font-weight: 700; font-size: 0.95rem; }
        .lp-footer-links { display: flex; gap: 1.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.25rem; font-size: 0.84rem; }
        .lp-footer-links a { color: #94a3b8; text-decoration: none; }
        .lp-footer-links a:hover { color: #e2e8f0; }
        .lp-footer-copy { font-size: 0.77rem; }

        @media (max-width: 640px) {
          .lp-mockup-body { grid-template-columns: 1fr; }
          .lp-mockup-sidebar { display: none; }
          .lp-stat-row { grid-template-columns: repeat(2, 1fr); }
          .lp-nav { padding: 0 1rem; }
          .lp-hero { padding: 3.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Navbar ─────────────────────────────────────────── */}
        <nav className="lp-nav">
          <Link to={user ? '/dashboard' : '/'} className="lp-logo">
            <img src="/logo.png" alt="EHealthClinic" />
            <span>EHealth Clinic</span>
          </Link>

          <div className="lp-nav-actions">
            <button
              className="lp-lang-btn"
              onClick={() => switchLang(lang === 'sq' ? 'en' : 'sq')}
            >
              {lang === 'sq' ? '🇬🇧 EN' : '🇦🇱 SQ'}
            </button>
            {user ? (
              <Link to="/dashboard" className="lp-btn-primary">{t('landing.goToDashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="lp-btn-ghost">{t('landing.login')}</Link>
                <Link to="/register" className="lp-btn-primary">{t('landing.register')}</Link>
              </>
            )}
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <img src="/logo.png" alt="EHealthClinic" className="lp-hero-logo" />
            <div className="lp-badge">{t('landing.badge')}</div>
            <h1>
              {t('landing.heroTitle1')}{' '}
              <span>{t('landing.heroTitle2')}</span>
            </h1>
            <p>{t('landing.heroSubtitle')}</p>
            <div className="lp-hero-btns">
              <Link to="/register" className="lp-btn-hero-primary">{t('landing.startFree')}</Link>
              <Link to="/login" className="lp-btn-hero-outline">{t('landing.login')}</Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <span className="lp-dot" style={{ background: '#fca5a5' }} />
              <span className="lp-dot" style={{ background: '#fde68a' }} />
              <span className="lp-dot" style={{ background: '#86efac' }} />
              <span className="lp-mockup-url">ehealthclinic.al/dashboard</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                {[
                  { icon: '🏠', label: t('nav.dashboard'), active: true },
                  { icon: '👥', label: t('nav.patients') },
                  { icon: '📅', label: t('nav.appointments') },
                  { icon: '🔢', label: t('nav.queue') },
                  { icon: '🧾', label: t('nav.invoices') },
                  { icon: '📊', label: t('nav.reports') },
                ].map(item => (
                  <div key={item.label} className={`lp-sidebar-item${item.active ? ' active' : ''}`}>
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
              <div className="lp-mockup-content">
                <div className="lp-stat-row">
                  <div className="lp-stat-card" style={{ borderLeftColor: '#2563eb' }}>
                    <div className="lp-stat-val" style={{ color: '#2563eb' }}>24</div>
                    <div className="lp-stat-lbl">{t('landing.mockupToday')}</div>
                  </div>
                  <div className="lp-stat-card" style={{ borderLeftColor: '#d97706' }}>
                    <div className="lp-stat-val" style={{ color: '#d97706' }}>8</div>
                    <div className="lp-stat-lbl">{t('landing.mockupWaiting')}</div>
                  </div>
                  <div className="lp-stat-card" style={{ borderLeftColor: '#16a34a' }}>
                    <div className="lp-stat-val" style={{ color: '#16a34a' }}>16</div>
                    <div className="lp-stat-lbl">{t('landing.mockupDone')}</div>
                  </div>
                </div>
                <div className="lp-progress-row">
                  <div className="lp-progress-bar">
                    <div className="lp-progress-fill" />
                  </div>
                  <span className="lp-progress-label">67% {t('landing.mockupCapacity')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ─────────────────────────────────────── */}
        <section className="lp-stats">
          <div className="lp-stats-grid">
            {[
              { value: '500+', label: t('landing.statsPatients') },
              { value: '50+',  label: t('landing.statsDoctors') },
              { value: '98%',  label: t('landing.statsSatisfaction') },
              { value: '24/7', label: t('landing.statsSupport') },
            ].map(s => (
              <div key={s.label}>
                <div className="lp-stat-big-val">{s.value}</div>
                <div className="lp-stat-big-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section className="lp-features">
          <div className="lp-section-header">
            <h2>{t('landing.featuresTitle')}</h2>
            <p>{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="lp-features-grid">
            {featureList.map(f => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── About Us ────────────────────────────────────────── */}
        <section className="lp-about">
          <div className="lp-about-inner">
            <div className="lp-about-body">
              <div className="lp-about-text">
                <h2>{t('landing.aboutTitle')}</h2>
                <p className="lp-about-sub">{t('landing.aboutSubtitle')}</p>
                <p>{t('landing.aboutMission')}</p>
                <p>{t('landing.aboutVision')}</p>
              </div>
              <div className="lp-about-image">
                {[
                  { icon: '🏥', val: '10+', lbl: lang === 'sq' ? 'Vjet eksperiencë' : 'Years of experience' },
                  { icon: '👥', val: '500+', lbl: t('landing.statsPatients') },
                  { icon: '⭐', val: '98%',  lbl: t('landing.statsSatisfaction') },
                  { icon: '🏢', val: '5',    lbl: lang === 'sq' ? 'Degë klinikash' : 'Clinic branches' },
                ].map(s => (
                  <div key={s.lbl} className="lp-about-stat">
                    <span className="lp-about-stat-icon">{s.icon}</span>
                    <div>
                      <div className="lp-about-stat-val">{s.val}</div>
                      <div className="lp-about-stat-lbl">{s.lbl}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-about-values">
              <div className="lp-about-val-card">
                <h4>{t('landing.aboutVal1Title')}</h4>
                <p>{t('landing.aboutVal1Desc')}</p>
              </div>
              <div className="lp-about-val-card">
                <h4>{t('landing.aboutVal2Title')}</h4>
                <p>{t('landing.aboutVal2Desc')}</p>
              </div>
              <div className="lp-about-val-card">
                <h4>{t('landing.aboutVal3Title')}</h4>
                <p>{t('landing.aboutVal3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Team ────────────────────────────────────────────── */}
        <section className="lp-team">
          <div className="lp-section-header">
            <h2>{t('landing.teamTitle')}</h2>
            <p>{t('landing.teamSubtitle')}</p>
          </div>
          <div className="lp-team-grid">
            {team.map(m => (
              <div key={m.name} className="lp-team-card">
                <div className="lp-team-avatar" style={{ background: m.color }}>{m.initials}</div>
                <div className="lp-team-name">{m.name}</div>
                <div className="lp-team-role">{m.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="lp-cta">
          <h2>{t('landing.ctaTitle')}</h2>
          <p>{t('landing.ctaSubtitle')}</p>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-btn-cta-white">{t('landing.startFree')}</Link>
            <Link to="/login" className="lp-btn-cta-outline">{t('landing.login')}</Link>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-footer-logo">
            <img src="/logo.png" alt="EHealthClinic" />
            <span>EHealth Clinic</span>
          </div>
          <div className="lp-footer-links">
            <Link to="/login">{t('landing.login')}</Link>
            <Link to="/register">{t('landing.register')}</Link>
            <Link to="/dashboard">{t('landing.goToDashboard')}</Link>
          </div>
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} EHealth Clinic. {t('landing.copyright')}
          </p>
        </footer>

      </div>
    </>
  )
}
