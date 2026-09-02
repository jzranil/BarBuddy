import { useRef, useState } from 'react';
import SettingsSectionCard from '../../common/settings/SettingsSectionCard';
import SaveBar from '../../common/settings/SaveBar';
import FormField from '../../common/FormField';
import Button from '../../Button';
import { getZeroedRegistrationDetails, BAR_APPLICATION_TYPES } from '../../../data/settings';

// BACKEND TODO: swap for a real fetch once GET /api/reviewee/registration exists.
const INITIAL_DETAILS = getZeroedRegistrationDetails();

export default function AccountProfileSection() {
  const [form, setForm] = useState(INITIAL_DETAILS);
  const [saved, setSaved] = useState(false);

  // Profile photo — client-side only preview. BACKEND TODO: upload to S3 /
  // Cognito profile picture once auth + storage exist.
  const [photoUrl, setPhotoUrl] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(INITIAL_DETAILS);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // BACKEND TODO: PUT /api/reviewee/registration with `form`.
    setSaved(true);
  };

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmPhoto = () => {
    // BACKEND TODO: upload the selected file and store the returned URL
    // instead of the local data URL.
    setPhotoUrl(pendingPhoto);
    setPendingPhoto(null);
  };

  const cancelPhoto = () => setPendingPhoto(null);

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase() || 'AC';

  return (
    <SettingsSectionCard
      id="account-profile"
      icon="account_circle"
      title="Account & Profile"
      description="Manage your personal and registration information."
    >
      {/* Profile photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', marginBottom: '26px' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: photoUrl ? `url(${photoUrl}) center/cover` : 'var(--bg)',
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy)',
            fontWeight: 700,
            fontSize: '24px',
            flexShrink: 0,
          }}
        >
          {!photoUrl && initials}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Profile Photo</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG or PNG, at least 200x200px.</span>
          <div style={{ marginTop: '6px' }}>
            <Button variant="outline" icon="photo_camera" onClick={() => fileInputRef.current?.click()}>
              Change Photo
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
        </div>
      </div>

      {pendingPhoto && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            background: 'var(--bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: `url(${pendingPhoto}) center/cover`,
              border: '1px solid var(--card-border)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>New photo selected</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Preview above — confirm to update your profile photo.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={cancelPhoto}>Cancel</Button>
            <Button variant="navy" onClick={confirmPhoto}>Save Photo</Button>
          </div>
        </div>
      )}

      {/* Personal information */}
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Personal Information
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4px 20px' }}>
        <FormField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
        <FormField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
        <FormField label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} required />
        <FormField label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="09XXXXXXXXX" />
      </div>

      {/* Registration information */}
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '14px 0 12px' }}>
        Registration Information
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4px 20px' }}>
        <FormField label="Law School" name="lawSchool" value={form.lawSchool} onChange={handleChange} placeholder="e.g. University of the Philippines" />
        <FormField label="Bar Application" type="select" name="barApplication" value={form.barApplication} onChange={handleChange} options={BAR_APPLICATION_TYPES} />
      </div>

      <SaveBar dirty={dirty} saved={saved} onSave={handleSave} />
    </SettingsSectionCard>
  );
}
