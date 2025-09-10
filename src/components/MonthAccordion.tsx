
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Entry } from '../services/api';
import EntryTable from './EntryTable';

interface MonthAccordionProps {
  month: string;
  entries: Entry[];
}

const MonthAccordion: React.FC<MonthAccordionProps> = ({ month, entries }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getMonthName = (monthNum: string) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNum) - 1] || month;
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
      >
        <div>
          <h4 className="text-lg font-semibold text-gray-800">
            {getMonthName(month)}
          </h4>
          <p className="text-sm text-gray-600">{entries.length} entries</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="border-t border-gray-200 animate-accordion-down">
          <EntryTable entries={entries} />
        </div>
      )}
    </div>
  );
};

export default MonthAccordion;
