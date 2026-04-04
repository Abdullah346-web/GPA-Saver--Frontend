import { useEffect, useMemo, useState } from 'react'
import logoImage from '../assets/ChatGPT Image Apr 4, 2026, 05_10_15 AM.png'

const LOADER_DURATION_MS = 4000
const FADE_OUT_DURATION_MS = 650

function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState('entering')

  const particles = useMemo(
    () =>
      [
        { left: '12%', top: '16%', delay: '0s', size: '7px' },
        { left: '20%', top: '68%', delay: '0.8s', size: '10px' },
        { left: '34%', top: '28%', delay: '1.4s', size: '6px' },
        { left: '58%', top: '18%', delay: '0.5s', size: '8px' },
        { left: '72%', top: '70%', delay: '1.2s', size: '11px' },
        { left: '86%', top: '34%', delay: '0.2s', size: '6px' },
      ],
    [],
  )

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setPhase('exiting')
    }, LOADER_DURATION_MS)

    const doneTimer = window.setTimeout(() => {
      onDone()
    }, LOADER_DURATION_MS + FADE_OUT_DURATION_MS)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <main className={`loading-screen ${phase}`} aria-label="GPA Saver loading screen">
      <div className="loading-backdrop" aria-hidden="true">
        <span className="glow glow-a" />
        <span className="glow glow-b" />
        <span className="glow glow-c" />
        {particles.map((particle, index) => (
          <span
            key={`${particle.left}-${index}`}
            className="particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>

      <section className="loader-panel" style={{ position: 'relative', zIndex: 5 }}>
        <img 
          src={logoImage} 
          alt="GPA Saver Logo" 
          style={{
            width: '150px',
            height: '150px',
            marginBottom: '24px',
          }}
        />

        <div className="brand-copy">
          <p className="brand-kicker">Academic progress tracker</p>
          <h1>GPA Saver</h1>
          <p className="tagline">Save Your Grades, Secure Your Future</p>
        </div>

        <div className="loader-shell" aria-hidden="true">
          <div className="loader-wave">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="loader-copy">
          <span>Preparing your dashboard</span>
          <span>Loading secure grade insights</span>
        </div>

        <p
          style={{
            margin: '6px 0 0',
            color: '#e2e8f0',
            fontSize: '0.9rem',
            letterSpacing: '0.04em',
          }}
        >
          Please wait...
        </p>
      </section>
    </main>
  )
}

export default LoadingScreen