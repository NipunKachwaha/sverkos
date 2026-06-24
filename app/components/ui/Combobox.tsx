import { useState, useRef, useEffect } from 'react';
import { classNames } from '../../utils/classNames';
import { CaretDownIcon, CheckIcon } from '@radix-ui/react-icons';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  // FIX: Added these props to match what the parent component is passing
  selectedOption?: string;
  setSelectedOption?: (value: string) => void;
  placeholder?: string;
  className?: string;
  [key: string]: any; // Catch-all for other extra props like 'searchPlaceholder', 'label', etc.
}

export function Combobox({ 
  options, 
  value, 
  onChange, 
  selectedOption, 
  setSelectedOption, 
  placeholder = 'Select an option...', 
  className,
  ...props 
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // FIX: Handle both 'value' and 'selectedOption' dynamically
  const activeValue = value !== undefined ? value : selectedOption;

  // Jo option select hua hai usko dhundhne ke liye
  const activeSelectedOption = options.find((opt) => opt.value === activeValue);

  // Search filter logic
  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );

  // Dropdown ke bahar click karne par usko close karne ka logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={classNames('relative w-full', className)}>
      <div
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md cursor-text dark:bg-gray-800 dark:border-gray-600 text-content-primary focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="w-full bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-500"
          placeholder={activeSelectedOption ? activeSelectedOption.label : placeholder}
          value={isOpen ? query : (activeSelectedOption ? activeSelectedOption.label : '')}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
        <CaretDownIcon 
          className={classNames("w-4 h-4 text-gray-500 transition-transform cursor-pointer", { "rotate-180": isOpen })} 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg max-h-60 dark:bg-gray-800 dark:border-gray-600 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-500">No options found.</li>
          ) : (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                className={classNames(
                  'relative flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-content-primary',
                  activeValue === option.value ? 'bg-blue-50 dark:bg-gray-700 font-medium' : ''
                )}
                onClick={() => {
                  // FIX: Safely call whichever function was passed without crashing
                  if (onChange) onChange(option.value);
                  if (setSelectedOption) setSelectedOption(option.value);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{option.label}</span>
                {activeValue === option.value && <CheckIcon className="w-4 h-4 text-blue-600" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}