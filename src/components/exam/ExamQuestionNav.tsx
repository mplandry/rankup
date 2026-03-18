import { cn } from '@/lib/utils/cn'

interface Props {
  total: number
  current: number
  answered: Set<number>
  flaggedIndexes: Set<number>
  onSelect: (index: number) => void
}

export default function ExamQuestionNav({ total, current, answered, flaggedIndexes, onSelect }: Props) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answered.has(i)
        const isFlagged = flaggedIndexes.has(i)
        const isCurrent = i === current

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            title={`Question ${i + 1}${isFlagged ? ' (flagged)' : ''}`}
            className={cn(
              'w-full aspect-square rounded text-xs font-medium transition-all',
              isCurrent && 'ring-2 ring-[#C0392B] ring-offset-1',
              isFlagged && 'bg-amber-400 text-white',
              !isFlagged && isAnswered && 'bg-green-500 text-white',
              !isFlagged && !isAnswered && 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
