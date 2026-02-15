// Kiosk App Translations
// Supports English and Arabic for multilingual kiosk experience

export type Language = 'en' | 'ar';

export interface Translations {
  // Common
  appName: string;
  loading: string;
  error: string;
  retry: string;
  back: string;
  select: string;
  cancel: string;
  confirm: string;
  close: string;
  
  // Connection status
  connected: string;
  disconnected: string;
  printerReady: string;
  printerNotReady: string;
  
  // Branch selection
  selectBranch: string;
  availableBranches: string;
  noBranches: string;
  chooseBranch: string;
  tapToContinue: string;
  touchFriendly: string;
  quickActions: string;
  joinByWhatsApp: string;
  scanQRDescription: string;
  ticket: string;
  
  // Department selection
  selectDepartment: string;
  availableDepartments: string;
  noDepartments: string;
  stepOf: string;
  
  // Service selection
  selectService: string;
  availableServices: string;
  noServices: string;
  chooseService: string;
  liveQueueStatus: string;
  waiting: string;
  estimatedWait: string;
  noWait: string;
  
  // Ticket
  printTicket: string;
  enterPhone: string;
  phoneRequired: string;
  invalidPhone: string;
  ticketNumber: string;
  position: string;
  service: string;
  time: string;
  lastTicket: string;
  yourTicket: string;
  
  // Settings
  settings: string;
  language: string;
  reconfigure: string;
  checkPrinter: string;
  
  // WhatsApp
  joinViaWhatsApp: string;
  scanQRCode: string;
  optionalPath: string;
  howItWorks: string;
  scanQRCodeStep: string;
  sendMessageStep: string;
  chooseServiceStep: string;
  getUpdatesStep: string;
  scanToJoin: string;
  unableToGenerateQR: string;
  
  // Phone Entry Modal
  confirmYourTicket: string;
  mobileNumber: string;
  mobileNumberHint: string;
  clear: string;
  
  // Settings Modal
  kioskSettings: string;
  organization: string;
  name: string;
  printerStatus: string;
  readyToPrint: string;
  notConnected: string;
  systemInfo: string;
  version: string;
  mode: string;
  lastUpdated: string;
  administration: string;
  reconfigureKiosk: string;
  reconfigureHint: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    appName: 'Queue System',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    back: 'Back',
    select: 'Select',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    
    // Connection status
    connected: 'Connected',
    disconnected: 'Disconnected',
    printerReady: 'Printer Ready',
    printerNotReady: 'Printer Not Ready',
    
    // Branch selection
    selectBranch: 'Select a Branch',
    availableBranches: 'Available branches',
    noBranches: 'No branches available',
    chooseBranch: 'Choose a branch',
    tapToContinue: 'Tap a branch to continue.',
    touchFriendly: 'Touch-friendly selection',
    quickActions: 'Quick actions',
    joinByWhatsApp: 'Join by WhatsApp',
    scanQRDescription: 'Scan the QR code to receive updates on your phone.',
    ticket: 'Ticket',
    
    // Department selection
    selectDepartment: 'Select a Department',
    availableDepartments: 'Available departments',
    noDepartments: 'No departments available',
    stepOf: 'Step {current} of {total}',
    
    // Service selection
    selectService: 'Select a Service',
    availableServices: 'Available services',
    noServices: 'No services available',
    chooseService: 'Choose the service you need.',
    liveQueueStatus: 'Live queue status',
    waiting: 'waiting',
    estimatedWait: 'Est. wait',
    noWait: 'No wait',
    
    // Ticket
    printTicket: 'Print Ticket',
    enterPhone: 'Enter your phone number',
    phoneRequired: 'Phone number is required.',
    invalidPhone: 'Please enter a valid phone number.',
    ticketNumber: 'Ticket Number',
    position: 'Position',
    service: 'Service',
    time: 'Time',
    lastTicket: 'Last ticket',
    yourTicket: 'Your Ticket',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    reconfigure: 'Reconfigure Kiosk',
    checkPrinter: 'Check Printer',
    
    // WhatsApp
    joinViaWhatsApp: 'Join queue via WhatsApp',
    scanQRCode: 'Scan QR code to join',
    optionalPath: 'Optional path',
    howItWorks: 'How it works',
    scanQRCodeStep: 'Scan the QR code with your phone camera.',
    sendMessageStep: 'Send the WhatsApp message to start.',
    chooseServiceStep: 'Choose your service and receive a ticket.',
    getUpdatesStep: 'Get real-time updates from the clinic.',
    scanToJoin: 'Scan to join',
    unableToGenerateQR: 'Unable to generate QR code.',
    
    // Phone Entry Modal
    confirmYourTicket: 'Confirm your ticket',
    mobileNumber: 'Mobile number',
    mobileNumberHint: 'Enter your mobile number for updates',
    clear: 'Clear',
    
