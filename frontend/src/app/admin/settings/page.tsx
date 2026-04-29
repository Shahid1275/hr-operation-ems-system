'use client';

import { useEffect, useState } from 'react';
import {
  Lock, Globe, Building2, Image, Save,
  ChevronRight, Shield, Bell, Palette,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/utils';

type Company = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logoUrl?: string | null;
};

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney',
];

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving]   = useState(false);
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwVisible, setPwVis] = useState(false);
  const [activeSection, setActiveSection] = useState<'company' | 'security' | 'notifications' | 'appearance'>('company');

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.getCompanySettings(user.companyId).then((d) => setCompany(d as Company));
  }, [user?.companyId]);

  const save = async () => {
    if (!user?.companyId || !company) return;
    setSaving(true);
    try {
      await hrApi.updateCompanySettings(user.companyId, {
        name: company.name,
        timezone: company.timezone,
        logoUrl: company.logoUrl ?? undefined,
      });
      notify.success('Settings saved successfully');
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'company',       label: 'Company',       icon: Building2, desc: 'Branding and organisation details' },
    { id: 'security',      label: 'Security',       icon: Lock,     desc: 'Password and access management' },
    { id: 'notifications', label: 'Notifications', icon: Bell,     desc: 'Email and push preferences' },
    { id: 'appearance',    label: 'Appearance',     icon: Palette,  desc: 'Theme and display options' },
  ] as const;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {sections.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-slate-100 last:border-0 transition-colors ${
                  activeSection === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  activeSection === id ? 'bg-indigo-100' : 'bg-slate-100'
                }`}>
                  <Icon className={`h-4 w-4 ${activeSection === id ? 'text-indigo-600' : 'text-slate-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-tight ${activeSection === id ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${activeSection === id ? 'text-indigo-400' : 'text-slate-300'}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 space-y-5">

          {/* Company Settings */}
          {activeSection === 'company' && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Company Branding</h2>
                <p className="text-sm text-slate-400 mt-0.5">Update your organisation name, logo and timezone</p>
              </div>
              {!company ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-7 w-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={company.name ?? ''}
                          onChange={(e) => setCompany({ ...company, name: e.target.value })}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Timezone
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          value={company.timezone ?? 'UTC'}
                          onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                          className="w-full h-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition cursor-pointer"
                        >
                          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Logo URL
                    </label>
                    <div className="relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={company.logoUrl ?? ''}
                        onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    {company.logoUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={company.logoUrl} alt="Logo preview" className="h-10 w-10 rounded-lg object-contain border border-slate-200" />
                        <span className="text-xs text-slate-400">Logo preview</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={save} isLoading={saving} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800">Password</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Update your account password</p>
                </div>
                <div className="p-6 space-y-4">
                  {(['current', 'next', 'confirm'] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={pwVisible ? 'text' : 'password'}
                          value={pwForm[field]}
                          onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 transition"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                      <input type="checkbox" className="rounded" checked={pwVisible} onChange={(e) => setPwVis(e.target.checked)} />
                      Show passwords
                    </label>
                    <Button size="sm" className="gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800">Two-Factor Authentication</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Add an extra layer of security</p>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Shield className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Authenticator App</p>
                      <p className="text-xs text-slate-400">Not configured</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Set up</Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Notification Preferences</h2>
                <p className="text-sm text-slate-400 mt-0.5">Control when and how you receive notifications</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Leave Requests',     desc: 'When employees submit new leave requests', enabled: true  },
                  { label: 'Payroll Alerts',      desc: 'Payroll cycle deadlines and processing',   enabled: true  },
                  { label: 'Attendance Alerts',   desc: 'Unusual attendance patterns detected',      enabled: false },
                  { label: 'System Updates',      desc: 'Important system and security updates',     enabled: true  },
                  { label: 'Weekly Summary',      desc: 'Weekly HR metrics digest via email',        enabled: false },
                ].map(({ label, desc, enabled }) => (
                  <div key={label} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={enabled} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-400 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Appearance</h2>
                <p className="text-sm text-slate-400 mt-0.5">Customise the look and feel</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Theme</p>
                  <div className="flex gap-3">
                    {[
                      { label: 'Light',  bg: 'bg-white border-slate-300',  active: true  },
                      { label: 'Dark',   bg: 'bg-slate-900 border-slate-700', active: false },
                      { label: 'System', bg: 'bg-gradient-to-r from-white to-slate-900 border-slate-300', active: false },
                    ].map(({ label, bg, active }) => (
                      <button key={label} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${active ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}`}>
                        <div className={`h-10 w-16 rounded-lg border ${bg}`} />
                        <span className={`text-xs font-semibold ${active ? 'text-indigo-600' : 'text-slate-500'}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Accent Colour</p>
                  <div className="flex gap-2">
                    {['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((c) => (
                      <button key={c} className={`h-7 w-7 rounded-full ${c} ring-2 ring-offset-2 ${c === 'bg-indigo-500' ? 'ring-indigo-500' : 'ring-transparent hover:ring-slate-300'} transition-all`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
