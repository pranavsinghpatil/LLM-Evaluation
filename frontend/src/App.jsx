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
                {/* Compact Input Configuration */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Header & Toggle */}
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Data Source</h2>
                        <div className="flex items-center gap-2 mt-1">
                          {['manual', 'upload'].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setInputMode(mode)}
                              className={`text-xs px-2 py-0.5 rounded transition-colors ${inputMode === mode
                                ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                                : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {mode === 'manual' ? 'Manual' : 'Upload'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Upload Controls (Only in Upload Mode) */}
                    {inputMode === 'upload' && (
                      <div className="flex flex-1 md:justify-end gap-3">
                        <label className="cursor-pointer group flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all">
                          <div className="p-1.5 bg-blue-500/10 rounded group-hover:bg-blue-500/20 transition-colors">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-semibold text-slate-300 group-hover:text-blue-400 transition-colors">Chat JSON</div>
                            <div className="text-[10px] text-slate-500">Upload conversation</div>
                          </div>
                          <input type="file" accept=".json" onChange={(e) => handleFileUpload(e, 'chat')} className="hidden" />
                        </label>

                        <label className="cursor-pointer group flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-all">
                          <div className="p-1.5 bg-purple-500/10 rounded group-hover:bg-purple-500/20 transition-colors">
                            <Database className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-semibold text-slate-300 group-hover:text-purple-400 transition-colors">Context JSON</div>
                            <div className="text-[10px] text-slate-500">Upload vectors</div>
                          </div>
                          <input type="file" accept=".json" onChange={(e) => handleFileUpload(e, 'context')} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {inputMode === 'upload' ? (
                  <div className="space-y-6 animate-fade-in">

                    {/* Strategy Toggle & Samples */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
                      <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                        <button
                          onClick={() => setEvalStrategy('smart')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${evalStrategy === 'smart'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                          <Zap className="w-3 h-3" />
                          Smart Eval
                        </button>
                        <button
                          onClick={() => setEvalStrategy('overall')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${evalStrategy === 'overall'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                          <FileText className="w-3 h-3" />
                          Overall Eval
                        </button>
                      </div>

                      <button onClick={loadPresetSamples} className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors font-medium">
                        <PlayCircle className="w-3 h-3" />
                        Load Demo Data
                      </button>
                    </div>


                    {/* Main Dashboard Grid */}
                    {(chatHistory.length > 0 || context) && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">

                        {/* Left Panel: Chat Interface (7 cols) */}
                        <div className="lg:col-span-7 bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl">
                          {/* Chat Header */}
                          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              Conversation Flow
                            </h3>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {chatHistory.length} Turns
                            </span>
                          </div>

                          {/* Messages Area */}
                          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {chatHistory.length > 0 ? (
                              chatHistory.map((turn, idx) => (
                                <div key={idx} className={`flex gap-4 ${turn.role === 'User' ? 'flex-row-reverse' : 'flex-row'}`}>
                                  {/* Avatar */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${turn.role === 'User' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                    <span className="text-xs font-bold text-white">{turn.role[0]}</span>
                                  </div>

                                  {/* Bubble */}
                                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${turn.role === 'User'
                                      ? 'bg-blue-600 text-white rounded-tr-none'
                                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                    }`}>
                                    {turn.message}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <MessageSquare className="w-12 h-12 mb-2" />
                                <p className="text-sm">No conversation history</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Panel: Context & Analysis Data (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col gap-6 h-full">

                          {/* Context Viewer */}
                          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between">
                              <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wide">
                                <Database className="w-3 h-3" />
                                Retrieved Context
                              </h3>
                              <div className="group relative">
                                <Info className="w-3 h-3 text-slate-600 hover:text-purple-400 transition-colors cursor-help" />
                                <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                                  Source documents used by the LLM.
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
                              <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed font-light">
                                {context || <span className="text-slate-600 italic">No context data loaded...</span>}
                              </pre>
                            </div>
                          </div>

                          {/* Active Analysis Target */}
                          <div className="h-1/3 bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                Current Analysis Target
                              </h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${evalStrategy === 'smart' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                {evalStrategy === 'smart' ? 'Smart Mode' : 'Overall Mode'}
                              </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900 to-slate-900/50">
                              <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold text-blue-500">Query</div>
                                <div className="text-xs text-slate-300 line-clamp-2 pl-2 border-l-2 border-slate-700">{query || "Waiting..."}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold text-green-500">Response</div>
                                <div className="text-xs text-slate-300 line-clamp-3 pl-2 border-l-2 border-slate-700">{response || "Waiting..."}</div>
                              </div>
                            </div>
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
