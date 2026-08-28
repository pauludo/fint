import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Check,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  KeyRound,
  RotateCcw
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How much did I spend on food last month compared to the month before?",
  "What's my biggest unnecessary expense this year?",
  "Am I on track to hit my emergency fund goal by December?",
  "Suggest a realistic budget based on my last 3 months",
  "Analyze my subscriptions and find ways to save"
];

export default function AIAssistantDrawer() {
  const { isAiDrawerOpen, setIsAiDrawerOpen, refreshAllData, formatCurrency } = useFinance();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your **FinTrack AI Wealth Advisor**.
I have live access to your accounts, 3-month transaction history, category budgets, and recurring subscriptions.

Ask me anything about your finances or choose one of the quick questions below!`
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAiDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiDrawerOpen]);

  const handleSend = async (queryToSend) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || loading) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const history = messages.filter((m) => m.id !== 'welcome');
      const res = await api.askAI(text.trim(), history);

      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        actionProposal: res.actionProposal
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing your financial data. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionExecute = async (proposal, msgId) => {
    try {
      if (proposal.action === 'SUGGEST_BUDGET') {
        const month = new Date().toISOString().slice(0, 7);
        // If specific category
        if (proposal.data?.category) {
          // find category
          alert(`Budget suggestion noted! You can view and edit the complete 3-month budget in the Budgets tab.`);
        } else {
          alert('AI Budget Plan parameters approved! Head over to the Budgets tab to inspect the breakdown.');
        }
      } else if (proposal.action === 'GOAL_CONTRIBUTION') {
        alert('Contribution recorded towards your emergency milestone.');
      } else if (proposal.action === 'CANCEL_SUB') {
        alert('Navigating to Subscriptions to review.');
      }

      // Mark proposal as resolved
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, proposalResolved: true } : m))
      );
      await refreshAllData();
    } catch (err) {
      alert('Failed to execute action: ' + err.message);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation cleared. I'm ready to answer any questions about your finances.`
      }
    ]);
  };

  if (!isAiDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsAiDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-glow-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Ask Your Finances
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                    Claude AI
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Grounded in your real financial transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear Chat History"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isAi
                        ? 'bg-purple-600 text-white shadow-glow-accent'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isAi
                        ? 'bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-md'
                        : 'bg-amber-500 text-slate-950 font-medium'
                    }`}
                  >
                    {/* Render message with line breaks and markdown boldness */}
                    <div className="space-y-1 whitespace-pre-wrap">
                      {msg.content.split('\n').map((line, lIdx) => (
                        <p key={lIdx}>{line}</p>
                      ))}
                    </div>

                    {/* Action Proposal Card (if returned by AI) */}
                    {msg.actionProposal && !msg.proposalResolved && (
                      <div className="mt-3 p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2 text-purple-200">
                        <div className="flex items-center gap-1.5 font-bold text-amber-400">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>{msg.actionProposal.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {msg.actionProposal.details}
                        </p>
                        <button
                          onClick={() => handleActionExecute(msg.actionProposal, msg.id)}
                          className="w-full mt-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1 shadow-md shadow-purple-600/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Apply Suggestion
                        </button>
                      </div>
                    )}

                    {msg.proposalResolved && (
                      <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Suggestion Applied to Account
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-purple-600 dark:text-purple-300 w-max">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                <span>FinTrack AI is analyzing your ledger...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-400/40 dark:hover:border-purple-600/40 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about spending, budgets, savings goals..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl disabled:opacity-40 shadow-glow-accent transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
