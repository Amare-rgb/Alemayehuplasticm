"use client"

import React, { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success('Thank you! Your message has been sent to our agronomy support team.')
    }, 800)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full">
            Customer & Farmer Support
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-2">Get in Touch with Genesis Agri</h1>
          <p className="text-gray-600">
            Have questions about bulk seed orders, fertilizer applications, equipment delivery, or becoming a partner? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Details Card */}
          <div className="bg-gradient-to-br from-green-800 to-emerald-900 text-white rounded-2xl p-8 space-y-8 shadow-md">
            <div>
              <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
              <p className="text-green-200 text-sm">
                Reach out to our main headquarters or regional distribution hubs.
              </p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <MapPin size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Headquarters</div>
                  <div className="text-green-100 mt-0.5">123 Agriculture Way, Farming District, FC 12345</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Phone size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Phone Support</div>
                  <div className="text-green-100 mt-0.5">+1 (555) 123-4567</div>
                  <div className="text-xs text-green-300">Mon - Fri: 8:00 AM - 6:00 PM</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Mail size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Email</div>
                  <div className="text-green-100 mt-0.5">support@genesisagri.com</div>
                  <div className="text-green-100">info@genesisagri.com</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Clock size={20} className="text-green-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Farm Emergency Line</div>
                  <div className="text-green-100 mt-0.5">24/7 Agronomy Dispatch Available</div>
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
                <h3 className="text-2xl font-bold text-gray-800">Message Received!</h3>
                <p className="text-gray-500 max-w-md mx-auto text-sm">
                  Thank you for reaching out. One of our agricultural specialists will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Send Us a Message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name *</label>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Bulk Seed Orders">Bulk Seed Orders</option>
                      <option value="Fertilizer Consultation">Fertilizer Consultation</option>
                      <option value="Farm Equipment & Delivery">Farm Equipment & Delivery</option>
                      <option value="Export & Partnerships">Export & Partnerships</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your farm requirements or question..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Send size={16} />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
