"use client";

import { useState } from "react";

type ExamTier = "lieutenant" | "captain";

const LT_READING_LIST = [
  {
    book: "Fire & Emergency Services Company Officer",
    edition: "6th Edition",
    publisher: "IFSTA",
    chapters: "Chapters 1–10",
    chapterList: [
      "Ch. 1 – Leadership",
      "Ch. 2 – Supervision",
      "Ch. 3 – Interpersonal Communications",
      "Ch. 4 – Administrative Functions",
      "Ch. 5 – Organizational Structure",
      "Ch. 6 – Fire Department Communications",
      "Ch. 7 – Human Resource Management I",
      "Ch. 8 – Human Resource Management II",
      "Ch. 9 – Community and Government Relations",
      "Ch. 10 – Health and Safety",
    ],
    borderColor: "border-l-red-500",
    expandBg: "bg-red-50",
    labelColor: "text-red-600",
    icon: "🔥",
    warning: null,
  },
  {
    book: "Fire Officer's Handbook of Tactics",
    edition: "5th Edition",
    publisher: "PennWell / Moran",
    chapters: "Chapters 1–12",
    chapterList: [
      "Ch. 1 – Command Overview",
      "Ch. 2 – Building Construction",
      "Ch. 3 – Pre-fire Planning",
      "Ch. 4 – Engine Company Operations",
      "Ch. 5 – Ladder Company Operations",
      "Ch. 6 – Private Dwellings",
      "Ch. 7 – Multiple Dwellings",
      "Ch. 8 – Taxpayers & Row Frames",
      "Ch. 9 – Garden Apartments",
      "Ch. 10 – High-Rise Operations",
      "Ch. 11 – Commercial Buildings",
      "Ch. 12 – Industrial Occupancies",
    ],
    borderColor: "border-l-blue-500",
    expandBg: "bg-blue-50",
    labelColor: "text-blue-600",
    icon: "🏗️",
    warning: null,
  },
  {
    book: "Building Construction Related to the Fire Service",
    edition: "4th Edition",
    publisher: "IFSTA",
    chapters: "Chapters 2–11",
    chapterList: [
      "Ch. 2 – Principles of Construction",
      "Ch. 3 – Wood Construction",
      "Ch. 4 – Ordinary Construction",
      "Ch. 5 – Heavy Timber Construction",
      "Ch. 6 – Non-Combustible Construction",
      "Ch. 7 – Fire-Resistive Construction",
      "Ch. 8 – Roof Coverings & Structural Elements",
      "Ch. 9 – Doors & Windows",
      "Ch. 10 – Renovations & Additions",
      "Ch. 11 – High-Rise Buildings",
    ],
    borderColor: "border-l-green-500",
    expandBg: "bg-green-50",
    labelColor: "text-green-600",
    icon: "🧱",
    warning: null,
  },
];

const CAPT_READING_LIST = [
  {
    book: "Building Construction Related to the Fire Service",
    edition: "4th Edition",
    publisher: "IFSTA",
    chapters: "Chapters 2–11",
    chapterList: [
      "Ch. 2 – Principles of Construction",
      "Ch. 3 – Wood Construction",
      "Ch. 4 – Ordinary Construction",
      "Ch. 5 – Heavy Timber Construction",
      "Ch. 6 – Non-Combustible Construction",
      "Ch. 7 – Fire-Resistive Construction",
      "Ch. 8 – Roof Coverings & Structural Elements",
      "Ch. 9 – Doors & Windows",
      "Ch. 10 – Renovations & Additions",
      "Ch. 11 – High-Rise Buildings",
    ],
    borderColor: "border-l-green-500",
    expandBg: "bg-green-50",
    labelColor: "text-green-600",
    icon: "🧱",
    warning: null,
  },
  {
    book: "Fire Officer: Principles & Practice",
    edition: "5th Edition (2025)",
    publisher: "Jones & Bartlett / Ward",
    chapters: "All Chapters",
    chapterList: ["Full book — all chapters included"],
    borderColor: "border-l-purple-500",
    expandBg: "bg-purple-50",
    labelColor: "text-purple-600",
    icon: "📘",
    warning: "Not yet in app — questions need to be generated",
  },
  {
    book: "Fire Officer's Handbook of Tactics",
    edition: "5th Edition",
    publisher: "PennWell / Moran",
    chapters: "Chapters 2–23",
    chapterList: [
      "Ch. 2 – Building Construction",
      "Ch. 3 – Pre-fire Planning",
      "Ch. 4 – Engine Company Operations",
      "Ch. 5 – Ladder Company Operations",
      "Ch. 6 – Private Dwellings",
      "Ch. 7 – Multiple Dwellings",
      "Ch. 8 – Taxpayers & Row Frames",
      "Ch. 9 – Garden Apartments",
      "Ch. 10 – High-Rise Operations",
      "Ch. 11 – Commercial Buildings",
      "Ch. 12 – Industrial Occupancies",
      "Ch. 13 – Churches",
      "Ch. 14 – Lumberyards & Piers",
      "Ch. 15 – Cellar & Subway Fires",
      "Ch. 16 – Firefighter Safety",
      "Ch. 17 – Emergency Medical Operations",
      "Ch. 18 – Hazardous Materials",
      "Ch. 19 – Collapse Operations",
      "Ch. 20 – Water Supply",
      "Ch. 21 – Rural Firefighting",
      "Ch. 22 – Wildland–Urban Interface",
      "Ch. 23 – Special Problems",
    ],
    borderColor: "border-l-blue-500",
    expandBg: "bg-blue-50",
    labelColor: "text-blue-600",
    icon: "🏗️",
    warning: null,
  },
  {
    book: "Massachusetts General Laws — Chapter 148",
    edition: "Current Statute",
    publisher: "Commonwealth of Massachusetts",
    chapters: "§§ 3, 5, 26, 26A–H, 27A",
    chapterList: [
      "§ 3 – Powers of the State Fire Marshal",
      "§ 5 – Duties of Local Fire Departments",
      "§ 26 – Sprinkler Requirements (General)",
      "§ 26A – New High-Rise Buildings",
      "§ 26B – Existing High-Rise Buildings",
      "§ 26C – Hotels & Motels",
      "§ 26D – Board & Care Facilities",
      "§ 26E – Lodging Houses",
      "§ 26F – Dwelling Houses",
      "§ 26G – Dormitories",
      "§ 26H – Day Care Centers",
      "§ 27A – Carbon Monoxide Detectors",
    ],
    borderColor: "border-l-orange-500",
    expandBg: "bg-orange-50",
    labelColor: "text-orange-600",
    icon: "⚖️",
    warning: "Statute questions — not yet in app question bank",
  },
];

