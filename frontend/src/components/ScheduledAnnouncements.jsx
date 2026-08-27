import { useEffect, useState } from 'react';
import { Bell, Edit3, Plus, Power, Trash2, X } from 'lucide-react';
import {
  createScheduledAnnouncement,
  deleteScheduledAnnouncement,
  getScheduledAnnouncements,
  toggleScheduledAnnouncement,
  updateScheduledAnnouncement,
} from '../services/api';
import './ScheduledAnnouncements.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_PRESETS = [{ label: 'Morning', value: '08:00' }, { label: 'Afternoon', value: '13:00' }, { label: 'Evening', value: '18:00' }];
const emptyForm = { title: '', message: '', frequency: 'once', scheduledAtLocal: '', time: '08:00', weekday: '1', weekdays: [], enabled: true };

const formatDate = (value) => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(value)) : 'Not scheduled';
const toNairobiInput = (value) => {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(value)).reduce((result, part) => { if (part.type !== 'literal') result[part.type] = part.value; return result; }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
};
const scheduleText = (item) => {
  if (item.frequency === 'once') return `Once: ${formatDate(item.scheduledAt)}`;
  if (item.frequency === 'daily') return `Every day at ${item.time} (EAT)`;
  if (item.frequency === 'weekday') return `${DAYS[item.weekday]} at ${item.time} (EAT)`;
  return `${(item.weekdays || []).map((day) => DAYS[day]).join(', ')} at ${item.time} (EAT)`;
};

const ScheduledAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const result = await getScheduledAnnouncements();
      setAnnouncements(result.announcements || []);
    } catch (err) { setError(err.response?.data?.message || 'Unable to load scheduled announcements.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(emptyForm); setEditingId(null); setError(''); };
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleDay = (day) => setForm((prev) => ({ ...prev, weekdays: prev.weekdays.includes(day) ? prev.weekdays.filter((value) => value !== day) : [...prev.weekdays, day].sort() }));

  const edit = (item) => {
    setEditingId(item._id);
    setForm({ title: item.title, message: item.message, frequency: item.frequency, scheduledAtLocal: toNairobiInput(item.scheduledAt), time: item.time, weekday: String(item.weekday ?? 1), weekdays: item.weekdays || [], enabled: item.enabled });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (!form.title.trim() || !form.message.trim()) return setError('Title and message are required.');
    if (form.frequency === 'once' && !editingId && !form.scheduledAtLocal) return setError('Choose a date and time for a one-time announcement.');
    if (form.frequency === 'custom' && form.weekdays.length === 0) return setError('Select at least one day for a custom schedule.');
    try {
      setSaving(true);
      const payload = { ...form, title: form.title.trim(), message: form.message.trim() };
      if (editingId && !payload.scheduledAtLocal) delete payload.scheduledAtLocal;
      const wasEditing = Boolean(editingId);
      if (wasEditing) await updateScheduledAnnouncement(editingId, payload);
      else await createScheduledAnnouncement(payload);
      reset(); setNotice(wasEditing ? 'Announcement updated.' : 'Announcement scheduled.'); await load();
    } catch (err) { setError(err.response?.data?.message || 'Unable to save announcement.'); }
    finally { setSaving(false); }
  };

  const toggle = async (id) => {
    try { await toggleScheduledAnnouncement(id); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to change announcement status.'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this scheduled announcement?')) return;
    try { await deleteScheduledAnnouncement(id); setNotice('Announcement deleted.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete announcement.'); }
  };

  return (
    <section className="scheduled-announcements">
      <div className="scheduled-heading"><div><h2><Bell size={19} /> Scheduled Announcements</h2><p>Server-delivered to all registered users in Africa/Nairobi time.</p></div>{editingId && <button type="button" className="scheduled-muted-btn" onClick={reset}><X size={15} /> Cancel edit</button>}</div>
      {(error || notice) && <div className={error ? 'scheduled-alert error' : 'scheduled-alert success'}>{error || notice}</div>}
      <form className="scheduled-form" onSubmit={submit}>
        <div className="scheduled-form-grid">
          <label>Title<input value={form.title} maxLength={100} onChange={(e) => setField('title', e.target.value)} placeholder="Announcement title" /></label>
          <label>Exact time (East Africa)<input type="time" value={form.time} onChange={(e) => setField('time', e.target.value)} /><span className="scheduled-presets">{TIME_PRESETS.map((preset) => <button type="button" key={preset.value} onClick={() => setField('time', preset.value)}>{preset.label}</button>)}</span></label>
          <label className="scheduled-wide">Message<textarea value={form.message} maxLength={500} rows={3} onChange={(e) => setField('message', e.target.value)} placeholder="Write the message users should receive" /></label>
          <label>Frequency<select value={form.frequency} onChange={(e) => setField('frequency', e.target.value)}><option value="once">Once</option><option value="daily">Every day</option><option value="weekday">Specific day</option><option value="custom">Custom days</option></select></label>
          {form.frequency === 'once' && <label>Date and time (EAT)<input type="datetime-local" value={form.scheduledAtLocal} onChange={(e) => setField('scheduledAtLocal', e.target.value)} /></label>}
          {form.frequency === 'weekday' && <label>Day<select value={form.weekday} onChange={(e) => setField('weekday', e.target.value)}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>}
          <label className="scheduled-enabled"><input type="checkbox" checked={form.enabled} onChange={(e) => setField('enabled', e.target.checked)} /> Active</label>
        </div>
        {form.frequency === 'custom' && <div className="scheduled-days">{DAYS.slice(1).concat(DAYS[0]).map((day) => { const index = DAYS.indexOf(day); return <label key={day}><input type="checkbox" checked={form.weekdays.includes(index)} onChange={() => toggleDay(index)} /> {day.slice(0, 3)}</label>; })}</div>}
        <button type="submit" className="scheduled-primary-btn" disabled={saving}><Plus size={16} /> {saving ? 'Saving...' : editingId ? 'Update announcement' : 'Schedule announcement'}</button>
      </form>

      <div className="scheduled-list"><div className="scheduled-list-heading"><h3>Existing announcements</h3><span>{announcements.length} total</span></div>
        {loading ? <p className="scheduled-empty">Loading announcements...</p> : announcements.length === 0 ? <p className="scheduled-empty">No scheduled announcements yet.</p> : <div className="scheduled-table-wrap"><table><thead><tr><th>Announcement</th><th>Schedule</th><th>Next send</th><th>Last sent</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>{announcements.map((item) => <tr key={item._id}><td><strong>{item.title}</strong><span>{item.message}</span></td><td>{scheduleText(item)}</td><td>{formatDate(item.nextRunAt)}</td><td>{formatDate(item.lastSentAt)}</td><td>{formatDate(item.createdAt)}</td><td><span className={`scheduled-status ${item.enabled ? 'active' : 'disabled'}`}>{item.enabled ? 'Active' : 'Disabled'}</span></td><td><div className="scheduled-actions"><button title="Edit" onClick={() => edit(item)}><Edit3 size={15} /></button><button title={item.enabled ? 'Disable' : 'Enable'} onClick={() => toggle(item._id)}><Power size={15} /></button><button title="Delete" onClick={() => remove(item._id)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
      </div>
    </section>
  );
};

export default ScheduledAnnouncements;
