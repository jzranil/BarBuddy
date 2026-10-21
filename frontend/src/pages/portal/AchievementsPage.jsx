import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import MilestoneCard from '../../components/portal/achievements/MilestoneCard';
import { useAchievements } from '../../lib/useAchievements';
import { Skeleton, SkeletonCards } from '../../components/common/Skeleton';


export default function AchievementsPage() {
  const navigate = useNavigate();
  const {
    loaded,
    error,
    summary,
    badges,
    achievements,
    dailyChallenges: DAILY_CHALLENGES,
    progression: PROGRESSION_ROAD,
    finalFrontier: FINAL_FRONTIER,
  } = useAchievements();
  const xpPercent = Math.min(100, (summary.xpCurrent / summary.xpTarget) * 100);
  const xpToGo = summary.xpTarget - summary.xpCurrent;

  const badgesEarnedCount = badges.filter((b) => b.earned).length;
  const achievementsEarnedCount = achievements.filter((a) => a.earned).length;
  const loading = !loaded && !error;

  return (
    <PortalLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '28px', margin: 0 }}>Prestigious Journey</h1>
            {loading ? (
              <Skeleton width={90} height={22} radius={999} />
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '4px 12px' }}>
                {summary.levelTitle}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: 0 }}>
            Level up your legal mastery by completing assessments. Every correct citation brings
            you closer to the Grand Mock Bar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <MiniStat icon="local_fire_department" label="DAY STREAK" value={`${summary.streakDays} Days`} loading={loading} />
          <MiniStat icon="diamond" label="EXP POINTS" value={summary.expPoints.toLocaleString()} loading={loading} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT: profile + daily challenges */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderTop: '3px solid var(--gold)', borderRadius: 'var(--radius-lg)', padding: '22px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '68px', height: '68px', margin: '0 auto 12px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '30px', color: 'var(--navy)' }}>person</span>
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: 'var(--navy)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? '' : summary.level}
              </span>
            </div>
            {loading ? (
              <div style={{ display: 'grid', justifyItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="75%" height={11} />
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>{summary.displayName}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{summary.trackTitle}</p>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>XP LEVEL PROGRESSION</span>
              {loading ? <Skeleton width={56} height={11} /> : <span>{summary.xpCurrent} / {summary.xpTarget}</span>}
            </div>
            {loading ? (
              <Skeleton height={6} radius={999} style={{ marginBottom: '8px' }} />
            ) : (
              <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '999px', marginBottom: '8px' }}>
                <div style={{ width: `${xpPercent}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
              </div>
            )}
            {loading ? (
              <Skeleton width="80%" height={11} style={{ margin: '0 auto 16px' }} />
            ) : (
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Earn {xpToGo} more XP to unlock Level {summary.level + 1}
              </p>
            )}

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/assessments')}
            >
              View Ranking History
            </Button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>schedule</span>
              Daily Challenges
            </h4>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
              {loading &&
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <Skeleton width="60%" height={13} />
                      <Skeleton width={42} height={11} />
                    </div>
                    <Skeleton height={5} radius={999} />
                    <Skeleton width={28} height={10} />
                  </div>
                ))}
              {DAILY_CHALLENGES.map((c) => (
                <div key={c.title} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>{c.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.title}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)' }}>+{c.xpReward} XP</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px', marginBottom: '4px' }}>
                    <div style={{ width: `${(c.progressCurrent / c.progressTotal) * 100}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.progressCurrent}/{c.progressTotal}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Resets daily</p>
          </div>
        </div>

        {/* CENTER: progression road */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>arrow_forward</span>
              Progression Road to Bar
            </h3>
            <button
              onClick={() => navigate('/achievements/badges')}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              View Full Map
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton width={32} height={32} radius={999} style={{ flexShrink: 0 }} />
                    {i < 4 && <div style={{ width: '1px', flex: 1, background: 'var(--card-border)', minHeight: '28px' }} />}
                  </div>
                  <div style={{ flex: 1, display: 'grid', gap: '6px', alignContent: 'start', padding: '8px 12px', marginBottom: '4px' }}>
                    <Skeleton width="45%" height={14} />
                    <Skeleton width="70%" height={11} />
                  </div>
                </div>
              ))}
            {PROGRESSION_ROAD.map((step, i) => (
              <div key={step.title} style={{ display: 'flex', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: step.status === 'current' ? '#fdf7e9' : step.status === 'done' ? 'var(--navy)' : 'var(--bg)',
                      border: step.status === 'current' ? '2px solid var(--gold)' : '1px solid var(--card-border)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: step.status === 'done' ? '#fff' : step.status === 'current' ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {step.status === 'done' ? 'check' : step.status === 'current' ? 'edit' : 'lock'}
                    </span>
                  </div>
                  {i < PROGRESSION_ROAD.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--card-border)', minHeight: '28px' }} />}
                </div>
                <button
                  onClick={() =>
                    navigate('/assessments')
                  }
                  style={{
                    textAlign: 'left',
                    background: step.status === 'current' ? '#f3f6fc' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: step.status === 'locked' ? 'var(--text-muted)' : 'var(--navy)' }}>{step.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{step.detail}</div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: final frontier */}
        <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>military_tech</span>
            Final Frontier
          </h4>
          <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>{FINAL_FRONTIER.title}</p>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--text-muted)' }}>lock</span>
          </div>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
            {loading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} width={`${85 - i * 12}%`} height={12} />)}
            {FINAL_FRONTIER.requirements.map((req) => (
              <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: req.met ? 'var(--navy)' : 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  {req.met ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                {req.label}
              </div>
            ))}
          </div>

          <Button
            variant="gold"
            fullWidth
            disabled
            onClick={() => {}}
          >
            Unlock Final Exam
          </Button>
        </div>
      </div>

      {/* Badges preview */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)' }}>military_tech</span>
            Badges
          </h3>
          {loading ? (
            <Skeleton width={90} height={13} />
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{badgesEarnedCount} / {badges.length} Unlocked</span>
          )}
        </div>

        {loading && (
          <div style={{ marginBottom: '18px' }}>
            <SkeletonCards count={4} height={150} min={240} />
          </div>
        )}
        <div style={{ display: loading ? 'none' : 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          {badges.slice(0, 4).map((b) => (
            <MilestoneCard
              key={b.id}
              icon={b.icon}
              name={b.name}
              description={b.description}
              requirementLabel={b.requirementLabel}
              current={b.current}
              target={b.target}
              earned={b.earned}
              variant="badge"
            />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/achievements/badges')}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            View All Badges
          </button>
        </div>
      </div>

      {/* Achievements Sanctum preview */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)' }}>emoji_events</span>
            Achievements Sanctum
          </h3>
          {loading ? (
            <Skeleton width={90} height={13} />
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{achievementsEarnedCount} / {achievements.length} Unlocked</span>
          )}
        </div>

        {loading && (
          <div style={{ marginBottom: '18px' }}>
            <SkeletonCards count={4} height={150} min={260} />
          </div>
        )}
        <div style={{ display: loading ? 'none' : 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          {achievements.slice(0, 4).map((a) => (
            <MilestoneCard
              key={a.id}
              icon={a.icon}
              name={a.name}
              description={a.description}
              requirementLabel={a.requirementLabel}
              current={a.current}
              target={a.target}
              earned={a.earned}
              rarity={a.rarity}
              variant="achievement"
            />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/achievements/sanctum')}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            View All Achievements
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}

function MiniStat({ icon, label, value, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--gold)' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        {loading ? (
          <Skeleton width={56} height={15} style={{ marginTop: '3px' }} />
        ) : (
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px' }}>{value}</div>
        )}
      </div>
    </div>
  );
}
