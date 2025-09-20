
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Entry } from '../services/api';
import MonthAccordion from './MonthAccordion';

interface YearAccordionProps {
  year: string;
  monthsData: { [month: string]: Entry[] };
  onRefreshEntry?: (entryId: number) => void;
}

const YearAccordion: React.FC<YearAccordionProps> = ({ year, monthsData, onRefreshEntry }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sort months in descending order (December to January)
  const sortedMonths = Object.keys(monthsData).sort((a, b) => {
    const monthOrder = {
      'December': 12, 'November': 11, 'October': 10, 'September': 9,
      'August': 8, 'July': 7, 'June': 6, 'May': 5,
      'April': 4, 'March': 3, 'February': 2, 'January': 1
    };
    return (monthOrder[b as keyof typeof monthOrder] || parseInt(b)) - 
           (monthOrder[a as keyof typeof monthOrder] || parseInt(a));
  });

  const getTotalEntries = () => {
    return Object.values(monthsData).reduce((total, entries) => total + entries.length, 0);
  };

  return (
    <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 text-left bg-blue-50 hover:bg-blue-100 transition-colors flex justify-between items-center"
      >
        <div>
          <h3 className="text-2xl font-bold text-blue-900">{year}</h3>
          <p className="text-blue-700">{getTotalEntries()} total entries</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-6 w-6 text-blue-700" />
        ) : (
          <ChevronDown className="h-6 w-6 text-blue-700" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-6 bg-white animate-accordion-down">
          {sortedMonths.map((month) => (
            <MonthAccordion 
              key={month} 
              month={month} 
              entries={monthsData[month]}
              onRefreshEntry={onRefreshEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default YearAccordion;
