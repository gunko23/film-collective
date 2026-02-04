import React, { useState, useEffect } from 'react';

// Film Collective - Mobile Landing Page
// Focus: Private groups, community, discussion — not just recommendations

export default function FilmCollectiveMobileCommunity() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050506',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '40px 20px',
      fontFamily: '-apple-system, sans-serif'
    }}>
      {/* Phone frame */}
      <div style={{
        width: '375px',
        backgroundColor: colors.bg,
        color: colors.cream,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '40px',
        border: `1px solid ${colors.cream}10`,
        boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
      }}>
        {/* Ambient light */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '50%',
          background: `radial-gradient(ellipse, ${colors.accent}15 0%, transparent 60%)`,
          pointerEvents: 'none'
        }} />
        
        {/* Film grain */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none'
        }} />

        {/* Status bar */}
        <div style={{
          padding: '14px 24px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: 600,
          position: 'relative',
          zIndex: 10
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} style={{ width: '3px', height: `${h}px`, backgroundColor: colors.cream, borderRadius: '1px' }} />
              ))}
            </div>
            <div style={{
              width: '24px',
              height: '12px',
              border: `1px solid ${colors.cream}`,
              borderRadius: '3px',
              padding: '2px',
              marginLeft: '4px'
            }}>
              <div style={{ width: '80%', height: '100%', backgroundColor: colors.cream, borderRadius: '1px' }} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '28px', height: '28px' }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '18px',
                height: '18px',
                border: `1.5px solid ${colors.accent}`,
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '14px',
                height: '14px',
                backgroundColor: colors.cool,
                borderRadius: '3px',
                opacity: 0.8
              }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Film Collective</span>
          </div>
          <button style={{
            padding: '10px 18px',
            backgroundColor: 'transparent',
            color: colors.cream,
            border: `1px solid ${colors.cream}25`,
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 500
          }}>
            Sign in
          </button>
        </div>

        {/* Hero Section - Community focused */}
        <div style={{ 
          padding: '40px 24px 32px', 
          position: 'relative', 
          zIndex: 10,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: colors.accent }} />
            <span style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: colors.accent,
              fontWeight: 500
            }}>Private film clubs</span>
          </div>

          {/* Headline - Community focused */}
          <h1 style={{
            fontSize: '40px',
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            marginBottom: '20px'
          }}>
            <span style={{ display: 'block' }}>Your space to</span>
            <span style={{ 
              display: 'block', 
              fontStyle: 'italic', 
              fontWeight: 400, 
              color: colors.accent 
            }}>
              talk film
            </span>
            <span style={{ display: 'block' }}>
              together<span style={{ color: colors.cool }}>.</span>
            </span>
          </h1>

          {/* Subhead - Community focused */}
          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: `${colors.cream}70`,
            marginBottom: '28px'
          }}>
            Create private collectives for your partner, friends, or family. 
            Share what you're watching, discuss your favorites, and discover 
            films you'll all love.
          </p>

          {/* CTAs */}
          <button style={{
            width: '100%',
            padding: '18px',
            backgroundColor: colors.cream,
            color: colors.bg,
            border: 'none',
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 500,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            Create your collective
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button style={{
            width: '100%',
            padding: '18px',
            backgroundColor: 'transparent',
            color: colors.cream,
            border: `1px solid ${colors.cream}20`,
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 500
          }}>
            Learn more
          </button>
        </div>

        {/* Social proof - member avatars */}
        <div style={{ 
          padding: '0 24px 32px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ display: 'flex' }}>
              {[colors.accent, colors.cool, colors.accentSoft, `${colors.cream}30`].map((color, i) => (
                <div key={i} style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  marginLeft: i > 0 ? '-10px' : 0,
                  border: `2px solid ${colors.bg}`
                }} />
              ))}
            </div>
            <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
              2,400+ collectives talking film
            </p>
          </div>
        </div>

        {/* Discussion Preview Card - NEW */}
        <div style={{ padding: '0 24px 32px', position: 'relative', zIndex: 10 }}>
          <div style={{
            backgroundColor: colors.surface,
            borderRadius: '20px',
            padding: '20px',
            border: `1px solid ${colors.cream}06`
          }}>
            {/* Collective header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${colors.cream}08`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${colors.accent}40, ${colors.cool}30)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>🎬</div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>Friday Night Films</p>
                  <p style={{ fontSize: '11px', color: `${colors.cream}40` }}>4 members</p>
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                backgroundColor: `${colors.cool}15`,
                borderRadius: '100px',
                fontSize: '11px',
                color: colors.cool,
                fontWeight: 500
              }}>Private</div>
            </div>

            {/* Discussion thread preview */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${colors.cream}35`,
                marginBottom: '12px'
              }}>Recent discussion</p>
              
              {/* Message 1 */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent,
                  flexShrink: 0
                }} />
                <div style={{
                  backgroundColor: colors.surfaceLight,
                  padding: '10px 14px',
                  borderRadius: '14px',
                  borderTopLeftRadius: '4px',
                  maxWidth: '85%'
                }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    Just finished Past Lives... I'm not okay 😭
                  </p>
                </div>
              </div>

              {/* Message 2 */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: colors.cool,
                  flexShrink: 0
                }} />
                <div style={{
                  backgroundColor: colors.surfaceLight,
                  padding: '10px 14px',
                  borderRadius: '14px',
                  borderTopLeftRadius: '4px'
                }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    RIGHT?? That ending scene...
                  </p>
                </div>
              </div>

              {/* Message 3 */}
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: colors.accentSoft,
                  flexShrink: 0
                }} />
                <div style={{
                  backgroundColor: colors.surfaceLight,
                  padding: '10px 14px',
                  borderRadius: '14px',
                  borderTopLeftRadius: '4px'
                }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    Adding it to my list now 👀
                  </p>
                </div>
              </div>
            </div>

            {/* Input hint */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: colors.surfaceLight,
              borderRadius: '100px'
            }}>
              <span style={{ fontSize: '13px', color: `${colors.cream}35` }}>
                Share what you're watching...
              </span>
            </div>
          </div>
        </div>

        {/* What you can do - Community features */}
        <div style={{ 
          padding: '32px 24px', 
          borderTop: `1px solid ${colors.cream}06`,
          position: 'relative',
          zIndex: 10
        }}>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: colors.cool,
            marginBottom: '24px',
            fontWeight: 500
          }}>Your collective, your space</p>

          {[
            { 
              icon: '💬', 
              title: 'Discuss', 
              text: 'Chat about what you\'re watching, share reactions, debate endings' 
            },
            { 
              icon: '📋', 
              title: 'Share lists', 
              text: 'Create watchlists together, track what everyone\'s seen' 
            },
            { 
              icon: '✨', 
              title: 'Get picks', 
              text: 'When you can\'t decide, we\'ll find something everyone will love' 
            },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              padding: '20px 0',
              borderBottom: i < 2 ? `1px solid ${colors.cream}06` : 'none',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: colors.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>{item.icon}</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '14px', color: `${colors.cream}55`, lineHeight: 1.5 }}>
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tonight's Pick preview - Secondary feature */}
        <div style={{ 
          padding: '32px 24px', 
          borderTop: `1px solid ${colors.cream}06`,
          position: 'relative',
          zIndex: 10
        }}>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: colors.accent,
            marginBottom: '8px',
            fontWeight: 500
          }}>When you can't decide</p>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 400,
            marginBottom: '16px',
            letterSpacing: '-0.01em'
          }}>
            Tonight's Pick
          </h3>
          <p style={{
            fontSize: '14px',
            color: `${colors.cream}55`,
            lineHeight: 1.5,
            marginBottom: '20px'
          }}>
            Select who's watching and the mood — we'll find films that match 
            everyone's taste. No more 30-minute scroll sessions.
          </p>

          {/* Mini film cards */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[94, 91, 88].map((match, i) => (
              <div key={i} style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: '12px',
                padding: '12px',
                border: `1px solid ${colors.cream}06`
              }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  borderRadius: '6px',
                  background: `linear-gradient(135deg, ${colors.accent}${30 - i*8}, ${colors.cool}${20 - i*5})`,
                  marginBottom: '10px'
                }} />
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: `${colors.cool}15`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.cool,
                  textAlign: 'center'
                }}>
                  {match}% match
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ 
          padding: '32px 24px', 
          borderTop: `1px solid ${colors.cream}06`,
          position: 'relative',
          zIndex: 10
        }}>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: `${colors.cream}40`,
            marginBottom: '20px',
            fontWeight: 500
          }}>Also included</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { title: 'Letterboxd sync', color: colors.cool },
              { title: 'Taste compatibility', color: colors.accent },
              { title: 'Group insights', color: colors.accentSoft },
              { title: 'Private & secure', color: colors.cool },
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '16px 14px',
                backgroundColor: colors.surface,
                borderRadius: '12px',
                border: `1px solid ${colors.cream}06`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: feature.color
                }} />
                <p style={{ fontSize: '13px', fontWeight: 500 }}>{feature.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial - Community focused */}
        <div style={{ 
          padding: '0 24px 32px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            padding: '24px',
            background: `linear-gradient(135deg, ${colors.accent}12, ${colors.cool}08)`,
            borderRadius: '16px'
          }}>
            <p style={{ 
              fontSize: '15px', 
              fontStyle: 'italic',
              lineHeight: 1.5,
              marginBottom: '12px'
            }}>
              "It's like a private group chat but for movies. We share everything 
              we're watching and finally have a place to talk about it all."
            </p>
            <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
              — The Martinez Family
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ 
          padding: '32px 24px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            padding: '40px 24px',
            background: `linear-gradient(135deg, ${colors.accent}22, ${colors.cool}15)`,
            borderRadius: '24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: `1px solid ${colors.cream}06`,
              borderRadius: '50%'
            }} />
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 300,
                marginBottom: '8px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Start your<br />
                <span style={{ fontStyle: 'italic', color: colors.accent }}>film club</span>
              </h3>
              <p style={{
                fontSize: '14px',
                color: `${colors.cream}55`,
                marginBottom: '24px'
              }}>
                Invite your people, start talking
              </p>
              <button style={{
                padding: '16px 36px',
                backgroundColor: colors.cream,
                color: colors.bg,
                border: 'none',
                borderRadius: '100px',
                fontSize: '15px',
                fontWeight: 500
              }}>
                Create your collective
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: `1px solid ${colors.cream}06`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px',
            marginBottom: '16px'
          }}>
            {['About', 'Privacy', 'Terms'].map((link) => (
              <a key={link} href="#" style={{ 
                fontSize: '13px', 
                color: `${colors.cream}40`, 
                textDecoration: 'none' 
              }}>
                {link}
              </a>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: `${colors.cream}30` }}>
            © 2026 Film Collective
          </p>
        </div>

        {/* Home indicator */}
        <div style={{
          padding: '8px 0 12px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '134px',
            height: '5px',
            backgroundColor: colors.cream,
            borderRadius: '100px',
            opacity: 0.2
          }} />
        </div>
      </div>
    </div>
  );
}
