'use client'
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
    if (!title.trim()) return;
    
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
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform rotate-[-90deg]" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-800 font-bold text-xs">{score}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-2">{label}</span>
    </div>
  );

  const AnalysisSection = ({ title, content, children }: { title: string; content?: string; children?: React.ReactNode }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">{title}</h3>
      {content && (
        <p className="text-gray-700 text-sm leading-relaxed bg-white rounded-lg p-3 border border-gray-200">
          {content}
        </p>
      )}
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Amazon Listing Analyzer
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            AI-powered analysis
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide text-xs">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="Wireless Bluetooth Headphones Noise Cancelling Over Ear..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide text-xs">
                    Product Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="Describe your product features, benefits, specifications, and unique selling points..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => analyzeListing(false)}
                    disabled={loading || !title.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {loading && !streaming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Analyze
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => analyzeListing(true)}
                    disabled={loading || !title.trim()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {streaming ? (
                      <>
                        <div className="flex mr-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        Streaming...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Stream Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 h-full">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              </div>
              
              {loading && !analysis && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Listing</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">Our AI is carefully reviewing your title and description for optimization opportunities...</p>
                </div>
              )}

              {analysis?.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-red-800 font-bold text-lg mb-2">Analysis Error</h3>
                  <p className="text-red-600">{analysis.message}</p>
                </div>
              )}

              {analysis && analysis.status !== 'error' && (
                <div className="space-y-8">
                  {/* Scores */}
                  {(analysis.overall_score !== undefined) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="font-bold text-gray-900 mb-6 text-center text-lg">Performance Scores</h3>
                      <div className="flex justify-around items-center">
                        <ScoreCircle score={analysis.overall_score || 0} label="Overall" />
                        <ScoreCircle score={analysis.keyword_score || 0} label="Keywords" />
                        <ScoreCircle score={analysis.readability_score || 0} label="Readability" />
                        <ScoreCircle score={analysis.compliance_score || 0} label="Compliance" />
                      </div>
                    </div>
                  )}

                  {/* Analysis Sections */}
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
                    {analysis.keyword_analysis && (
                      <AnalysisSection 
                        title="Keyword Analysis" 
                        content={analysis.keyword_analysis}
                      />
                    )}

                    {analysis.readability_analysis && (
                      <AnalysisSection 
                        title="Readability Analysis" 
                        content={analysis.readability_analysis}
                      />
                    )}

                    {analysis.competitor_analysis && (
                      <AnalysisSection 
                        title="Competitor Analysis" 
                        content={analysis.competitor_analysis}
                      />
                    )}

                    {analysis.compliance_analysis && (
                      <AnalysisSection 
                        title="Compliance Analysis" 
                        content={analysis.compliance_analysis}
                      />
                    )}

                    {analysis.top_improvements && (
                      <AnalysisSection title="Top Improvements">
                        <div className="space-y-3">
                          {analysis.top_improvements.map((imp, index) => (
                            <div key={index} className="flex items-start bg-white rounded-lg p-3 border border-red-100 hover:border-red-200 transition-colors">
                              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                              </div>
                              <p className="text-gray-700 text-sm flex-1">{imp}</p>
                            </div>
                          ))}
                        </div>
                      </AnalysisSection>
                    )}

                    {analysis.best_practices_used && analysis.best_practices_used.length > 0 && (
                      <AnalysisSection title="Best Practices">
                        <div className="space-y-3">
                          {analysis.best_practices_used.map((practice, index) => (
                            <div key={index} className="flex items-start bg-white rounded-lg p-3 border border-green-100 hover:border-green-200 transition-colors">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <p className="text-gray-700 text-sm flex-1">{practice}</p>
                            </div>
                          ))}
                        </div>
                      </AnalysisSection>
                    )}
                  </div>

                  {analysis.status === 'streaming' && (
                    <div className="text-center py-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-center text-blue-600 font-medium">
                        <div className="flex mr-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        Receiving real-time analysis...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready for Analysis</h3>
                  <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Enter your product title and description to get AI-powered optimization suggestions and performance scores.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
