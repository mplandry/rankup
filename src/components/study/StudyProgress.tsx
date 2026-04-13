interface Props {
  current: number;
  total: number;
}

export default function StudyProgress({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between text-sm text-gray-500 mb-2'>
        <span>
          Question {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
        <div
          className='h-full bg-[#C0392B] rounded-full transition-all duration-300'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