    // Settings Modal
    kioskSettings: 'Kiosk Settings',
    organization: 'Organization',
    name: 'Name',
    printerStatus: 'Printer status',
    readyToPrint: 'Ready to print',
    notConnected: 'Not connected',
    systemInfo: 'System info',
    version: 'Version',
    mode: 'Mode',
    lastUpdated: 'Last updated',
    administration: 'Administration',
    reconfigureKiosk: 'Reconfigure Kiosk',
    reconfigureHint: 'Change department, PIN, or factory reset. Requires admin PIN.',
  },
  ar: {
    // Common
    appName: 'نظام الانتظار',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    back: 'رجوع',
    select: 'اختيار',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
    
    // Connection status
    connected: 'متصل',
    disconnected: 'غير متصل',
    printerReady: 'الطابعة جاهزة',
    printerNotReady: 'الطابعة غير جاهزة',
    
    // Branch selection
    selectBranch: 'اختر فرع',
    availableBranches: 'الفروع المتاحة',
    noBranches: 'لا توجد فروع متاحة',
    chooseBranch: 'اختر فرعاً',
    tapToContinue: 'اضغط على فرع للمتابعة.',
    touchFriendly: 'اختيار باللمس',
    quickActions: 'إجراءات سريعة',
    joinByWhatsApp: 'انضم عبر الواتساب',
    scanQRDescription: 'امسح رمز QR للحصول على تحديثات على هاتفك.',
    ticket: 'تذكرة',
    
    // Department selection
    selectDepartment: 'اختر قسم',
    availableDepartments: 'الأقسام المتاحة',
    noDepartments: 'لا توجد أقسام متاحة',
    stepOf: 'الخطوة {current} من {total}',
    
    // Service selection
    selectService: 'اختر خدمة',
    availableServices: 'الخدمات المتاحة',
    noServices: 'لا توجد خدمات متاحة',
    chooseService: 'اختر الخدمة التي تحتاجها.',
    liveQueueStatus: 'حالة الانتظار المباشرة',
    waiting: 'في الانتظار',
    estimatedWait: 'الوقت المتوقع',
    noWait: 'لا انتظار',
    
    // Ticket
    printTicket: 'طباعة التذكرة',
    enterPhone: 'أدخل رقم هاتفك',
    phoneRequired: 'رقم الهاتف مطلوب.',
    invalidPhone: 'الرجاء إدخال رقم هاتف صحيح.',
    ticketNumber: 'رقم التذكرة',
    position: 'الترتيب',
    service: 'الخدمة',
    time: 'الوقت',
    lastTicket: 'آخر تذكرة',
    yourTicket: 'تذكرتك',
    
    // Settings
    settings: 'الإعدادات',
    language: 'اللغة',
    reconfigure: 'إعادة ضبط الكشك',
    checkPrinter: 'فحص الطابعة',
    
    // WhatsApp
    joinViaWhatsApp: 'انضم عبر واتساب',
    scanQRCode: 'امسح رمز QR للانضمام',
    optionalPath: 'مسار اختياري',
    howItWorks: 'كيف يعمل',
    scanQRCodeStep: 'امسح رمز QR بكاميرا هاتفك.',
    sendMessageStep: 'أرسل رسالة الواتساب للبدء.',
    chooseServiceStep: 'اختر خدمتك واحصل على تذكرة.',
    getUpdatesStep: 'احصل على تحديثات فورية من العيادة.',
    scanToJoin: 'امسح للانضمام',
    unableToGenerateQR: 'تعذر إنشاء رمز QR.',
    
    // Phone Entry Modal
    confirmYourTicket: 'تأكيد تذكرتك',
    mobileNumber: 'رقم الجوال',
    mobileNumberHint: 'أدخل رقم جوالك للحصول على التحديثات',
    clear: 'مسح',
    
    // Settings Modal
    kioskSettings: 'إعدادات الكشك',
    organization: 'المنظمة',
    name: 'الاسم',
    printerStatus: 'حالة الطابعة',
    readyToPrint: 'جاهزة للطباعة',
    notConnected: 'غير متصلة',
    systemInfo: 'معلومات النظام',
    version: 'الإصدار',
    mode: 'الوضع',
    lastUpdated: 'آخر تحديث',
    administration: 'الإدارة',
    reconfigureKiosk: 'إعادة ضبط الكشك',
    reconfigureHint: 'تغيير القسم، الرمز السري، أو إعادة الضبط. يتطلب رمز المسؤول.',
  },
};

// Helper function to get translation with variable replacement
export const t = (
  translations: Translations,
  key: keyof Translations,
  variables?: Record<string, string | number>
): string => {
  let text = translations[key] || key;
  
  if (variables) {
    Object.entries(variables).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, String(value));
    });
  }
  
  return text;
};
