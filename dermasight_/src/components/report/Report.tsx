'use client';

import { useState, useEffect } from 'react';
import { useUpload, useUserReports } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MedicalReport } from '@/types';

// interface ReportData {
//   id: string;
//   userId: string | null;
//   imageData: string;
//   questionnaireData: {
//     location: string;
//     size: string;
//     duration: string;
//     symptoms: string[];
//     additional: string;
//   };
//   analysisResult: {
//     id: string;
//     confidence: number;
//     possibleConditions: string[];
//     recommendations: string[];
//     // severityLevel: string;
//     // requiresUrgentCare: boolean;
//     generatedAt: string;
//   };
//   createdAt: string;
//   // status: string;
// }

const Report = () => {
  const [data, setData] = useState<MedicalReport | null>(null);
    const { deleteReport, deleting, error } = useUserReports();
  const router = useRouter();

  useEffect(() => {
    const reportData = localStorage.getItem('reportData');
    if (reportData) {
      setData(JSON.parse(reportData));
    } else {
      router.push('/upload');
    }
  }, [router]);

  const onDelete = () => {
    if (data) deleteReport(data.id)
    localStorage.removeItem('reportData');
    router.push('/profile');
  };

  const onChatbot = () => {
    router.push('/chatbot');
  };

  const onShare = () => {
    console.log('Share report functionality to be implemented');
  };

  if (!data) {
    return (
      <div className="main-container min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-custom"></div>
      </div>
    );
  }

  return (
    <div className="main-container min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-custom mb-4">
            📊 Analysis Report
          </h1>
          <p className="text-gray-600 text-lg">
            Detailed analysis of your skin condition
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden slide-up">
          <div className="flex flex-col lg:flex-row">
            {/* Image & Details Sidebar */}
            <div className="lg:w-1/3 bg-gray-50 p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-primary-custom mb-4">
                  Skin Condition Analysis
                </h2>
                <div className="relative mx-auto w-48 h-48 sm:w-64 sm:h-64">
                  <Image
                    src={data.imageUrl}
                    alt="Analyzed skin condition"
                    fill
                    className="object-cover rounded-xl shadow-md"
                    unoptimized
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-600">{data.questionnaireData.location}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Size:</span>
                  <span className="ml-2 text-gray-600">{data.questionnaireData.size}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-600">{data.questionnaireData.duration}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Symptoms:</span>
                  <span className="ml-2 text-gray-600">
                    {data.questionnaireData.symptoms.length > 0 ? data.questionnaireData.symptoms.join(", ") : "None reported"}
                  </span>
                </div>
                {data.questionnaireData.additionalInfo && (
                  <div>
                    <span className="font-semibold text-gray-700">Additional Info:</span>
                    <p className="mt-2 text-gray-600 text-sm bg-white p-3 rounded-lg">
                      {data.questionnaireData.additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information Content */}
            <div className="lg:w-2/3 p-6">
              <div className="space-y-6">
                {/* Characteristics */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    📋 Skin Condition
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg mb-3">
                    <p className="text-blue-800 text-sm font-medium">
                      Note: This app is intended for informational purposes only and uses machine learning to provide preliminary insights into skin conditions. It does not replace professional medical advice, diagnosis, or treatment. The results provided by this app should be used as a research or educational aid only, and relying solely on them for medical decisions is not recommended.
                    </p>
                  </div>
                  <p className="text-gray-600 mb-3">The AI system’s assessment gives your condition a {data.analysisResult.confidence}% confidence score that it is the following condition(s):</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {data.analysisResult.possibleConditions.map((condition, index) => (
                    <li>{condition}</li>
                    ))}
                  </ul>
                </div>

                {/* Common Causes */}
                {/* <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    🔍 Common Causes
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg mb-3">
                    <p className="text-yellow-800 text-sm font-medium">
                      Demo: Production would show AI-analyzed potential causes
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Environmental factors</li>
                    <li>Allergic reactions</li>
                    <li>Genetic predisposition</li>
                    <li>Other medical conditions</li>
                  </ul>
                </div> */}

                {/* Treatments */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    💊 Known Treatments
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg mb-3">
                    <p className="text-green-800 text-sm font-medium">
                      Note: Treatment recommendations provided are general suggestions and may not be suitable for everyone. Always consult a healthcare professional before starting any new treatment.
                    </p>
                  </div>
                  <p className="text-gray-600 mb-3">Common approaches may include:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {data.analysisResult.recommendations.map((recommendation, index) => (
                    <li className="pl-[1em] indent-[-1em]">{recommendation}</li>
                    ))}
                  </ul>
                </div>

                {/* Seek Care */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    🚨 Seek Care
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg mb-3">
                    <p className="text-red-800 text-sm font-medium">
                      Important: This report does not replace professional medical advice
                    </p>
                  </div>
                  {/* <p className="text-gray-600 mb-2">Your condition's severity is classified as {data.analysisResult.severityLevel}.</p>
                  {data.analysisResult.requiresUrgentCare ? (
                    <p className="text-gray-700 font-medium mb-2">Urgent care is required.</p>
                  ) : (
                    <p className="text-gray-700 font-medium mb-2">Urgent care is currently not required.</p>
                  )} */}
                  <p className="text-gray-600 mb-2">Seek medical attention if:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>The condition worsens or doesn't improve</li>
                    <li>You experience severe symptoms</li>
                    <li>You have concerns about the condition</li>
                    <li>The lesion changes in appearance, size, or color</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={onDelete}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={onShare}
                    className="px-6 py-3 border-2 border-primary-custom text-primary-custom hover:bg-primary-custom hover:text-white rounded-lg font-medium transition-colors"
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={onChatbot}
                    className="px-6 py-3 bg-primary-custom hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
                  >
                    🤖 AI Assistant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            <span className="font-medium">Medical Disclaimer:</span> This analysis is generated by AI 
            and is not a substitute for professional medical diagnosis. Always consult with a qualified healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;