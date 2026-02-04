import React, { useState, useRef, useEffect } from 'react';

// Film Collective - Desktop Film Detail
// Centered layout with sticky collective dropdown + tabs

export default function DesktopFilmDetail() {
  const [activeCollective, setActiveCollective] = useState('misha-mike');
  const [activeTab, setActiveTab] = useState('discussion');
  const [userRating, setUserRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  const displayRating = hoverRating || userRating;

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const stickyElement = stickyRef.current;
    if (!scrollContainer || !stickyElement) return;

    const handleScroll = () => {
      const stickyTop = stickyElement.offsetTop;
      const scrollTop = scrollContainer.scrollTop;
      setIsSticky(scrollTop >= stickyTop);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const Icons = {
    Back: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Heart: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Family: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3L21 10M5 10V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Chat: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Info: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Users: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
        <circle cx="16" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
        <path d="M3 20C3 16.5 5.5 14 9 14C12.5 14 15 16.5 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    ChevronDown: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Send: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Share: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.5" />
        <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.5" />
        <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.5" />
        <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Plus: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  const collectives = [
    {
      id: 'misha-mike',
      name: 'Misha + Mike',
      icon: 'Heart',
      color: '#f472b6',
      members: [{ name: 'Misha', rating: 5, avatar: '#f472b6' }],
      filmDiscussion: {
        count: 12,
        messages: [
          { id: 1, user: 'Misha', avatar: '#f472b6', message: "This movie WRECKED me 😭", time: '2:34 PM', isYou: false },
          { id: 2, user: 'Mike', avatar: colors.accent, message: "I know! That last scene on the street when they're walking back...", time: '2:36 PM', isYou: true },
          { id: 3, user: 'Misha', avatar: '#f472b6', message: "When she finally lets herself cry in the Uber. I lost it.", time: '2:38 PM', isYou: false },
          { id: 4, user: 'Mike', avatar: colors.accent, message: "The way they used In-yun throughout was so beautiful. It ties everything together.", time: '2:40 PM', isYou: true },
          { id: 5, user: 'Misha', avatar: '#f472b6', message: "And Greta Lee's performance! She says so much with just her eyes", time: '2:42 PM', isYou: false },
        ]
      }
    },
    {
      id: 'gunko-bros',
      name: 'Gunko Bros',
      icon: 'Family',
      color: colors.cool,
      members: [
        { name: 'Dan', rating: 4, avatar: colors.cool },
        { name: 'Dad', rating: null, avatar: colors.accentSoft },
      ],
      filmDiscussion: {
        count: 3,
        messages: [
          { id: 1, user: 'Dan', avatar: colors.cool, message: "Finally watched it. Really good.", time: 'Yesterday', isYou: false },
          { id: 2, user: 'Mike', avatar: colors.accent, message: "Right?! What did you think of the ending?", time: 'Yesterday', isYou: true },
        ]
      }
    },
  ];

  const currentCollective = collectives.find(c => c.id === activeCollective);

  const getIcon = (iconName, color, size = 24) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent color={color} size={size} /> : null;
  };

  const scrollbarStyles = `
    .elegant-scroll::-webkit-scrollbar { width: 6px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 3px; }
  `;

  const StickyHeader = ({ isFixed = false }) => (
    <div style={{
      backgroundColor: colors.bg,
      maxWidth: '900px',
      margin: '0 auto',
      ...(isFixed && {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        maxWidth: 'none',
        borderBottom: `1px solid ${colors.cream}10`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      })
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isFixed ? '16px 48px' : '0' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          {/* Collective dropdown */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.cream}08`,
            borderRadius: '10px',
            cursor: 'pointer',
            color: colors.cream
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: `${currentCollective.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {getIcon(currentCollective.icon, currentCollective.color, 18)}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{currentCollective.name}</span>
            <Icons.ChevronDown color={`${colors.cream}40`} size={18} />
          </button>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'info', label: 'Info', Icon: Icons.Info },
              { id: 'discussion', label: 'Discussion', Icon: Icons.Chat, badge: currentCollective.filmDiscussion.count },
              { id: 'ratings', label: 'Ratings', Icon: Icons.Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px',
                  backgroundColor: activeTab === tab.id ? `${colors.accent}15` : 'transparent',
                  border: activeTab === tab.id ? `1px solid ${colors.accent}30` : `1px solid transparent`,
                  borderRadius: '8px',
                  color: activeTab === tab.id ? colors.cream : `${colors.cream}50`,
                  cursor: 'pointer'
                }}
              >
                <tab.Icon color={activeTab === tab.id ? colors.accent : `${colors.cream}40`} size={18} />
                <span style={{ fontSize: '14px', fontWeight: activeTab === tab.id ? 500 : 400 }}>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: activeTab === tab.id ? `${colors.accent}20` : colors.surfaceLight,
                    borderRadius: '10px', fontSize: '12px',
                    color: activeTab === tab.id ? colors.accent : `${colors.cream}50`
                  }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        color: colors.cream,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {isSticky && <StickyHeader isFixed={true} />}

        <div 
          ref={scrollContainerRef}
          className="elegant-scroll"
          style={{ height: '100vh', overflowY: 'auto' }}
        >
          {/* Hero */}
          <div style={{
            height: '300px',
            background: `linear-gradient(180deg, ${colors.accent}25 0%, ${colors.cool}15 50%, ${colors.bg} 100%)`,
            position: 'relative'
          }}>
            <button style={{
              position: 'absolute', top: '32px', left: '48px',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: `${colors.bg}80`, border: 'none',
              padding: '10px 16px', borderRadius: '8px',
              cursor: 'pointer', color: colors.cream,
              backdropFilter: 'blur(10px)'
            }}>
              <Icons.Back color={colors.cream} size={20} />
              <span style={{ fontSize: '14px' }}>Back</span>
            </button>
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 48px' }}>
            {/* Film info row */}
            <div style={{ display: 'flex', gap: '32px', marginTop: '-120px', marginBottom: '32px' }}>
              <div style={{
                width: '200px', height: '280px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.accent}60, ${colors.cool}40)`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: `1px solid ${colors.cream}10`,
                flexShrink: 0
              }} />

              <div style={{ paddingTop: '130px', flex: 1 }}>
                <h1 style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  Past Lives
                </h1>
                <p style={{ fontSize: '16px', color: `${colors.cream}50`, marginBottom: '20px' }}>
                  2023 · Drama, Romance · 1h 45m · Directed by Celine Song
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: colors.accent, border: 'none',
                    borderRadius: '8px', cursor: 'pointer',
                    color: colors.bg, fontSize: '14px', fontWeight: 500
                  }}>
                    <Icons.Plus color={colors.bg} size={18} />
                    Add to list
                  </button>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: colors.surface, border: `1px solid ${colors.cream}10`,
                    borderRadius: '8px', cursor: 'pointer',
                    color: colors.cream, fontSize: '14px', fontWeight: 500
                  }}>
                    <Icons.Share color={colors.cream} size={18} />
                    Share
                  </button>
                </div>
              </div>
            </div>

            <div ref={stickyRef} style={{ marginBottom: '24px' }}>
              <StickyHeader />
            </div>

            <div style={{ paddingTop: isSticky ? '80px' : '0', paddingBottom: '48px' }}>
              {activeTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
                  <div>
                    <p style={{
                      fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: `${colors.cream}40`, marginBottom: '12px'
                    }}>Overview</p>
                    <p style={{ fontSize: '16px', lineHeight: 1.7, color: `${colors.cream}80`, marginBottom: '32px' }}>
                      Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after 
                      Nora's family emigrates from South Korea. Two decades later, they are reunited in 
                      New York for one fateful week as they confront notions of destiny, love, and the 
                      choices that make a life.
                    </p>

                    <div style={{
                      padding: '20px', backgroundColor: colors.surface,
                      borderRadius: '14px', border: `1px solid ${colors.cream}06`
                    }}>
                      {[
                        { label: 'Director', value: 'Celine Song' },
                        { label: 'Cast', value: 'Greta Lee, Teo Yoo, John Magaro' },
                        { label: 'Studio', value: 'A24' },
                        { label: 'Genre', value: 'Drama, Romance' },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: i < 3 ? `1px solid ${colors.cream}06` : 'none'
                        }}>
                          <span style={{ fontSize: '14px', color: `${colors.cream}50` }}>{item.label}</span>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      padding: '24px', backgroundColor: colors.surface,
                      borderRadius: '14px', border: `1px solid ${colors.cream}06`
                    }}>
                      <p style={{
                        fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: `${colors.cream}40`, marginBottom: '20px', textAlign: 'center'
                      }}>Your Rating</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '4px', fontSize: '32px',
                              color: star <= displayRating ? colors.accent : `${colors.cream}20`,
                              transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
                              transition: 'all 0.15s ease'
                            }}
                          >★</button>
                        ))}
                      </div>
                      <p style={{ textAlign: 'center', fontSize: '14px', color: `${colors.cream}50` }}>
                        {userRating > 0 ? `You rated this ${userRating}/5` : 'Rate this film'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    {currentCollective.filmDiscussion.messages.map((msg) => (
                      <div key={msg.id} style={{
                        display: 'flex', gap: '14px', marginBottom: '20px',
                        flexDirection: msg.isYou ? 'row-reverse' : 'row'
                      }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          backgroundColor: msg.avatar, flexShrink: 0
                        }} />
                        <div style={{ maxWidth: '60%' }}>
                          <div style={{
                            display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px',
                            flexDirection: msg.isYou ? 'row-reverse' : 'row'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{msg.user}</span>
                            <span style={{ fontSize: '12px', color: `${colors.cream}35` }}>{msg.time}</span>
                          </div>
                          <div style={{
                            backgroundColor: msg.isYou ? `${colors.accent}20` : colors.surface,
                            padding: '14px 18px', borderRadius: '16px',
                            borderTopLeftRadius: msg.isYou ? '16px' : '4px',
                            borderTopRightRadius: msg.isYou ? '4px' : '16px',
                            border: `1px solid ${msg.isYou ? colors.accent + '30' : colors.cream + '06'}`
                          }}>
                            <p style={{ fontSize: '15px', lineHeight: 1.5 }}>{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px 12px 20px',
                    backgroundColor: colors.surface, borderRadius: '100px',
                    border: `1px solid ${colors.cream}08`
                  }}>
                    <input type="text" placeholder="Discuss this film..." style={{
                      flex: 1, backgroundColor: 'transparent', border: 'none',
                      outline: 'none', fontSize: '15px', color: colors.cream
                    }} />
                    <button style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      backgroundColor: colors.accent, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}>
                      <Icons.Send color={colors.bg} size={18} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'ratings' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{
                    padding: '24px', backgroundColor: `${colors.accent}10`,
                    borderRadius: '14px', border: `1px solid ${colors.accent}20`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: colors.accent }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>You</p>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ fontSize: '18px', color: s <= userRating ? colors.accent : `${colors.cream}20` }}>★</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: '28px', fontWeight: 600, color: colors.accent }}>{userRating}</span>
                    </div>
                  </div>

                  {currentCollective.members.map((member, i) => (
                    <div key={i} style={{
                      padding: '24px', backgroundColor: colors.surface,
                      borderRadius: '14px', border: `1px solid ${colors.cream}06`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '50%',
                          backgroundColor: member.avatar, opacity: member.rating ? 1 : 0.4
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{member.name}</p>
                          {member.rating ? (
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} style={{ fontSize: '18px', color: s <= member.rating ? colors.accent : `${colors.cream}20` }}>★</span>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '14px', color: `${colors.cream}40` }}>Not rated yet</p>
                          )}
                        </div>
                        {member.rating && <span style={{ fontSize: '28px', fontWeight: 600, color: colors.accent }}>{member.rating}</span>}
                      </div>
                    </div>
                  ))}

                  <div style={{
                    gridColumn: 'span 2',
                    padding: '24px',
                    backgroundColor: colors.surfaceLight,
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '80px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '36px', fontWeight: 600, color: colors.accent }}>
                        {((userRating + currentCollective.members.filter(m => m.rating).reduce((a, m) => a + m.rating, 0)) / 
                          (1 + currentCollective.members.filter(m => m.rating).length)).toFixed(1)}
                      </p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}45`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Collective Average</p>
                    </div>
                    <div style={{ width: '1px', backgroundColor: `${colors.cream}10` }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '36px', fontWeight: 600 }}>
                        {1 + currentCollective.members.filter(m => m.rating).length}/{1 + currentCollective.members.length}
                      </p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}45`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Have Rated</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
