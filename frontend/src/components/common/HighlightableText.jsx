import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HIGHLIGHT_COLORS, buildSegments, locateHighlights } from '../../lib/useHighlights';
import '../../styles/highlights.css';

const SELECTION_DELAY_MS = 150;

// Text that can carry saved highlights. Renders plain text and <mark> runs, so
// positions in the DOM match positions in `text`.
export default function HighlightableText({ text, submissionId, target, highlights = [], style }) {
  const segments = useMemo(() => {
    const own = highlights.filter((h) => h.submissionId === submissionId && h.target === target);
    return buildSegments(text, locateHighlights(text, own));
  }, [text, highlights, submissionId, target]);

  return (
    <p data-highlight-target={target} data-highlight-submission={submissionId} style={style}>
      {segments.map(({ start, end, highlight }) =>
        highlight ? (
          <mark
            key={`${start}-${highlight.id}`}
            className={`bb-highlight bb-highlight-${highlight.color}`}
            data-highlight-id={highlight.id}
            tabIndex={0}
            aria-label={`${highlight.color} highlight. Press Enter to edit.`}
          >
            {text.slice(start, end)}
          </mark>
        ) : (
          <span key={start}>{text.slice(start, end)}</span>
        )
      )}
    </p>
  );
}

// Character positions of a range inside its block, without surrounding spaces
function rangeOffsets(block, range) {
  const measure = range.cloneRange();
  measure.selectNodeContents(block);
  measure.setEnd(range.startContainer, range.startOffset);
  let start = measure.toString().length;
  let end = start + range.toString().length;

  const text = block.textContent;
  while (start < end && /\s/.test(text[start])) start += 1;
  while (end > start && /\s/.test(text[end - 1])) end -= 1;
  return { start, end, text };
}

const blockOf = (node) => (node?.nodeType === 1 ? node : node?.parentElement)?.closest('[data-highlight-target]') ?? null;

// One per page: shows the color picker over selected text, or over a clicked
// highlight to change or remove it. A selection has to stay inside one block.
export function HighlightToolbar({ highlights, onAdd, onRecolor, onRemove }) {
  const [active, setActive] = useState(null); // { kind: 'selection', range, block } | { kind: 'mark', id, element }
  const [position, setPosition] = useState(null);
  const toolbarRef = useRef(null);
  const draggingRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const readSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setActive((a) => (a?.kind === 'selection' ? null : a));
        return;
      }
      const range = selection.getRangeAt(0);
      const block = blockOf(range.startContainer);
      if (!block || block !== blockOf(range.endContainer) || !range.toString().trim()) {
        setActive((a) => (a?.kind === 'selection' ? null : a));
        return;
      }
      setActive({ kind: 'selection', range: range.cloneRange(), block });
    };

    const onSelectionChange = () => {
      clearTimeout(timerRef.current);
      if (!draggingRef.current) timerRef.current = setTimeout(readSelection, SELECTION_DELAY_MS);
    };
    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse') draggingRef.current = true;
    };
    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      onSelectionChange();
    };

    const openMark = (element) => {
      setActive({ kind: 'mark', id: element.dataset.highlightId, element });
    };
    const onClick = (e) => {
      if (toolbarRef.current?.contains(e.target)) return;
      const element = e.target.closest?.('[data-highlight-id]');
      if (element && window.getSelection()?.isCollapsed && !element.dataset.highlightId.startsWith('temp-')) openMark(element);
      else setActive((a) => (a?.kind === 'mark' ? null : a));
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'Enter' && e.target.dataset?.highlightId && !e.target.dataset.highlightId.startsWith('temp-')) openMark(e.target);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Keep the toolbar above its text while the page scrolls
  useEffect(() => {
    if (!active) return undefined;
    const place = () => {
      const anchor = active.kind === 'selection' ? active.range : active.element;
      if (active.kind === 'mark' && !anchor.isConnected) {
        setActive(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const height = toolbarRef.current?.offsetHeight ?? 40;
      const top = rect.top - height - 8;
      setPosition({
        top: top < 8 ? rect.bottom + 8 : top,
        left: Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2)),
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [active]);

  if (!active || !position) return null;

  const current = active.kind === 'mark' ? highlights.find((h) => h.id === active.id) : null;

  const pick = (color) => {
    if (active.kind === 'selection') {
      const { start, end, text } = rangeOffsets(active.block, active.range);
      if (end > start) {
        onAdd({
          submissionId: active.block.dataset.highlightSubmission,
          target: active.block.dataset.highlightTarget,
          start,
          end,
          color,
          text,
        });
      }
      window.getSelection()?.removeAllRanges();
    } else if (current && current.color !== color) {
      onRecolor(active.id, color);
    }
    setActive(null);
  };

  return createPortal(
    <div
      ref={toolbarRef}
      className="bb-highlight-toolbar no-print"
      role="toolbar"
      aria-label="Highlight"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          className={`bb-highlight-swatch bb-highlight-swatch-${c.key}${current?.color === c.key ? ' is-on' : ''}`}
          onClick={() => pick(c.key)}
          aria-label={`${c.label} highlight`}
          aria-pressed={current ? current.color === c.key : undefined}
          title={c.label}
        />
      ))}
      {active.kind === 'mark' && (
        <button
          type="button"
          className="bb-highlight-remove"
          onClick={() => {
            onRemove(active.id);
            setActive(null);
          }}
          aria-label="Remove highlight"
          title="Remove highlight"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      )}
    </div>,
    document.body
  );
}
