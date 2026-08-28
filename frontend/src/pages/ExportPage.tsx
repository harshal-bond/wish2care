import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi, API_URL } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { Download, FileSpreadsheet, Loader2, Info, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

export function ExportPage() {
  const [downloading, setDownloading] = useState<'screening' | 'mh' | null>(null);
  const [error, setError] = useState('');

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => fetchApi('/schools')
  });

  const schools = schoolsData?.data || [];

  const downloadBlob = async (path: string, body: object, filename: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate export file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleExport = async (schoolId?: number) => {
    setDownloading('screening');
    setError('');
    try {
      await downloadBlob(
        '/export',
        schoolId ? { schoolId } : {},
        `Wish2Care_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleMhExport = async (schoolId?: number) => {
    setDownloading('mh');
    setError('');
    try {
      await downloadBlob(
        '/export/mental-health',
        schoolId ? { schoolId } : {},
        `Wish2Care_MH_Normalized_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Export Screenings</h1>
        <p className="text-gray-500 mt-1 text-sm">Download wellness screening data mapped directly into the target Excel templates.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Full Export Card */}
        <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-6 pb-4">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mt-4">Full Master Export</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <p className="text-sm text-gray-500 leading-relaxed">
              Export all student screening logs across all schools into a single compiled spreadsheet. 
              The spreadsheet automatically scales beyond 60 rows while preserving conditional styling and formulas.
            </p>
            <Button 
              onClick={() => handleExport()} 
              disabled={downloading !== null}
              className="w-full h-11 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {downloading === 'screening' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* School-specific Exports */}
        {schools.map((school: any, idx: number) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            key={school.id}
          >
            <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
              <CardHeader className="p-6 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl w-fit">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-4">{school.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Generate and download an Excel screening workbook filtered to show only students enrolled in {school.name}.
                </p>
                <Button 
                  onClick={() => handleExport(school.id)} 
                  disabled={downloading !== null}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50 font-bold transition-all flex items-center justify-center gap-2"
                >
                  {downloading === 'screening' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-gray-600" />
                      School Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Mental Health Export</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Reverse-codes negatively worded items for export only. In-app scores stay as the raw 1–5 sum.
            Formula: New Score = (5 + 1) − Original Score. Reverse items: Q4, Q8, Q18, Q22, Q29 (marked “(R)” in the file).
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-indigo-100 bg-white shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <div className="p-3 bg-indigo-50 rounded-xl w-fit">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mt-4">Normalized MH Scores</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <p className="text-sm text-gray-500 leading-relaxed">
                Latest mental health assessment per student, with reverse-coded item values and a normalized total
                (30–150). Original stored total is included as a separate column.
              </p>
              <Button
                onClick={() => handleMhExport()}
                disabled={downloading !== null}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {downloading === 'mh' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export All MH (Normalized)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {schools.map((school: any, idx: number) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              key={`mh-${school.id}`}
            >
              <Card className="border border-indigo-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full flex flex-col justify-between">
                <CardHeader className="p-6 pb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl w-fit">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mt-4">{school.name} — MH</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Normalized mental health export for students in {school.name}.
                  </p>
                  <Button
                    onClick={() => handleMhExport(school.id)}
                    disabled={downloading !== null}
                    variant="outline"
                    className="w-full h-11 rounded-xl border-indigo-200 hover:bg-indigo-50 font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {downloading === 'mh' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 text-indigo-600" />
                        School MH Export
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
