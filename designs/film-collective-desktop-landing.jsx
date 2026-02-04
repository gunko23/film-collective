import React, { useState, useEffect } from 'react';

// Film Collective - Desktop Landing Page
// Community-focused, cinematic, immersive design

export default function FilmCollectiveDesktopLanding() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [activeFilm, setActiveFilm] = useState(0);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  const messages = [
    { user: 'Sarah', avatar: colors.cool, message: "Just finished Past Lives... I'm not okay 😭" },
    { user: 'Mike', avatar: colors.accent, message: "RIGHT?? That ending scene..." },
    { user: 'Dan', avatar: colors.accentSoft, message: "Adding it to my list now 👀" },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.cream,
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Cinematic light effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 50% at ${25 + mousePos.x * 15}% ${20 + mousePos.y * 15}%, ${colors.accent}12 0%, transparent 50%),
          radial-gradient(ellipse 60% 60% at ${75 - mousePos.x * 10}% ${70 + mousePos.y * 10}%, ${colors.cool}08 0%, transparent 45%)
        `,
        pointerEvents: 'none',
        transition: 'background 0.5s ease'
      }} />

      {/* Film grain */}
      <div style={{
        position: 'fixed',
        inset: 0,
        opacity: 0.02,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '28px 56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo */}
          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '24px',
              height: '24px',
              border: `2px solid ${colors.accent}`,
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              backgroundColor: colors.cool,
              borderRadius: '4px',
              opacity: 0.8
            }} />
          </div>
          <span style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Film Collective
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {['Features', 'About', 'Sign in'].map((item, i) => (
            <a
              key={item}
              href="#"
              style={{
                fontSize: '14px',
                color: i === 2 ? colors.cream : `${colors.cream}60`,
                textDecoration: 'none',
                fontWeight: i === 2 ? 500 : 400
              }}
            >
              {item}
            </a>
          ))}
          <button style={{
            padding: '14px 32px',
            backgroundColor: colors.cream,
            color: colors.bg,
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Create your collective
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '0 56px',
        position: 'relative'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '500px',
          height: '500px',
          border: `1px solid ${colors.cream}05`,
          borderRadius: '50%',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease 0.5s'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            border: `1px solid ${colors.cream}03`,
            borderRadius: '50%'
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '100px',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          alignItems: 'center'
        }}>
          {/* Left - Copy */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Eyebrow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
            }}>
              <div style={{ width: '48px', height: '2px', backgroundColor: colors.accent }} />
              <span style={{
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: colors.accent,
                fontWeight: 500
              }}>Private film clubs</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(52px, 6vw, 80px)',
              fontWeight: 300,
              lineHeight: 0.98,
              letterSpacing: '-0.03em',
              marginBottom: '32px'
            }}>
              <span style={{
                display: 'block',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
              }}>
                Your space to
              </span>
              <span style={{
                display: 'block',
                fontStyle: 'italic',
                fontWeight: 400,
                color: colors.accent,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
              }}>
                talk film
              </span>
              <span style={{
                display: 'block',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
              }}>
                together<span style={{ color: colors.cool }}>.</span>
              </span>
            </h1>

            {/* Subhead */}
            <p style={{
              fontSize: '19px',
              lineHeight: 1.6,
              color: `${colors.cream}70`,
              maxWidth: '460px',
              marginBottom: '40px',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s'
            }}>
              Create private collectives for your partner, friends, or family. 
              Share what you're watching, discuss your favorites, and discover 
              films you'll all love.
            </p>

            {/* CTAs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '56px',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s'
            }}>
              <button style={{
                padding: '20px 40px',
                backgroundColor: colors.cream,
                color: colors.bg,
                border: 'none',
                borderRadius: '100px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                Create your collective
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button style={{
                padding: '20px 40px',
                backgroundColor: 'transparent',
                color: colors.cream,
                border: `1px solid ${colors.cream}20`,
                borderRadius: '100px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                Learn more
              </button>
            </div>

            {/* Social proof */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s'
            }}>
              <div style={{ display: 'flex' }}>
                {[colors.accent, colors.cool, colors.accentSoft, `${colors.cream}30`].map((color, i) => (
                  <div key={i} style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    marginLeft: i > 0 ? '-10px' : 0,
                    border: `2px solid ${colors.bg}`
                  }} />
                ))}
              </div>
              <p style={{ fontSize: '14px', color: `${colors.cream}50` }}>
                2,400+ collectives talking film
              </p>
            </div>
          </div>

          {/* Right - Discussion Preview */}
          <div style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0) rotate(0deg)' : 'translateY(40px) rotate(2deg)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
          }}>
            <div style={{
              backgroundColor: colors.surface,
              borderRadius: '24px',
              border: `1px solid ${colors.cream}06`,
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.4)'
            }}>
              {/* Card header */}
              <div style={{
                padding: '24px 28px',
                borderBottom: `1px solid ${colors.cream}06`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${colors.accent}40, ${colors.cool}30)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>🎬</div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600 }}>Friday Night Films</p>
                    <p style={{ fontSize: '12px', color: `${colors.cream}40` }}>4 members · Active now</p>
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: `${colors.cool}15`,
                  borderRadius: '100px',
                  fontSize: '11px',
                  color: colors.cool,
                  fontWeight: 500
                }}>Private</div>
              </div>

              {/* Film being discussed */}
              <div style={{
                padding: '20px 28px',
                backgroundColor: colors.surfaceLight,
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '75px',
                  borderRadius: '6px',
                  background: `linear-gradient(135deg, ${colors.accent}50, ${colors.cool}30)`,
                  flexShrink: 0
                }} />
                <div>
                  <p style={{ fontSize: '10px', color: `${colors.cream}35`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Currently discussing
                  </p>
                  <p style={{ fontSize: '17px', fontWeight: 600, marginBottom: '2px' }}>Past Lives</p>
                  <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>2023 · Drama, Romance</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '24px 28px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: i < messages.length - 1 ? '16px' : 0,
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: msg.avatar,
                      flexShrink: 0
                    }} />
                    <div style={{
                      backgroundColor: colors.surfaceLight,
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderTopLeftRadius: '4px'
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: `${colors.cream}80` }}>
                        {msg.user}
                      </p>
                      <p style={{ fontSize: '14px', lineHeight: 1.4 }}>{msg.message}</p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  paddingLeft: '44px'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: `${colors.cream}30`,
                        animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: `${colors.cream}35` }}>Emma is typing...</span>
                </div>
              </div>

              {/* Input hint */}
              <div style={{
                padding: '16px 28px',
                borderTop: `1px solid ${colors.cream}06`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  backgroundColor: colors.surfaceLight,
                  borderRadius: '100px'
                }}>
                  <span style={{ fontSize: '14px', color: `${colors.cream}35` }}>
                    Share your thoughts...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '160px 56px',
        position: 'relative'
      }}>
        {/* Section number */}
        <div style={{
          position: 'absolute',
          top: '160px',
          right: '56px',
          fontSize: '180px',
          fontWeight: 200,
          color: `${colors.cream}03`,
          lineHeight: 1
        }}>01</div>

        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '100px',
            alignItems: 'start'
          }}>
            {/* Left - Intro */}
            <div style={{ position: 'sticky', top: '160px' }}>
              <p style={{
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: colors.cool,
                marginBottom: '24px',
                fontWeight: 500
              }}>Your collective, your space</p>
              <h2 style={{
                fontSize: '42px',
                fontWeight: 300,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '24px'
              }}>
                More than just
                <span style={{ fontStyle: 'italic', color: colors.accent }}> recommendations</span>
              </h2>
              <p style={{
                fontSize: '17px',
                lineHeight: 1.65,
                color: `${colors.cream}60`
              }}>
                Film Collective is a private space for you and your people to share, 
                discuss, and discover films together. It's your movie club, digitized.
              </p>
            </div>

            {/* Right - Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                {
                  icon: '💬',
                  title: 'Discuss everything',
                  desc: 'React to scenes, debate endings, share hot takes. Your conversations live alongside the films you love.',
                  color: colors.cool
                },
                {
                  icon: '📋',
                  title: 'Share watchlists',
                  desc: 'Create lists together, track what everyone\'s seen, build a shared film history over time.',
                  color: colors.accent
                },
                {
                  icon: '✨',
                  title: 'Find your next watch',
                  desc: 'When you can\'t decide, we\'ll find something that matches everyone\'s taste. No more 30-minute scrolls.',
                  color: colors.accentSoft
                },
                {
                  icon: '🔒',
                  title: 'Private by default',
                  desc: 'Your collective is yours. Invite-only, no public profiles, no algorithms deciding what you see.',
                  color: colors.cool
                },
              ].map((feature, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '24px',
                  padding: '36px',
                  backgroundColor: colors.surface,
                  borderRadius: '20px',
                  border: `1px solid ${colors.cream}06`,
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: `${feature.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>{feature.icon}</div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 500,
                      marginBottom: '10px',
                      letterSpacing: '-0.01em'
                    }}>{feature.title}</h3>
                    <p style={{
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: `${colors.cream}55`
                    }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tonight's Pick Section */}
      <section style={{
        padding: '160px 56px',
        position: 'relative',
        backgroundColor: colors.surface
      }}>
        <div style={{
          position: 'absolute',
          top: '160px',
          left: '56px',
          fontSize: '180px',
          fontWeight: 200,
          color: `${colors.cream}03`,
          lineHeight: 1
        }}>02</div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center'
          }}>
            {/* Left - Demo */}
            <div style={{
              backgroundColor: colors.bg,
              borderRadius: '24px',
              padding: '32px',
              border: `1px solid ${colors.cream}06`
            }}>
              <div style={{ marginBottom: '28px' }}>
                <p style={{
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: colors.accent,
                  marginBottom: '8px',
                  fontWeight: 500
                }}>Tonight's Pick</p>
                <p style={{ fontSize: '20px', fontWeight: 500 }}>Friday with Sarah & Dan</p>
              </div>

              {/* Mood selector */}
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '12px', color: `${colors.cream}40`, marginBottom: '12px' }}>Mood?</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Chill', 'Intense', 'Funny', 'Deep'].map((mood, i) => (
                    <button key={mood} style={{
                      padding: '10px 20px',
                      backgroundColor: i === 0 ? colors.accent : 'transparent',
                      color: i === 0 ? colors.bg : `${colors.cream}60`,
                      border: i === 0 ? 'none' : `1px solid ${colors.cream}12`,
                      borderRadius: '100px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}>
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div>
                <p style={{ fontSize: '12px', color: `${colors.cream}40`, marginBottom: '14px' }}>Perfect matches</p>
                {[
                  { title: 'The Holdovers', year: '2023', match: 94 },
                  { title: 'Past Lives', year: '2023', match: 91 },
                  { title: 'Aftersun', year: '2022', match: 88 },
                ].map((film, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: i === 0 ? colors.surfaceLight : 'transparent',
                    marginBottom: '6px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '60px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${colors.accent}35, ${colors.cool}20)`
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '2px' }}>{film.title}</p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}45` }}>{film.year}</p>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: `${colors.cool}15`,
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: colors.cool }}>{film.match}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Copy */}
            <div>
              <p style={{
                fontSize: '13px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: colors.accent,
                marginBottom: '24px',
                fontWeight: 500
              }}>When you can't decide</p>
              <h2 style={{
                fontSize: '42px',
                fontWeight: 300,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: '24px'
              }}>
                Find something
                <span style={{ fontStyle: 'italic', color: colors.cool }}> everyone</span> will love
              </h2>
              <p style={{
                fontSize: '17px',
                lineHeight: 1.65,
                color: `${colors.cream}60`,
                marginBottom: '32px'
              }}>
                Select who's watching and the vibe you're going for. We'll analyze 
                everyone's taste and find films that hit the sweet spot — movies 
                you'll all genuinely enjoy, not just tolerate.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  'Learns from your ratings and Letterboxd',
                  'Factors in streaming availability',
                  'Gets smarter the more you watch'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: `${colors.cool}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.cool} strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '15px', color: `${colors.cream}70` }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '160px 56px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{
              fontSize: '13px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: `${colors.cream}40`,
              marginBottom: '20px',
              fontWeight: 500
            }}>From our collectives</p>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 300,
              letterSpacing: '-0.02em'
            }}>
              People are <span style={{ fontStyle: 'italic', color: colors.accent }}>loving</span> it
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              {
                quote: "It's like a private group chat but for movies. We share everything we're watching and finally have a place to talk about it all.",
                name: 'The Martinez Family',
                context: 'Family collective'
              },
              {
                quote: "My roommates and I have completely different taste. Film Collective actually finds stuff we all enjoy — I didn't think that was possible.",
                name: 'Jake & Friends',
                context: 'Apartment of 4'
              },
              {
                quote: "We used to spend 45 minutes deciding what to watch. Now it takes 2 minutes and we get to spend that time actually talking about films.",
                name: 'Sarah & Mike',
                context: 'Couple'
              },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '32px',
                backgroundColor: colors.surface,
                borderRadius: '20px',
                border: `1px solid ${colors.cream}06`
              }}>
                <p style={{
                  fontSize: '16px',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                  fontStyle: 'italic'
                }}>"{t.quote}"</p>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>{t.name}</p>
                  <p style={{ fontSize: '13px', color: `${colors.cream}45` }}>{t.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '160px 56px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          border: `1px solid ${colors.cream}04`,
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          border: `1px solid ${colors.cream}06`,
          borderRadius: '50%'
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(40px, 5vw, 60px)',
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '24px'
          }}>
            Start your<br />
            <span style={{ fontStyle: 'italic', color: colors.accent }}>film club</span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: `${colors.cream}55`,
            marginBottom: '40px'
          }}>
            Invite your people, start talking about the films you love
          </p>
          <button style={{
            padding: '22px 52px',
            backgroundColor: colors.cream,
            color: colors.bg,
            border: 'none',
            borderRadius: '100px',
            fontSize: '17px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            Create your collective
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '48px 56px',
        borderTop: `1px solid ${colors.cream}06`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '24px', height: '24px' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '16px',
              height: '16px',
              border: `1.5px solid ${colors.accent}`,
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              backgroundColor: colors.cool,
              borderRadius: '2px',
              opacity: 0.8
            }} />
          </div>
          <span style={{ fontSize: '14px', color: `${colors.cream}40` }}>© 2026 Film Collective</span>
        </div>
        <div style={{ display: 'flex', gap: '36px' }}>
          {['About', 'Privacy', 'Terms', 'Contact'].map((link) => (
            <a key={link} href="#" style={{ fontSize: '14px', color: `${colors.cream}40`, textDecoration: 'none' }}>
              {link}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
