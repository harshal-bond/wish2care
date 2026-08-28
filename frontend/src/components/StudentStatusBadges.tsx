/** Renders screening + mental health status badges for student list cards. */
export function StudentStatusBadges({ status }: { status: any }) {
  const screeningComplete = status?.screeningComplete ?? status?.isComplete ?? false;
  const mentalComplete = status?.mentalAssessmentComplete ?? false;
  const domains = status?.completedDomains ?? 0;

  return (
    <div className="flex flex-col items-end gap-1">
      {screeningComplete ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Screening Complete
        </span>
      ) : domains > 0 ? (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          {domains}/8 In Progress
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
          Not Started
        </span>
      )}
      {screeningComplete && !mentalComplete && (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
          Mental Pending
        </span>
      )}
    </div>
  );
}

export function screeningStatusLabel(status: any): string {
  const screeningComplete = status?.screeningComplete ?? status?.isComplete ?? false;
  const domains = status?.completedDomains ?? 0;
  if (screeningComplete) return 'Screening Complete';
  if (domains > 0) return `${domains}/8 Sections Filled`;
  return 'Not Started';
}
