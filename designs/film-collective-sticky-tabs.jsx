import React, { useState, useRef, useEffect } from 'react';

// Film Collective - Film Detail with Sticky Tabs
// Collective dropdown and tabs stick to top when scrolling past poster
// Can still scroll back up to see movie details

export default function FilmDetailStickyTabs() {
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

  // Handle scroll to detect when tabs should become sticky
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const stickyElement = stickyRef.current;
    
    if (!scrollContainer || !stickyElement) return;

    const handleScroll = () => {
      const stickyTop = stickyElement.offsetTop;
      const scrollTop = scrollContainer.scrollTop;
      setIsSticky(scrollTop >= stickyTop - 48); // 48px is status bar height
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Icons
  const Icons = {
    Back: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    More: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="1.5" fill={color} />
        <circle cx="19" cy="12" r="1.5" fill={color} />
        <circle cx="5" cy="12" r="1.5" fill={color} />
      </svg>
    ),
    Chat: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    Info: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
        <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Users: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
        <circle cx="16" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
        <path d="M3 20C3 16.5 5.5 14 9 14C12.5 14 15 16.5 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 14C17.5 14 19.5 15.8 20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Heart: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Family: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3L21 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V10" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Send: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Home: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Search: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Collective: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <circle cx="15" cy="10" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.5 7 14 9 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 20C19 16.5 17 14 15 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Profile: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
        <path d="M5 20C5 16.13 8.13 13 12 13C15.87 13 19 16.13 19 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    ChevronDown: ({ color = colors.cream, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          { id: 6, user: 'Mike', avatar: colors.accent, message: "The scene at the bar where Arthur asks about dreams... heartbreaking", time: '2:45 PM', isYou: true },
          { id: 7, user: 'Misha', avatar: '#f472b6', message: "We need to watch more A24 films. What should be next?", time: '2:48 PM', isYou: false },
          { id: 8, user: 'Mike', avatar: colors.accent, message: "Aftersun? I've heard it's similar vibes", time: '2:50 PM', isYou: true },
          { id: 9, user: 'Misha', avatar: '#f472b6', message: "Yes! Let's do that this weekend", time: '2:52 PM', isYou: false },
          { id: 10, user: 'Mike', avatar: colors.accent, message: "Perfect. Saturday night?", time: '2:53 PM', isYou: true },
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
          { id: 3, user: 'Dan', avatar: colors.cool, message: "Honestly still processing it. Need to rewatch.", time: 'Yesterday', isYou: false },
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
    .elegant-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 4px; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  // Sticky header component (collective dropdown + tabs)
  const StickyHeader = ({ isFixed = false }) => (
    <div style={{
      backgroundColor: colors.bg,
      ...(isFixed && {
        position: 'absolute',
        top: '48px', // Below status bar
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottom: `1px solid ${colors.cream}10`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      })
    }}>
      {/* Collective context */}
      <div style={{
        margin: isFixed ? '12px 20px' : '0 20px 12px',
        padding: '10px 14px',
        backgroundColor: colors.surface,
        borderRadius: '10px',
        border: `1px solid ${colors.cream}06`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          backgroundColor: `${currentCollective.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {getIcon(currentCollective.icon, currentCollective.color, 16)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: colors.cream }}>{currentCollective.name}</p>
        </div>
        <Icons.ChevronDown color={`${colors.cream}40`} size={18} />
      </div>

      {/* Tab bar */}
      <div style={{ 
        padding: '0 20px',
        borderBottom: `1px solid ${colors.cream}08`
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'info', label: 'Info', Icon: Icons.Info },
            { id: 'discussion', label: 'Discussion', Icon: Icons.Chat, badge: currentCollective.filmDiscussion.count },
            { id: 'ratings', label: 'Ratings', Icon: Icons.Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${colors.accent}` : '2px solid transparent',
                color: activeTab === tab.id ? colors.cream : `${colors.cream}50`,
                cursor: 'pointer', marginBottom: '-1px'
              }}
            >
              <tab.Icon color={activeTab === tab.id ? colors.accent : `${colors.cream}40`} size={16} />
              <span style={{ fontSize: '13px', fontWeight: activeTab === tab.id ? 500 : 400 }}>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  padding: '2px 6px',
                  backgroundColor: activeTab === tab.id ? `${colors.accent}20` : colors.surfaceLight,
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: activeTab === tab.id ? colors.accent : `${colors.cream}50`
                }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#050506',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '40px 20px',
        fontFamily: '-apple-system, sans-serif',
        gap: '40px'
      }}>
        {/* Controls */}
        <div style={{ maxWidth: '280px', color: colors.cream, position: 'sticky', top: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Sticky Tabs</h3>
          <p style={{ fontSize: '14px', color: `${colors.cream}60`, lineHeight: 1.6, marginBottom: '24px' }}>
            Scroll down to see the collective dropdown and tabs become sticky at the top. 
            You can still scroll back up to see the movie poster and details.
          </p>

          <div style={{
            padding: '14px',
            backgroundColor: colors.surface,
            borderRadius: '10px',
            border: `1px solid ${colors.cream}10`,
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '12px', color: `${colors.cream}50`, marginBottom: '8px' }}>Sticky state:</p>
            <p style={{ fontSize: '16px', fontWeight: 600, color: isSticky ? colors.accent : colors.cool }}>
              {isSticky ? 'Header is sticky' : 'Header in flow'}
            </p>
          </div>

          {/* Tab switcher */}
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: `${colors.cream}40`, marginBottom: '10px' }}>Tab</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {['info', 'discussion', 'ratings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: activeTab === tab ? colors.accent : colors.surface,
                  color: activeTab === tab ? colors.bg : `${colors.cream}60`,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >{tab}</button>
            ))}
          </div>

          {/* Collective switcher */}
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: `${colors.cream}40`, marginBottom: '10px' }}>Collective</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {collectives.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCollective(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: activeCollective === c.id ? `${colors.accent}15` : colors.surface,
                  border: `1px solid ${activeCollective === c.id ? colors.accent : colors.cream}10`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: colors.cream,
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: `${c.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {getIcon(c.icon, c.color, 18)}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>{c.name}</p>
                  <p style={{ fontSize: '11px', color: `${colors.cream}45` }}>{c.filmDiscussion.count} messages</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Phone frame */}
        <div style={{
          width: '375px',
          height: '812px',
          backgroundColor: colors.bg,
          color: colors.cream,
          borderRadius: '40px',
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${colors.cream}10`,
          boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
        }}>
          {/* Status bar - fixed */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '14px 24px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: colors.bg,
            zIndex: 200
          }}>
            <span>9:41</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                {[4, 6, 8, 10].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h}px`, backgroundColor: colors.cream, borderRadius: '1px' }} />
                ))}
              </div>
              <div style={{ width: '24px', height: '12px', border: `1px solid ${colors.cream}`, borderRadius: '3px', padding: '2px', marginLeft: '4px' }}>
                <div style={{ width: '80%', height: '100%', backgroundColor: colors.cream, borderRadius: '1px' }} />
              </div>
            </div>
          </div>

          {/* Sticky header when scrolled */}
          {isSticky && <StickyHeader isFixed={true} />}

          {/* Main scrollable area */}
          <div 
            ref={scrollContainerRef}
            className="elegant-scroll"
            style={{ 
              position: 'absolute',
              top: '48px', // Below status bar
              bottom: '85px', // Above footer nav
              left: 0,
              right: 0,
              overflowY: 'auto'
            }}
          >
            {/* Hero - scrolls away */}
            <div style={{
              height: '180px',
              background: `linear-gradient(180deg, ${colors.accent}30 0%, ${colors.cool}20 50%, ${colors.bg} 100%)`,
              position: 'relative'
            }}>
              <button style={{
                position: 'absolute', top: '12px', left: '20px',
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: `${colors.bg}80`, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(10px)'
              }}>
                <Icons.Back color={colors.cream} size={20} />
              </button>
              <button style={{
                position: 'absolute', top: '12px', right: '20px',
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: `${colors.bg}80`, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(10px)'
              }}>
                <Icons.More color={colors.cream} size={20} />
              </button>
              <div style={{
                position: 'absolute', bottom: '-40px', left: '20px',
                width: '80px', height: '110px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${colors.accent}60, ${colors.cool}40)`,
                boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                border: `1px solid ${colors.cream}10`, zIndex: 10
              }} />
            </div>

            {/* Title section - scrolls away */}
            <div style={{ padding: '50px 20px 16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Past Lives
              </h1>
              <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
                2023 · Drama, Romance · 1h 45m
              </p>
            </div>

            {/* Sticky header placeholder - this is where sticky behavior triggers */}
            <div ref={stickyRef}>
              <StickyHeader />
            </div>

            {/* Tab content */}
            <div style={{ 
              minHeight: isSticky ? 'calc(100% - 100px)' : 'auto',
              paddingTop: isSticky ? '100px' : '0' // Compensate for sticky header
            }}>
              {activeTab === 'info' && (
                <div style={{ padding: '20px' }}>
                  {/* Your Rating */}
                  <div style={{
                    backgroundColor: colors.surface,
                    borderRadius: '14px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: `1px solid ${colors.cream}06`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40` }}>Your Rating</p>
                      {userRating > 0 && <span style={{ fontSize: '13px', color: `${colors.cream}50` }}>{userRating}/5</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', fontSize: '28px',
                            color: star <= displayRating ? colors.accent : `${colors.cream}20`,
                            transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                        >★</button>
                      ))}
                    </div>
                  </div>

                  {/* Overview */}
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, marginBottom: '10px' }}>Overview</p>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: `${colors.cream}70`, marginBottom: '20px' }}>
                    Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora's family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week.
                  </p>

                  {/* Details */}
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: colors.surface,
                    borderRadius: '12px',
                    border: `1px solid ${colors.cream}06`,
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: `${colors.cream}50` }}>Director</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>Celine Song</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: `${colors.cream}50` }}>Cast</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>Greta Lee, Teo Yoo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: `${colors.cream}50` }}>Studio</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>A24</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button style={{
                      padding: '14px', backgroundColor: colors.surface,
                      border: `1px solid ${colors.cream}08`, borderRadius: '10px',
                      fontSize: '13px', fontWeight: 500, color: colors.cream, cursor: 'pointer'
                    }}>+ Add to list</button>
                    <button style={{
                      padding: '14px', backgroundColor: colors.surface,
                      border: `1px solid ${colors.cream}08`, borderRadius: '10px',
                      fontSize: '13px', fontWeight: 500, color: colors.cream, cursor: 'pointer'
                    }}>Share</button>
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div style={{ padding: '16px 20px' }}>
                  {currentCollective.filmDiscussion.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        marginBottom: '16px',
                        flexDirection: msg.isYou ? 'row-reverse' : 'row'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: msg.avatar, flexShrink: 0
                      }} />
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'baseline', 
                          gap: '8px', 
                          marginBottom: '4px',
                          flexDirection: msg.isYou ? 'row-reverse' : 'row'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: `${colors.cream}70` }}>{msg.user}</span>
                          <span style={{ fontSize: '10px', color: `${colors.cream}30` }}>{msg.time}</span>
                        </div>
                        <div style={{
                          backgroundColor: msg.isYou ? `${colors.accent}20` : colors.surface,
                          padding: '10px 14px',
                          borderRadius: '14px',
                          borderTopLeftRadius: msg.isYou ? '14px' : '4px',
                          borderTopRightRadius: msg.isYou ? '4px' : '14px',
                          border: `1px solid ${msg.isYou ? colors.accent + '30' : colors.cream + '06'}`
                        }}>
                          <p style={{ fontSize: '14px', lineHeight: 1.45 }}>{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Spacer for input */}
                  <div style={{ height: '80px' }} />
                </div>
              )}

              {activeTab === 'ratings' && (
                <div style={{ padding: '20px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: `${colors.cream}40`, marginBottom: '14px' }}>
                    Ratings in {currentCollective.name}
                  </p>
                  
                  {/* Your rating */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px', backgroundColor: `${colors.accent}10`,
                    borderRadius: '12px', border: `1px solid ${colors.accent}20`, marginBottom: '10px'
                  }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: colors.accent }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>You</p>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ fontSize: '14px', color: s <= userRating ? colors.accent : `${colors.cream}20` }}>★</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: colors.accent }}>{userRating}</span>
                  </div>
                  
                  {/* Other members */}
                  {currentCollective.members.map((member, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px', backgroundColor: colors.surface,
                      borderRadius: '12px', border: `1px solid ${colors.cream}06`, marginBottom: '10px'
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        backgroundColor: member.avatar, opacity: member.rating ? 1 : 0.4
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{member.name}</p>
                        {member.rating ? (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} style={{ fontSize: '14px', color: s <= member.rating ? colors.accent : `${colors.cream}20` }}>★</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: `${colors.cream}40` }}>Not rated yet</p>
                        )}
                      </div>
                      {member.rating && <span style={{ fontSize: '18px', fontWeight: 600, color: colors.accent }}>{member.rating}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Input bar - fixed at bottom when on discussion tab */}
          {activeTab === 'discussion' && (
            <div style={{ 
              position: 'absolute',
              bottom: '85px',
              left: 0,
              right: 0,
              padding: '12px 20px',
              backgroundColor: colors.bg,
              borderTop: `1px solid ${colors.cream}06`,
              zIndex: 150
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px 10px 16px',
                backgroundColor: colors.surface, borderRadius: '100px',
                border: `1px solid ${colors.cream}08`
              }}>
                <input
                  type="text"
                  placeholder="Discuss this film..."
                  style={{
                    flex: 1, backgroundColor: 'transparent', border: 'none',
                    outline: 'none', fontSize: '14px', color: colors.cream
                  }}
                />
                <button style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: colors.accent, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <Icons.Send color={colors.bg} size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px 28px',
            backgroundColor: colors.surface,
            borderTop: `1px solid ${colors.cream}08`,
            display: 'flex', justifyContent: 'space-around',
            zIndex: 100
          }}>
            {[
              { id: 'home', label: 'Home', Icon: Icons.Home },
              { id: 'search', label: 'Search', Icon: Icons.Search },
              { id: 'collectives', label: 'Collectives', Icon: Icons.Collective },
              { id: 'profile', label: 'Profile', Icon: Icons.Profile },
            ].map((item) => (
              <button key={item.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer'
              }}>
                <item.Icon color={`${colors.cream}40`} size={22} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: `${colors.cream}40` }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            width: '134px', height: '5px', backgroundColor: colors.cream, borderRadius: '100px', opacity: 0.2
          }} />
        </div>
      </div>
    </>
  );
}
