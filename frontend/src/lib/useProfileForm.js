import { useEffect, useState } from 'react';
import { apiRequest } from './api';
import { normalizeContactNumber, validateContactNumber, validateName } from './validation';

// Account & Profile settings (paper Table 3.1 "Account management: allows
// users to update account information"). Loads GET /api/user/profile into the
// existing form shape and saves name/contact changes with PATCH.
// Email is the Supabase login and is shown read-only.
export function useProfileForm(defaults) {
  const [form, setForm] = useState(defaults);
  const [baseline, setBaseline] = useState(defaults);
  const [extra, setExtra] = useState({ address: '', birthdate: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/user/profile')
      .then((p) => {
        if (!active) return;
        const loaded = { ...defaults, firstName: p.firstName, lastName: p.lastName, email: p.email, contactNumber: p.contactNumber };
        setForm(loaded);
        setBaseline(loaded);
        setExtra({ address: p.address, birthdate: p.birthdate });
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
    // Load once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setError('');
    const problem =
      validateName(form.firstName || '', 'First name') ||
      validateName(form.lastName || '', 'Last name') ||
      (form.contactNumber ? validateContactNumber(form.contactNumber) : '');
    if (problem) {
      setError(problem);
      return false;
    }
    try {
      await apiRequest('/user/profile', {
        method: 'PATCH',
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          contactNumber: form.contactNumber ? normalizeContactNumber(form.contactNumber) : '',
          address: extra.address,
          birthdate: extra.birthdate,
        },
      });
      const next = { ...form, email: baseline.email };
      setForm(next);
      setBaseline(next);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    form,
    setForm,
    dirty: JSON.stringify({ ...form, email: baseline.email }) !== JSON.stringify(baseline),
    error,
    save,
  };
}
