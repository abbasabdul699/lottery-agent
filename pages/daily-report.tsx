import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';

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

export default function DailyReportPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [helpField, setHelpField] = useState<string | null>(null);
  const calendarRef = useRef<HTMLInputElement>(null);

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
  }, [selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/lottery-report?date=${dateStr}`);
      const data = await response.json();
      if (data.success && data.report) {
        setFormData({
          ...data.report,
          date: format(new Date(data.report.date), 'yyyy-MM-dd'),
        });
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
      
      // Recalculate total balance whenever online or instant balance changes
      if (field === 'onlineBalance' || field === 'instantBalance') {
        updated.totalBalance = (updated.onlineBalance || 0) + (updated.instantBalance || 0);
      }
      
      // Recalculate over/short whenever total balance or register cash changes
      if (field === 'onlineBalance' || field === 'instantBalance' || field === 'totalBalance' || field === 'registerCash') {
        const totalBal = field === 'totalBalance' ? numValue : (updated.onlineBalance || 0) + (updated.instantBalance || 0);
        const regCash = field === 'registerCash' ? numValue : (updated.registerCash || 0);
        updated.totalBalance = totalBal;
        updated.overShort = totalBal - regCash;
      }

      return updated;
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const handleDateClick = () => {
    setTimeout(() => {
      if (calendarRef.current) {
        // Position the input near the button for better mobile calendar positioning
        const button = document.querySelector('[data-date-button]') as HTMLElement;
        if (button) {
          const rect = button.getBoundingClientRect();
          calendarRef.current.style.position = 'fixed';
          calendarRef.current.style.top = `${rect.bottom + 5}px`;
          calendarRef.current.style.right = `${window.innerWidth - rect.right}px`;
          calendarRef.current.style.width = '1px';
          calendarRef.current.style.height = '1px';
          calendarRef.current.style.opacity = '0';
        }
        calendarRef.current.focus();
        calendarRef.current.click();
        if (typeof calendarRef.current.showPicker === 'function') {
          calendarRef.current.showPicker();
        }
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

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
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const helpContent: Record<string, { title: string; instruction: string; imageUrl?: string }> = {
    onlineNetSalesSR50: {
      title: 'Online Net Sales (SR50)',
      instruction: 'Find this value on your lottery terminal report. Look for "NET SALES" in the Online section (SR50). This is the total sales minus any cancellations or free bets.',
      imageUrl: '/help-images/online-net-sales.png', // Placeholder - you can add actual images later
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
      title: 'Instant Sale (SR34)',
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

  const InputField = ({ label, field, value, showHelp = true }: { label: string; field: keyof DailyLotteryReport; value: number; showHelp?: boolean }) => {
    const hasHelp = helpContent[field as string];
    const labelWithoutQuestion = label.replace(' ?', '');
    
    return (
      <div className="mb-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          <span>{labelWithoutQuestion}</span>
          {showHelp && hasHelp && (
            <button
              type="button"
              onClick={() => setHelpField(field as string)}
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
            type="number"
            step="0.01"
            min="0"
            value={value || 0}
            onChange={(e) => handleInputChange(field, e.target.value)}
            onKeyDown={(e) => {
              // Prevent non-numeric characters except decimal point, backspace, delete, arrow keys, etc.
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
  };

  const ReadOnlyField = ({ label, value }: { label: string; value: number }) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 text-lg">$</span>
        <input
          type="text"
          value={value.toFixed(2)}
          readOnly
          className="w-full pl-8 p-2 border border-gray-300 rounded-lg text-lg bg-gray-100 text-gray-800"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-start mb-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-full border-2 border-blue-400 bg-white text-blue-400 font-medium flex items-center gap-2 hover:bg-teal-50 active:bg-blue-100 transition-colors"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="text-right relative">
            <h1 className="text-2xl font-bold">Daily Lottery Report</h1>
            <button
              onClick={handleDateClick}
              data-date-button
              className="cursor-pointer hover:opacity-80 transition-opacity mt-1 relative"
            >
              <p className="text-base text-white font-bold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </button>
            <input
              ref={calendarRef}
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="absolute top-full right-0 mt-1 opacity-0 pointer-events-none w-1 h-1"
              style={{ position: 'fixed', top: 'auto', right: 'auto' }}
              aria-label="Select date"
            />
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
            
            <InputField label="Online Net Sales (SR50) ?" field="onlineNetSalesSR50" value={formData.onlineNetSalesSR50 || 0} />
            <InputField label="Online Cashing (SR50) ?" field="onlineCashingSR50" value={formData.onlineCashingSR50 || 0} />
            <InputField label="Instant Cashing (SR34) ?" field="instantCashingSR34" value={formData.instantCashingSR34 || 0} />
          </div>

          {/* Register 2 Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="bg-green-100 border-l-4 border-green-500 p-3 mb-4 rounded">
              <h2 className="text-xl font-bold text-green-800">Lottery Register 2</h2>
            </div>
            
            <InputField label="Online Net Sales (SR50) ?" field="onlineNetSales2SR50" value={formData.onlineNetSales2SR50 || 0} />
            <InputField label="Online Cashing (SR50) ?" field="onlineCashing2SR50" value={formData.onlineCashing2SR50 || 0} />
            <InputField label="Instant Cashing (SR34) ?" field="instantCashing2SR34" value={formData.instantCashing2SR34 || 0} />
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
          <ReadOnlyField label="Instant Sale (SR34)" value={formData.instantSaleSR34 || 0} />
        </div>

        {/* Today Cash Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="bg-purple-100 border-l-4 border-purple-500 p-3 mb-4 rounded">
            <h2 className="text-xl font-bold text-purple-800">Today Cash</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputField label="Total EBT Sale" field="debitCreditCard" value={formData.debitCreditCard || 0} />
              <InputField label="Total Credit Card Sale" field="creditsSale" value={formData.creditsSale || 0} />
              <InputField label="Total Debit Card Sale" field="debitsSale" value={formData.debitsSale || 0} />
              <InputField label="Vending Cash" field="vendingCash" value={formData.vendingCash || 0} />
            </div>
            <div>
              <InputField label="Online Balance" field="onlineBalance" value={formData.onlineBalance || 0} />
              <InputField label="Instant Balance" field="instantBalance" value={formData.instantBalance || 0} />
              <ReadOnlyField label="Total Balance" value={formData.totalBalance || 0} />
              <InputField label="Register Cash" field="registerCash" value={formData.registerCash || 0} />
              <ReadOnlyField 
                label="Over/Short" 
                value={formData.overShort || 0}
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

