import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Database,
  MessageSquare,
  FileText,
  Info,
  PlayCircle,
  Copy,
  Download,
} from "lucide-react";
import HowItWorks from "./HowItWorks";

// API URL - uses environment variable in production
// API URL - uses environment variable in production. Trims trailing slash if present.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function App() {
  const [activeTab, setActiveTab] = useState("evaluator"); // 'evaluator' | 'how-it-works'
  const [inputMode, setInputMode] = useState("upload"); // 'manual' | 'upload'
  const [query, setQuery] = useState("What is the capital of France?");
  const [response, setResponse] = useState("The capital of France is Paris.");
  const [context, setContext] = useState(
    "France is a country in Western Europe. Its capital is Paris, known for the Eiffel Tower.",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Split context by newlines if it's a string, or keep as is
      const contextList = context
        .split("\n")
        .filter((line) => line.trim() !== "");

      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          response,
          context: contextList,
        }),
      });

      if (!res.ok) {
        let errorMsg = `Server Error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch (e) {
          // ignore invalid json
        }
        throw new Error(errorMsg);
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
    setResponse(
      "The health benefits of Green tea include being rich in antioxidants called catechins, which may help prevent cell damage. It can also improve brain function, fat loss, and lower the risk of heart disease.",
    );
    setContext(
      "Green tea is loaded with antioxidants that have many health benefits, which may include improved brain function, fat loss, protecting against cancer, and lowering the risk of heart disease.\nThe main antioxidant in green tea is EGCG (Epigallocatechin Gallate).\nGreen tea contains less caffeine than coffee but enough to produce an effect.",
    );
  };

  const [chatHistory, setChatHistory] = useState([]); // Store full conversation for display
  const [evalStrategy, setEvalStrategy] = useState("smart"); // 'smart' | 'overall'

  // Clear default data when switching to Upload mode
  useEffect(() => {
    if (inputMode === "upload") {
      setQuery("");
      setResponse("");
      setContext("");
      setChatHistory([]); // Clear history
      setResult(null);
      setError(null);
      setEvalStrategy("smart");
    } else {
      // Restore sample data for manual mode
      loadSampleData();
      setChatHistory([]);
    }
  }, [inputMode]);

  // Re-calculate Query/Response whenever Chat History or Strategy changes (Only in Upload Mode)
  useEffect(() => {
    if (inputMode !== "upload" || chatHistory.length === 0) return;

    if (evalStrategy === "smart") {
      // SMART STRATEGY (Default): Focus on the last substantive interaction
      let turns = [...chatHistory];
      let aiTurnIndex = -1;

      // Find last AI response
      for (let i = turns.length - 1; i >= 0; i--) {
        if (turns[i].role === "AI/Chatbot") {
          aiTurnIndex = i;
          break;
        }
      }

      if (aiTurnIndex !== -1) {
        const aiTurn = turns[aiTurnIndex];
        setResponse(aiTurn.message);

        // Find valid user query preceding this response
        const userTurnIndex = turns
          .slice(0, aiTurnIndex)
          .reverse()
          .findIndex((t) => t.role === "User");

        if (userTurnIndex !== -1) {
          const absoluteUserIndex = aiTurnIndex - 1 - userTurnIndex;
          const userTurn = turns[absoluteUserIndex];

          let finalQuery = userTurn.message;

          // Augment with previous system turn if available (for context)
          if (absoluteUserIndex > 0) {
            const prevSystemTurn = turns[absoluteUserIndex - 1];
            if (prevSystemTurn) {
              finalQuery = `[Previous Context]: "${prevSystemTurn.message.substring(0, 100)}..."
[User Question]: ${userTurn.message}`;
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
    }
  }, [chatHistory, evalStrategy, inputMode]);

  // Universal Smart Context Extractor
  const extractSmartContext = (data) => {
    if (!data) return "";

    // 1. Direct string match
    if (typeof data === "string") return data;

    // 2. Array of strings
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
      return data.join("\n\n");
    }

    // 3. Recursive search for content fields
    let gatheredTexts = [];
    const traverse = (node) => {
      if (!node) return;

      if (Array.isArray(node)) {
        node.forEach(traverse);
        return;
      }

      if (typeof node === "object") {
        // Check for specific content keys prioritized by likelihood
        // 'text' maps to the sample format. 'page_content' is common in LangChain.
        const content =
          node.text ||
          node.content ||
          node.page_content ||
          node.pageContent ||
          node.snippet ||
          node.body;

        // Check for score/relevance keys
        const score =
          node.score || node.similarity || node.relevance || node.vector_score;

        if (
          content &&
          typeof content === "string" &&
          content.trim().length > 0
        ) {
          // Verify if score is a valid number
          const scoreStr =
            score !== undefined && score !== null && !isNaN(score)
              ? `[Score: ${Number(score).toFixed(4)}] `
              : "";
          gatheredTexts.push(`${scoreStr}${content}`);
          // If we found content, we generally don't need to traverse children of this node looking for more chunks
          // unless it's a structural node, but usually 'text' is a leaf content node.
          return;
        }

        // Navigate into likely container keys
        // We scan all keys but skip metadata to be efficient and reduce noise
        const skipKeys = [
          "id",
          "tokens",
          "created_at",
          "status",
          "status_code",
          "message",
          "type",
          "metadata",
        ];

        Object.keys(node).forEach((key) => {
          if (!skipKeys.includes(key)) {
            traverse(node[key]);
          }
        });
      }
    };

    traverse(data);

    if (gatheredTexts.length > 0) {
      return gatheredTexts.join("\n\n");
    }

    // 4. Fallback: Pretty print if no patterns matched
    return JSON.stringify(data, null, 2);
  };

  const processParsedJson = (json, type) => {
    if (type === "chat") {
      // Handle simple format
      if (json.query && json.response) {
        setQuery(json.query);
        setResponse(json.response);
        setChatHistory([]);
      }
      // Handle complex conversation format
      else if (
        json.conversation_turns &&
        Array.isArray(json.conversation_turns)
      ) {
        let turns = json.conversation_turns;
        // 1. Sort by turn ID to ensure correct chronological order
        turns = turns.sort((a, b) => (a.turn || 0) - (b.turn || 0));
        setChatHistory(turns);
      }
    } else if (type === "context") {
      // Use Universal Smart Extractor
      const extractedText = extractSmartContext(json);
      setContext(extractedText);
    }
  };

  const parseJsonWithComments = (text) => {
    // 1. Remove comments safely (ignoring // inside strings like URLs)
    // Regex matches either a String ("...") OR a Comment (//...)
    let cleanText = text.replace(
      /("(?:[^"\\]|\\.)*")|(\/\/.*$)/gm,
      (match, strGroup) => {
        // If it Matched a String, keep it
        if (strGroup) return strGroup;
        // If it Matched a Comment, remove it
        return "";
      },
    );

    // 2. Fix unescaped control characters (newlines/tabs) inside strings
    // This regex matches JSON string literals (double-quoted)
    cleanText = cleanText.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
      return match
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\r/g, "") // Remove carriage returns
        .replace(/\t/g, "\\t"); // Escape tabs
    });

    // 3. Fix trailing commas (invalid in JSON but common in manual files)
    cleanText = cleanText.replace(/,\s*([\\\]}])/g, "$1");

    return JSON.parse(cleanText);
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    // Optional: show toast, but for now user will see visual feedback or just assume it worked
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evaluation_report.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      const chatRes = await fetch("/samples/sample-chat-conversation-01.json");
      const chatText = await chatRes.text();
      const chatJson = parseJsonWithComments(chatText);
      processParsedJson(chatJson, "chat");

      const contextRes = await fetch("/samples/sample_context_vectors-01.json");
      const contextText = await contextRes.text();
      const contextJson = parseJsonWithComments(contextText);
      processParsedJson(contextJson, "context");
    } catch (err) {
      setError(`Failed to load preset samples: ${err.message}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar / Header */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                LLM Eval Pipeline
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                Automated Quality Assurance
              </p>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
            {[
              { id: "evaluator", icon: PlayCircle, label: "Evaluator" },
              { id: "how-it-works", icon: Info, label: "How it Works" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {activeTab === "how-it-works" ? (
          <HowItWorks />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* LEFT COLUMN: Input & Configuration */}
            <div className="lg:col-span-7 space-y-6">

              {/* Data Source Card */}
              <div className="glass-card rounded-2xl p-1 overflow-hidden">
                <div className="bg-slate-900/40 p-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-white/5">
                      <Database className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Data Source</h2>
                      <p className="text-xs text-slate-400">Choose your input method</p>
                    </div>
                  </div>

                  {/* Segmented Control */}
                  <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                    {["manual", "upload"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setInputMode(mode)}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 capitalize ${inputMode === mode
                          ? "bg-slate-700 text-white shadow-sm ring-1 ring-white/10"
                          : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-900/20">
                  {inputMode === "upload" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="group relative flex flex-col items-center justify-center p-6 border border-dashed border-slate-700 rounded-xl hover:bg-white/5 hover:border-blue-500/50 transition-all cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-300 group-hover:text-blue-400 text-center">Upload Conversation History</span>
                          <span className="text-[10px] text-slate-500 mt-1">.json</span>
                          <input type="file" accept=".json" onChange={(e) => handleFileUpload(e, "chat")} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>

                        <label className="group relative flex flex-col items-center justify-center p-6 border border-dashed border-slate-700 rounded-xl hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-300 group-hover:text-purple-400 text-center">Upload Retrieved Context</span>
                          <span className="text-[10px] text-slate-500 mt-1">.json</span>
                          <input type="file" accept=".json" onChange={(e) => handleFileUpload(e, "context")} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                      </div>

                      {/* Strategy Selection */}


                      <div className="flex justify-end">
                        <button
                          onClick={loadPresetSamples}
                          className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Load Sample Data
                        </button>
                      </div>

                      {/* Data Preview */}
                      {(chatHistory.length > 0 || context) && (
                        <div className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 h-96">
                            {/* Chat Preview */}
                            <div className="border-r border-slate-800 flex flex-col">
                              <div className="p-3 border-b border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-400 flex justify-between items-center">
                                <span>Chat History</span>
                                <span className="badge bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{chatHistory.length} turns (messages)</span>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                                {chatHistory.length === 0 ? (
                                  <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">No chat loaded</div>
                                ) : (
                                  chatHistory.map((turn, i) => (
                                    <div key={i} className={`flex gap-3 ${turn.role === 'User' ? 'flex-row-reverse' : ''}`}>
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${turn.role === 'User' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                        {turn.role[0]}
                                      </div>
                                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${turn.role === 'User'
                                        ? 'bg-blue-600/20 text-blue-100 rounded-tr-none'
                                        : 'bg-slate-800 text-slate-300 rounded-tl-none'
                                        }`}>
                                        {turn.message}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Context Preview */}
                            <div className="flex flex-col">
                              <div className="p-3 border-b border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-400 flex justify-between items-center">
                                <span>Retrieved Context</span>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 text-xs font-mono text-slate-400 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                                {context || <span className="text-slate-600 italic">No context loaded...</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Query</label>
                          <button onClick={loadSampleData} className="text-[10px] text-blue-400 hover:underline">Load Sample</button>
                        </div>
                        <textarea
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                          rows="2"
                          placeholder="Enter the user's question here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LLM Response</label>
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                          rows="4"
                          placeholder="Paste the AI's response here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retrieved Context</label>
                        <textarea
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-700"
                          rows="6"
                          placeholder="Paste the RAG context chunks here..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <button
                      onClick={handleEvaluate}
                      disabled={loading || !query || !response}
                      className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-3 ${loading || !query || !response
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/20"
                        }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Evaluation</span>
                          <Zap className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="lg:col-span-5 space-y-6">
              {!result && !loading && !error && (
                <div className="h-full min-h-[400px] glass-card rounded-2xl border-dashed border-2 border-slate-800 flex flex-col items-center justify-center p-12 text-center group">
                  <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Activity className="w-10 h-10 text-slate-600 group-hover:text-blue-500 transition-colors duration-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Evaluate</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Input your data locally or upload a JSON dataset to generate quality metrics.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-red-400">Evaluation Failed</h3>
                    <p className="text-xs text-red-300/70 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-fade-in">
                  {/* Verdict Banner */}
                  <div className={`relative overflow-hidden rounded-2xl p-6 border ${result.verdict.status === 'PASS'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {result.verdict.status === 'PASS' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                          <h2 className={`text-2xl font-bold ${result.verdict.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                            {result.verdict.status}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Latency: {result.metrics.latency_ms.toFixed(0)}ms</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${result.verdict.status === 'PASS'
                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                        : 'bg-red-500/20 border-red-500/30 text-red-300'
                        }`}>
                        Verdict
                      </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                      {result.verdict.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.verdict.status === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          <span className="opacity-90">{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Artistic BG Blur */}
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 blur-3xl opacity-20 rounded-full ${result.verdict.status === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                  </div>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Relevance", score: result.metrics.relevance, icon: Zap, color: "text-amber-400", bg: "bg-amber-500" },
                      { label: "Completeness", score: result.metrics.completeness, icon: FileText, color: "text-blue-400", bg: "bg-blue-500" },
                      { label: "Hallucination", score: result.metrics.hallucination, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500", inverse: true },
                    ].map((metric, i) => (
                      <div key={i} className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${metric.bg}`} />
                        <metric.icon className={`w-5 h-5 mb-2 ${metric.color}`} />
                        <div className="text-2xl font-bold text-slate-200 mb-1">
                          {(metric.score * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{metric.label}</div>

                        {/* Progress Bar visual at bottom */}
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
                          <div
                            className={`h-full ${metric.bg} transition-all duration-1000`}
                            style={{ width: `${metric.score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* JSON Dump */}
                  <div className="glass-panel p-0 rounded-xl overflow-hidden text-xs">
                    <div className="px-4 py-2 bg-slate-950/80 border-b border-white/5 flex justify-between items-center text-slate-500">
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        <span className="font-mono">RAW_JSON_OUTPUT</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyJson}
                          className="hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDownloadJson}
                          className="hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                          title="Download .json"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 overflow-x-auto text-emerald-400/90 font-mono leading-relaxed">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-2 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>Built by</span>
            <a
              href="https://prnav.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors font-medium"
            >
              PranavSingh
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/pranavsinghpatil/LLM-Evaluation-Pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              GitHub
            </a>
            <a
              href="https://twitter.com/pranavenv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              Twitter
            </a>
            <a
              href="https://linkedin.com/in/pranavsinghpatil"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
