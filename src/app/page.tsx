import Link from "next/link";
import "./landing.css";

export default function LandingPage() {
  return (
    <>
      <nav>
        <Link href='/' className='nav-logo'>
          <div className='nav-logo-icon'>R</div>
          <span className='nav-logo-text'>
            Rank<span>Up</span>
          </span>
        </Link>
        <div className='nav-actions'>
          <Link href='/login' className='btn-ghost'>
            Log In
          </Link>
          <Link href='/signup' className='btn-primary-nav'>
            Get Started Free
          </Link>
        </div>
      </nav>

      <section className='hero'>
        <div className='hero-content'>
          <div className='hero-left'>
            <div className='badge'>
              <div className='badge-dot'></div>2026 Massachusetts Fire
              Promotional Exam
            </div>
            <h1 className='hero-title'>
              <span>PREPARE.</span>
              <br />
              <span className='gold'>STUDY.</span>
              <br />
              <span className='red'>PROMOTE.</span>
            </h1>
            <p className='hero-subtitle'>
              The most comprehensive Massachusetts firefighter promotional exam
              prep platform for 2026. Study smarter with adaptive flashcards,
              practice exams, and detailed progress tracking built around the MA
              reading list.
            </p>
            <div className='hero-ctas'>
              <Link href='/signup' className='btn-hero-primary'>
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth='2.5'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                Start Studying Free
              </Link>
              <Link href='/login' className='btn-hero-secondary'>
                Log In to Your Account
              </Link>
            </div>
            <div className='hero-stats'>
              <div className='stat'>
                <div className='stat-num'>1,500+</div>
                <div className='stat-label'>Questions</div>
              </div>
              <div className='stat-divider'></div>
              <div className='stat'>
                <div className='stat-num'>5</div>
                <div className='stat-label'>Study Books</div>
              </div>
              <div className='stat-divider'></div>
              <div className='stat'>
                <div className='stat-num'>LT & CPT</div>
                <div className='stat-label'>Exam Tracks</div>
              </div>
            </div>
          </div>

          <div className='hero-right'>
            <div className='phone-mockup'>
              <div className='phone-notch'></div>
              <div className='phone-screen'>
                <div className='phone-header'>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>← Back</div>
                  <div className='phone-header-title'>RankUp</div>
                  <div style={{ fontSize: "18px" }}>🔔</div>
                </div>
                <div className='ring-container'>
                  <svg width='100' height='100' viewBox='0 0 100 100'>
                    <circle
                      cx='50'
                      cy='50'
                      r='40'
                      stroke='#e8ecf0'
                      strokeWidth='8'
                      fill='none'
                    />
                    <circle
                      cx='50'
                      cy='50'
                      r='40'
                      stroke='url(#grad)'
                      strokeWidth='8'
                      fill='none'
                      strokeDasharray='251'
                      strokeDashoffset='33'
                      strokeLinecap='round'
                    />
                    <defs>
                      <linearGradient
                        id='grad'
                        x1='0%'
                        y1='0%'
                        x2='100%'
                        y2='0%'
                      >
                        <stop offset='0%' stopColor='#22c55e' />
                        <stop offset='100%' stopColor='#C0392B' />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className='ring-text'>
                    <div className='ring-pct'>87%</div>
                    <div className='ring-sub'>Best Score</div>
                  </div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  {[
                    { l: "Building Const.", p: 92, c: "#22c55e" },
                    { l: "Co. Officers", p: 78, c: "#22c55e" },
                    { l: "Mass Gen. Laws", p: 61, c: "#f59e0b" },
                    { l: "ERG 2024", p: 55, c: "#ef4444" },
                  ].map(({ l, p, c }) => (
                    <div key={l} className='progress-row'>
                      <div className='progress-label'>{l}</div>
                      <div className='progress-bar-bg'>
                        <div
                          className='progress-bar-fill'
                          style={{ width: `${p}%`, background: c }}
                        ></div>
                      </div>
                      <div className='progress-pct' style={{ color: c }}>
                        {p}%
                      </div>
                    </div>
                  ))}
                </div>
                <button className='phone-btn phone-btn-red'>
                  Start Study Session
                </button>
                <button className='phone-btn phone-btn-navy'>
                  Take Practice Exam
                </button>
                <div className='phone-nav'>
                  {["Home", "Study", "Exam"].map((item, i) => (
                    <div
                      key={item}
                      className={`phone-nav-item${i === 0 ? " active" : ""}`}
                    >
                      <div className='phone-nav-dot'></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='flames'>
          {[
            {
              left: "5%",
              delay: "0s",
              dur: "1.8s",
              w: "40px",
              id: "f1",
              c1: "#F39C12",
              c2: "#E74C3C",
            },
            {
              left: "18%",
              delay: "0.4s",
              dur: "2.2s",
              w: "28px",
              id: "f2",
              c1: "#F5C842",
              c2: "#E74C3C",
            },
            {
              left: "35%",
              delay: "0.8s",
              dur: "1.6s",
              w: "50px",
              id: "f3",
              c1: "#F39C12",
              c2: "#C0392B",
            },
            {
              left: "55%",
              delay: "0.2s",
              dur: "2s",
              w: "32px",
              id: "f4",
              c1: "#F5C842",
              c2: "#E74C3C",
            },
            {
              left: "72%",
              delay: "0.6s",
              dur: "1.9s",
              w: "45px",
              id: "f5",
              c1: "#F39C12",
              c2: "#C0392B",
            },
            {
              left: "88%",
              delay: "1s",
              dur: "1.7s",
              w: "36px",
              id: "f6",
              c1: "#F5C842",
              c2: "#E74C3C",
            },
          ].map(({ left, delay, dur, w, id, c1, c2 }) => (
            <div
              key={id}
              className='flame'
              style={{
                left,
                animationDelay: delay,
                animationDuration: dur,
                width: w,
              }}
            >
              <svg viewBox='0 0 40 60' fill='none'>
                <path
                  d='M20 60 C8 50 2 35 10 20 C14 12 12 5 20 0 C18 10 24 14 22 22 C28 16 30 8 28 2 C38 14 38 30 32 42 C38 38 40 28 36 20 C44 36 36 52 20 60Z'
                  fill={`url(#${id})`}
                />
                <defs>
                  <linearGradient
                    id={id}
                    x1='20'
                    y1='0'
                    x2='20'
                    y2='60'
                    gradientUnits='userSpaceOnUse'
                  >
                    <stop stopColor={c1} />
                    <stop offset='0.6' stopColor={c2} />
                    <stop offset='1' stopColor='#96281B' stopOpacity='0.2' />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}
        </div>
      </section>

      <section className='features'>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className='section-label'>Why RankUp</div>
          <h2 className='section-title'>
            EVERYTHING YOU NEED
            <br />
            TO PASS YOUR EXAM
          </h2>
          <p className='section-sub'>
            Built specifically for firefighter promotional exams — not generic
            test prep.
          </p>
          <div className='features-grid'>
            {[
              {
                icon: "📚",
                cls: "fi-red",
                title: "Study Mode",
                desc: "Practice with instant feedback after every question. Filter by book, chapter, difficulty, or topic.",
              },
              {
                icon: "📝",
                cls: "fi-navy",
                title: "Exam Simulation",
                desc: "Timed, full-length practice exams that mirror the real promotional exam format.",
              },
              {
                icon: "🃏",
                cls: "fi-gold",
                title: "Smart Flashcards",
                desc: "Spaced repetition flashcards that adapt to your performance. Cards you miss come back sooner.",
              },
              {
                icon: "📊",
                cls: "fi-red",
                title: "Progress Tracking",
                desc: "See exactly where you stand. Identify your weakest chapters and get direct links to study them.",
              },
              {
                icon: "🎯",
                cls: "fi-navy",
                title: "1,500+ Questions",
                desc: "Covering Building Construction, Company Officers, Massachusetts General Laws, ERG 2024, and more.",
              },
              {
                icon: "📱",
                cls: "fi-gold",
                title: "Study Anywhere",
                desc: "Fully mobile-responsive. Study on your phone between calls or on your laptop at home.",
              },
            ].map(({ icon, cls, title, desc }) => (
              <div key={title} className='feature-card'>
                <div className={`feature-icon ${cls}`}>{icon}</div>
                <div className='feature-title'>{title}</div>
                <p className='feature-desc'>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='how'>
        <div className='how-inner'>
          <div className='section-label' style={{ color: "#ff8a75" }}>
            How It Works
          </div>
          <h2 className='section-title'>
            FROM SIGNUP TO
            <br />
            PROMOTION READY
          </h2>
          <p className='section-sub'>Get up and running in minutes.</p>
          <div className='steps'>
            {[
              {
                n: "1",
                title: "Create Your Free Account",
                desc: "Sign up in under 60 seconds. Choose your exam track — Lieutenant or Captain.",
              },
              {
                n: "2",
                title: "Pick Your Study Mode",
                desc: "Study Mode for instant feedback, Exam Mode for test simulation, or Flashcards for quick review.",
              },
              {
                n: "3",
                title: "Track Your Weak Areas",
                desc: "Your dashboard shows which chapters need work — with direct links to study them immediately.",
              },
              {
                n: "4",
                title: "Walk In Confident",
                desc: "Consistent practice builds the knowledge and confidence to outperform and earn your promotion.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className='step'>
                <div className='step-num'>{n}</div>
                <div>
                  <div className='step-title'>{title}</div>
                  <p className='step-desc'>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='proof'>
        <div className='section-label'>Real Results</div>
        <h2 className='section-title'>
          FIREFIGHTERS WHO
          <br />
          RANKED UP
        </h2>
        <p style={{ fontSize: "16px", color: "#5a6a7a", marginBottom: "48px" }}>
          Join firefighters across Massachusetts who used RankUp to prepare for
          their promotional exams.
        </p>
        <div className='testimonials'>
          {[
            {
              init: "MR",
              name: "M. Rivera",
              role: "Promoted to Lieutenant",
              text: "The chapter-by-chapter breakdown showed me exactly where I was weak. I went from failing practice exams to passing on my first attempt.",
            },
            {
              init: "JT",
              name: "J. Thompson",
              role: "Firefighter, preparing for Captain",
              text: "The flashcard spaced repetition is a game changer. I studied on my phone between shifts and the material actually stuck.",
            },
            {
              init: "DK",
              name: "D. Kowalski",
              role: "Promoted to Captain",
              text: "Best exam prep resource for MA firefighters. The Mass General Laws section alone is worth it.",
            },
          ].map(({ init, name, role, text }) => (
            <div key={name} className='testimonial'>
              <div className='stars'>★★★★★</div>
              <p className='testimonial-text'>{text}</p>
              <div className='testimonial-author'>
                <div className='author-avatar'>{init}</div>
                <div>
                  <div className='author-name'>{name}</div>
                  <div className='author-title'>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='cta-section'>
        <div className='cta-inner'>
          <h2 className='cta-title'>READY TO RANK UP?</h2>
          <p className='cta-sub'>
            Start your free account today and begin studying with 1,500+ exam
            questions.
          </p>
          <Link href='/signup' className='btn-cta-white'>
            <svg
              width='20'
              height='20'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth='2.5'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
            Get Started Free
          </Link>
          <p className='cta-note'>
            Built for the 2026 MA Fire Promotional Exam · Free to get started
          </p>
        </div>
      </section>

      <footer>
        <div className='footer-logo'>
          Rank<span>Up</span>
        </div>
        <div className='footer-copy'>
          © 2026 RankUp · rankupfire.com · Built for firefighters, by
          firefighters.
        </div>
        <div className='footer-links'>
          <Link href='/login'>Log In</Link>
          <Link href='/signup'>Sign Up</Link>
        </div>
      </footer>
    </>
  );
}
