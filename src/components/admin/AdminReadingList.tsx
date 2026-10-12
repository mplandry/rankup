"use client";

import { useState } from "react";

type ExamTier = "lieutenant" | "captain";

// Source: MA HRD Civil Service reading list announcements published Oct 9, 2026.
// Exam date: April 12, 2027 (Statewide Fire Lieutenant and Statewide Fire Captain).

const BUILDING = {
  book: "Building Construction Related to the Fire Service",
  edition: "5th Edition (2026)",
  publisher: "IFSTA",
  borderColor: "border-l-green-500",
  expandBg: "bg-green-50 dark:bg-green-950/30",
  labelColor: "text-green-600 dark:text-green-400",
  icon: "🧱",
  warning: null,
};

const ERG = {
  book: "Emergency Response Guidebook",
  edition: "2024",
  publisher: "U.S. DOT / PHMSA",
  chapters: "Selected sections",
  chapterList: [
    "Hazard Classification System",
    "Introduction to the Tables of Markings, Labels and Placards",
    "Globally Harmonized Systems of Classification and Labeling of Chemicals (GHS)",
    "Hazard Identification Numbers Displayed on Some Intermodal Containers",
    "Pipeline Transportation – exclude pg. 27 (“U.S. Pipeline Resources” and “Canadian Pipeline Resources”)",
    "ERG2024 User’s Guide",
    "Protective Clothing",
    "Decontamination",
    "Fire and Spill Control",
    "Considerations for Lithium Battery and Electric Vehicle (EV) Fires",
    "BLEVE and Heat Induced Tear",
    "BLEVE – Safety Precautions",
    "Criminal or Terrorist Use of Chemical, Biological and Radiological Agents – exclude pg. 364–366 (“Biological Warfare Agents” up to end of section)",
  ],
  borderColor: "border-l-orange-500",
  expandBg: "bg-orange-50 dark:bg-orange-950/30",
  labelColor: "text-orange-600 dark:text-orange-400",
  icon: "⚠️",
  warning: null,
};

const COMPANY_OFFICERS = {
  book: "Fire and Emergency Services Company Officer",
  edition: "7th Edition (2025)",
  publisher: "IFSTA",
  borderColor: "border-l-red-500",
  expandBg: "bg-red-50 dark:bg-red-950/30",
  labelColor: "text-red-600 dark:text-red-400",
  icon: "🔥",
  warning: null,
};

const LT_READING_LIST = [
  {
    ...BUILDING,
    chapters: "Chapters 2–9, 11, 13",
    chapterList: [
      "Ch. 2 – exclude pg. 49–54 (“Fire Resistance” up to “Occupancy Classifications”)",
      "Ch. 3 – exclude pg. 71–74 (“Seismic Loads” up to “Soil Pressure Load”)",
      "Ch. 4",
      "Ch. 5 – exclude pg. 156–158 (“Fire Door Testing” up to “Fire Windows”) and pg. 162–165 (“Interior Finishes Tests” up to end of chapter)",
      "Ch. 6",
      "Ch. 7",
      "Ch. 8",
      "Ch. 9",
      "Ch. 11",
      "Ch. 13",
    ],
  },
  ERG,
  {
    ...COMPANY_OFFICERS,
    chapters: "Chapters 1, 3, 4, 5, 7, 8, 9, 11",
    chapterList: [
      "Ch. 1",
      "Ch. 3",
      "Ch. 4 – exclude pg. 89–90 (start of chapter up to “Expectations of New Personnel”), pg. 98–100 (“Promotions” up to “Employee Assistance Programs (EAP)”), pg. 109–110 (“Leave Benefits” up to “Conflict Management”), and pg. 113–122 (“Grievances” up to end of chapter)",
      "Ch. 5 – exclude pg. 137–151 (“Written Communication” up to “Communicating in Emergency Situations”)",
      "Ch. 7",
      "Ch. 8",
      "Ch. 9 – exclude pg. 259–278 (start of chapter up to “Fire Protection Systems”) and pg. 282–311 (“Fire Dynamics” up to end of chapter)",
      "Ch. 11 – exclude pg. 381–394 (“Property and Environmental Conservation” up to end of chapter)",
    ],
  },
  {
    book: "Structural Fire Fighting: Initial Response Strategy and Tactics",
    edition: "3rd Edition (2022)",
    publisher: "IFSTA",
    chapters: "Chapters 1, 2, 4, 5, 6",
    chapterList: [
      "Ch. 1",
      "Ch. 2 – exclude pg. 71–109 (start of chapter up to “Prefire Planning”)",
      "Ch. 4",
      "Ch. 5",
      "Ch. 6",
    ],
    borderColor: "border-l-blue-500",
    expandBg: "bg-blue-50 dark:bg-blue-950/30",
    labelColor: "text-blue-600 dark:text-blue-400",
    icon: "🏗️",
    warning: null,
  },
];

