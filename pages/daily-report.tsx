import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import React from 'react';
import { useSharedDate } from '@/lib/useSharedDate';

interface DailyLotteryReport {
  _id?: string;
  date: string;
  onlineNetSalesSR50?: number;
  onlineNetSales2SR50?: number;
  totalOnlineNetSales?: number;
  onlineCashingSR50?: number;
  onlineCashing2SR50?: number;
  totalOnlineCashing?: number;
  instantCashingSR34?: number;
  instantCashing2SR34?: number;
  totalInstantCashing?: number;
  instantSaleSR34?: number;
  debitCreditCard?: number;
  creditsSale?: number;
  debitsSale?: number;
  vendingCash?: number;
  onlineBalance?: number;
  instantBalance?: number;
  totalBalance?: number;
  registerCash?: number;
  overShort?: number;
  notes?: string;
}

const helpContent: Record<string, { title: string; instruction: string; imageUrl?: string }> = {
  onlineNetSalesSR50: {
    title: 'Online Net Sales (SR50)',
    instruction: 'Find this value on your lottery terminal report. Look for "NET SALES" in the Online section (SR50). This is the total sales minus any cancellations or free bets.',
    imageUrl: '/help-images/online-net-sales.png',
  },
  onlineCashingSR50: {
    title: 'Online Cashing (SR50)',
    instruction: 'On your lottery terminal report, locate the "CASHES" or "CASHING" section for Online (SR50). Enter the total number of cashes multiplied by the cash amount, or the total cash value shown.',
    imageUrl: '/help-images/online-cashing.png',
  },
  instantCashingSR34: {
    title: 'Instant Cashing (SR34)',
    instruction: 'Find the "CASHES" or "CASHING" section for Instant tickets (SR34) on your terminal report. Enter the total cash value for instant ticket cashes.',
    imageUrl: '/help-images/instant-cashing.png',
  },
  instantSaleSR34: {
    title: 'Yesterday Instant Sale (SR34)',
    instruction: 'Locate the "INSTANT SALE" or "INSTANT SALES" section on your terminal report for SR34. This shows the total sales value for instant/scratch-off tickets.',
    imageUrl: '/help-images/instant-sale.png',
  },
  onlineNetSales2SR50: {
    title: 'Online Net Sales (SR50) - Register 2',
    instruction: 'Find this value on your second lottery terminal report. Look for "NET SALES" in the Online section (SR50) for Register 2.',
    imageUrl: '/help-images/online-net-sales.png',
  },
  onlineCashing2SR50: {
    title: 'Online Cashing (SR50) - Register 2',
    instruction: 'On your second lottery terminal report, locate the "CASHES" or "CASHING" section for Online (SR50) for Register 2.',
    imageUrl: '/help-images/online-cashing.png',
  },
  instantCashing2SR34: {
    title: 'Instant Cashing (SR34) - Register 2',
    instruction: 'Find the "CASHES" or "CASHING" section for Instant tickets (SR34) on your second terminal report (Register 2).',
    imageUrl: '/help-images/instant-cashing.png',
  },
};

