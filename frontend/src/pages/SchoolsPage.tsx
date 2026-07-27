import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { fetchApi, API_URL } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import {
  Building2,
  Upload,
  Plus,
  Loader2,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { StudentUploadResult } from '@wish2care/shared';

function downloadStudentTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Student Code', 'Name', 'Age', 'Gender'],
    ['STU-0001', 'Priya Sharma', 12, 'F'],
    ['STU-0002', 'Arjun Patel', 13, 'M'],
  ]);
  worksheet['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 10 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, 'Wish2Care_Student_Upload_Template.xlsx');
}

export function SchoolsPage() {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [schoolName, setSchoolName] = useState('');
  const [uploadingSchoolId, setUploadingSchoolId] = useState<number | null>(null);
  const [uploadResults, setUploadResults] = useState<Record<number, StudentUploadResult & { message?: string }>>({});
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => fetchApi('/schools'),
  });

  const schools = data?.data || [];

  const createSchool = useMutation({
    mutationFn: (name: string) =>
      fetchApi('/schools', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      setSchoolName('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = schoolName.trim();
    if (!trimmed) {
      setFormError('School name is required');
      return;
    }
    createSchool.mutate(trimmed);
  };

  const handleUpload = async (schoolId: number, file: File) => {
    setUploadingSchoolId(schoolId);
    setUploadResults((prev) => {
      const next = { ...prev };
      delete next[schoolId];
      return next;
    });

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/schools/${schoolId}/students/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResults((prev) => ({
        ...prev,
        [schoolId]: {
          ...result.data,
          message: result.message,
        },
      }));

      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      setUploadResults((prev) => ({
        ...prev,
        [schoolId]: {
          imported: 0,
          skipped: 0,
          errors: [{ row: 0, message: err.message }],
          message: err.message,
        },
      }));
    } finally {
      setUploadingSchoolId(null);
      const input = fileInputRefs.current[schoolId];
      if (input) input.value = '';
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Schools</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Add schools and upload student lists from Excel for each school.
        </p>
      </div>

      <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-900 rounded-xl">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">Add a school</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleAddSchool} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="School name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="h-11 rounded-xl border-gray-200"
            />
            <Button
              type="submit"
              disabled={createSchool.isPending}
              className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold shrink-0"
            >
              {createSchool.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add school'
              )}
            </Button>
          </form>
          {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
        </CardContent>
      </Card>

      <Card className="border border-blue-100 bg-blue-50/40 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">Student upload template</p>
            <p className="text-sm text-gray-600">
              Excel columns: Student Code (optional), Name, Age, Gender (M/F).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={downloadStudentTemplate}
            className="h-11 rounded-xl border-blue-200 bg-white hover:bg-blue-50 font-semibold shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Download template
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Registered schools</h2>

        {schools.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl p-8 text-center text-gray-500 text-sm">
            No schools yet. Add your first school above.
          </Card>
        ) : (
          schools.map((school: any, idx: number) => {
            const result = uploadResults[school.id];
            const isUploading = uploadingSchoolId === school.id;

            return (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.04 }}
              >
                <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl shrink-0">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{school.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                            <Users className="h-3.5 w-3.5" />
                            {school.studentCount ?? 0} student{(school.studentCount ?? 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[school.id] = el;
                          }}
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(school.id, file);
                          }}
                        />
                        <Button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[school.id]?.click()}
                          className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload students
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {result && (
                      <div
                        className={`rounded-xl border p-4 text-sm ${
                          result.imported > 0
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                            : 'border-red-100 bg-red-50 text-red-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.imported > 0 ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-2">
                            <p className="font-semibold">{result.message}</p>
                            <p>
                              Imported: {result.imported}
                              {result.skipped > 0 ? ` · Skipped: ${result.skipped}` : ''}
                            </p>
                            {result.errors.length > 0 && (
                              <ul className="list-disc pl-5 space-y-1">
                                {result.errors.slice(0, 5).map((error, errorIdx) => (
                                  <li key={errorIdx}>
                                    {error.row > 0 ? `Row ${error.row}: ` : ''}
                                    {error.message}
                                  </li>
                                ))}
                                {result.errors.length > 5 && (
                                  <li>…and {result.errors.length - 5} more</li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Accepts .xlsx files with Student Code, Name, Age, Gender columns
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
