import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileText, MapPin, ShieldCheck } from 'lucide-react';
import { brgApi, getCurrentUser } from '../services/brgApi';
import type { ApiUser } from '../services/brgApi';

const reportTypes = [
  'Flooding',
  'Cyclone or severe weather damage',
  'Earthquake damage',
  'Fire or industrial incident',
  'Landslide or road blockage',
  'Medical assistance needed',
  'People stranded',
  'Other emergency',
];

type CitizenReport = { id: string; reference: string; reportType: string; location: string; status: string; createdAt: string };

export const CitizenPortalPage = () => {
  const location = useLocation();
  const { data: user, error: authError, isLoading: authLoading } = useSWR<ApiUser>('brg-current-user', getCurrentUser, { shouldRetryOnError: false });
  const { data: reports, mutate: refreshReports } = useSWR<CitizenReport[]>(user ? 'citizen-reports-mine' : null, () => brgApi.getMyCitizenReports(), { shouldRetryOnError: false });
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<CitizenReport | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.emailVerified) {
      setError('Verify the email address on your Neon Auth account before submitting a report.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await brgApi.submitCitizenReport({
        report_type: reportType,
        description: description.trim(),
        location_text: locationText.trim(),
        state: state.trim() || undefined,
        district: district.trim() || undefined,
      });
      const confirmation: CitizenReport = {
        id: result.id,
        reference: result.reference,
        reportType,
        location: locationText.trim(),
        status: result.status,
        createdAt: result.createdAt,
      };
      setSubmitted(confirmation);
      setDescription('');
      setLocationText('');
      setState('');
      setDistrict('');
      await refreshReports();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The report could not be saved. Please retry when the service is available.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <main className="mx-auto max-w-3xl p-6 text-sm text-slate-400" role="status">Checking secure citizen access…</main>;
  }

  if (authError || !user) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><ShieldCheck size={15} /> Bharat Response Grid</div>
          <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Citizen response portal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Submit a report only after signing in with a verified account. Reports are stored in the operational database and are not treated as verified incidents until reviewed by an authorized officer.</p>
        </header>
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5" role="note">
          <div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 text-amber-300" /><div><h2 className="font-semibold text-amber-100">For immediate danger, call 112</h2><p className="mt-1 text-sm text-amber-200/80">This reporting portal is not an emergency dispatch service and may be unavailable during an incident.</p></div></div>
        </section>
        <Link to="/login" state={{ from: { pathname: location.pathname } }} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300">Sign in to submit a report <ArrowRight size={16} /></Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><ShieldCheck size={15} /> Verified citizen access</div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Submit a community report</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Your submission is timestamped and routed for review. It does not automatically create or confirm an incident.</p>
        </div>
        <div className="text-sm text-slate-400">Signed in as <span className="text-slate-200">{user.name}</span></div>
      </header>

      {!user.emailVerified && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200" role="alert">
          Your email is not verified. Verify it through Neon Auth before submitting reports; this portal does not accept unverified submissions.
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          {submitted && (
            <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4" role="status">
              <div className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 text-emerald-300" /><div><p className="font-semibold text-emerald-100">Report recorded</p><p className="mt-1 text-sm text-emerald-200/80">Reference: <span className="font-mono">{submitted.reference}</span> · Current status: {submitted.status}</p></div></div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-slate-300">Report category
              <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-sky-400" required>
                {reportTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-300">What happened?
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={2000} rows={5} required className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400" placeholder="Describe what you observed, when it happened, and any immediate safety concerns." />
              <span className="mt-1 block text-right text-xs text-slate-500">{description.length}/2000</span>
            </label>
            <label className="block text-sm text-slate-300">Location description
              <input value={locationText} onChange={(event) => setLocationText(event.target.value)} maxLength={240} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400" placeholder="Landmark, street, village, or nearest known place" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">State or union territory
                <input value={state} onChange={(event) => setState(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
              </label>
              <label className="block text-sm text-slate-300">District
                <input value={district} onChange={(event) => setDistrict(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
              </label>
            </div>
            {error && <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-200" role="alert">{error}</p>}
            <button type="submit" disabled={submitting || !user.emailVerified} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
              <FileText size={16} /> {submitting ? 'Saving report…' : 'Submit for review'}
            </button>
            <p className="text-xs leading-5 text-slate-500">Text and location fields only. Image uploads are not enabled in this deployment. Do not include sensitive personal information.</p>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h2 className="font-semibold text-rose-100">Immediate emergency?</h2>
            <p className="mt-2 text-sm leading-5 text-rose-200/80">Call the national emergency number. Do not wait for a portal response.</p>
            <a href="tel:112" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/30 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/10">Call 112 <ArrowRight size={15} /></a>
          </section>
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2"><Clock3 size={15} className="text-sky-300" /><h2 className="font-semibold text-slate-100">Your recent reports</h2></div>
            {reports?.length ? <ul className="mt-4 space-y-3">{reports.map((report) => <li key={report.id} className="border-t border-slate-800 pt-3"><p className="font-mono text-xs text-sky-300">{report.reference}</p><p className="mt-1 text-sm text-slate-200">{report.reportType}</p><p className="mt-1 text-xs text-slate-500">{report.location} · {report.status}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{reports ? 'No reports recorded for this account.' : 'Report history is unavailable while the API is offline.'}</p>}
          </section>
        </aside>
      </div>
    </main>
  );
};
