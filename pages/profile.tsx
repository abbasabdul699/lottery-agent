export default function ProfilePage() {

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={() => {
              // Sign out functionality - can be implemented later
              console.log('Sign out clicked');
            }}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Employee Name</h2>
            <p className="text-gray-600 text-sm">Employee ID: EMP001</p>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                placeholder="employee@example.com"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                placeholder="Employee"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                placeholder="Lottery Operations"
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tickets Scanned</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reports Created</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Settings</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">Notifications</span>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">Preferences</span>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">Help & Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

