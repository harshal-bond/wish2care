import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi, API_URL } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { Download, FileSpreadsheet, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function ExportPage() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => fetchApi('/schools')
  });

  const schools = schoolsData?.data || [];

  const handleExport = async (schoolId?: number) => {
    setDownloading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(schoolId ? { schoolId } : {})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate export file.');
      }

      // Create blob link to download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Wish2Care_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
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
              disabled={downloading}
              className="w-full h-11 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {downloading ? (
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
                  disabled={downloading}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50 font-bold transition-all flex items-center justify-center gap-2"
                >
                  {downloading ? (
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
    </div>
  );
}
