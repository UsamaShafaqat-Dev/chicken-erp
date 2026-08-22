import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // 🔥 FINAL FIX: 'overflow-x-hidden' yahan root par lagaya hai taake website par hargiz scroll na aaye
    <div className="min-h-screen bg-gray-50 font-sans flex print:bg-white overflow-x-hidden">
      
      {/* Sidebar Component */}
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      {/* Main Content Area - 🔥 FIX: 'min-w-0' lagaya taake table screen ko dhakka na maar sake */}
      <div className="flex-1 lg:ml-64 print:ml-0 flex flex-col min-h-screen transition-all duration-300 min-w-0">
        
        {/* Topbar */}
        <div className="print:hidden">
          <Topbar setIsOpen={setIsSidebarOpen} />
        </div>

        {/* Page Content - 🔥 FIX: 'min-w-0' aur overflow handle kiya */}
        <main className="flex-1 p-4 lg:p-8 print:p-0 print:overflow-visible min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;