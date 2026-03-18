import CsvImporter from '@/components/admin/CsvImporter'

export default function ImportPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Import Questions from CSV</h1>
        <p className="text-gray-500 mt-1">Upload a CSV file to bulk-import questions into the question bank</p>
      </div>
      <CsvImporter />
    </div>
  )
}