const CAPT_READING_LIST = [
  {
    ...BUILDING,
    chapters: "Chapters 2–11, 13",
    chapterList: [
      "Ch. 2 – exclude pg. 49–59 (“Fire Resistance” up to end of chapter)",
      "Ch. 3 – exclude pg. 71–75 (“Seismic Loads” up to “Structural Accommodations for Loads”)",
      "Ch. 4",
      "Ch. 5 – exclude pg. 155–158 (“Fire Door Maintenance” up to “Fire Windows”) and pg. 162–165 (“Interior Finishes Tests” up to end of chapter)",
      "Ch. 6",
      "Ch. 7",
      "Ch. 8",
      "Ch. 9",
      "Ch. 10 – exclude pg. 259–260 (“Quality Control of Concrete” up to “Fire Resistance of Concrete Construction”)",
      "Ch. 11",
      "Ch. 13",
    ],
  },
  ERG,
  {
    ...COMPANY_OFFICERS,
    chapters: "Chapters 3, 4, 5, 7, 8, 10, 11",
    chapterList: [
      "Ch. 3",
      "Ch. 4 – exclude pg. 89–90 (start of chapter up to “Expectations of New Personnel”), pg. 98–100 (“Promotions” up to “Employee Assistance Programs (EAP)”), pg. 109–110 (“Leave Benefits” up to “Conflict Management”), and pg. 113–122 (“Grievances” up to end of chapter)",
      "Ch. 5 – exclude pg. 143–144 (“Policies and Procedures” up to “Reports”), pg. 148–149 (“Virtual Conferencing Technology” up to “Social Media Content”), and pg. 153–156 (“Alternative Communications Methods and Technologies” up to “Radio Communications”); INCLUDE pg. 150 “Career-Ending Posts – Social Media” box",
      "Ch. 7",
      "Ch. 8",
      "Ch. 10 – exclude pg. 315–336 (start of chapter up to “Preincident Survey Process”) and pg. 347–353 (“Developing and Managing Preincident Plans” up to end of chapter)",
      "Ch. 11 – exclude pg. 381–394 (“Property and Environmental Conservation” up to end of chapter)",
    ],
  },
  {
    book: "Strategic and Tactical Considerations on the Fireground",
    edition: "4th Edition (2017)",
    publisher: "Pearson / James P. Smith",
    chapters: "Chapters 1, 3, 4, 6, 7, 8, 9",
    chapterList: [
      "Ch. 1 – exclude pg. 9–35 (“Training” up to end of chapter)",
      "Ch. 3",
      "Ch. 4",
      "Ch. 6",
      "Ch. 7 – exclude green “Considerations…” sections (cellar fires, garden apartments, row houses and town houses, renovated buildings, hotels and motels, vacant buildings, wildland urban interface fires)",
      "Ch. 8 – exclude pg. 336–346 (“Mass Casualty Incidents (MCIs)” up to “Houses of Worship”), pg. 359–367 (“Penal Institutions” up to “Public Assembly Buildings”), pg. 379–393 (“Schools and Other Active Shooter Incidents” up to end of chapter), and the green “Considerations…” sections (hospitals, nursing homes and assisted living, houses of worship, public assembly buildings, schools)",
      "Ch. 9 – exclude pg. 423–456 (“Lumberyards” up to end of chapter) and the green “Considerations…” sections (commercial buildings and warehouses, strip malls, enclosed malls, supermarkets)",
    ],
    borderColor: "border-l-purple-500",
    expandBg: "bg-purple-50 dark:bg-purple-950/30",
    labelColor: "text-purple-600 dark:text-purple-400",
    icon: "📘",
    warning: null,
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
          <h2 className="text-lg font-bold text-[#1B2A4A] dark:text-[#e2e8f0]">
            📋 MA Statewide 2027 Reading Lists
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Admin reference — official reading lists by rank</p>
        </div>
        <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 rounded-md px-3 py-1">
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
                : "bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {tier === "lieutenant" ? "🪖 Lieutenant" : "⭐ Captain"}
          </button>
        ))}
      </div>

      <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
        📅 MA Statewide {activeTab === "lieutenant" ? "Lieutenant" : "Captain"} Exam: April 12, 2027 · {list.length} source materials · lists published Oct 9, 2026
      </div>

      <div className="flex flex-col gap-3">
        {list.map((item, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 border-l-4 ${item.borderColor} rounded-xl overflow-hidden`}
          >
            <div
              onClick={() => setExpandedBook(expandedBook === i ? null : i)}
              className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                expandedBook === i ? item.expandBg : "hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-[#1B2A4A] dark:text-[#e2e8f0] text-sm">{item.book}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.edition} · {item.publisher} ·{" "}
                    <span className={`font-semibold ${item.labelColor}`}>{item.chapters}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.warning && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 rounded px-2 py-0.5 font-semibold hidden sm:inline">
                    ⚠️ Needs questions
                  </span>
                )}
                <span className="text-gray-400 dark:text-gray-500 text-sm">{expandedBook === i ? "▾" : "▸"}</span>
              </div>
            </div>

            {expandedBook === i && (
              <div className={`px-5 pb-4 ${item.expandBg} border-t border-gray-100 dark:border-gray-800`}>
                <div className={`text-xs font-bold uppercase tracking-wide ${item.labelColor} mt-3 mb-2`}>
                  Chapters / Sections Included
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {item.chapterList.map((ch, j) => (
                    <div key={j} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                      <span className={`${item.labelColor} mt-0.5 flex-shrink-0`}>›</span>
                      {ch}
                    </div>
                  ))}
                </div>
                {item.warning && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300 font-semibold">
                    ⚠️ {item.warning}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>
          📚 <strong>{list.length} source materials</strong> for {activeTab === "lieutenant" ? "Lieutenant" : "Captain"} exam
        </span>
        <span className="ml-auto">Click any book to expand chapter list</span>
      </div>
    </div>
  );
}
