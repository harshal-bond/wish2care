import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, Button } from '../components/ui';
import { ChevronLeft, Loader2, ClipboardList, User, Building2 } from 'lucide-react';

export function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const staffId = parseInt(id || '0', 10);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: () => fetchApi(`/staff/${staffId}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const member = data?.data;

  if (!member) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-gray-900">Staff not found</h3>
        <Button onClick={() => navigate('/staff')} className="mt-4">
          Go back to Staff
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/staff')}
            className="rounded-xl border border-gray-100 bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
              {member.staffCode}
            </span>
            <h1 className="text-2xl font-bold text-gray-950 mt-1 leading-none">{member.name}</h1>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              {member.age} yrs • {member.gender === 'M' ? 'Male' : 'Female'}
              {member.designation ? ` • ${member.designation}` : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/staff/${staffId}/assessment`)}
          className="rounded-xl font-semibold bg-gray-950 hover:bg-gray-800 text-white"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          {member.assessment ? 'Open Assessment' : 'Start Assessment'}
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-gray-100 bg-white shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">School / College</dt>
              <dd className="font-semibold text-gray-900 text-right flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                {member.school?.name || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Department</dt>
              <dd className="font-semibold text-gray-900">{member.department || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Designation</dt>
              <dd className="font-semibold text-gray-900">{member.designation || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-semibold text-gray-900">{member.email || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Mobile</dt>
              <dd className="font-semibold text-gray-900">{member.mobileNo || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="border-gray-100 bg-white shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Assessment</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Staff questionnaire content will be added when the instrument is finalized. You can open
            the placeholder assessment page to track status.
          </p>
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm">
            <span className="text-gray-500">Status: </span>
            <span className="font-semibold text-gray-900">
              {member._status?.isComplete || member.assessment?.assessmentComplete
                ? 'Complete'
                : 'Not started'}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
