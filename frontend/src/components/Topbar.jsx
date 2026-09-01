import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Bell, Menu, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 🔥 FIX: Yahan 'toggleSidebar' ki jagah 'setIsOpen' likhna tha kyunki Layout.jsx yehi bhej raha hai
const Topbar = ({ setIsOpen }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    // LocalStorage se User ka data utha raha hai (jismein ab profilePic bhi hai)
    const user = localStorage.getItem("userInfo");
    if (user) setUserInfo(JSON.parse(user));

    axios
      .get("http://129.121.140.57:5000/api/customers", { withCredentials: true })
      .then((res) =>
        setAllCustomers(res.data.filter((c) => c.status !== "inactive")),
      )
      .catch((err) => console.log(err));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://129.121.140.57:5000/api/auth/logout",
        {},
        { withCredentials: true },
      );
      localStorage.removeItem("userInfo");
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      const filtered = allCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.area && c.area.toLowerCase().includes(query.toLowerCase())),
      );
      setSearchResults(filtered.slice(0, 5));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSearchQuery("");
    setShowDropdown(false);
    navigate("/ledgers");
  };

  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        {/* 🔥 FIX: Yahan onClick par setIsOpen(true) call karna hai */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden text-gray-500 hover:text-gray-700 bg-gray-50 p-2 rounded-lg"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full max-w-md focus-within:ring-2 focus-within:ring-[#0a5228] transition-all relative">
          <Search size={18} className="text-gray-400 min-w-max" />
          <input
            type="text"
            placeholder="Search customer balance..."
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700"
            value={searchQuery}
            onChange={handleSearch}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
          />

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50">
              {searchResults.length > 0 ? (
                searchResults.map((c) => (
                  <div
                    key={c._id}
                    onMouseDown={() => handleCustomerClick(c)}
                    className="p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">
                        {c.name}
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {c.area || c.mobile}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase">
                        Balance
                      </p>
                      <p
                        className={`text-sm font-bold ${c.currentBalance > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        Rs. {c.currentBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No customer found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-3 border-l pl-4 border-gray-100">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800 leading-tight">
              {userInfo?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {userInfo?.role || "Staff"}
            </p>
          </div>

          {/* IMAGE SHOW KARNE WALA HISSA */}
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden border border-green-200 shadow-sm">
            {userInfo?.profilePic ? (
              <img
                src={userInfo.profilePic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : userInfo?.name ? (
              userInfo.name.charAt(0).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
