import React from 'react';
import { ArrowLeft, User, MapPin, Award, Phone, Mail, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import { farmerProfile } from '../../data/mockData';

export const ProfileView = ({ onBack, onLogout }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D5] shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#3B3028] hover:bg-[#E6E1D5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#3B3028]">
            Profile & Settings
          </h1>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="agri-card p-4 sm:p-6 flex flex-col gap-6">
        {/* Profile Header Avatar */}
        <div className="flex items-center gap-4 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E6E1D5]">
          <div className="w-16 h-16 rounded-full bg-[#3D4E2A] text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow">
            RP
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#3B3028] flex items-center gap-1.5">
              {farmerProfile.name} <span className="text-base">{farmerProfile.emoji}</span>
            </h2>
            <span className="text-xs font-semibold text-[#556B2F] bg-[#E3EBD3] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              Verified {farmerProfile.role}
            </span>
          </div>
        </div>

        {/* Farm & Personal Information */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
            Farm Information
          </h3>
          <div className="bg-[#FAF7F0] rounded-xl p-3.5 border border-[#E6E1D5] flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#786E65] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7A8B52]" /> Location
              </span>
              <span className="font-bold text-[#3B3028]">{farmerProfile.location}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#E6E1D5] pt-2">
              <span className="font-semibold text-[#786E65] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7A8B52]" /> Farm Size
              </span>
              <span className="font-bold text-[#3B3028]">{farmerProfile.farmSize}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#E6E1D5] pt-2">
              <span className="font-semibold text-[#786E65] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#7A8B52]" /> Certification
              </span>
              <span className="font-bold text-[#3D5220] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {farmerProfile.certification}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#786E65]">
            Contact Details
          </h3>
          <div className="bg-[#FAF7F0] rounded-xl p-3.5 border border-[#E6E1D5] flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#786E65] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#7A8B52]" /> Phone
              </span>
              <span className="font-bold text-[#3B3028]">{farmerProfile.contact}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#E6E1D5] pt-2">
              <span className="font-semibold text-[#786E65] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7A8B52]" /> Email
              </span>
              <span className="font-bold text-[#3B3028]">{farmerProfile.email}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="w-full py-3.5 bg-[#B85C38] hover:bg-[#9E4D1B] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
