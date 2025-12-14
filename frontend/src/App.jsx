import { useState, useEffect } from 'react';
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

  const [chatHistory, setChatHistory] = useState([]); // Store full conversation for display
  const [evalStrategy, setEvalStrategy] = useState('smart'); // 'smart' | 'overall'

  // Clear default data when switching to Upload mode
  useEffect(() => {
    if (inputMode === 'upload') {
      setQuery('');
      setResponse('');
      setContext('');
      setChatHistory([]); // Clear history
      setResult(null);
      setError(null);
      setEvalStrategy('smart');
    } else {
      // Restore sample data for manual mode
      loadSampleData();
      setChatHistory([]);
    }
  }, [inputMode]);

  // Re-calculate Query/Response whenever Chat History or Strategy changes (Only in Upload Mode)
  useEffect(() => {
    if (inputMode !== 'upload' || chatHistory.length === 0) return;

    if (evalStrategy === 'smart') {
      // SMART STRATEGY (Default): Focus on the last substantive interaction
      let turns = [...chatHistory];
      let aiTurnIndex = -1;

      // Find last AI response
      for (let i = turns.length - 1; i >= 0; i--) {
        if (turns[i].role === 'AI/Chatbot') {
          aiTurnIndex = i;
          break;
        }
      }

      if (aiTurnIndex !== -1) {
        const aiTurn = turns[aiTurnIndex];
        setResponse(aiTurn.message);

        // Find valid user query preceding this response
        const userTurnIndex = turns.slice(0, aiTurnIndex).reverse().findIndex(t => t.role === 'User');

        if (userTurnIndex !== -1) {
          const absoluteUserIndex = aiTurnIndex - 1 - userTurnIndex;
          const userTurn = turns[absoluteUserIndex];

          let finalQuery = userTurn.message;

          // Augment with previous system turn if available (for context)
          if (absoluteUserIndex > 0) {
            const prevSystemTurn = turns[absoluteUserIndex - 1];
            if (prevSystemTurn) {
              finalQuery = `[Previous Context]: "${prevSystemTurn.message.substring(0, 100)}..."\n[User Question]: ${userTurn.message}`;
            }
          }
          setQuery(finalQuery);
        } else {
          setQuery("No preceding user query found.");
        }
      } else {
        setResponse("No AI response found.");
        setQuery("Unknown Query");
      }

    } else {
      // OVERALL STRATEGY: Concatenate all User vs All AI messages
      const userText = chatHistory
        .filter(t => t.role === 'User')
        .map(t => t.message)
        .join('\n\n');

      const aiText = chatHistory
        .filter(t => t.role === 'AI/Chatbot')
        .map(t => t.message)
        .join('\n\n');

      setQuery(userText || "No user messages found.");
      setResponse(aiText || "No AI messages found.");
    }
  }, [chatHistory, evalStrategy, inputMode]);

  // Universal Smart Context Extractor
  const extractSmartContext = (data) => {
    if (!data) return '';

    // 1. Direct string match
    if (typeof data === 'string') return data;

    // 2. Array of strings
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return data.join('\n\n');
    }

    // 3. Recursive search for content fields
    let gatheredTexts = [];
    const traverse = (node) => {
      if (!node) return;

      if (Array.isArray(node)) {
        node.forEach(traverse);
        return;
      }

      if (typeof node === 'object') {
        // Check for specific content keys prioritized by likelihood
        // 'text' maps to the sample format. 'page_content' is common in LangChain.
        const content = node.text || node.content || node.page_content || node.pageContent || node.snippet || node.body;

        // Check for score/relevance keys
        const score = node.score || node.similarity || node.relevance || node.vector_score;

        if (content && typeof content === 'string' && content.trim().length > 0) {
          // Verify if score is a valid number
          const scoreStr = (score !== undefined && score !== null && !isNaN(score)) ? `[Score: ${Number(score).toFixed(4)}] ` : '';
          gatheredTexts.push(`${scoreStr}${content}`);
          // If we found content, we generally don't need to traverse children of this node looking for more chunks
          // unless it's a structural node, but usually 'text' is a leaf content node.
          return;
        }

        // Navigate into likely container keys
        // We scan all keys but skip metadata to be efficient and reduce noise
        const skipKeys = ['id', 'tokens', 'created_at', 'status', 'status_code', 'message', 'type', 'metadata'];

        Object.keys(node).forEach(key => {
          if (!skipKeys.includes(key)) {
            traverse(node[key]);
          }
        });
      }
    };

    traverse(data);

    if (gatheredTexts.length > 0) {
      return gatheredTexts.join('\n\n');
    }

    // 4. Fallback: Pretty print if no patterns matched
    return JSON.stringify(data, null, 2);
  };

  const processParsedJson = (json, type) => {
    if (type === 'chat') {
      // Handle simple format
      if (json.query && json.response) {
        setQuery(json.query);
        setResponse(json.response);
        setChatHistory([]);
      }
      // Handle complex conversation format
      else if (json.conversation_turns && Array.isArray(json.conversation_turns)) {
        let turns = json.conversation_turns;
        // 1. Sort by turn ID to ensure correct chronological order
        turns = turns.sort((a, b) => (a.turn || 0) - (b.turn || 0));
        setChatHistory(turns);
      }
    } else if (type === 'context') {
      // Use Universal Smart Extractor
      const extractedText = extractSmartContext(json);
      setContext(extractedText);
    }
  };

  const parseJsonWithComments = (text) => {
    // 1. Remove comments safely (ignoring // inside strings like URLs)
    // Regex matches either a String ("...") OR a Comment (//...)
    let cleanText = text.replace(/("(?:[^"\\]|\\.)*")|(\/\/.*$)/gm, (match, strGroup) => {
      // If it Matched a String, keep it
      if (strGroup) return strGroup;
      // If it Matched a Comment, remove it
      return '';
    });

    // 2. Fix unescaped control characters (newlines/tabs) inside strings
    // This regex matches JSON string literals (double-quoted)
    cleanText = cleanText.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
      return match
        .replace(/\n/g, '\\n')  // Escape newlines
        .replace(/\r/g, '')     // Remove carriage returns
        .replace(/\t/g, '\\t'); // Escape tabs
    });

    // 3. Fix trailing commas (invalid in JSON but common in manual files)
    cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

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
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      Input Configuration
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 ml-1">Configure your evaluation data source.</p>
                  </div>

                  {/* Modern Toggle Switch */}
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    {['manual', 'upload'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setInputMode(mode)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${inputMode === mode
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        {mode === 'manual' ? 'Manual Entry' : 'File Upload'}
                      </button>
                    ))}
                  </div>
                </div>

                {inputMode === 'upload' ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Modern Upload Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                      {/* Chat Upload Card */}
                      <div className="group relative p-6 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/50">
                        <div className="absolute top-4 right-4">
                          <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors"></div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="p-3 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white mb-1">Conversation JSON</h3>
                            <p className="text-xs text-slate-400">Upload chat logs (OpenAI/LangChain)</p>
                          </div>
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 border border-blue-500/20">
                              Select File
                            </span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleFileUpload(e, 'chat')}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-500 font-mono">.json supported</p>
                        </div>
                      </div>

                      {/* Context Upload Card */}
                      <div className="group relative p-6 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:bg-slate-800/50">
                        <div className="absolute top-4 right-4">
                          <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-purple-400 transition-colors"></div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="p-3 bg-purple-500/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white mb-1">Vector Context</h3>
                            <p className="text-xs text-slate-400">Upload retrieved RAG documents</p>
                          </div>
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 rounded-lg bg-purple-600/10 text-purple-400 text-xs font-semibold hover:bg-purple-600 hover:text-white transition-all duration-200 border border-purple-500/20">
                              Select File
                            </span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => handleFileUpload(e, 'context')}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-500 font-mono">.json (Smart Extract)</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mb-6">
                      <button
                        onClick={loadPresetSamples}
                        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors group"
                      >
                        <PlayCircle className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        Load Demo Samples
                      </button>
                    </div>

                    {/* Evaluation Strategy Toggle */}
                    <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-4 transition-all hover:border-blue-500/30">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-300">Evaluation Strategy:</label>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-slate-500 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-xs text-slate-300 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                            <p className="mb-2"><strong className="text-blue-400">Smart Eval (Default):</strong> Target the last user query and AI response. Best for RAG accuracy.</p>
                            <p><strong className="text-purple-400">Overall Eval:</strong> Concatenates entire history. Best for summarizing the whole conversation.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button
                          onClick={() => setEvalStrategy('smart')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${evalStrategy === 'smart'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'}`}
                        >
                          Smart Eval
                        </button>
                        <button
                          onClick={() => setEvalStrategy('overall')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${evalStrategy === 'overall'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'}`}
                        >
                          Overall Eval
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Chat Preview */}
                    {(chatHistory.length > 0 || context) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                        {/* Left Col: Conversation History */}
                        <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col h-96">
                          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 rounded-t-lg">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Conversation Flow</span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatHistory.length > 0 ? (
                              chatHistory.map((turn, idx) => (
                                <div key={idx} className={`flex ${turn.role === 'User' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${turn.role === 'User'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                    }`}>
                                    <div className="text-[10px] opacity-50 mb-1 uppercase font-bold tracking-wide">
                                      {turn.role}
                                    </div>
                                    {turn.message}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-slate-600 text-sm mt-10">
                                No conversation loaded.
                              </div>
                            )}
                          </div>
                          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                            {evalStrategy === 'smart'
                              ? "Targeting last Interaction for Evaluation"
                              : "Targeting Full Conversation for Evaluation"
                            }
                          </div>
                        </div>

                        {/* Right Col: Context & Target Data */}
                        <div className="flex flex-col h-96 gap-4">
                          {/* Context Viewer */}
                          <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col flex-1 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Retrieved Context</span>
                              <div className="group relative">
                                <Info className="w-3 h-3 text-slate-500 cursor-help" />
                                <div className="absolute right-0 top-full mt-2 w-56 p-2 bg-slate-900 text-[10px] text-slate-300 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                  Smart Context automatically extracts relevant text and scores from uploaded files, filtering out metadata noise.
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                              <p className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                                {context || <span className="opacity-30 italic">No context loaded...</span>}
                              </p>
                            </div>
                          </div>

                          {/* Evaluation Target Preview */}
                          <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 h-1/3 flex flex-col justify-center relative group">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-[10px] uppercase text-blue-400 font-bold">Analysis Target ({evalStrategy === 'smart' ? 'Latest Response' : 'Full Conversation'})</div>
                              <Info className="w-3 h-3 text-slate-500 cursor-help" />
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-0 mb-2 bg-slate-800 text-slate-300 text-[10px] p-2 rounded border border-slate-700 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                {evalStrategy === 'smart'
                                  ? "We automatically target the final substantive response for deep evaluation to assess RAG performance."
                                  : "We are evaluating the entire conversation history as a single document. Warning: May include conversational noise."
                                }
                              </div>
                            </div>
                            <div className="text-xs text-slate-300 truncate mb-1 border-l-2 border-blue-500 pl-2"><span className="opacity-50 text-[10px] uppercase">Query:</span> "{query}"</div>
                            <div className="text-xs text-slate-300 truncate border-l-2 border-green-500 pl-2"><span className="opacity-50 text-[10px] uppercase">Response:</span> "{response}"</div>
                          </div>
                        </div>

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
    </div >
  );
}

export default App;
