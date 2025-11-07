import { useState } from 'react';
import axios from 'axios';

interface AnalysisResult {
  status: string;
  message?: string;
  keyword_score?: number;
  readability_score?: number;
  compliance_score?: number;
  overall_score?: number;
  keyword_analysis?: string;
  readability_analysis?: string;
  competitor_analysis?: string;
  compliance_analysis?: string;
  top_improvements?: string[];
  best_practices_used?: string[];
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export default function Home() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const analyzeListing = async (useStreaming = false) => {
    setLoading(true);
    setStreaming(useStreaming);
    setAnalysis(null);

    try {
      if (useStreaming) {
        await analyzeStreaming();
      } else {
        const response = await axios.post(`${BACKEND_URL}/analyze`, {
          product_title: title,
          product_description: description
        });
        setAnalysis(response.data);
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setAnalysis({ 
        status: 'error', 
        message: error.response?.data?.message || 'Analysis failed' 
      });
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const analyzeStreaming = async () => {
    const response = await fetch(`${BACKEND_URL}/analyze-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_title: title,
        product_description: description
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let accumulatedData: Partial<AnalysisResult> = { status: 'success' };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'keyword_analysis':
                accumulatedData.keyword_analysis = data.content;
                break;
              case 'readability_analysis':
                accumulatedData.readability_analysis = data.content;
                break;
              case 'competitor_analysis':
                accumulatedData.competitor_analysis = data.content;
                break;
              case 'compliance_analysis':
                accumulatedData.compliance_analysis = data.content;
                break;
              case 'improvements':
                accumulatedData.top_improvements = data.content;
                break;
              case 'best_practices':
                accumulatedData.best_practices_used = data.content;
                break;
              case 'error':
                setAnalysis({ status: 'error', message: data.content });
                return;
            }

            setAnalysis({ ...accumulatedData, status: 'streaming' } as AnalysisResult);
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    }

    setAnalysis({ ...accumulatedData, status: 'success' } as AnalysisResult);
  };

  const ScoreCircle = ({ score, label }: { score: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
          />
          <text 
            x="18" 
            y="20.5" 
            textAnchor="middle" 
            fill="#4B5563" 
            fontSize="9"
            fontWeight="bold"
            className="font-bold"
          >
            {score}%
          </text>
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-2">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Smart Amazon Listing Analyzer
        </h1>
        <p className="text-gray-600 text-center mb-8">
          AI-powered analysis using ChromaDB vector search and OpenRouter
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Wireless Bluetooth Headphones Noise Cancelling Over Ear..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your product features, benefits, specifications..."
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => analyzeListing(false)}
                  disabled={loading || !title}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 font-medium"
                >
                  {loading && !streaming ? 'Analyzing...' : 'Quick Analyze'}
                </button>
                
                <button
                  onClick={() => analyzeListing(true)}
                  disabled={loading || !title}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 font-medium"
                >
                  {streaming ? 'Streaming...' : 'Stream Analyze'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Results
            </h2>
            
            {loading && !analysis && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Analyzing your listing...</p>
              </div>
            )}

            {analysis?.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600">{analysis.message}</p>
              </div>
            )}

            {analysis && analysis.status !== 'error' && (
              <div className="space-y-6">
                {/* Scores */}
                {(analysis.overall_score !== undefined) && (
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-gray-900 mb-4">Performance Scores</h3>
                    <div className="flex justify-around">
                      <ScoreCircle score={analysis.overall_score || 0} label="Overall" />
                      <ScoreCircle score={analysis.keyword_score || 0} label="Keywords" />
                      <ScoreCircle score={analysis.readability_score || 0} label="Readability" />
                      <ScoreCircle score={analysis.compliance_score || 0} label="Compliance" />
                    </div>
                  </div>
                )}

                {/* Analysis Sections */}
                {analysis.keyword_analysis && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Keyword Analysis</h3>
                    <p className="text-gray-700 text-sm">{analysis.keyword_analysis}</p>
                  </div>
                )}

                {analysis.readability_analysis && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Readability Analysis</h3>
                    <p className="text-gray-700 text-sm">{analysis.readability_analysis}</p>
                  </div>
                )}

                {analysis.competitor_analysis && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Competitor Analysis</h3>
                    <p className="text-gray-700 text-sm">{analysis.competitor_analysis}</p>
                  </div>
                )}

                {analysis.compliance_analysis && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Compliance Analysis</h3>
                    <p className="text-gray-700 text-sm">{analysis.compliance_analysis}</p>
                  </div>
                )}

                {/* Improvements */}
                {analysis.top_improvements && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Top 5 Improvements</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.top_improvements.map((imp, index) => (
                        <li key={index} className="text-gray-700 text-sm">{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best Practices - Fixed section */}
                {analysis.best_practices_used && analysis.best_practices_used.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Relevant Best Practices</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.best_practices_used.map((practice, index) => (
                        <li key={index} className="text-gray-700 text-sm">{practice}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.status === 'streaming' && (
                  <div className="text-center py-2">
                    <div className="animate-pulse text-blue-600">Receiving analysis...</div>
                  </div>
                )}
              </div>
            )}

            {!analysis && !loading && (
              <div className="text-center py-8 text-gray-500">
                Enter your product details to get analysis
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
