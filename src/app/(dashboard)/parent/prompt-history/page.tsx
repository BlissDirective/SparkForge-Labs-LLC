// ════════════════════════════════════════════════════
// PARENT — Prompt History Page
// Shows child's AI prompt interactions from Prompt Lab
// Frost-Prismatic dark-mode design, ARIA labels
// ════════════════════════════════════════════════════
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  ArrowLeft, Search, Download, MessageSquare, Clock,
  User, Filter, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import Link from 'next/link';

// ═══ Types ═══

interface PromptHistoryEntry {
  id: string;
  childId: string;
  childName: string;
  timestamp: string;
  prompt: string;
  response: string;
  wordCount: number;
  labId: number;
  labName: string;
}

// ═══ Mock Data Generator ═══

function generateMockPrompts(
  children: { id: string; display_name: string }[]
): PromptHistoryEntry[] {
  const prompts = [
    { prompt: 'What is machine learning?', response: 'Machine learning is a type of artificial intelligence where computers learn from data instead of being explicitly programmed. Think of it like teaching a dog tricks — you show examples and the computer figures out the pattern!', labId: 2, labName: 'Teaching Machines' },
    { prompt: 'How do neural networks work?', response: 'Neural networks are inspired by the human brain. They have layers of connected nodes (like neurons) that process information. Each connection has a weight that gets adjusted during training.', labId: 3, labName: 'The Brain Inside' },
    { prompt: 'Can AI create art?', response: 'Yes! AI can create art using generative models. These models learn patterns from thousands of existing artworks and can then create new, original pieces based on text descriptions or style references.', labId: 4, labName: 'AI That Creates' },
    { prompt: 'What is a chatbot?', response: 'A chatbot is an AI program designed to have conversations with humans. It uses natural language processing to understand what you say and generate helpful responses.', labId: 8, labName: 'Words & Language' },
    { prompt: 'Is AI dangerous?', response: 'AI itself is a tool — it can be used for good or bad purposes. The important thing is that we build AI responsibly, with safety measures and fairness in mind. That is why studying AI ethics matters!', labId: 6, labName: 'AI & Ethics' },
    { prompt: 'How does AI see images?', response: 'AI uses computer vision to analyze images pixel by pixel. It looks for patterns like edges, colors, and shapes. With enough training examples, it can recognize objects, faces, and even emotions in pictures.', labId: 7, labName: 'Computer Vision' },
    { prompt: 'What are tokens in AI?', response: 'Tokens are small pieces of text that AI models work with. A token might be a word, part of a word, or even a single character. When you type a message, the AI breaks it into tokens to process it.', labId: 4, labName: 'AI That Creates' },
    { prompt: 'How do self-driving cars work?', response: 'Self-driving cars use a combination of cameras, radar, and AI to understand their surroundings. The AI processes all this sensor data in real-time to make driving decisions like steering, braking, and accelerating.', labId: 5, labName: 'AI Helpers' },
    { prompt: 'What is bias in AI?', response: 'AI bias happens when an AI system makes unfair decisions because of problems in its training data. For example, if an AI only sees pictures of one type of dog, it might not recognize other breeds. We need diverse, balanced data to build fair AI.', labId: 6, labName: 'AI & Ethics' },
    { prompt: 'Can AI write code?', response: 'Yes! AI code assistants can help write, debug, and explain code. They have been trained on millions of code examples and can suggest completions, fix bugs, and even write entire functions based on descriptions.', labId: 9, labName: 'Build Your AI' },
    { prompt: 'What will AI look like in the future?', response: 'AI in the future will likely be more integrated into daily life — smarter assistants, better healthcare diagnostics, more creative tools, and new inventions we have not even imagined yet!', labId: 10, labName: 'AI Futures' },
    { prompt: 'How does AI learn from data?', response: 'AI learns by finding patterns in large amounts of data. During training, the AI adjusts its internal settings (called parameters) to minimize errors. It is like practicing a skill — the more you practice with good examples, the better you get.', labId: 2, labName: 'Teaching Machines' },
  ];

  const entries: PromptHistoryEntry[] = [];
  let idCounter = 0;

  for (const child of children) {
    const count = 8 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const template = prompts[Math.floor(Math.random() * prompts.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);

      entries.push({
        id: `prompt-${idCounter++}`,
        childId: child.id,
        childName: child.display_name,
        timestamp: date.toISOString(),
        prompt: template.prompt,
        response: template.response,
        wordCount: template.response.split(/\s+/).length,
        labId: template.labId,
        labName: template.labName,
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ═══ Constants ═══

const ITEMS_PER_PAGE = 10;

// ═══ Component ═══

export default function PromptHistoryPage() {
  const { children, isLoading } = useParentDashboard();

  const [mockData, setMockData] = useState<PromptHistoryEntry[]>([]);
  const [filterChildId, setFilterChildId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate mock data once children load
  useEffect(() => {
    if (children.length > 0 && mockData.length === 0) {
      setMockData(generateMockPrompts(children));
    }
  }, [children, mockData.length]);

  // Filtered data
  const filtered = useMemo(() => {
    return mockData.filter((entry) => {
      if (filterChildId !== 'all' && entry.childId !== filterChildId) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !entry.prompt.toLowerCase().includes(q) &&
          !entry.response.toLowerCase().includes(q)
        )
          return false;
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(entry.timestamp) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(entry.timestamp) > to) return false;
      }
      return true;
    });
  }, [mockData, filterChildId, searchText, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterChildId, searchText, dateFrom, dateTo]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const header = 'Timestamp,Child,Prompt,Response,Word Count,Lab\n';
    const rows = filtered
      .map((e) => {
        const ts = new Date(e.timestamp).toLocaleString();
        const prompt = `"${e.prompt.replace(/"/g, '""')}"`;
        const response = `"${e.response.replace(/"/g, '""')}"`;
        return `${ts},${e.childName},${prompt},${response},${e.wordCount},${e.labName}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparkforge-prompt-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // ═══ Loading skeleton ═══
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/parent"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
            aria-label="Back to Parent Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Prompt History</h1>
            <p className="font-body text-sm text-white/40">
              Review your children&apos;s AI interactions in Prompt Lab
            </p>
          </div>
        </div>
        <motion.button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-body text-sm hover:border-spark-blue/30 hover:text-spark-blue transition-all inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.97 }}
          aria-label="Export prompt history as CSV"
        >
          <Download className="w-4 h-4" /> Export CSV
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-spark-blue" />
          <span className="font-display text-sm font-bold text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Child filter */}
          <div>
            <label htmlFor="filter-child" className="font-body text-xs text-white/30 mb-1 block">
              Child
            </label>
            <select
              id="filter-child"
              value={filterChildId}
              onChange={(e) => setFilterChildId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:border-spark-blue/50 focus:outline-none appearance-none cursor-pointer"
              aria-label="Filter by child"
            >
              <option value="all">All Children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="filter-search" className="font-body text-xs text-white/30 mb-1 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="filter-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/20 focus:border-spark-blue/50 focus:outline-none"
                aria-label="Search prompt text"
              />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label htmlFor="filter-date-from" className="font-body text-xs text-white/30 mb-1 block">
              From
            </label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:border-spark-blue/50 focus:outline-none [color-scheme:dark]"
              aria-label="Filter from date"
            />
          </div>

          {/* Date to */}
          <div>
            <label htmlFor="filter-date-to" className="font-body text-xs text-white/30 mb-1 block">
              To
            </label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:border-spark-blue/50 focus:outline-none [color-scheme:dark]"
              aria-label="Filter to date"
            />
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-4">
        <p className="font-body text-sm text-white/40">
          <span className="font-data text-spark-blue">{filtered.length}</span> prompt{filtered.length !== 1 ? 's' : ''} found
        </p>
      </motion.div>

      {/* Prompt list */}
      <AnimatePresence mode="wait">
        {paginated.length === 0 ? (
          <motion.div
            key="empty"
            variants={staggerItem}
            initial="initial"
            animate="animate"
            exit="initial"
            className="text-center py-16"
          >
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-white mb-2">No prompts found</h2>
            <p className="font-body text-sm text-white/40">
              {children.length === 0
                ? 'Add a child profile to start tracking prompt history'
                : 'Try adjusting your filters or date range'}
            </p>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-3">
            {paginated.map((entry, idx) => (
              <motion.div
                key={entry.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                className="glass-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={expandedId === entry.id}
                  aria-label={`Prompt: ${entry.prompt}. Click to ${expandedId === entry.id ? 'collapse' : 'expand'} response`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <User className="w-3.5 h-3.5 text-spark-purple flex-shrink-0" />
                        <span className="font-body text-xs text-spark-purple font-semibold">
                          {entry.childName}
                        </span>
                        <span className="font-body text-xs text-white/20">|</span>
                        <span className="font-body text-xs text-white/30">
                          {entry.labName}
                        </span>
                      </div>
                      <p className="font-body text-sm text-white truncate">
                        {entry.prompt}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-white/30">
                        <Clock className="w-3 h-3" />
                        <span className="font-data text-xs">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/20">
                        <FileText className="w-3 h-3" />
                        <span className="font-data text-xs">{entry.wordCount} words</span>
                      </div>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="border-t border-white/5 pt-3">
                          <p className="font-body text-xs text-white/30 mb-1.5">AI Response:</p>
                          <p className="font-body text-sm text-white/70 leading-relaxed">
                            {entry.response}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="font-data text-xs text-white/20">
                              {new Date(entry.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="font-data text-xs text-white/20">
                              Lab {entry.labId}: {entry.labName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <motion.button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.95 }}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => {
                const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <span key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-white/20 font-data text-xs">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-data text-xs transition-all ${
                        currentPage === page
                          ? 'bg-spark-blue/20 border border-spark-blue/30 text-spark-blue font-bold'
                          : 'bg-white/5 border border-white/10 text-white/40 hover:border-white/20'
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
          </div>

          <motion.button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.95 }}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
