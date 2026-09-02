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

  // Debug logging
  useEffect(() => {
    console.log('📊 Contact Page State:');
    console.log('  - loading:', loading);
    console.log('  - error:', error);
    console.log('  - settings:', settings);
    console.log('  - hasSettings:', !!settings);
  }, [loading, error, settings]);

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
  const supportEmail = settings?.supportEmail || 'support@genesisagri.com';
  const infoEmail = settings?.infoEmail || 'info@genesisagri.com';
  const emergencyPhone = settings?.emergencyPhone;

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

  // Error state - using main instead of div for consistency
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
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-mono text-xs bg-gray-100 p-3 rounded-lg text-left overflow-auto">
              {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Loading state - using main instead of div for consistency
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
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

  // Main content
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
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <MapPin size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t('contact.headquarters', 'Headquarters')}
                  </div>
                  <div className="text-green-100 mt-0.5">
                    {contactAddress}
                  </div>
                </div>
              </div>

              {/* Phone */}
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

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Mail size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t('contact.email', 'Email')}
                  </div>
                  <div className="text-green-100 mt-0.5">
                    <a href={`mailto:${supportEmail}`} className="hover:text-green-300 transition">
                      {supportEmail}
                    </a>
                  </div>
                  <div className="text-green-100">
                    <a href={`mailto:${infoEmail}`} className="hover:text-green-300 transition">
                      {infoEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Emergency Line */}
              {emergencyPhone && (
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <Clock size={20} className="text-green-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {t('contact.emergency_line', 'Farm Emergency Line')}
                    </div>
                    <div className="text-green-100 mt-0.5">
                      <a href={`tel:${emergencyPhone}`} className="hover:text-green-300 transition">
                        {emergencyPhone}
                      </a>
                    </div>
                    <div className="text-xs text-green-300">
                      {t('contact.emergency_desc', '24/7 Agronomy Dispatch Available')}
                    </div>
                  </div>
                </div>
              )}
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
      </div>
    </main>
  );
}