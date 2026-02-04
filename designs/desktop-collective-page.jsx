import React, { useState } from 'react';

// Film Collective - Desktop Collective Page
// Sidebar + main content with tabs

export default function DesktopCollectivePage() {
  const [activeTab, setActiveTab] = useState('feed');

  const colors = {
    bg: '#08080a',
    surface: '#0f0f12',
    surfaceLight: '#161619',
    cream: '#f8f6f1',
    accent: '#e07850',
    accentSoft: '#d4a574',
    cool: '#7b8cde',
  };

  const Icons = {
    Back: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Settings: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Home: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Chat: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Film: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M2 8H22M2 16H22M6 4V20M18 4V20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    Insights: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 20V14M9 20V10M14 20V12M19 20V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    Heart: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    TonightsPick: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    Send: ({ color, size = 24 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  const collective = {
    name: 'Misha + Mike',
    members: 2,
    role: 'owner',
    color: '#f472b6',
    memberList: [
      { name: 'Mike Gunko', role: 'owner', avatar: colors.accent },
      { name: 'Misha', role: 'member', avatar: '#f472b6' },
    ]
  };

  const messages = [
    { id: 1, user: 'Misha', avatar: '#f472b6', message: "What should we watch tonight?", time: '2:34 PM', isYou: false },
    { id: 2, user: 'Mike', avatar: colors.accent, message: "I'm in the mood for something light. Maybe a comedy?", time: '2:36 PM', isYou: true },
    { id: 3, user: 'Misha', avatar: '#f472b6', message: "Comedy sounds great! Or maybe a fun action movie?", time: '2:40 PM', isYou: false },
    { id: 4, user: 'Mike', avatar: colors.accent, message: "Let's use Tonight's Pick and see what it suggests!", time: '2:42 PM', isYou: true },
    { id: 5, user: 'Misha', avatar: '#f472b6', message: "Good idea! I'll set it up now", time: '2:43 PM', isYou: false },
  ];

  const films = [
    { title: 'Past Lives', year: '2023', rating: 4.8, color: colors.accent },
    { title: 'Barbie', year: '2023', rating: 4.2, color: colors.cool },
    { title: 'Oppenheimer', year: '2023', rating: 4.9, color: colors.accentSoft },
    { title: 'Poor Things', year: '2023', rating: 4.5, color: '#f472b6' },
    { title: 'Dune: Part Two', year: '2024', rating: 4.7, color: colors.accent },
    { title: 'The Holdovers', year: '2023', rating: 4.4, color: colors.cool },
  ];

  const scrollbarStyles = `
    .elegant-scroll::-webkit-scrollbar { width: 6px; }
    .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
    .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 3px; }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.bg,
        color: colors.cream,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: '300px',
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.cream}08`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0
        }}>
          {/* Back button */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: `${colors.cream}60`, marginBottom: '24px', padding: 0
          }}>
            <Icons.Back color={`${colors.cream}60`} size={20} />
            <span style={{ fontSize: '14px' }}>Back to Dashboard</span>
          </button>

          {/* Collective header */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.surfaceLight,
            borderRadius: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              backgroundColor: `${collective.color}15`,
              border: `2px solid ${collective.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icons.Heart color={collective.color} size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{collective.name}</h2>
            <p style={{ fontSize: '13px', color: `${colors.cream}50` }}>
              {collective.members} members · You're the owner
            </p>
          </div>

          {/* Members */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: `${colors.cream}40`, marginBottom: '12px'
            }}>Members</p>
            
            {collective.memberList.map((member, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '10px', marginBottom: '6px',
                backgroundColor: 'transparent'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: member.avatar
                }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>{member.name}</p>
                  <p style={{ fontSize: '11px', color: `${colors.cream}45`, textTransform: 'capitalize' }}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Settings */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px', backgroundColor: 'transparent', border: 'none',
            borderRadius: '8px', cursor: 'pointer', color: `${colors.cream}50`
          }}>
            <Icons.Settings color={`${colors.cream}40`} size={20} />
            <span style={{ fontSize: '14px' }}>Collective Settings</span>
          </button>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '300px',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* Tab bar */}
          <div style={{
            padding: '0 48px',
            borderBottom: `1px solid ${colors.cream}08`,
            backgroundColor: colors.bg
          }}>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '24px' }}>
              {[
                { id: 'feed', label: 'Feed', Icon: Icons.Home },
                { id: 'chat', label: 'Chat', Icon: Icons.Chat },
                { id: 'films', label: 'Films', Icon: Icons.Film },
                { id: 'insights', label: 'Insights', Icon: Icons.Insights },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 20px',
                    backgroundColor: 'transparent', border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${colors.accent}` : '2px solid transparent',
                    color: activeTab === tab.id ? colors.cream : `${colors.cream}50`,
                    cursor: 'pointer', marginBottom: '-1px'
                  }}
                >
                  <tab.Icon color={activeTab === tab.id ? colors.accent : `${colors.cream}40`} size={20} />
                  <span style={{ fontSize: '15px', fontWeight: activeTab === tab.id ? 500 : 400 }}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="elegant-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'feed' && (
              <div style={{ padding: '32px 48px', maxWidth: '800px' }}>
                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
                  <button style={{
                    padding: '24px',
                    background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
                    border: `1px solid ${colors.accent}25`, borderRadius: '14px',
                    textAlign: 'left', cursor: 'pointer', color: colors.cream,
                    display: 'flex', alignItems: 'center', gap: '16px'
                  }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      backgroundColor: `${colors.accent}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icons.TonightsPick color={colors.accent} size={26} />
                    </div>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 500 }}>Tonight's Pick</p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}50`, marginTop: '2px' }}>Find something to watch together</p>
                    </div>
                  </button>
                  <button style={{
                    padding: '24px', backgroundColor: colors.surface,
                    border: `1px solid ${colors.cream}08`, borderRadius: '14px',
                    textAlign: 'left', cursor: 'pointer', color: colors.cream,
                    display: 'flex', alignItems: 'center', gap: '16px'
                  }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      backgroundColor: colors.surfaceLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icons.Chat color={colors.cream} size={26} />
                    </div>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 500 }}>Start Discussion</p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}50`, marginTop: '2px' }}>Talk about a film you watched</p>
                    </div>
                  </button>
                </div>

                {/* Recent activity */}
                <p style={{
                  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: `${colors.cream}40`, marginBottom: '16px'
                }}>Recent Activity</p>
                
                <div style={{
                  padding: '20px', backgroundColor: colors.surface,
                  borderRadius: '14px', border: `1px solid ${colors.cream}06`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f472b6' }} />
                    <div>
                      <p style={{ fontSize: '15px' }}>
                        <span style={{ fontWeight: 600 }}>Misha</span>
                        <span style={{ color: `${colors.cream}60` }}> rated </span>
                        <span style={{ fontWeight: 500 }}>Past Lives</span>
                      </p>
                      <p style={{ fontSize: '13px', color: `${colors.cream}40`, marginTop: '4px' }}>2 hours ago</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ fontSize: '18px', color: s <= 5 ? colors.accent : `${colors.cream}20` }}>★</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Messages */}
                <div style={{ flex: 1, padding: '24px 48px', maxWidth: '800px' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{
                      display: 'flex', gap: '12px', marginBottom: '20px',
                      flexDirection: msg.isYou ? 'row-reverse' : 'row'
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
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

                {/* Input */}
                <div style={{
                  padding: '16px 48px 24px', backgroundColor: colors.bg,
                  borderTop: `1px solid ${colors.cream}06`
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px 12px 20px', backgroundColor: colors.surface,
                    borderRadius: '100px', border: `1px solid ${colors.cream}08`,
                    maxWidth: '800px'
                  }}>
                    <input type="text" placeholder="Type a message..." style={{
                      flex: 1, backgroundColor: 'transparent', border: 'none',
                      outline: 'none', fontSize: '15px', color: colors.cream
                    }} />
                    <button style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      backgroundColor: colors.accent, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}>
                      <Icons.Send color={colors.bg} size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'films' && (
              <div style={{ padding: '32px 48px' }}>
                <p style={{
                  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: `${colors.cream}40`, marginBottom: '20px'
                }}>Films in this collective ({films.length})</p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '20px'
                }}>
                  {films.map((film, i) => (
                    <div key={i} style={{ cursor: 'pointer' }}>
                      <div style={{
                        aspectRatio: '2/3', borderRadius: '10px',
                        background: `linear-gradient(135deg, ${film.color}50, ${colors.cool}30)`,
                        marginBottom: '12px'
                      }} />
                      <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{film.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: `${colors.cream}45` }}>{film.year}</span>
                        <span style={{ fontSize: '13px', color: colors.accent }}>★ {film.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div style={{ padding: '32px 48px', maxWidth: '900px' }}>
                {/* Stats grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px', marginBottom: '40px'
                }}>
                  {[
                    { value: '47', label: 'Films Rated' },
                    { value: '12', label: 'Discussions' },
                    { value: '4.1', label: 'Avg Rating' },
                    { value: '84%', label: 'Compatibility' },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      padding: '24px', backgroundColor: colors.surface,
                      borderRadius: '14px', border: `1px solid ${colors.cream}06`,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '32px', fontWeight: 600, marginBottom: '4px' }}>{stat.value}</p>
                      <p style={{ fontSize: '12px', color: `${colors.cream}45`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Taste match */}
                <p style={{
                  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: `${colors.cream}40`, marginBottom: '16px'
                }}>Taste Compatibility</p>
                
                <div style={{
                  padding: '24px', backgroundColor: colors.surface,
                  borderRadius: '14px', border: `1px solid ${colors.cream}06`
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f472b6' }} />
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>Misha</p>
                        <p style={{ fontSize: '13px', color: `${colors.cream}45` }}>Based on 47 shared films</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 600, color: colors.cool }}>84%</span>
                  </div>
                  <div style={{
                    height: '8px', backgroundColor: colors.surfaceLight,
                    borderRadius: '4px', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '84%', height: '100%',
                      backgroundColor: colors.cool, borderRadius: '4px'
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
