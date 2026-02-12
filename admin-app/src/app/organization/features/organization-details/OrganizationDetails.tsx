import {
  Building2,
  Upload,
  X,
  Users,
  Palette,
  Globe,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Zap,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ColorPreview } from "@/components/ColorPreview";
import {
  Organization,
  OrganizationForm,
  UltraMessageTestResult,
} from "../shared/types";
import { CountrySelector } from "./CountrySelector";
import { UltraMessageInstanceManager } from "@/lib/ultramsg-instance-manager";

interface OrganizationDetailsProps {
  orgForm: OrganizationForm;
  setOrgForm: (form: OrganizationForm) => void;
  loading: boolean;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  readOnly?: boolean;
  // UltraMessage testing props
  onTestConnection?: () => Promise<UltraMessageTestResult>;
  testingConnection?: boolean;
  testResult?: UltraMessageTestResult | null;
}

export const OrganizationDetails = ({
  orgForm,
  setOrgForm,
  loading,
  uploading,
  onSubmit,
  onLogoUpload,
  onRemoveLogo,
  readOnly = false,
  onTestConnection,
  testingConnection = false,
  testResult,
}: OrganizationDetailsProps) => {
  // Ref for brand preview background
  const brandPreviewRef = useRef<HTMLDivElement>(null);

  // State for UltraMessage section
  const [showAdvancedUltraMsg, setShowAdvancedUltraMsg] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Update brand preview background when color changes
  useEffect(() => {
    if (brandPreviewRef.current) {
      brandPreviewRef.current.style.backgroundColor = orgForm.primary_color;
    }
  }, [orgForm.primary_color]);

  // Helper function to get input props with read-only logic
  const getInputProps = (field: keyof OrganizationForm) => ({
    readOnly,
    className: `input-field ${
      readOnly ? "bg-gray-50 cursor-not-allowed text-gray-700" : ""
    }`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      !readOnly && setOrgForm({ ...orgForm, [field]: e.target.value }),
  });
  return (
    <div className="max-w-7xl mx-auto">
      {readOnly && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>View Mode:</strong> You can view organization details but
              cannot make changes. Contact your administrator to modify these
              settings.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout - Responsive card system */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 relative z-10">
        {/* Basic Information Card - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 analytics-card p-5">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Basic Information
              </h2>
              <p className="text-xs text-gray-500">
                Essential organization details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Organization Name - Full width with compact styling */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Organization Name *
              </label>
              <input
                type="text"
                value={orgForm.name}
                {...getInputProps("name")}
                placeholder="Enter organization name"
                required
              />
            </div>

            {/* Contact Info - Two columns for desktop, stacked for mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>Contact Email</span>
                </label>
                <input
                  type="email"
                  value={orgForm.contact_email}
                  {...getInputProps("contact_email")}
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={orgForm.phone}
                  {...getInputProps("phone")}
                  placeholder="+201015554028"
                />
              </div>
            </div>

            {/* Country Selector with Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CountrySelector
                  selectedCountry={orgForm.country}
                  selectedCountryCode={orgForm.country_code}
                  onCountryChange={(country, countryCode) => {
                    if (!readOnly) {
                      setOrgForm({
                        ...orgForm,
                        country,
                        country_code: countryCode,
                      });
                    }
                  }}
                  disabled={readOnly}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default country for customer phone entry
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  <span>Website</span>
                </label>
                <input
                  type="url"
                  value={orgForm.website}
                  {...getInputProps("website")}
                  placeholder="https://company.com"
                />
              </div>
            </div>

            {/* Address - Full width */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>Address</span>
              </label>
              <textarea
                value={orgForm.address}
                {...getInputProps("address")}
                rows={2}
                placeholder="Enter organization address"
              />
            </div>
          </div>
        </div>

        {/* Branding Card */}
        <div className="analytics-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-info-500 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Branding</h2>
              <p className="text-sm text-gray-500">Visual identity</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Logo Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Organization Logo
              </label>

              {/* Horizontal Layout: Logo + Controls */}
              <div className="flex items-start space-x-12">
                {/* Logo Preview - Left Side */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 relative">
                    {orgForm.logo_url ? (
                      <>
                        <img
                          src={orgForm.logo_url}
                          alt="Organization Logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        {orgForm.logo_url && !readOnly && (
                          <button
                            onClick={onRemoveLogo}
                            disabled={uploading}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg"
                            title="Remove logo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                    )}
                  </div>
                </div>

                {/* Upload Controls - Right Side */}
                <div className="flex-1 space-y-3">
                  {!readOnly && (
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 border border-blue-200 hover:border-blue-300 disabled:opacity-50">
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploading
                          ? "Uploading..."
                          : orgForm.logo_url
                          ? "Change Logo"
                          : "Upload Logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onLogoUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}

                  {/* Status Messages */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG • Max 10MB
                      <br />
                      Recommended: 200×200px
                    </p>
                    {orgForm.logo_url && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Logo uploaded successfully
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Brand Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Brand Color
              </label>
              <p className="text-xs text-gray-500 mb-4 text-center">
                Primary color for customer app
              </p>

              {/* Color Picker - Better Layout */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-center space-x-4">
                  {/* Custom Brand Preview with Logo and Name */}
                  <div
                    ref={brandPreviewRef}
                    className="w-42 h-16 rounded-lg shadow-sm flex items-center justify-center px-8 py-3"
                  >
                    <div className="flex items-center space-x-3">
                      {orgForm.logo_url ? (
                        <img
                          src={orgForm.logo_url}
                          alt="Logo"
                          className="w-7 h-7 object-cover rounded"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-white bg-opacity-20 rounded flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium truncate">
                        {orgForm.name || "Organization"}
                      </span>
                    </div>
                  </div>

                  <input
                    type="color"
                    value={orgForm.primary_color}
                    onChange={(e) =>
                      setOrgForm({ ...orgForm, primary_color: e.target.value })
                    }
                    className="w-12 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                    title="Brand color picker"
                  />
                </div>
                <p className="text-sm font-mono text-gray-700 text-center bg-white px-3 py-1.5 rounded-md border">
                  {orgForm.primary_color}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UltraMessage WhatsApp Configuration Section */}
      <div className="analytics-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                WhatsApp Configuration
              </h2>
              <p className="text-sm text-gray-500">
                UltraMessage instance settings
              </p>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            {testResult?.success === true && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Connected</span>
              </div>
            )}
            {testResult?.success === false && (
              <div className="flex items-center space-x-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Connection Failed</span>
              </div>
            )}
            {testingConnection && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Testing...</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Business Number */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              <span>WhatsApp Business Number *</span>
            </label>
            <input
              type="tel"
              value={orgForm.whatsapp_business_number}
              {...getInputProps("whatsapp_business_number")}
              placeholder="+201234567890"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The WhatsApp number connected to your UltraMessage instance
            </p>
          </div>

          {/* UltraMessage Instance ID */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Instance ID *</span>
            </label>
            <input
              type="text"
              value={orgForm.ultramsg_instance_id}
              {...getInputProps("ultramsg_instance_id")}
              placeholder="instance140392"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your UltraMessage instance identifier
            </p>
          </div>

          {/* UltraMessage Token */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <span>API Token *</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={orgForm.ultramsg_token}
                {...getInputProps("ultramsg_token")}
                placeholder="••••••••••••••••••••"
                className={`${getInputProps("ultramsg_token").className} pr-10`}
                required
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  title={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your UltraMessage API token (kept secure)
            </p>
          </div>

          {/* Daily Message Limit */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <span>Daily Message Limit</span>
            </label>
            <input
              type="number"
              value={orgForm.daily_message_limit}
              {...getInputProps("daily_message_limit")}
              placeholder="1000"
              min="1"
              max="10000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum messages per day (default: 1000)
            </p>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAdvancedUltraMsg(!showAdvancedUltraMsg)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={readOnly}
          >
            <span>
              {showAdvancedUltraMsg ? "Hide" : "Show"} Advanced Settings
            </span>
            <div
              className={`w-4 h-4 transition-transform ${
                showAdvancedUltraMsg ? "rotate-180" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {showAdvancedUltraMsg && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={orgForm.ultramsg_base_url}
                  {...getInputProps("ultramsg_base_url")}
                  placeholder="https://api.ultramsg.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  UltraMessage API base URL (usually default)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Test Connection Button */}
        {!readOnly && onTestConnection && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onTestConnection}
                  disabled={
                    testingConnection ||
                    !orgForm.ultramsg_instance_id ||
                    !orgForm.ultramsg_token
                  }
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Testing Connection...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className="text-sm">
                    {testResult.success ? (
                      <span className="text-green-600">
                        ✅ Connected successfully
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ❌ {testResult.message}
                      </span>
                    )}
                    {testResult.responseTime && (
                      <span className="text-gray-500 ml-2">
                        ({testResult.responseTime}ms)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {orgForm.ultramsg_instance_id && orgForm.ultramsg_token
                  ? "Ready to test connection"
                  : "Fill in Instance ID and Token to test"}
              </div>
            </div>

            {testResult?.success === false && testResult.details && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-1">
                  Connection Error Details:
                </p>
                <p className="text-xs text-red-600 font-mono">
                  {JSON.stringify(testResult.details, null, 2)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar - Normal flow, not sticky */}
      {!readOnly && (
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onSubmit}
            disabled={loading || uploading}
            className="btn-primary px-8 py-3 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
