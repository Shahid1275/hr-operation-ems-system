'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/utils';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<{
    id: string;
    name: string;
    slug: string;
    timezone: string;
    logoUrl?: string | null;
  } | null>(null);
  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.getCompanySettings(user.companyId).then((data) => setCompany(data));
  }, [user?.companyId]);

  const save = async () => {
    if (!user?.companyId || !company) return;
    try {
      await hrApi.updateCompanySettings(user.companyId, {
        name: company.name,
        timezone: company.timezone,
        logoUrl: company.logoUrl ?? undefined,
      });
      notify.success('Settings saved');
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    }
  };

  if (!company) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Company Branding and Settings</h1>
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <input className="w-full rounded border px-3 py-2 text-sm" value={company.name ?? ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Company name" />
        <input className="w-full rounded border px-3 py-2 text-sm" value={company.timezone ?? ''} onChange={(e) => setCompany({ ...company, timezone: e.target.value })} placeholder="Timezone" />
        <input className="w-full rounded border px-3 py-2 text-sm" value={company.logoUrl ?? ''} onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })} placeholder="Logo URL" />
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
}
