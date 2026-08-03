import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HealthRecord, HealthRecordPartial, Student } from '@wish2care/shared';
import { countCompletedDomains, isRecordComplete } from '@wish2care/shared';
import { HEALTH_RECORD_SAVE_MUTATION_KEY, saveHealthRecordMutationFn } from '../../lib/queryClient';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };
type StudentWithStatus = Student & { _status: { completedDomains: number; isComplete: boolean } };

function deriveStatus(record: Partial<HealthRecord> | null) {
  return {
    completedDomains: record ? countCompletedDomains(record) : 0,
    isComplete: record ? isRecordComplete(record) : false,
  };
}

export function useSaveHealthRecord(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...HEALTH_RECORD_SAVE_MUTATION_KEY, studentId],
    mutationFn: saveHealthRecordMutationFn,
    onMutate: async ({ payload }: { studentId: number; payload: HealthRecordPartial }) => {
      await queryClient.cancelQueries({ queryKey: ['students', studentId] });

      const previousDetail = queryClient.getQueryData<StudentWithRecord | null>(['students', studentId]);
      const previousList = queryClient.getQueryData<StudentWithStatus[]>(['students']);

      const mergedRecord = { ...(previousDetail?.healthRecord ?? {}), ...payload } as HealthRecord;

      if (previousDetail) {
        queryClient.setQueryData(['students', studentId], { ...previousDetail, healthRecord: mergedRecord });
      }

      if (previousList) {
        queryClient.setQueryData(
          ['students'],
          previousList.map((item) => (item.id === studentId ? { ...item, _status: deriveStatus(mergedRecord) } : item))
        );
      }

      return { previousDetail, previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(['students', studentId], context.previousDetail);
      }
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(['students'], context.previousList);
      }
    },
    onSuccess: (res: { data?: HealthRecord } | null) => {
      const record = res?.data;
      if (!record) return;

      queryClient.setQueryData(['students', studentId], (prev: StudentWithRecord | null | undefined) =>
        prev ? { ...prev, healthRecord: record } : prev
      );
      queryClient.setQueryData(['students'], (prev: StudentWithStatus[] | undefined) =>
        prev?.map((item) => (item.id === studentId ? { ...item, _status: deriveStatus(record) } : item))
      );
    },
  });
}
