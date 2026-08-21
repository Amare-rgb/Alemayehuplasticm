"use client";

import React, { useState, ChangeEvent } from "react";

type TabType = "profile" | "security" | "billing" | null;

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop");

  // 📸 ፎቶው ሲመረጥ ወዲያውኑ እንዲቀየር የሚያደርግ ፈንክሽን
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        
        {/* የገጹ ራስጌ (Header) */}
        <div className="px-6 py-6 border-b border-gray-100 bg-white sm:px-8 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Please select an option below to manage your account configuration.</p>
        </div>

        {/* ዋናው ክፍል */}
        <div className={`flex flex-col ${activeTab ? "md:flex-row" : "items-center justify-center py-12"} transition-all duration-300`}>
          
          {/* 👥 የካርዶቹ/የቁልፎቹ ስብስብ (Navigation Options) */}
          <div className={`p-6 space-y-3 transition-all duration-300 ${activeTab ? "w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100" : "w-full max-w-md"}`}>
            
            {/* 1. My Profile Button */}
            <button
              onClick={() => setActiveTab("profile")}
              aria-label="Open profile settings"
              className={`w-full text-left px-5 py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-between border ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/10"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">👤</span>
                <div>
                  <p className="font-bold">My Profile</p>
                  {!activeTab && <p className="text-xs text-gray-400 font-normal mt-0.5">Manage identity and personal info</p>}
                </div>
              </div>
              <span className="text-xs opacity-60" aria-hidden="true">→</span>
            </button>
            
            {/* 2. Security Button */}
            <button
              onClick={() => setActiveTab("security")}
              aria-label="Open security settings"
              className={`w-full text-left px-5 py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-between border ${
                activeTab === "security"
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/10"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">🔒</span>
                <div>
                  <p className="font-bold">Security & Password</p>
                  {!activeTab && <p className="text-xs text-gray-400 font-normal mt-0.5">Update password and secure account</p>}
                </div>
              </div>
              <span className="text-xs opacity-60" aria-hidden="true">→</span>
            </button>
            
            {/* 3. Billing Button */}
            <button
              onClick={() => setActiveTab("billing")}
              aria-label="Open billing settings"
              className={`w-full text-left px-5 py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-between border ${
                activeTab === "billing"
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/10"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">💳</span>
                <div>
                  <p className="font-bold">Billing & Subscriptions</p>
                  {!activeTab && <p className="text-xs text-gray-400 font-normal mt-0.5">View plans and payment setup</p>}
                </div>
              </div>
              <span className="text-xs opacity-60" aria-hidden="true">→</span>
            </button>

            {activeTab && (
              <button 
                onClick={() => setActiveTab(null)}
                className="w-full mt-4 text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-2 border border-dashed border-gray-200 rounded-lg transition"
              >
                ← Back to Overview
              </button>
            )}
          </div>

          {/* 📄 የቀኝ ጎን ይዘት */}
          <div className={`flex-1 transition-all duration-300 ${activeTab ? "p-6 sm:p-8 bg-white block" : "hidden"}`}>
            
            {/* 1. MY PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                  <p className="text-xs text-gray-500">Update your account details and profile picture.</p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <img src={profileImage} alt="Profile Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  <label htmlFor="avatar-upload" className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-gray-50 transition">
                    Change Photo
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      title="Upload profile picture"
                    />
                  </label>
                </div>

                <form className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label htmlFor="full-name" className="block text-xs font-semibold text-gray-600">Full Name</label>
                    <input id="full-name" type="text" defaultValue="Amare Mesele" placeholder="Enter your full name" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label htmlFor="phone-number" className="block text-xs font-semibold text-gray-600">Phone Number</label>
                    <input id="phone-number" type="tel" defaultValue="+251 912 34 5678" placeholder="Enter your phone number" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email-address" className="block text-xs font-semibold text-gray-600">Email Address</label>
                    <input id="email-address" type="email" defaultValue="amare@example.com" placeholder="Enter your email address" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" disabled />
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SECURITY & PASSWORD TAB */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                  <p className="text-xs text-gray-500">Ensure your account is using a strong password.</p>
                </div>

                <form className="space-y-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label htmlFor="current-password" className="block text-xs font-semibold text-gray-600">Current Password</label>
                    <input id="current-password" type="password" placeholder="••••••••" title="Current password" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-semibold text-gray-600">New Password</label>
                    <input id="new-password" type="password" placeholder="••••••••" title="New password" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-600">Confirm Password</label>
                    <input id="confirm-password" type="password" placeholder="••••••••" title="Confirm new password" className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. BILLING & SUBSCRIPTIONS TAB */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Billing & Plan</h2>
                  <p className="text-xs text-gray-500">Manage your subscription tier and payment.</p>
                </div>

                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">Active</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1">Premium Developer Pro</h3>
                    <p className="text-[11px] text-gray-400">Next billing: July 10, 2026</p>
                  </div>
                  <button className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition">
                    Cancel
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gray-900 text-white font-bold text-[9px] flex items-center justify-center rounded">VISA</div>
                    <p className="text-xs font-medium text-gray-700">Visa ending in 4242</p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Edit</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}