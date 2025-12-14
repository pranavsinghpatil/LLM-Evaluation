import React from 'react';
import { Zap, FileText, AlertTriangle, Clock, Database, CheckCircle, XCircle, ArrowRight, Cpu, Layers, ShieldCheck } from 'lucide-react';

const HowItWorks = () => {
    return (
        <div className="space-y-12 animate-fade-in pb-12">

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-medium mb-6">
                        <Cpu className="w-3 h-3" />
                        <span>Deterministic Evaluation Engine</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                        Under the Hood
                    </h2>
                    <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
                        A rigorous, multi-stage pipeline designed for <span className="text-white font-semibold">speed</span> and <span className="text-white font-semibold">accuracy</span>.
                        We replace "vibes" with mathematical certainty using advanced NLP metrics.
                    </p>
                </div>
            </div>


            {/* Problem & Solution Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-900/10 border border-red-500/20 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <XCircle className="w-6 h-6 text-red-500" />
                        <h3 className="text-xl font-bold text-white">The Problem</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        LLMs are "stochastic parrots". They hallucinate facts, ramble irrelevantly, or miss the point entirely.
                        In high-stakes fields like medicine or finance, a wrong answer isn't just annoying—it's dangerous.
                        Manually reviewing every chat is impossible at scale.
                    </p>
                </div>

                <div className="bg-green-900/10 border border-green-500/20 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h3 className="text-xl font-bold text-white">Our Solution</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        We built an automated <strong>Evaluation Pipeline</strong> that acts as a "Quality Control Check".
                        By using mathematical metrics (Cosine Similarity, NER), we verify if an answer is <span className="text-green-400">Relevant</span>, <span className="text-blue-400">Complete</span>, and <span className="text-orange-400">Factually Grounded</span> before it reaches the user.
                    </p>
                </div>
            </div>

            {/* The 3 Pillars - Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Relevance Card */}
                <div className="group relative bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-900/10 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Zap className="w-7 h-7 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Relevance</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            Ensures the LLM isn't dodging the question. We measure semantic alignment between the user's intent and the response.
                        </p>
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                            <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-2">
                                <span>ALGORITHM</span>
                                <span className="text-yellow-500">TF-IDF + Cosine</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Completeness Card */}
                <div className="group relative bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Layers className="w-7 h-7 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Completeness</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            Verifies that every part of the prompt is addressed. We extract key entities and check for their presence in the output.
                        </p>
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                            <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-2">
                                <span>ALGORITHM</span>
                                <span className="text-blue-500">NER Entity Coverage</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-4/5"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hallucination Card */}
                <div className="group relative bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <ShieldCheck className="w-7 h-7 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Hallucination</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            The safety net. We cross-reference every claim made by the LLM against the retrieved context to prevent misinformation.
                        </p>
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                            <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-2">
                                <span>ALGORITHM</span>
                                <span className="text-orange-500">N-gram Entailment</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="bg-slate-900/50 p-10 rounded-3xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center max-w-[200px]">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-4 shadow-xl">
                            <Database className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-white font-bold mb-1">Ingestion</h4>
                        <p className="text-xs text-slate-500">Query, Response & Context</p>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:block flex-1 h-px bg-slate-700 relative">
                        <div className="absolute right-0 -top-1.5 text-slate-600">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center max-w-[200px]">
                        <div className="w-16 h-16 bg-blue-900/20 rounded-2xl border border-blue-500/30 flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
                            <Cpu className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>
                        <h4 className="text-white font-bold mb-1">Processing</h4>
                        <p className="text-xs text-slate-500">&lt; 200ms Latency</p>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:block flex-1 h-px bg-slate-700 relative">
                        <div className="absolute right-0 -top-1.5 text-slate-600">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center max-w-[200px]">
                        <div className="w-16 h-16 bg-green-900/20 rounded-2xl border border-green-500/30 flex items-center justify-center mb-4 shadow-xl shadow-green-900/20">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h4 className="text-white font-bold mb-1">Verdict</h4>
                        <p className="text-xs text-slate-500">Pass / Fail Decision</p>
                    </div>
                </div>
            </div>

            {/* JSON Output Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Transparent Reporting</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed">
                        Every evaluation produces a structured JSON report. This isn't a black box; it's a fully auditable record of why a model passed or failed.
                        Perfect for CI/CD pipelines and automated regression testing.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-slate-300">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Detailed score breakdown</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Human-readable reasoning</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Latency and cost estimation</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        <span className="ml-2 text-xs font-mono text-slate-500">output.json</span>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <pre className="text-xs font-mono leading-relaxed">
                            <span className="text-purple-400">{"{"}</span>
                            <br />
                            <span className="text-blue-400">  "metrics"</span>: <span className="text-purple-400">{"{"}</span>
                            <br />
                            <span className="text-blue-300">    "relevance"</span>: <span className="text-yellow-300">0.92</span>,
                            <br />
                            <span className="text-blue-300">    "completeness"</span>: <span className="text-yellow-300">0.85</span>,
                            <br />
                            <span className="text-blue-300">    "hallucination"</span>: <span className="text-yellow-300">0.0</span>,
                            <br />
                            <span className="text-blue-300">    "latency_ms"</span>: <span className="text-yellow-300">45.2</span>
                            <br />
                            <span className="text-purple-400">  {"}"}</span>,
                            <br />
                            <span className="text-blue-400">  "verdict"</span>: <span className="text-purple-400">{"{"}</span>
                            <br />
                            <span className="text-blue-300">    "status"</span>: <span className="text-green-400">"PASS"</span>,
                            <br />
                            <span className="text-blue-300">    "reasons"</span>: [
                            <br />
                            <span className="text-orange-300">      "High relevance score"</span>,
                            <br />
                            <span className="text-orange-300">      "No hallucinations detected"</span>
                            <br />
                            <span className="text-slate-500">    ]</span>
                            <br />
                            <span className="text-purple-400">  {"}"}</span>
                            <br />
                            <span className="text-purple-400">{"}"}</span>
                        </pre>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HowItWorks;
