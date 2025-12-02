'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useToken from '@/hooks/useToken';
import { useUserReports } from '@/hooks/useApi';
import { MedicalReport } from '@/types';

// interface SavedReport {
//   id: string;
//   image: string;
//   location: string;
//   date: string;
//   symptoms: string[];
// }

const Profile = () => {
  const { token, isAuthenticated } = useToken();
  const [savedReports, setSavedReports] = useState<MedicalReport[]>([]);
  const { reports, isLoading: isLoadingReports, deleteReport, deleting, error } = useUserReports();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
  if (reports) {
    setSavedReports(reports);
  }
}, [reports]);

  const handleViewReport = (index: number) => {
    // In production, this would load the specific report
    //console.log(reportId)
    // TODO: handle report using ID, not index
    localStorage.setItem('reportData', JSON.stringify(reports[index]))
    router.push(`/report`);
  };

  const handleDeleteReport = (reportId: string, index: number) => {
    // setSavedReports(prev => prev.filter(report => report.id !== reportId));
    // // Update localStorage
    // const updatedReports = savedReports.filter(report => report.id !== reportId);
    // localStorage.setItem('savedReports', JSON.stringify(updatedReports));
    deleteReport(reportId)
    const storedReports = localStorage.getItem('reports');
    if (!storedReports) return;

    const updatedReports = JSON.parse(storedReports);
    updatedReports.splice(index, 1);
    localStorage.setItem('reports', JSON.stringify(updatedReports));

    // (Optional) Step 5: Update your local state so UI updates immediately
    setSavedReports(updatedReports);
  };

  if (!isAuthenticated) {
    return (
      <div className="main-container min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-custom"></div>
      </div>
    );
  }

  if (isLoadingReports) {
  return (
    <div className="main-container min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-custom"></div>
    </div>
  );
}

// if (error) {
//   return (
//     <div className="main-container min-h-screen flex items-center justify-center">
//       <p className="text-red-500 font-medium">{error}</p>
//     </div>
//   );
// }

  return (
    <div className="main-container min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-custom mb-4">
            👤 My Profile
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account and view your analysis history
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 slide-up">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-custom to-secondary-custom rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl text-white">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {JSON.parse(localStorage.getItem('token')).user.username || 'User'}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  DermaSight Member
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reports:</span>
                  <span className="font-medium text-gray-800">{reports.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium text-gray-800">Jan 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>

              <button 
                onClick={() => router.push('/upload')}
                className="w-full mt-6 px-4 py-3 bg-primary-custom hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
              >
                📸 New Analysis
              </button>
            </div>
          </div>

          {/* Reports History */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  📊 Analysis History
                </h2>
                <span className="text-sm text-gray-600">
                  {reports.length} report{reports.length !== 1 ? 's' : ''}
                </span>
              </div>

              {savedReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    No Reports Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start by uploading an image of your skin condition for analysis
                  </p>
                  <button 
                    onClick={() => router.push('/upload')}
                    className="px-6 py-3 bg-primary-custom hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedReports.map((report, index) => (
                    <div 
                      key={report.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      //onClick={() => handleViewReport(report.id)}
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 flex items-center justify-center">
                          <span className="text-lg">📋</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            Skin Analysis #{index + 1}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Condition:</span>
                          <span className="ml-2 text-gray-800">{report.analysisResult.possibleConditions[0] || 'N/A'}</span>
                        </div>
                        {report.analysisResult.confidence && (
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <span className="ml-2 text-gray-800">{report.analysisResult.confidence.toFixed(2)}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(index);
                          }}
                          className="text-primary-custom hover:text-opacity-80 text-sm font-medium"
                        >
                          View Report
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id, index);
                          }}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/upload')}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-2xl mb-2">📸</div>
            <div className="font-medium text-gray-800">New Analysis</div>
            <div className="text-sm text-gray-600">Upload image</div>
          </button>
          
          <button 
            onClick={() => router.push('/chatbot')}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-medium text-gray-800">Ask AI</div>
            <div className="text-sm text-gray-600">Chat with assistant</div>
          </button>

          <div className="p-4 bg-white rounded-lg shadow-md text-center opacity-75">
            <div className="text-2xl mb-2">📄</div>
            <div className="font-medium text-gray-800">Export Reports</div>
            <div className="text-sm text-gray-600">Coming soon</div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-md text-center opacity-75">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium text-gray-800">Settings</div>
            <div className="text-sm text-gray-600">Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;