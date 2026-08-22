import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  X,
  AlertTriangle,
  MapPin,
  Phone,
  Map,
} from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    whatsapp: "",
    area: "",
    address: "",
    openingBalance: 0,
    notes: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("https://asia-poultry-api.onrender.com//api/customers", {
        withCredentials: true,
      });
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (customer = null) => {
    if (customer) {
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        whatsapp: customer.whatsapp || "",
        area: customer.area || "",
        address: customer.address || "",
        openingBalance: customer.openingBalance,
        notes: customer.notes || "",
      });
      setEditingId(customer._id);
    } else {
      setFormData({
        name: "",
        mobile: "",
        whatsapp: "",
        area: "",
        address: "",
        openingBalance: 0,
        notes: "",
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.area)
      return toast.error("Name, Mobile and Area are required");

    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com//api/customers/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Customer updated successfully");
      } else {
        await axios.post("https://asia-poultry-api.onrender.com//api/customers", formData, {
          withCredentials: true,
        });
        toast.success("Customer added successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`https://asia-poultry-api.onrender.com//api/customers/${deletingId}`, {
        withCredentials: true,
      });
      toast.success("Customer deleted successfully");
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleWhatsAppClick = (phone) => {
    if (!phone) return toast.error("WhatsApp number not available");
    let cleanNumber = phone.replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "92" + cleanNumber.substring(1);
    }
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      (c.area && c.area.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-72 flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, mobile or area..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block w-full">
          <table className="w-full text-left border-collapse text-xs table-auto">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-1.5 py-3 font-medium">Name</th>
                <th className="px-1.5 py-3 font-medium">Mobile</th>
                <th className="px-1.5 py-3 font-medium">WhatsApp</th>
                <th className="px-1.5 py-3 font-medium">Area</th>
                <th className="px-1.5 py-3 font-medium">Address</th>
                <th className="px-1.5 py-3 font-medium">Purchases</th>
                <th className="px-1.5 py-3 font-medium">Paid</th>
                <th className="px-1.5 py-3 font-medium">Outstanding</th>
                <th className="px-1.5 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-8 text-gray-500 text-sm"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center p-8 text-gray-500 text-sm"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-1.5 py-3 font-bold text-gray-800 break-words max-w-[120px]">
                      {customer.name}
                    </td>
                    <td className="px-1.5 py-3 text-gray-800 whitespace-nowrap">
                      {customer.mobile}
                    </td>
                    <td className="px-1.5 py-3 whitespace-nowrap">
                      {customer.whatsapp ? (
                        <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                          <MessageCircle size={10} /> {customer.whatsapp}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-1.5 py-3 break-words max-w-[100px]">
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-1 rounded-md text-[10px] font-bold">
                        <Map size={10} /> {customer.area || "-"}
                      </span>
                    </td>
                    <td
                      className="px-1.5 py-3 text-gray-600 truncate max-w-[100px]"
                      title={customer.address}
                    >
                      {customer.address || "-"}
                    </td>

                    <td className="px-1.5 py-3 text-blue-600 font-medium whitespace-nowrap">
                      Rs. {customer.totalPurchases?.toLocaleString() || 0}
                    </td>
                    <td className="px-1.5 py-3 text-green-600 font-medium whitespace-nowrap">
                      Rs. {customer.totalPaid?.toLocaleString() || 0}
                    </td>
                    <td
                      className={`px-1.5 py-3 font-bold whitespace-nowrap ${customer.currentBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {customer.currentBalance > 0
                        ? `Rs. ${customer.currentBalance.toLocaleString()}`
                        : "Nil"}
                    </td>

                    <td className="px-1.5 py-3 flex justify-center items-center gap-1 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleWhatsAppClick(
                            customer.whatsapp || customer.mobile,
                          )
                        }
                        className="flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={12} /> WA
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => openModal(customer)}
                            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                            title="Edit"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(customer._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} /> Del
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden flex flex-col">
          {filteredCustomers.map((customer, index) => (
            <div
              key={customer._id}
              className={`p-4 flex flex-col gap-4 ${index !== filteredCustomers.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {customer.name}
                  </h3>
                  <span className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    <Map size={12} /> {customer.area || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />{" "}
                    <span className="font-medium text-gray-700">
                      {customer.mobile}
                    </span>
                  </p>
                  {customer.whatsapp && (
                    <p className="flex items-center gap-2 text-green-600">
                      <MessageCircle size={14} />{" "}
                      <span className="font-medium">{customer.whatsapp}</span>
                    </p>
                  )}
                  {customer.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />{" "}
                      {customer.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Purchases</p>
                  <p className="font-medium text-blue-600">
                    Rs. {customer.totalPurchases?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Paid</p>
                  <p className="font-medium text-green-600">
                    Rs. {customer.totalPaid?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-xs mb-1">
                    Outstanding Balance
                  </p>
                  <p
                    className={`text-base font-bold ${customer.currentBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                  >
                    {customer.currentBalance > 0
                      ? `Rs. ${customer.currentBalance.toLocaleString()}`
                      : "Nil"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    handleWhatsAppClick(customer.whatsapp || customer.mobile)
                  }
                  className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors border border-green-100"
                >
                  <MessageCircle size={16} /> WA
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => openModal(customer)}
                      className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(customer._id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors border border-red-100"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. Al-Rehman Chicken"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Mobile No *
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0300-1234567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    WhatsApp No
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Opening Balance (Rs)
                  </label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Area (City/Town) *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. Rajanpur"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Detailed Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Shop Address..."
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0a5228] text-white rounded-lg hover:bg-green-800 font-medium"
                >
                  {editingId ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Customer?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this customer? This action cannot
              be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 flex-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 flex-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
