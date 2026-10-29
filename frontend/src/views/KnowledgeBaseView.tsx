import React, { useState, useEffect } from 'react';
import { BookOpen, UploadCloud, Search, FileText, Trash2, CheckCircle2, ShieldCheck, Eye, X } from 'lucide-react';
import { api, KnowledgeDoc } from '../services/api';

export const KnowledgeBaseView: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('Company Policy');

  // Diagnostic search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Chunk inspection state
  const [inspectDoc, setInspectDoc] = useState<KnowledgeDoc | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.listKnowledgeDocs();
      setDocs(res.data);
    } catch (err) {
      console.error('Failed to load knowledge documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_category', category);

    setUploading(true);
    try {
      await api.uploadKnowledgeDoc(formData);
      fetchDocs();
      alert(`Successfully parsed, chunked, and indexed '${file.name}' into RAG vector engine!`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document and its semantic chunks from the AI index?')) return;
    try {
      await api.deleteDoc(docId);
      fetchDocs();
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.testKnowledgeSearch(searchQuery);
      setSearchResults(res.data.matches);
    } catch (err) {
      console.error('Failed to test knowledge search', err);
    } finally {
      setSearching(false);
    }
  };

  const handleInspectChunks = async (doc: KnowledgeDoc) => {
    setInspectDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await api.getDocChunks(doc.id);
      setDocChunks(res.data);
    } catch (err) {
      console.error('Failed to load chunks', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Company Knowledge Base & RAG Index</h1>
          <p className="text-xs text-slate-500">
            Upload PDF, DOCX, TXT files. All facts, prices, and policies are strictly grounded against these documents.
          </p>
        </div>
      </div>

      {/* Upload Zone & Semantic Search Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Upload Document (PDF, DOCX, TXT)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Documents are automatically parsed, segmented into overlapping semantic passages, and indexed with vector embeddings.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mb-3"
              >
                <option value="Company Policy">Company Policy (Returns, Warranty, Security)</option>
                <option value="Product Catalogue">Product Catalogue & Technical Specifications</option>
                <option value="Frequently Asked Questions (FAQ)">Frequently Asked Questions (FAQ)</option>
                <option value="Operations & SLA">Operations & Business Hours SLA</option>
              </select>
            </div>
          </div>

          <div className="mt-2 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 rounded-2xl p-6 text-center transition-colors">
            <input
              type="file"
              id="docUploadInput"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="docUploadInput"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-blue-700">
                {uploading ? 'Extracting & Indexing Vectors...' : 'Click to select PDF, DOCX, or TXT file'}
              </span>
              <span className="text-[11px] text-slate-400">Max file size: 25 MB</span>
            </label>
          </div>
        </div>

        {/* Semantic Search Tester */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-600" />
            <span>Interactive Grounded RAG Search Tester</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Test inquiries in English, Tamil, Hindi, Telugu, or Malayalam to preview matching chunks and confidence scores.
          </p>

          <form onSubmit={handleTestSearch} className="flex items-center space-x-2 mt-4">
            <input
              type="text"
              placeholder="e.g. What is the return warranty on voice hardware?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {searching ? 'Querying...' : 'Search'}
            </button>
          </form>

          {/* Results Box */}
          <div className="flex-1 overflow-y-auto max-h-[190px] mt-3 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {searchResults.length === 0 ? (
              <p className="text-center text-[11px] text-slate-400 py-6">
                Type a test inquiry above to test vector retrieval.
              </p>
            ) : (
              searchResults.map((match, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-800">{match.doc_title}</span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Similarity: {match.similarity_score}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-3">{match.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Indexed Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Indexed Knowledge Documents</h2>
          <span className="text-xs text-slate-500">{docs.length} active documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Indexed Chunks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading documents...</td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No documents indexed yet.</td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{d.title}</p>
                          <p className="text-[10px] text-slate-400">{d.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase font-mono font-semibold text-slate-600">
                      {d.file_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{d.doc_category}</td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-700">
                      {d.chunks_count} chunks
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{d.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspectChunks(d)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Chunks</span>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chunk Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Vector Chunks: {inspectDoc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectDoc.chunks_count} semantic segments indexed with 128-dimensional normalized embeddings.
                </p>
              </div>
              <button onClick={() => setInspectDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingChunks ? (
                <p className="text-center py-6 text-slate-400">Loading chunk vectors...</p>
              ) : (
                docChunks.map((ch, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 mb-1">
                      <span>Chunk #{ch.chunk_index + 1}</span>
                      <span>{ch.token_count} words</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{ch.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

