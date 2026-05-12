import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../lib/api.js';

export default function UploadModal({ onClose }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/upload');
      setDocuments(data.documents);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(`"${data.document.originalName}" uploaded successfully`);
      fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this document?')) return;
    try {
      await api.delete(`/upload/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setUploadError('Failed to delete document');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Document Library</h2>
            <p className="text-sm text-gray-400 mt-0.5">Upload PDFs or text files for RAG</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragOver
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader size={28} className="animate-spin text-green-400" />
                <span className="text-sm">Uploading & indexing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={28} className={dragOver ? 'text-green-400' : ''} />
                <span className="text-sm font-medium text-gray-300">Drop file here or click to browse</span>
                <span className="text-xs">PDF · Word · Excel · CSV · TXT · Code files · Max 25MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.js,.ts,.py,.java,.c,.cpp,.html,.css,.json,.xml,.yaml,.yml,.sql"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Feedback */}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={15} />
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
              <CheckCircle size={15} />
              {uploadSuccess}
            </div>
          )}

          {/* Document list */}
          {documents.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Uploaded documents ({documents.length})</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2.5"
                  >
                    <FileText size={16} className="text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.original_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatSize(doc.file_size)} · {doc.chunk_count} chunks · {doc.file_type.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-gray-500 hover:text-red-400 transition shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && !uploading && (
            <p className="text-center text-gray-500 text-sm py-2">No documents uploaded yet</p>
          )}
        </div>

        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 text-center">
            Enable "RAG On" in the chat input to use these documents as context
          </p>
        </div>
      </div>
    </div>
  );
}
