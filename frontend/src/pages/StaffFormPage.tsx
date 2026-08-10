import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, Button } from '../components/ui';
import { ChevronLeft, Loader2, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';

export function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const staffId = parseInt(id || '0', 10);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      <div className="text-center py-12 max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Staff not found</h3>
        <Button onClick={() => navigate('/staff')}>Go back to Staff</Button>
      </div>
    );
  }

  const markComplete = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await fetchApi(`/staff/${staffId}/assessment`, {
        method: 'PUT',
        body: JSON.stringify({
          assessmentComplete: true,
          payload: member.assessment?.payload || {},
        }),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff', staffId] }),
        queryClient.invalidateQueries({ queryKey: ['staff'] }),
      ]);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = member.assessment?.assessmentComplete === true;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/staff/${staffId}`)}
          className="rounded-xl border border-gray-100 bg-white"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
            {member.staffCode}
          </span>
          <h1 className="text-2xl font-bold text-gray-950 mt-1 leading-none">{member.name}</h1>
          <p className="text-xs text-gray-500 mt-1.5">Staff assessment</p>
        </div>
      </div>

      <Card className="border-gray-100 bg-white shadow-sm rounded-2xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Questionnaire coming soon</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              The staff screening instrument will be added here when it is ready. Demographics are
              already stored on the staff profile. Until then, this page tracks assessment status only.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-gray-700">No questions configured yet</p>
          <p className="text-xs text-gray-400">
            Drop in the staff questionnaire when available — routes and storage are ready.
          </p>
        </div>

        {saveError ? <p className="text-sm text-red-600 font-medium">{saveError}</p> : null}

        {isComplete ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Assessment marked complete
          </div>
        ) : (
          <Button
            onClick={() => void markComplete()}
            disabled={isSaving}
            className="w-full h-12 rounded-xl font-bold bg-gray-950 hover:bg-gray-800 text-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Mark assessment complete (placeholder)
          </Button>
        )}
      </Card>
    </div>
  );
}
