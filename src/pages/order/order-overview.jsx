import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RotateCcw,
  Link,
  FileText,
} from "lucide-react";
import { orderService } from "../../store/api/orderService";
import UserService from "../../store/api/userService";
import { toast } from "react-toastify";
import outletService from "@/store/api/outletService";

// Modal for image preview
const ImageModal = ({ open, onClose, imageUrl }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <XCircle size={24} />
          </button>
          <div className="flex flex-col items-center mt-5">
            <img
              src={imageUrl}
              alt="Proof of Delivery"
              className="max-h-192 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CancelGrabModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-6 text-center">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Cancel Delivery Order
        </h2>
        <p className="text-md text-gray-600 mb-6">
          Are you sure you want to cancel this delivery order? <br />
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
          >
            No, Keep It
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded"
          >
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

const ChangeOutletModal = ({
  open,
  onClose,
  outlets,
  selectedOutlet,
  onSelect,
  onConfirm,
  loading,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Change Outlet
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Select a new outlet for this order.
        </p>

        <select
          value={selectedOutlet}
          onChange={(e) => onSelect(e.target.value)}
          className="border border-gray-300 rounded w-full p-2 mb-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select Outlet --</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.title}
            </option>
          ))}
        </select>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded ${
              loading && "opacity-70 cursor-not-allowed"
            }`}
          >
            {loading ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [isChangingOutlet, setIsChangingOutlet] = useState(false);

  const handleOpenOutletModal = async () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user"));
      const userId = userObj?.user?.user_id; 
      if (!userId) {
        toast.error("User not logged in or ID missing");
        return;
      }

      const res = await outletService.getOutlets(userId);
      console.log("Fetched outlets:", res);
      setOutlets(res?.result || []);
      console.log("Outlets state after fetch:", res?.data?.result);
      setShowOutletModal(true);
    } catch (err) {
      console.error("Failed to load outlets:", err);
      toast.error("Failed to load outlet list");
    }
  };


  const handleChangeOutlet = async () => {
    if (!selectedOutlet) return toast.warning("Please select an outlet");
    setIsChangingOutlet(true);
    try {
      await orderService.changeOutlet(order.id, selectedOutlet);
      toast.success("Outlet changed successfully");
      const updatedOrder = await orderService.getOrderById(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to change outlet:", err);
      toast.error(err?.message || "Failed to change outlet");
    } finally {
      setIsChangingOutlet(false);
      setShowOutletModal(false);
    }
  };

  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await orderService.getOrderById(id);
        setOrder(orderData);
      } catch (err) {
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPermissions = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const userObj = JSON.parse(userStr);
        const userId = userObj?.user.user_id;
        if (!userId) return;

        const userDataRes = await UserService.getUser(userId);
        const userData = userDataRes?.data;
        if (!userData) return;

        if (userData.role && userData.role.toLowerCase() === "admin") {
          setIsAdmin(true);
          setHasUpdatePermission(true);
          return;
        }

        let permissions = {};
        if (userData.user_permissions) {
          try {
            permissions = JSON.parse(userData.user_permissions);
            setUserPermissions(permissions);

            // Fixed the path to check the update permission
            if (
              permissions.Orders &&
              permissions.Orders.subItems &&
              permissions.Orders.subItems.Lists &&
              permissions.Orders.subItems.Lists.update === true
            ) {
              setHasUpdatePermission(true);
            }
          } catch (e) {
            console.error("Error parsing user permissions:", e);
          }
        }
      } catch (err) {
        console.error("Error fetching user permissions:", err);
      }
    };

    fetchOrder();
    fetchUserPermissions();
  }, [id]);

  const handleBack = () => navigate(-1);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0000-00-00 00:00:00") return "-";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString("en-US", options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "bg-yellow-500", icon: <Clock size={16} /> },
      completed: { color: "bg-green-600", icon: <CheckCircle size={16} /> },
      cancelled: { color: "bg-red-600", icon: <XCircle size={16} /> },
      delivered: { color: "bg-blue-600", icon: <Truck size={16} /> },
      on_the_way: { color: "bg-blue-500", icon: <Truck size={16} /> },
      picked_up: { color: "bg-purple-600", icon: <CheckCircle size={16} /> },
      preparing: { color: "bg-orange-500", icon: <Clock size={16} /> },
      ready_to_pickup: {
        color: "bg-indigo-600",
        icon: <CheckCircle size={16} />,
      },
      default: { color: "bg-gray-500", icon: null },
    };

    // Format the status text for display
    const statusText = {
      pending: "Pending",
      completed: "Completed",
      cancelled: "Cancelled",
      delivered: "Delivered",
      on_the_way: "Delivering",
      picked_up: "Picked Up",
      preparing: "Preparing",
      ready_to_pickup: "Ready For Pickup",
    };

    const statusInfo = statusMap[status.toLowerCase()] || statusMap.default;
    const displayText =
      statusText[status.toLowerCase()] ||
      status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}
      >
        {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
        {displayText}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: { color: "bg-green-600", icon: <CheckCircle size={16} /> },
      unpaid: { color: "bg-red-600", icon: <XCircle size={16} /> },
      pending: { color: "bg-yellow-500", icon: <Clock size={16} /> },
      refunded: { color: "bg-purple-600", icon: <RotateCcw size={16} /> },
      default: { color: "bg-gray-500", icon: null },
    };

    const statusInfo = statusMap[status.toLowerCase()] || statusMap.default;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}
      >
        {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const OrderItemImage = ({ item }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    const imageData = item.menu_item_image || item.image || null;

    const getImageUrl = () => {
      if (!imageData) return null;

      if (Array.isArray(imageData) && imageData.length > 0) {
        const imageObj = imageData[currentImageIndex];
        return imageObj.image_url || imageObj.url || imageObj.src || null;
      }

      return null;
    };

    const imageUrl = getImageUrl();
    const hasMultipleImages = Array.isArray(imageData) && imageData.length > 1;

    if (imageError || !imageUrl) {
      return (
        <div className="w-20 h-16 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">No Image</span>
        </div>
      );
    }

    return (
      <div className="w-20 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden relative">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />

        {hasMultipleImages && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
            {currentImageIndex + 1}/{imageData.length}
          </div>
        )}
      </div>
    );
  };

  const handleEditTime = () => {
    navigate(`/orders/order_overview/editTime/${id}`);
  };

  const handleEditStatus = () => {
    navigate(`/orders/order_overview/editStatus/${id}`);
  };

  const handleTrackingLink = () => {
    navigate(`/orders/order_overview/trackinglink/${id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Order Overview</h1>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              onClick={handleBack}
            >
              <ArrowLeft size={20} />
              Go back
            </button>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Order Overview</h1>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              onClick={handleBack}
            >
              <ArrowLeft size={20} />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Overview
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Order #{order.order_so}
            </h2>
            <span className="text-sm text-gray-500">
              {formatDate(order.created_at)}
            </span>
          </div>

          <div className="flex gap-2">
            {getStatusBadge(order.status)}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${
                order.order_type?.toLowerCase() === "delivery"
                  ? "bg-blue-600"
                  : "bg-purple-600"
              }`}
            >
              {order.order_type
                ? order.order_type
                    .split("-") // Split by dashes
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
                    .join(" ") // Join with spaces
                : "N/A"}
            </span>
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          onClick={handleBack}
        >
          <ArrowLeft size={20} />
          Go back
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full lg:w-3/5 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Order Items ({order.items.length})
              </h3>
            </div>
            <div className="p-6">
              {order.items.map((item, index) => (
                <React.Fragment key={`${item.id}-${index}`}>
                  <div className="flex gap-4 mb-6">
                    <OrderItemImage item={item} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold">
                              {item.title}{" "}
                              {item.variation_name !== "" &&
                                `(${item.variation_name})`}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-1">
                            Unit Price: RM{item.unit_price}
                          </p>

                          {item.options && item.options.length > 0 && (
                            <div className="text-sm space-y-1">
                              <p className="font-medium font-semibold underline">
                                Selected Options:
                              </p>
                              {item.options.map((option) => (
                                <p key={option.id} className="text-gray-600">
                                  {option.option_title} (+RM
                                  {option.price_adjustment})
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold">
                            RM{item.line_subtotal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <hr className="my-4" />}
                </React.Fragment>
              ))}

              <hr className="my-4" />

              <div className="flex justify-between items-center font-bold text-lg">
                <span>TOTAL</span>
                <span>RM{order.subtotal_amount}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Order Summary
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>RM{order.subtotal_amount}</span>
              </div>

              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-RM{order.discount_amount}</span>
                </div>
              )}

              {parseFloat(order.promo_discount_amount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Promo Discount</span>
                  <span>- RM{order.promo_discount_amount}</span>
                </div>
              )}

              {parseFloat(order.voucher_discount_amount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Voucher Discount</span>
                  <span>- RM{order.voucher_discount_amount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>RM{order.delivery_fee}</span>
              </div>

              {order.taxes.map((tax) => (
                <div key={tax.id} className="flex justify-between">
                  <span>
                    {tax.tax_type} ({tax.tax_rate}%)
                  </span>
                  <span>RM{tax.tax_amount}</span>
                </div>
              ))}

              <hr />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>RM{order.grand_total}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Order Timeline
              </h3>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="space-y-8">
                  {/* Order Created */}
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                      <div className="w-px h-full bg-gray-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-600">
                        Order Created
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`w-4 h-4 rounded-full mt-1 ${
                          order.payment_status === "paid"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div className="w-px h-full bg-gray-300"></div>
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          order.payment_status === "paid"
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        Payment{" "}
                        {order.payment_status === "paid"
                          ? "Completed"
                          : "Pending"}
                      </p>
                      {order.payments[0]?.paid_at && (
                        <p className="text-sm text-gray-500">
                          {formatDate(order.payments[0].paid_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Status */}
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`w-4 h-4 rounded-full mt-1 ${
                          order.status === "completed"
                            ? "bg-green-500"
                            : order.status === "cancelled"
                            ? "bg-red-500"
                            : order.status === "on_the_way"
                            ? "bg-blue-500"
                            : order.status === "picked_up"
                            ? "bg-purple-500"
                            : order.status === "pending"
                            ? "bg-yellow-500"
                            : order.status === "ready_to_pickup"
                            ? "bg-indigo-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          order.status === "completed"
                            ? "text-green-600"
                            : order.status === "cancelled"
                            ? "text-red-600"
                            : order.status === "on_the_way"
                            ? "text-blue-600"
                            : order.status === "picked_up"
                            ? "text-purple-600"
                            : order.status === "pending"
                            ? "text-yellow-600"
                            : order.status === "ready_to_pickup"
                            ? "text-indigo-600"
                            : "text-gray-500"
                        }`}
                      >
                        {order.status === "completed"
                          ? "Order Completed"
                          : order.status === "cancelled"
                          ? "Order Cancelled"
                          : order.status === "on_the_way"
                          ? "Delivering"
                          : order.status === "picked_up"
                          ? "Picked Up"
                          : order.status === "pending"
                          ? "Preparing Order"
                          : order.status === "ready_to_pickup"
                          ? "Ready For Pickup"
                          : "Order In Progress"}
                      </p>
                      {(order.status === "completed" ||
                        order.status === "cancelled" ||
                        order.status === "on_the_way" ||
                        order.status === "picked_up" ||
                        order.status === "pending" ||
                        order.status === "ready_to_pickup") &&
                        order.updated_at && (
                          <p className="text-sm text-gray-500">
                            {order.status === "completed" && order.order_type === "delivery"
                              ? formatDate(order.deliveries?.[0]?.updated_at)
                              : order.status === "pending" && order.order_type === "delivery"
                              ? formatDate(order.payments?.[0]?.paid_at)
                              : formatDate(order.updated_at)}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          {order.order_type?.toLowerCase() === "delivery" && (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden w-full">
                <div className="bg-indigo-900 px-6 py-3">
                  <h3 className="text-lg text-white font-semibold">Delivery</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Delivery Carrier</span>
                      <span>{order.deliveries[0]?.provider_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>RM{order.delivery_fee}</span>
                    </div>
                    {order.order_type?.toLowerCase() === "delivery" && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tracking Link</span>
                        {order.lalamove_quot_id == null &&
                        order.grab_quot_id == null ? (
                          <button
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={handleTrackingLink}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={() =>
                              window.open(
                                order.deliveries[0].tracking_link,
                                "_blank"
                              )
                            }
                          >
                            <Link className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Proof of Delivery</span>

                      {order.proof_of_delivery ? (
                        <button
                          className="text-indigo-600 hover:text-indigo-800"
                          onClick={() => setShowProofModal(true)}
                          title="View Proof of Delivery"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                      {/* Modal for proof of delivery image */}
                      <ImageModal
                        open={showProofModal}
                        onClose={() => setShowProofModal(false)}
                        imageUrl={order.deliveries[0]?.POD_url || ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-2/5 space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Order Details
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">
                  {order.payments[0]?.payment_method
                    ? order.payments[0].payment_method.charAt(0).toUpperCase() +
                      order.payments[0].payment_method.slice(1)
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Order Type</span>
                <span className="font-medium capitalize">
                  {order.order_type.replace(/-/g, " ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Customer Notes</span>
                <span className="font-medium">{order.notes || "None"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="font-medium">
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivery / Pickup Time</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {order.selected_date
                      ? `${order.selected_date}  ${formatTime(
                          order.selected_time
                        )}`
                      : "ASAP"}
                  </span>
                  {(isAdmin || hasUpdatePermission) && (
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={handleEditTime}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Status</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {
                      order.status === "on_the_way"
                        ? "Delivering"
                        : order.status
                            .split("_") // Split by underscores
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ) // Capitalize each word
                            .join(" ") // Join with spaces instead of underscores
                    }
                  </span>
                  {(isAdmin || hasUpdatePermission) && (
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={handleEditStatus}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </div>

              {order.order_type?.toLowerCase() === "delivery" && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tracking Link</span>
                  {order.lalamove_quot_id == null &&
                  order.grab_quot_id == null ? (
                    (isAdmin || hasUpdatePermission) && (
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={handleTrackingLink}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() =>
                        window.open(order.deliveries[0].tracking_link, "_blank")
                      }
                    >
                      <Link className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {order.order_type?.toLowerCase() === "delivery" &&
                order.deliveries?.[0]?.provider_name === "Grab" && (
                  <>
                    <button
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium transition-colors"
                      onClick={() => setShowCancelModal(true)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Delivery Order"}
                    </button>
                    <CancelGrabModal
                      open={showCancelModal}
                      onClose={() => setShowCancelModal(false)}
                      onConfirm={async () => {
                        setIsCancelling(true);
                        try {
                          const local_order_id = order.id;
                          // console.log('Local Order ID:', local_order_id);
                          const res = await orderService.cancelOrderDelivery(
                            local_order_id
                          );
                          // console.log(res?.message || 'Delivery order cancelled successfully.');
                          toast.success(
                            "Delivery order cancelled successfully.",
                            "success"
                          );
                          // Refresh order details
                          const updatedOrder = await orderService.getOrderById(
                            id
                          );
                          setOrder(updatedOrder);
                        } catch (err) {
                          console.error(err);
                          console.log(
                            err?.message || "Failed to cancel Delivery order."
                          );
                        } finally {
                          setIsCancelling(false);
                          setShowCancelModal(false);
                        }
                      }}
                    />
                  </>
                )}
              {order.order_type?.toLowerCase() === "pickup" &&
                order.deliveries?.[0]?.provider_name === "Grab" && (
                  <>
                    <button
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium transition-colors"
                      onClick={() => setShowCancelModal(true)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Delivery Order"}
                    </button>

                    <CancelGrabModal
                      open={showCancelModal}
                      onClose={() => setShowCancelModal(false)}
                      onConfirm={async () => {
                        setIsCancelling(true);
                        try {
                          const local_order_id = order.id;
                          console.log("Local Order ID:", local_order_id);
                          const res = await orderService.cancelOrderDelivery(
                            local_order_id
                          );
                          console.log(
                            res?.message ||
                              "Delivery order cancelled successfully."
                          );
                          toast.success(
                            "Delivery order cancelled successfully.",
                            "success"
                          );
                          // Refresh order details
                          const updatedOrder = await orderService.getOrderById(
                            id
                          );
                          setOrder(updatedOrder);
                        } catch (err) {
                          console.error(err);
                          console.log(
                            err?.message || "Failed to cancel Delivery order."
                          );
                        } finally {
                          setIsCancelling(false);
                          setShowCancelModal(false);
                        }
                      }}
                    />
                  </>
                )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Customer Details
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">
                    {order.customer_name || "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Number</span>
                  <span className="font-medium">
                    {order.customer_phone || "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Email Address</span>
                  <span className="font-medium text-sm">
                    {order.customer_email || "-"}
                  </span>
                </div>

                {order.order_type === "delivery" && order.customer_address && (
                  <div className="flex justify-between">
                    <p className="text-gray-600 mb-1">Delivery Address</p>
                    <p className="font-medium text-sm">
                      {order.customer_address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Outlet Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-900 px-6 py-3">
              <h3 className="text-lg text-white font-semibold">
                Outlet Details
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Outlet</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right">
                    {order.outlet_title || "-"}
                  </span>
                  {(isAdmin || hasUpdatePermission) && (
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={handleOpenOutletModal}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Outlet Email</span>
                <span className="font-medium text-right">
                  {order.outlet_email || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <p className="text-gray-600">Phone</p>
                <p className="font-medium text-right">
                  {order.outlet_phone || "-"}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-gray-600 ">Address</p>
                <p className="font-medium text-right w-[80%]">
                  {order.outlet_address || "-"}
                </p>
              </div>
            </div>
          </div>
          {/* {(order.order_type?.toLowerCase() === 'delivery') && <>
            <div className="bg-white rounded-lg shadow overflow-hidden w-full ">
              <div className="bg-indigo-900 px-6 py-3">
                <h3 className="text-lg text-white font-semibold">Driver Details</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Driver Name</span>
                      <span>{order.driver_name || 'N/A'}</span>
                    </div>

                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Phone Number</span>
                      <span>{order.driver_phone || 'N/A'}</span>
                    </div>

                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Driver's License</span>
                      <span>{order.driver_license || 'N/A'}</span>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </>} */}
        </div>
      </div>
      <ChangeOutletModal
  open={showOutletModal}
  onClose={() => setShowOutletModal(false)}
  outlets={outlets}
  selectedOutlet={selectedOutlet}
  onSelect={setSelectedOutlet}
  onConfirm={handleChangeOutlet}
  loading={isChangingOutlet}
/>
    
    </div>
    
    
  );
};

export default OrderOverview;
