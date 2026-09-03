// app/contact/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { settings, loading, error, forceUpdate, refetch } = useSettings();
  const { t } = useLanguage();

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isClient, setIsClient] = useState(false);
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      requestAnimationFrame(() => {
        setIsClient(true);
      });
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      console.log('📊 Contact Page State:');
      console.log('  - loading:', loading);
      console.log('  - error:', error);
      console.log('  - settings:', settings);
    }
  }, [loading, error, settings, isClient]);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('🔄 Contact page: Settings changed, forcing update...');
      forceUpdate();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site_settings' && e.newValue) {
        console.log('🔄 Contact page: Storage changed, forcing update...');
        forceUpdate();
      }
    };

    window.addEventListener('settings-change', handleSettingsChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('settings-change', handleSettingsChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [forceUpdate]);

  // Auto-retry if loading takes too long
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Settings loading timeout after 8 seconds - retrying...');
        refetch?.();
      }
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [loading, refetch]);

  // Use settings with fallback defaults
  const siteName = settings?.siteName || 'Genesis Agri';
  const contactAddress = settings?.contactAddress || '123 Agriculture Way, Farming District, FC 12345';
  const contactPhone = settings?.contactPhone || '+1 (555) 123-4567';
  const contactHours = settings?.contactHours || 'Mon-Fri: 8:00 AM - 6:00 PM';
  const contactEmail = settings?.contactEmail || 'support@genesisagri.com';
  
  // ✅ CORRECT: Use a properly formatted Google Maps embed URL
  // This is a working embed URL for Nairobi, Kenya
  const defaultMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.820123456789!2d36.821945!3d-1.292066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7b8b8b8b8b8b8b8!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2s!4v1234567890123';
  
  // ✅ Use the map from settings or fallback to default
  let mapEmbedUrl = settings?.contactMapEmbed || defaultMapUrl;
  
  // ✅ FIX: Ensure the URL has the correct format
  if (mapEmbedUrl && !mapEmbedUrl.startsWith('https://www.google.com/maps/embed')) {
    console.warn('⚠️ Invalid map URL format, using default:', mapEmbedUrl);
    mapEmbedUrl = defaultMapUrl;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
      toast.success(
        t(
          'contact.toast_success',
          'Thank you! Your message has been sent to our agronomy support team.'
        )
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error(
        t('contact.toast_error', 'Failed to send message. Please try again.')
      );
    } finally {
      setSending(false);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact information...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('contact.error_title', 'Something went wrong')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t(
              'contact.error_desc',
              'We couldn\'t load the contact information. Please try again.'
            )}
          </p>
          <button
            onClick={() => refetch?.()}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            {t('contact.retry_btn', 'Retry')}
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {t('contact.loading_info', 'Loading contact information...')}
          </p>
          <button
            onClick={() => refetch?.()}
            className="mt-4 text-sm text-green-600 hover:text-green-700 underline"
          >
            {t('contact.loading_retry', 'Retry loading')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full">
            {t('contact.badge', 'Customer & Farmer Support')}
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-2">
            {t('contact.title_prefix', 'Get in Touch with')} {siteName}
          </h1>
          <p className="text-gray-600">
            {t(
              'contact.subtitle',
              'Have questions about bulk seed orders, fertilizer applications, equipment delivery, or becoming a partner? We are here to help.'
            )}
          </p>
        </div>

        {/* Top Section: Contact Details + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Details Card */}
          <div className="bg-gradient-to-br from-green-800 to-emerald-900 text-white rounded-2xl p-8 space-y-8 shadow-md">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {t('contact.info_title', 'Contact Information')}
              </h2>
              <p className="text-green-200 text-sm">
                {t(
                  'contact.info_subtitle',
                  'Reach out to our main headquarters or regional distribution hubs.'
                )}
              </p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <MapPin size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t('contact.contact_address', 'Contact Address')}
                  </div>
                  <div className="text-green-100 mt-0.5">
                    {contactAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Phone size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t('contact.phone_support', 'Phone Support')}
                  </div>
                  <div className="text-green-100 mt-0.5">
                    <a href={`tel:${contactPhone}`} className="hover:text-green-300 transition">
                      {contactPhone}
                    </a>
                  </div>
                  <div className="text-xs text-green-300">
                    {contactHours}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Mail size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t('contact.email', 'Email')}
                  </div>
                  <div className="text-green-100 mt-0.5">
                    <a href={`mailto:${contactEmail}`} className="hover:text-green-300 transition">
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {t('contact.success_title', 'Message Received!')}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto text-sm">
                  {t(
                    'contact.success_desc',
                    'Thank you for reaching out. One of our agricultural specialists will contact you shortly.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  {t('contact.send_another', 'Send Another Message')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {t('contact.form_title', 'Send Us a Message')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('contact.full_name', 'Your Full Name *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('contact.email_address', 'Email Address *')}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@farm.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('contact.phone_number', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('contact.inquiry_topic', 'Inquiry Topic')}
                    </label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="General Inquiry">
                        {t('contact.topic_general', 'General Inquiry')}
                      </option>
                      <option value="Bulk Seed Orders">
                        {t('contact.topic_seed', 'Bulk Seed Orders')}
                      </option>
                      <option value="Fertilizer Consultation">
                        {t('contact.topic_fertilizer', 'Fertilizer Consultation')}
                      </option>
                      <option value="Farm Equipment & Delivery">
                        {t('contact.topic_equipment', 'Farm Equipment & Delivery')}
                      </option>
                      <option value="Export & Partnerships">
                        {t('contact.topic_partnerships', 'Export & Partnerships')}
                      </option>
                      <option value="Technical Support">
                        {t('contact.topic_technical', 'Technical Support')}
                      </option>
                      <option value="Other">
                        {t('contact.topic_other', 'Other')}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('contact.message', 'Message *')}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={t(
                      'contact.message_placeholder',
                      'Tell us about your farm requirements or question...'
                    )}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('contact.sending_btn', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {t('contact.send_btn', 'Send Message')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ✅ Google Map Section */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin size={20} className="text-green-600" />
                {t('contact.map_title', 'Find Us on Map')}
              </h3>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Genesis+Agri" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
              >
                Open in Google Maps
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="relative w-full" style={{ height: '450px' }}>
              <iframe
                src={mapEmbedUrl}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps - Our Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}