const InputField = React.memo(({ label, field, value, showHelp = true, onHelpClick, onChange, onBlur }: { 
  label: string; 
  field: keyof DailyLotteryReport; 
  value: number; 
  showHelp?: boolean;
  onHelpClick: (field: string) => void;
  onChange: (field: keyof DailyLotteryReport, value: string) => void;
  onBlur?: () => void;
}) => {
  const hasHelp = helpContent[field as string];
  const labelWithoutQuestion = label.replace(' ?', '');
  
  return (
    <div className="mb-3">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        <span>{labelWithoutQuestion}</span>
        {showHelp && hasHelp && (
          <button
            type="button"
            onClick={() => onHelpClick(field as string)}
            className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-600 active:bg-blue-700"
            aria-label="Get help"
          >
            ?
          </button>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 text-lg">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value === 0 ? '' : value.toString()}
          onChange={(e) => {
            // Only allow numbers and decimal point
            const inputValue = e.target.value.replace(/[^0-9.]/g, '');
            // Ensure only one decimal point
            const parts = inputValue.split('.');
            const filteredValue = parts.length > 2 
              ? parts[0] + '.' + parts.slice(1).join('')
              : inputValue;
            onChange(field, filteredValue);
          }}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !(e.ctrlKey || e.metaKey)) {
              e.preventDefault();
            }
          }}
          className="w-full pl-8 p-2 border border-gray-300 rounded-lg text-lg text-gray-900"
          placeholder="0.00"
        />
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useSharedDate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch by only rendering date after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState<DailyLotteryReport>({
    date: format(new Date(), 'yyyy-MM-dd'),
    onlineNetSalesSR50: 0,
    onlineNetSales2SR50: 0,
    totalOnlineNetSales: 0,
    onlineCashingSR50: 0,
    onlineCashing2SR50: 0,
    totalOnlineCashing: 0,
    instantCashingSR34: 0,
    instantCashing2SR34: 0,
    totalInstantCashing: 0,
    instantSaleSR34: 0,
    debitCreditCard: 0,
    creditsSale: 0,
    debitsSale: 0,
    vendingCash: 0,
    onlineBalance: 0,
    instantBalance: 0,
    totalBalance: 0,
    registerCash: 0,
    overShort: 0,
  });

  useEffect(() => {
    fetchReport();
    fetchInstantSale();
  }, [selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/lottery-report?date=${dateStr}`);
      const data = await response.json();
      if (data.success && data.report) {
        setFormData((prev) => ({
          ...data.report,
          date: format(new Date(data.report.date), 'yyyy-MM-dd'),
          instantSaleSR34: prev.instantSaleSR34 || data.report.instantSaleSR34 || 0, // Preserve instant sale from tickets
        }));
      } else {
        // Reset to defaults for new date
        setFormData({
          date: dateStr,
          onlineNetSalesSR50: 0,
          onlineNetSales2SR50: 0,
          totalOnlineNetSales: 0,
          onlineCashingSR50: 0,
          onlineCashing2SR50: 0,
          totalOnlineCashing: 0,
          instantCashingSR34: 0,
          instantCashing2SR34: 0,
          totalInstantCashing: 0,
          instantSaleSR34: 0,
          debitCreditCard: 0,
          creditsSale: 0,
          debitsSale: 0,
          vendingCash: 0,
          onlineBalance: 0,
          instantBalance: 0,
          totalBalance: 0,
          registerCash: 0,
          overShort: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstantSale = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/tickets/instant-sale?date=${dateStr}`);
      const data = await response.json();
      if (data.success) {
        setFormData((prev) => {
          const instantSale = data.totalInstantSale || 0;
          // Recalculate Instant Balance when Instant Sale is updated
          const instantBalance = instantSale - (prev.totalInstantCashing || 0);
          // Recalculate Total Balance
          const totalBalance = (prev.onlineBalance || 0) + instantBalance;
          // Recalculate Over/Short
          const overShort = totalBalance - (prev.registerCash || 0);
          
          return {
            ...prev,
            instantSaleSR34: instantSale,
            instantBalance,
            totalBalance,
            overShort,
          };
        });
      }
    } catch (error) {
      console.error('Error fetching instant sale:', error);
    }
  };

  const handleInputChange = (field: keyof DailyLotteryReport, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => {
      const updated = { ...prev, [field]: numValue };

      // Auto-calculate totals
      if (field === 'onlineNetSalesSR50' || field === 'onlineNetSales2SR50') {
        updated.totalOnlineNetSales = (updated.onlineNetSalesSR50 || 0) + (updated.onlineNetSales2SR50 || 0);
      }
      if (field === 'onlineCashingSR50' || field === 'onlineCashing2SR50') {
        updated.totalOnlineCashing = (updated.onlineCashingSR50 || 0) + (updated.onlineCashing2SR50 || 0);
      }
      if (field === 'instantCashingSR34' || field === 'instantCashing2SR34') {
        updated.totalInstantCashing = (updated.instantCashingSR34 || 0) + (updated.instantCashing2SR34 || 0);
      }
      
      // Auto-calculate Instant Balance: Instant Sale (SR34) - Total Instant Cashing
      // Note: instantSaleSR34 comes from scanned tickets, so we recalculate when instant cashing changes
      if (field === 'instantCashingSR34' || field === 'instantCashing2SR34') {
        updated.instantBalance = (updated.instantSaleSR34 || 0) - (updated.totalInstantCashing || 0);
      }
      
      // Auto-calculate Online Balance: Total Online Net Sales - Total Online Cashing
      if (field === 'onlineNetSalesSR50' || field === 'onlineNetSales2SR50' || field === 'onlineCashingSR50' || field === 'onlineCashing2SR50') {
        updated.onlineBalance = (updated.totalOnlineNetSales || 0) - (updated.totalOnlineCashing || 0);
      }
      
      // Auto-calculate Total Balance: Instant Balance + Online Balance
      if (field === 'instantSaleSR34' || field === 'instantCashingSR34' || field === 'instantCashing2SR34' || field === 'onlineNetSalesSR50' || field === 'onlineNetSales2SR50' || field === 'onlineCashingSR50' || field === 'onlineCashing2SR50') {
        updated.totalBalance = (updated.onlineBalance || 0) + (updated.instantBalance || 0);
      }
      
      // Recalculate over/short whenever total balance or register cash changes
      if (field === 'instantSaleSR34' || field === 'instantCashingSR34' || field === 'instantCashing2SR34' || field === 'registerCash' || field === 'onlineNetSalesSR50' || field === 'onlineNetSales2SR50' || field === 'onlineCashingSR50' || field === 'onlineCashing2SR50') {
        const totalBal = (updated.onlineBalance || 0) + (updated.instantBalance || 0);
        const regCash = field === 'registerCash' ? numValue : (updated.registerCash || 0);
        updated.totalBalance = totalBal;
        updated.overShort = totalBal - regCash;
      }

      return updated;
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date string manually to avoid timezone issues
    // Split "YYYY-MM-DD" and create date in local timezone
    const dateStr = e.target.value;
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const newDate = new Date(year, month - 1, day); // month is 0-indexed
      setSelectedDate(newDate);
    }
  };

  const handleDateClick = () => {
    if (calendarRef.current) {
      calendarRef.current.focus();
      // Try to show picker if available (modern browsers)
      if (typeof calendarRef.current.showPicker === 'function') {
        calendarRef.current.showPicker();
      } else {
        // Fallback: click the input directly
        calendarRef.current.click();
      }
    }
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/lottery-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: format(selectedDate, 'yyyy-MM-dd'),
          createdBy: 'user', // Replace with actual user
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        console.error('Failed to save report:', data.error);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReport();
  };


  const ReadOnlyField = ({ label, value, highlightColor }: { label: string; value: number; highlightColor?: 'positive' | 'negative' }) => {
    const getInputStyles = () => {
      if (highlightColor === 'positive') {
        return 'w-full pl-8 p-2 border border-green-300 rounded-lg text-lg bg-green-50 text-green-800';
      } else if (highlightColor === 'negative') {
        return 'w-full pl-8 p-2 border border-red-300 rounded-lg text-lg bg-red-50 text-red-800';
      }
      return 'w-full pl-8 p-2 border border-gray-300 rounded-lg text-lg bg-gray-100 text-gray-800';
    };

    const getDollarSignColor = () => {
      if (highlightColor === 'positive') {
        return 'text-green-700';
      } else if (highlightColor === 'negative') {
        return 'text-red-700';
      }
      return 'text-gray-700';
    };

    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
          <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-lg ${getDollarSignColor()}`}>$</span>
          <input
            type="text"
            value={value.toFixed(2)}
            readOnly
            className={getInputStyles()}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white shadow-md" style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 1rem)`, paddingBottom: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logos.png" 
              alt="QuickRepp Logo" 
              width={70} 
              height={70}
              className="rounded-lg"
            />
          </div>
          <div className="text-right relative">
            <h1 className="text-2xl font-bold">Daily Lottery Report</h1>
            <div className="relative inline-block mt-1">
              <button
                onClick={handleDateClick}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p className="text-base text-white font-bold">
                  {mounted ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Loading...'}
                </p>
              </button>
              <input
                ref={calendarRef}
                type="date"
                value={mounted ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ width: '100%', height: '100%' }}
                aria-label="Select date"
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Register 1 Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-4 rounded">
              <h2 className="text-xl font-bold text-blue-800">Lottery Register 1</h2>
            </div>
            
            <InputField label="Online Net Sales (SR50) ?" field="onlineNetSalesSR50" value={formData.onlineNetSalesSR50 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
            <InputField label="Online Cashing (SR50) ?" field="onlineCashingSR50" value={formData.onlineCashingSR50 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
            <InputField label="Instant Cashing (SR34) ?" field="instantCashingSR34" value={formData.instantCashingSR34 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
          </div>

          {/* Register 2 Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="bg-green-100 border-l-4 border-green-500 p-3 mb-4 rounded">
              <h2 className="text-xl font-bold text-green-800">Lottery Register 2</h2>
            </div>
            
            <InputField label="Online Net Sales (SR50) ?" field="onlineNetSales2SR50" value={formData.onlineNetSales2SR50 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
            <InputField label="Online Cashing (SR50) ?" field="onlineCashing2SR50" value={formData.onlineCashing2SR50 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
            <InputField label="Instant Cashing (SR34) ?" field="instantCashing2SR34" value={formData.instantCashing2SR34 || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="bg-purple-100 border-l-4 border-purple-500 p-3 mb-4 rounded">
            <h2 className="text-xl font-bold text-purple-800">Total Lottery Register</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <ReadOnlyField label="Total Online Net Sales" value={formData.totalOnlineNetSales || 0} />
            <ReadOnlyField label="Total Online Cashing" value={formData.totalOnlineCashing || 0} />
            <ReadOnlyField label="Total Instant Cashing" value={formData.totalInstantCashing || 0} />
          </div>
          <ReadOnlyField label="Yesterday Instant Sale (SR34)" value={formData.instantSaleSR34 || 0} />
        </div>

        {/* Today Cash Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="bg-purple-100 border-l-4 border-purple-500 p-3 mb-4 rounded">
            <h2 className="text-xl font-bold text-purple-800">Today Cash</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputField label="Total EBT Sale" field="debitCreditCard" value={formData.debitCreditCard || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
              <InputField label="Total Credit Card Sale" field="creditsSale" value={formData.creditsSale || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
              <InputField label="Total Debit Card Sale" field="debitsSale" value={formData.debitsSale || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
              <InputField label="Register Cash" field="registerCash" value={formData.registerCash || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} />
              {/* <InputField label="Vending Cash" field="vendingCash" value={formData.vendingCash || 0} onHelpClick={setHelpField} onChange={handleInputChange} onBlur={saveReport} /> */}
            </div>
            <div>
              <ReadOnlyField label="Lottery Online Balance" value={formData.onlineBalance || 0} />
              <ReadOnlyField label="Lottery Instant Balance" value={formData.instantBalance || 0} />
              <ReadOnlyField label="LotteryTotal Balance" value={formData.totalBalance || 0} />
              <ReadOnlyField 
                label="Over/Short" 
                value={formData.overShort || 0}
                highlightColor={(formData.overShort || 0) > 0 ? 'positive' : (formData.overShort || 0) < 0 ? 'negative' : undefined}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className={`w-full mt-4 p-4 rounded-lg text-white font-semibold text-lg ${
            success
              ? 'bg-green-500'
              : saving || loading
              ? 'bg-gray-400'
              : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          {success ? '✓ Report Saved!' : saving ? 'Saving...' : loading ? 'Loading...' : 'Save Report'}
        </button>
      </form>

      {/* Help Modal */}
      {helpField && helpContent[helpField] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setHelpField(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-bold">{helpContent[helpField].title}</h3>
              <button
                onClick={() => setHelpField(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
                aria-label="Close help"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{helpContent[helpField].instruction}</p>
              </div>
              {helpContent[helpField].imageUrl && (
                <div className="mb-4 border border-gray-300 rounded-lg p-2 bg-gray-50">
                  <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-gray-500 text-sm text-center px-4">
                      Image placeholder: {helpContent[helpField].imageUrl}
                      <br />
                      <span className="text-xs">Add your help image here</span>
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setHelpField(null)}
                className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold active:bg-blue-600"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

