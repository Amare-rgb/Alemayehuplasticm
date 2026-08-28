// app/admin/add-article/page.tsx
'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ArticleFormData {
  title: string;
  author: string;
  summary: string;
  content: string;
  pdfFile: File | null;
}

export default function AddArticlePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    author: '',
    summary: '',
    content: '',
    pdfFile: null,
  });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle text input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle PDF file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setSubmitStatus({
          type: 'error',
          message: 'Please select a valid PDF document.',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSubmitStatus({
          type: 'error',
          message: 'File size exceeds 10MB limit.',
        });
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPdfPreviewUrl(previewUrl);

      setFormData((prev) => ({
        ...prev,
        pdfFile: file,
      }));

      setSubmitStatus({ type: null, message: '' });
    }
  };

  // Remove PDF file
  const removePdfFile = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setFormData((prev) => ({
      ...prev,
      pdfFile: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter an article title.',
      });
      return;
    }

    if (!formData.author.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter the author name.',
      });
      return;
    }

    if (!formData.content.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter the article content.',
      });
      return;
    }

    if (!formData.pdfFile) {
      setSubmitStatus({
        type: 'error',
        message: 'Please upload a PDF document.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('You must be logged in to publish an article.');
      }

      // Create FormData object for API transmission
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('summary', formData.summary.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('pdfFile', formData.pdfFile);

      // Send to backend API
      const response = await fetch('http://localhost:5000/api/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
        // Do not set Content-Type header - browser sets it with boundary
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to save article');
      }

      setSubmitStatus({
        type: 'success',
        message: 'Article published successfully!',
      });

      // Reset form after successful submission
      setFormData({
        title: '',
        author: '',
        summary: '',
        content: '',
        pdfFile: null,
      });
      
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/articles');
      }, 2000);

    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to publish article. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Add New Article</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the article details and upload a PDF document
          </p>
        </div>

        {/* Status Message */}
        {submitStatus.type && (
          <div
            className={`mb-6 p-4 rounded-md print:hidden ${
              submitStatus.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 print:hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Article Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 border"
                  placeholder="Enter article title"
                  required
                />
              </div>

              {/* Author */}
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700"
                >
                  Author Name *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 border"
                  placeholder="Enter author name"
                  required
                />
              </div>

              {/* Summary */}
              <div>
                <label
                  htmlFor="summary"
                  className="block text-sm font-medium text-gray-700"
                >
                  Summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 border"
                  placeholder="Brief summary of the article"
                />
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700"
                >
                  Main Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={8}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-4 py-2 border"
                  placeholder="Write the main content of your article..."
                  required
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label
                  htmlFor="pdfFile"
                  className="block text-sm font-medium text-gray-700"
                >
                  PDF Document *
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="pdfFile"
                    name="pdfFile"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    required={!formData.pdfFile}
                  />
                  {formData.pdfFile && (
                    <button
                      type="button"
                      onClick={removePdfFile}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {formData.pdfFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {formData.pdfFile.name} ({(formData.pdfFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Article'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* PDF Preview Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 print:block">
              PDF Preview
            </h2>
            {pdfPreviewUrl ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                </div>
                <p className="text-sm text-gray-500 print:hidden">
                  {formData.pdfFile?.name} - Use the controls above to navigate
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center" style={{ height: '500px' }}>
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v20a4 4 0 004 4h24a4 4 0 004-4V14m-8 0l-8-8-8 8m16 0v20"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a PDF to preview here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Layout - Clean document view */}
        <div className="hidden print:block mt-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {formData.title || 'Article Title'}
            </h1>
            <p className="text-gray-600 mb-2">
              By {formData.author || 'Author Name'}
            </p>
            {formData.summary && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">{formData.summary}</p>
              </div>
            )}
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{formData.content || 'Article content goes here...'}</p>
            </div>
            {pdfPreviewUrl && (
              <div className="mt-8 border rounded-lg overflow-hidden" style={{ height: '800px' }}>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full"
                  title="PDF Document"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}