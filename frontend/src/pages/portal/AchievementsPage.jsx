import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import {
  getZeroedAchievementSummary,
  DAILY_CHALLENGES,
  PROGRESSION_ROAD,
  ACHIEVEMENT_BADGES,
  FINAL_FRONTIER,
  totalBadges,
} from '../../data/achievements';

// BACKEND TODO: swap for a real fetch once GET /api/reviewee/achievements-summary exists.
const summary = getZeroedAchievementSummary();

export default function AchievementsPage() {
  const navigate = useNavigate();
  const xpPercent = Math.min(100, (summary.xpCurrent / summary.xpTarget) * 100);
  const xpToGo = summary.xpTarget - summary.xpCurrent;

  return (
    <PortalLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '28px', margin: 0 }}>Prestigious Journey</h1>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '4px 12px' }}>
              {summary.levelTitle}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: 0 }}>
            Level up your legal mastery by completing assessments. Every correct citation brings
            you closer to the Grand Mock Bar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <MiniStat icon="local_fire_department" label="DAY STREAK" value={`${summary.streakDays} Days`} />
          <MiniStat icon="diamond" label="EXP POINTS" value={summary.expPoints.toLocaleString()} />
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
                {summary.level}
              </span>
            </div>
            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>{summary.displayName}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{summary.trackTitle}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>XP LEVEL PROGRESSION</span>
              <span>{summary.xpCurrent} / {summary.xpTarget}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '999px', marginBottom: '8px' }}>
              <div style={{ width: `${xpPercent}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
            </div>
            <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Earn {xpToGo} more XP to unlock Level {summary.level + 1}
            </p>

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/coming-soon', { state: { title: 'Ranking History', description: 'Your XP and ranking history will appear here once you start earning XP.' } })}
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
              onClick={() => navigate('/coming-soon', { state: { title: 'Full Progression Map', description: 'A zoomed-out view of every milestone will live here.' } })}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              View Full Map
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
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
                    navigate('/coming-soon', { state: { title: step.title, description: 'This milestone unlocks once its requirement is met.' } })
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

      {/* Achievement Sanctum */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)' }}>emoji_events</span>
            Achievement Sanctum
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>0 / {totalBadges} Unlocked</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          {ACHIEVEMENT_BADGES.map((badge) => (
            <div key={badge.title} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>{badge.icon}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '2px 8px', color: 'var(--text-muted)' }}>
                  {badge.rarity}
                </span>
              </div>
              <h4 style={{ fontSize: '14px', marginBottom: '6px' }}>{badge.title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>{badge.description}</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                Locked
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/coming-soon', { state: { title: 'All Achievements', description: 'The full badge catalog will be browsable here.' } })}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            Show More Achievements
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--gold)' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px' }}>{value}</div>
      </div>
    </div>
  );
}