export default function AdminReadingList() {
  const [activeTab, setActiveTab] = useState<ExamTier>("lieutenant");
  const [expandedBook, setExpandedBook] = useState<number | null>(null);

  const list = activeTab === "lieutenant" ? LT_READING_LIST : CAPT_READING_LIST;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B2A4A]">
            📋 MA Promotional Exam Reading Lists
          </h2>
          <p className="text-sm text-gray-500">Admin reference — official reading lists by rank</p>
        </div>
        <span className="text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md px-3 py-1">
          🔒 Admin Only
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {(["lieutenant", "captain"] as ExamTier[]).map((tier) => (
          <button
            key={tier}
            onClick={() => { setActiveTab(tier); setExpandedBook(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tier
                ? "bg-[#1B2A4A] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {tier === "lieutenant" ? "🪖 Lieutenant" : "⭐ Captain"}
          </button>
        ))}
      </div>

      {activeTab === "captain" && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2.5 text-sm text-yellow-800 font-semibold">
          📅 MA Statewide Captain Exam: April 7, 2026 · 4 source materials (including 1 statute)
        </div>
      )}

      <div className="flex flex-col gap-3">
        {list.map((item, i) => (
          <div
            key={i}
            className={`bg-white border border-gray-200 border-l-4 ${item.borderColor} rounded-xl overflow-hidden`}
          >
            <div
              onClick={() => setExpandedBook(expandedBook === i ? null : i)}
              className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                expandedBook === i ? item.expandBg : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-[#1B2A4A] text-sm">{item.book}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.edition} · {item.publisher} ·{" "}
                    <span className={`font-semibold ${item.labelColor}`}>{item.chapters}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.warning && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-0.5 font-semibold hidden sm:inline">
                    ⚠️ Needs questions
                  </span>
                )}
                <span className="text-gray-400 text-sm">{expandedBook === i ? "▾" : "▸"}</span>
              </div>
            </div>

            {expandedBook === i && (
              <div className={`px-5 pb-4 ${item.expandBg} border-t border-gray-100`}>
                <div className={`text-xs font-bold uppercase tracking-wide ${item.labelColor} mt-3 mb-2`}>
                  Chapters / Sections Included
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {item.chapterList.map((ch, j) => (
                    <div key={j} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className={`${item.labelColor} mt-0.5 flex-shrink-0`}>›</span>
                      {ch}
                    </div>
                  ))}
                </div>
                {item.warning && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 text-xs text-yellow-800 font-semibold">
                    ⚠️ {item.warning}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          📚 <strong>{list.length} source materials</strong> for {activeTab === "lieutenant" ? "Lieutenant" : "Captain"} exam
        </span>
        {activeTab === "captain" && (
          <span className="text-yellow-700 font-semibold">
            ⚠️ 2 sources not yet in question bank
          </span>
        )}
        <span className="ml-auto">Click any book to expand chapter list</span>
      </div>
    </div>
  );
}
