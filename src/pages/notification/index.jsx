import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
import { pushNotificationService } from "../../store/api/pushNotificationService";
import { VITE_API_BASE_URL } from "../../constant/config";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import FormGroup from "../../components/ui/FormGroup";
import Radio from "../../components/ui/Radio";
import Fileinput from "../../components/ui/Fileinput";

const PushNotificationPage = () => {
    const authToken = sessionStorage.getItem("token");

    // Filter States
    const [filters, setFilters] = useState({
        name: "",
        phone: "",
        email: "",
        tier: "",
        customerType: "",
        birthday: ""
    });

    const [tierData, setTierData] = useState([]);
    const [customerType, setCustomerType] = useState([]);

    // Table Data States
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState([]);
    const [clearSelectionToggle, setClearSelectionToggle] = useState(false);

    // Form States
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [linkType, setLinkType] = useState("url");
    const [urlLink, setUrlLink] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState("");

    const fetchCustomers = async (page = 1, limit = 50) => {
        setLoading(true);
        try {
            const response = await pushNotificationService.getCustomers({
                ...filters,
                page,
                limit
            });
            if (response.status === "success") {
                setCustomers(response.data);
                setTotalRows(response.total);
            }
        } catch (error) {
            toast.error("Failed to fetch customers: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTierData = async () => {
        try {
            const response = await fetch(VITE_API_BASE_URL + "settings/membership-tiers", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setTierData(data.data || []);
        } catch (error) {
            console.error("Error fetching tier data:", error);
        }
    };

    const fetchCustomerType = async () => {
        try {
            const response = await fetch(VITE_API_BASE_URL + "settings/customer-types", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const customerTypeData = await response.json();
            setCustomerType(customerTypeData.data || []);
        } catch (error) {
            console.error("Error fetching customer type data:", error);
        }
    };

    useEffect(() => {
        fetchCustomers(currentPage, perPage);
        fetchTierData();
        fetchCustomerType();
    }, []);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchCustomers(page, perPage);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
        setCurrentPage(page);
        fetchCustomers(page, newPerPage);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchCustomers(1, perPage);
    };

    const handleClearFilters = () => {
        setFilters({ name: "", phone: "", email: "", tier: "", customerType: "", birthday: "" });
        setCurrentPage(1);
        // Let the next render trigger the fetch or manually pass empty strings
        pushNotificationService.getCustomers({ page: 1, limit: perPage }).then(res => {
            setCustomers(res.data);
            setTotalRows(res.total);
        });
    };

    const handleRowSelected = (state) => {
        setSelectedRows(state.selectedRows.map(row => row.id));
    };

    const handleSendNotification = async () => {
        if (!title) return toast.error("Title is required");
        if (!message) return toast.error("Message is required");
        if (selectedRows.length === 0) return toast.error("Please select at least one customer");
        if (isScheduled && !scheduledAt) return toast.error("Please select a schedule date and time");

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("message", message);
            formData.append("link_type", linkType);

            if (isScheduled && scheduledAt) {
                formData.append("scheduled_at", scheduledAt);
            }

            // Send as JSON string for array
            formData.append("customer_ids", JSON.stringify(selectedRows));

            const trimmedUrlLink = urlLink?.trim();
            const trimmedContent = content?.trim();

            if (trimmedUrlLink) {
                formData.append("url_link", trimmedUrlLink);
            }

            if (trimmedContent) {
                formData.append("content", trimmedContent);
            }

            if (image) {
                formData.append("image", image);
            }

            const res = await pushNotificationService.sendNotification(formData);
            if (res.status === "success") {
                toast.success("Notification successfully queued!");
                // Reset form
                setTitle("");
                setMessage("");
                setUrlLink("");
                setContent("");
                setImage(null);
                setSelectedRows([]);
                setClearSelectionToggle((prev) => !prev);
                setScheduledAt("");
                setIsScheduled(false);
            }
        } catch (error) {
            toast.error("Failed to queue notification: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const columns = [
        { name: "ID", selector: row => row.id, sortable: true, width: "80px" },
        { name: "Name", selector: row => row.name, sortable: true },
        { name: "Phone", selector: row => row.phone, sortable: true },
        { name: "Email", selector: row => row.email, sortable: true },
        { name: "Type", selector: row => row.customer_type, sortable: true },
        { name: "Tier", selector: row => row.customer_tier, sortable: true },
        { name: "Birthday", selector: row => row.birthday, sortable: true },
    ];

    return (
        <div className="space-y-6">
            <ToastContainer position="top-right" />

            <div className="flex justify-between items-center">
                <h4 className="card-title">Push App Notification</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Filter & Select Customers */}
                <Card title="1. Select Customers" className="h-full">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block capitalize form-label">Name</label>
                            <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search name" className="form-control py-2 w-full" />
                        </div>
                        <div>
                            <label className="block capitalize form-label">Phone</label>
                            <input type="text" name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="Search phone" className="form-control py-2 w-full" />
                        </div>
                        <div>
                            <label className="block capitalize form-label">Email</label>
                            <input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Search email" className="form-control py-2 w-full" />
                        </div>
                        <div>
                            <label className="block capitalize form-label">Birthday (YYYY-MM-DD or MM)</label>
                            <input type="text" name="birthday" value={filters.birthday} onChange={handleFilterChange} placeholder="e.g. 08 or 1990-08-15" className="form-control py-2 w-full" />
                        </div>
                        <div>
                            <label className="block capitalize form-label">Membership Tier</label>
                            <div className="relative">
                                <select
                                    name="tier"
                                    value={filters.tier}
                                    onChange={handleFilterChange}
                                    className="form-control py-2 appearance-none w-full"
                                >
                                    <option value="">All Tiers</option>
                                    {tierData.map(tier => (
                                        <option key={tier.id} value={tier.name}>{tier.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block capitalize form-label">Customer Type</label>
                            <div className="relative">
                                <select
                                    name="customerType"
                                    value={filters.customerType}
                                    onChange={handleFilterChange}
                                    className="form-control py-2 appearance-none w-full"
                                >
                                    <option value="">All Types</option>
                                    {customerType.map(type => (
                                        <option key={type.id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6">
                        <Button text="Search" className="btn-primary" onClick={handleSearch} isLoading={loading} />
                        <Button text="Clear" className="btn-secondary outline" onClick={handleClearFilters} />
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-md">
                        <DataTable
                            columns={columns}
                            data={customers}
                            progressPending={loading}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            onChangeRowsPerPage={handlePerRowsChange}
                            onChangePage={handlePageChange}
                            selectableRows
                            onSelectedRowsChange={handleRowSelected}
                            paginationPerPage={50}
                            paginationRowsPerPageOptions={[50, 100, 250, 500]}
                            clearSelectedRows={clearSelectionToggle}
                            customStyles={{
                                headCells: {
                                    style: {
                                        backgroundColor: "#f1f5f9",
                                        color: "#475569",
                                        fontWeight: "bold",
                                    },
                                },
                            }}
                        />
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-sm font-medium">
                            Selected Customers: <span className="text-primary-500">{selectedRows.length}</span>
                        </div>
                    </div>
                </Card>

                {/* Right Column: Compose Notification */}
                <Card title="2. Compose Notification" className="h-full">
                    <div className="space-y-4">
                        <div>
                            <label className="block capitalize form-label">Notification Title</label>
                            <input
                                type="text"
                                placeholder="Enter title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="form-control py-2 w-full"
                            />
                        </div>

                        <FormGroup label="Notification Message (Short)">
                            <textarea
                                className="form-control w-full py-2 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows="3"
                                placeholder="Enter short message body..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            ></textarea>
                        </FormGroup>

                        <FormGroup label="Notification Image (Optional)">
                            <Fileinput
                                name="image"
                                selectedFile={image}
                                onChange={(e) => setImage(e.target.files[0])}
                                preview
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                                Upload an image to display in the push notification (recommended &lt; 1MB, JPG/PNG).
                            </p>
                        </FormGroup>

                        {/* <FormGroup label="Link Type">
                            <div className="flex space-x-4">
                                <Radio
                                    label="External URL"
                                    name="link_type"
                                    value="url"
                                    checked={linkType === "url"}
                                    onChange={(e) => setLinkType(e.target.value)}
                                />
                                <Radio
                                    label="In-App Page"
                                    name="link_type"
                                    value="in_app"
                                    checked={linkType === "in_app"}
                                    onChange={(e) => setLinkType(e.target.value)}
                                />
                            </div>
                        </FormGroup> */}

                        {/* {linkType === "url" && (
                            <div>
                                <label className="block capitalize form-label">Destination URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com"
                                    value={urlLink}
                                    onChange={(e) => setUrlLink(e.target.value)}
                                    className="form-control py-2 w-full"
                                />
                            </div>
                        )}

                        {linkType === "in_app" && (
                            <div className="space-y-4 border p-4 rounded-md border-slate-200">
                                <h5 className="text-sm font-semibold text-slate-700">In-App Page Content</h5>
                                <Fileinput
                                    name="image"
                                    label="Banner Image"
                                    selectedFile={image}
                                    onChange={(e) => setImage(e.target.files[0])}
                                    preview
                                />
                                <FormGroup label="Page HTML Content">
                                    <textarea
                                        className="form-control w-full py-2 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        rows="8"
                                        placeholder="Enter HTML content here (e.g. <b>Hello</b>). Note: CKEditor can be integrated here if available in the project."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    ></textarea>
                                </FormGroup>
                            </div>
                        )} */}

                        <div className="space-y-4 border p-4 rounded-md border-slate-200">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700">Schedule Deployment</label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="schedule-toggle"
                                        checked={isScheduled}
                                        onChange={(e) => setIsScheduled(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="schedule-toggle" className="ml-2 text-sm text-slate-600">Plan for later</label>
                                </div>
                            </div>

                            {isScheduled && (
                                <div className="mt-4">
                                    <label className="block capitalize form-label">Deployment Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="form-control py-2 w-full"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Select the date and time when this notification should be sent.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                text={isSending ? "Queueing Notification..." : "Queue Notification"}
                                className="btn-primary w-full"
                                onClick={handleSendNotification}
                                isLoading={isSending}
                                disabled={selectedRows.length === 0}
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Notifications will be processed in the background. Note: To send to 100k+ users, please ensure the server cron job is configured.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PushNotificationPage;
