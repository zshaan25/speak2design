import React from 'react';
import { Mic, LayoutGrid, ShoppingBag, Settings, LogOut, Info, Search, Bell, Clock, Star, Trash2, Users } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: { name: string; avatar: string };
}

export const Sidebar: React.FC<{ currentPage: string; onNavigate: (page: string) => void }> = ({ currentPage, onNavigate }) => {
  const mainItems = [
    { id: 'dashboard', label: 'My Projects', icon: LayoutGrid },
    { id: 'workspace', label: 'Workspace', icon: Mic },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  ];

  const secondaryItems = [
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed left-0 top-16 bottom-0 z-40">
      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-4">Main Navigation</p>
          <nav className="space-y-1">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                  currentPage === item.id 
                    ? 'text-[#0052CC] bg-blue-50 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-4">Workspace</p>
          <nav className="space-y-1">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-blue-600 rounded-2xl p-4 text-white">
            <p className="text-xs font-bold opacity-80 mb-1">Pro Plan</p>
            <p className="text-sm font-bold mb-3">Get unlimited projects</p>
            <button className="w-full bg-white text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => onNavigate('logout')}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export const TopNavbar: React.FC<LayoutProps> = ({ currentPage, onNavigate, user }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center">
            <Mic className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Speak2Design</span>
        </div>

        <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-80">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-transparent border-none text-sm outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-gray-100 mx-2" />
        <button 
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-full transition-all border ${
            currentPage === 'settings' ? 'border-blue-100 bg-blue-50' : 'border-transparent hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">Free Account</p>
            </div>
            <div className="w-9 h-9 bg-[#0052CC] text-white rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-blue-50">
              {user.avatar}
            </div>
          </div>
        </button>
      </div>
    </nav>
  );
};

export const Annotation: React.FC<{ title: string; text: string }> = ({ title, text }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <div className="absolute bottom-full right-0 mb-4 w-64 bg-gray-900 text-white p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform translate-y-2 group-hover:translate-y-0 duration-200">
        <h4 className="font-bold text-sm mb-1 text-blue-400 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {title}
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
      <button className="w-10 h-10 bg-[#0052CC] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110">
        <Info className="w-5 h-5" />
      </button>
    </div>
  );
};
