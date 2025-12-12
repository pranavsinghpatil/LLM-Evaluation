import { useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Zap, Database, MessageSquare, FileText, Info, PlayCircle } from 'lucide-react';
import HowItWorks from './HowItWorks';

function App() {
  const [activeTab, setActiveTab] = useState('evaluator'); // 'evaluator' | 'how-it-works'
  const [inputMode, setInputMode] = useState('upload'); // 'manual' | 'upload'
  const [query, setQuery] = useState('What is the capital of France?');
  const [response, setResponse] = useState('The capital of France is Paris.');
  const [context, setContext] = useState('France is a country in Western Europe. Its capital is Paris, known for the Eiffel Tower.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Split context by newlines if it's a string, or keep as is
      const contextList = context.split('\n').filter(line => line.trim() !== '');

      const res = await fetch('http://localhost:8000/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          response,
          context: contextList,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    setQuery("What are the health benefits of green tea?");
    setResponse("The health benefits of Green tea include being rich in antioxidants called catechins, which may help prevent cell damage. It can also improve brain function, fat loss, and lower the risk of heart disease.");
    setContext("Green tea is loaded with antioxidants that have many health benefits, which may include improved brain function, fat loss, protecting against cancer, and lowering the risk of heart disease.\nThe main antioxidant in green tea is EGCG (Epigallocatechin Gallate).\nGreen tea contains less caffeine than coffee but enough to produce an effect.");
  };

  const processParsedJson = (json, type) => {
    if (type === 'chat') {
      // Handle simple format
      if (json.query && json.response) {
        setQuery(json.query);
        setResponse(json.response);
      }
      // Handle complex conversation format
      else if (json.conversation_turns && Array.isArray(json.conversation_turns)) {
        const turns = json.conversation_turns;
        const lastUserTurn = [...turns].reverse().find(t => t.role === 'User');
        const lastAiTurn = [...turns].reverse().find(t => t.role === 'AI/Chatbot');

        if (lastUserTurn) setQuery(lastUserTurn.message);
        if (lastAiTurn) setResponse(lastAiTurn.message);
      }
    } else if (type === 'context') {
      // Handle simple format
      if (Array.isArray(json.context)) {
        setContext(json.context.join('\n\n'));
      } else if (typeof json.context === 'string') {
        setContext(json.context);
      }
      // Handle complex vector format
      else if (json.data && json.data.vector_data && Array.isArray(json.data.vector_data)) {
        const contextTexts = json.data.vector_data.map(item => item.text).join('\n\n');
        setContext(contextTexts);
      }
    }
  };

  const parseJsonWithComments = (text) => {
    const cleanText = text.replace(/\/\/.*$/gm, '');
    return JSON.parse(cleanText);
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = parseJsonWithComments(e.target.result);
        processParsedJson(json, type);
      } catch (err) {
        setError(`Failed to parse JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const loadPresetSamples = async () => {
    try {
      const chatRes = await fetch('/samples/sample-chat-conversation-01.json');
      const chatText = await chatRes.text();
      const chatJson = parseJsonWithComments(chatText);
      processParsedJson(chatJson, 'chat');

      const contextRes = await fetch('/samples/sample_context_vectors-01.json');
      const contextText = await contextRes.text();
      const contextJson = parseJsonWithComments(contextText);
      processParsedJson(contextJson, 'context');
    } catch (err) {
      setError(`Failed to load preset samples: ${err.message}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 border-b border-slate-700 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              LLM Evaluation Pipeline
            </h1>
            <p className="text-slate-400 mt-2">Real-time assessment of Relevance, Completeness, and Hallucination.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('evaluator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'evaluator'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <PlayCircle className="w-4 h-4" />
              Evaluator
            </button>
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'how-it-works'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Info className="w-4 h-4" />
              How it Works
            </button>
          </div>
        </header>

        {activeTab === 'how-it-works' ? (
          <HowItWorks />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Input Section */}
            {/* Input Section */}
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Input Data
                  </h2>

                  {/* Input Mode Toggle */}
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => setInputMode('manual')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${inputMode === 'manual'
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setInputMode('upload')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${inputMode === 'upload'
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      JSON Upload
                    </button>
                  </div>
                </div>

                {inputMode === 'upload' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-900/50 hover:border-blue-500/50 transition-colors">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        1. Conversation JSON (Chat)
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleFileUpload(e, 'chat')}
                        className="block w-full text-sm text-slate-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-xs file:font-semibold
                          file:bg-blue-900/20 file:text-blue-400
                          hover:file:bg-blue-900/30
                          cursor-pointer"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Expected format: <code>{`{ "query": "...", "response": "..." }`}</code>
                      </p>
                    </div>

                    <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-900/50 hover:border-purple-500/50 transition-colors">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        2. Context JSON (Vector DB)
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleFileUpload(e, 'context')}
                        className="block w-full text-sm text-slate-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-xs file:font-semibold
                          file:bg-purple-900/20 file:text-purple-400
                          hover:file:bg-purple-900/30
                          cursor-pointer"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Expected format: <code>{`{ "context": ["...", "..."] }`}</code>
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={loadPresetSamples}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Load Preset Samples (Demo)
                      </button>
                    </div>

                    {(query || context) && (
                      <div className="bg-slate-900 p-3 rounded border border-slate-700 text-xs font-mono text-slate-300">
                        <div className="mb-1"><span className="text-blue-400">Query:</span> {query.substring(0, 50)}...</div>
                        <div className="mb-1"><span className="text-green-400">Response:</span> {response.substring(0, 50)}...</div>
                        <div><span className="text-purple-400">Context:</span> {context.substring(0, 50)}...</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-400">User Query</label>
                      <button
                        onClick={loadSampleData}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Load Sample Data
                      </button>
                    </div>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      rows="2"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">LLM Response</label>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        rows="4"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Retrieved Context</label>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        rows="4"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleEvaluate}
                  disabled={loading || !query || !response}
                  className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading || !query || !response
                    ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Evaluating...
                    </span>
                  ) : (
                    'Run Evaluation'
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {!result && !loading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl p-12">
                  <Activity className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Ready to evaluate.</p>
                  <p className="text-sm">Enter data and click "Run Evaluation"</p>
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-fade-in">
                  {/* Verdict Card */}
                  <div className={`p-6 rounded-xl border shadow-lg ${result.verdict.status === 'PASS'
                    ? 'bg-green-900/10 border-green-500/30'
                    : 'bg-red-900/10 border-red-500/30'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {result.verdict.status === 'PASS' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                        Verdict: {result.verdict.status}
                      </h2>
                      <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">
                        {result.metrics.latency_ms.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="space-y-2">
                      {result.verdict.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-slate-500" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Relevance */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Relevance</span>
                        <Zap className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(result.metrics.relevance)}`}>
                        {(result.metrics.relevance * 100).toFixed(1)}%
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div
                          className="bg-current h-full transition-all duration-1000"
                          style={{ width: `${result.metrics.relevance * 100}%`, color: 'inherit' }}
                        />
                      </div>
                    </div>

                    {/* Completeness */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Completeness</span>
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(result.metrics.completeness)}`}>
                        {(result.metrics.completeness * 100).toFixed(1)}%
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div
                          className="bg-current h-full transition-all duration-1000"
                          style={{ width: `${result.metrics.completeness * 100}%`, color: 'inherit' }}
                        />
                      </div>
                    </div>

                    {/* Hallucination */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Hallucination</span>
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className={`text-3xl font-bold ${result.metrics.hallucination > 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                        {(result.metrics.hallucination * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Lower is better</p>
                    </div>
                  </div>

                  {/* JSON View */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500">RAW JSON OUTPUT</span>
                      <Database className="w-3 h-3 text-slate-600" />
                    </div>
                    <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
