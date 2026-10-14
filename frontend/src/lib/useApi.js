import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api';

// Loads GET /api{path}. Returns { data, error, loading, reload }.
// Pass null as the path to skip loading.
export function useApi(path) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: '' });
  const key = path ? `${path}#${reloadCount}` : null;

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    apiRequest(path)
      .then((data) => active && setState({ key, data, error: '' }))
      .catch((err) => active && setState({ key, data: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [key, path]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);
  const current = state.key === key;

  return {
    // Keep showing the previous data while a reload is in flight
    data: state.data,
    error: current ? state.error : '',
    loading: Boolean(path) && !current,
    reload,
  };
}

// Starts (or resumes) an assessment and returns its id.
export async function startAssessment(type, subjectSlug) {
  const result = await apiRequest('/assessments', { method: 'POST', body: { type, subjectSlug } });
  return result.assessmentId;
}
