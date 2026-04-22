'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hrApi } from '@/lib/hrApi';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/utils';
import { notify } from '@/lib/notify';

type Item = Record<string, unknown>;

export default function AdminDocumentsPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Item[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState('contract');
  const load = async () => {
    if (!user?.companyId) return;
    try {
      setDocuments(await hrApi.listDocuments(user.companyId));
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!user?.companyId) return;
    void hrApi.listDocuments(user.companyId).then((data) => setDocuments(data as Item[]));
  }, [user?.companyId]);

  const onUpload = async (file: File | null) => {
    if (!file || !user?.companyId || !employeeId) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('employeeId', employeeId);
    fd.append('companyId', user.companyId);
    fd.append('category', category);
    try {
      await hrApi.uploadDocument(fd);
      notify.success('Uploaded successfully');
      await load();
    } catch (e) {
      notify.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Secure Document Management</h1>
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input type="file" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Uploaded Documents</h2>
        {documents.map((d, idx) => (
          <div key={String(d.id ?? idx)} className="text-sm border rounded-lg p-2 mb-2">
            {String(d.fileName ?? '-')} | {String(d.category ?? '-')} | {String(d.mimeType ?? '-')}
            <a className="ml-2 text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${String(d.storagePath ?? '')}`} target="_blank">open</a>
          </div>
        ))}
      </div>
      <Button onClick={load} variant="outline">Refresh</Button>
    </div>
  );
}
