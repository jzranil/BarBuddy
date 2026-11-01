import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from './api';
import { toastError } from './swal';

export const HIGHLIGHT_COLORS = [
  { key: 'yellow', label: 'Yellow' },
  { key: 'green', label: 'Green' },
  { key: 'pink', label: 'Pink' },
];

// Places saved highlights in the text. Question and suggested answers can be
// edited later, so a highlight whose text moved is found again by its quote and
// one whose text is gone is left out (the saved record stays).
export function locateHighlights(text, highlights) {
  return highlights.flatMap((h) => {
    if (text.slice(h.start, h.end) === h.quote) return [h];
    const start = text.indexOf(h.quote);
    return start === -1 ? [] : [{ ...h, start, end: start + h.quote.length }];
  });
}

// Splits text into plain and highlighted runs. Where highlights overlap the
// newest shows on top, which is the last one in the list.
export function buildSegments(text, highlights) {
  const edges = [...new Set([0, text.length, ...highlights.flatMap((h) => [h.start, h.end])])]
    .filter((n) => n >= 0 && n <= text.length)
    .sort((a, b) => a - b);

  const segments = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const [start, end] = [edges[i], edges[i + 1]];
    const highlight = highlights.findLast((h) => h.start <= start && h.end >= end) ?? null;
    const last = segments[segments.length - 1];
    if (last && last.highlight?.id === highlight?.id) last.end = end;
    else segments.push({ start, end, highlight });
  }
  return segments;
}

// Loads and saves the reviewee's highlights for one assessment. The screen
// updates first; a failed save puts it back. `enabled` is false when highlights
// can't be loaded, such as for staff viewing someone else's results.
export function useHighlights(assessmentId) {
  const [highlights, setHighlights] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const tempId = useRef(0);

  useEffect(() => {
    let active = true;
    apiRequest(`/assessments/${assessmentId}/highlights`)
      .then((r) => {
        if (!active) return;
        setHighlights(r.highlights);
        setEnabled(true);
      })
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, [assessmentId]);

  const add = useCallback(
    async ({ submissionId, target, start, end, color, text }) => {
      // Touching or overlapping highlights of the same color become one
      const located = locateHighlights(text, highlights.filter((h) => h.submissionId === submissionId && h.target === target));
      const merged = located.filter((h) => h.color === color && h.start <= end && h.end >= start);
      const from = Math.min(start, ...merged.map((h) => h.start));
      const to = Math.max(end, ...merged.map((h) => h.end));
      const replaces = merged.map((h) => h.id);
      const draft = { id: `temp-${(tempId.current += 1)}`, submissionId, target, start: from, end: to, quote: text.slice(from, to), color };

      const previous = highlights;
      setHighlights([...highlights.filter((h) => !replaces.includes(h.id)), draft]);
      try {
        const { highlight } = await apiRequest(`/assessments/${assessmentId}/highlights`, {
          method: 'POST',
          body: { submissionId, target, start: from, end: to, quote: draft.quote, color, replaces },
        });
        setHighlights((list) => list.map((h) => (h.id === draft.id ? highlight : h)));
      } catch (err) {
        setHighlights(previous);
        toastError(err.message);
      }
    },
    [assessmentId, highlights]
  );

  const recolor = useCallback(
    async (id, color) => {
      const previous = highlights;
      setHighlights(highlights.map((h) => (h.id === id ? { ...h, color } : h)));
      try {
        await apiRequest(`/assessments/${assessmentId}/highlights/${id}`, { method: 'PATCH', body: { color } });
      } catch (err) {
        setHighlights(previous);
        toastError(err.message);
      }
    },
    [assessmentId, highlights]
  );

  const remove = useCallback(
    async (id) => {
      const previous = highlights;
      setHighlights(highlights.filter((h) => h.id !== id));
      try {
        await apiRequest(`/assessments/${assessmentId}/highlights/${id}`, { method: 'DELETE' });
      } catch (err) {
        setHighlights(previous);
        toastError(err.message);
      }
    },
    [assessmentId, highlights]
  );

  return { highlights, enabled, add, recolor, remove };
}
