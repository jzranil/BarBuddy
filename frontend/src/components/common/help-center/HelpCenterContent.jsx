import { useMemo, useState } from 'react';
import HelpArticle from './HelpArticle';
import { getHelpCategoriesForRole, searchHelpCategories } from '../../../data/helpCenter';

// Shared across the reviewee, lawyer, and superadmin Help Center pages —
// only the surrounding layout (PortalLayout / LawyerLayout /
// SuperAdminLayout) and breadcrumb differ per portal, so all the
// content/search/filtering logic lives here once.
export default function HelpCenterContent({ role }) {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => getHelpCategoriesForRole(role), [role]);
  const visibleCategories = useMemo(() => searchHelpCategories(categories, searchTerm), [categories, searchTerm]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Help Center</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '620px' }}>
        Find guides, explanations, and answers to common questions about using BarBuddy for your Philippine Bar
        Examination review.
      </p>

      <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '22px' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}>
          search
        </span>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search the Help Center..."
          style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '999px', border: '1px solid var(--card-border)', fontSize: '13px' }}
        />
      </div>

      {!searchTerm && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '10px',
            marginBottom: '22px',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollTo(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--navy)',
                background: '#fff',
                border: '1px solid var(--card-border)',
                borderRadius: '999px',
                padding: '7px 14px',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--gold)' }}>{cat.icon}</span>
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {visibleCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 22px', background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>search_off</span>
          <h4 style={{ fontSize: '15px', margin: '10px 0 4px' }}>No results</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Nothing matched "{searchTerm}". Try a different search term.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {visibleCategories.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px', scrollMarginTop: '85px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: cat.note ? '4px' : '10px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '20px' }}>{cat.icon}</span>
                <h3 style={{ fontSize: '16px', margin: 0 }}>{cat.title}</h3>
              </div>
              {cat.note && <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 10px' }}>{cat.note}</p>}

              <div>
                {cat.articles.map((a) => (
                  <HelpArticle key={a.id} id={a.id} question={a.question} content={a.content} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
