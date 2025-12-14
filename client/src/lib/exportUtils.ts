/**
 * Export utility functions for generating reports in various formats
 */

import type { Order, User, ShippingType, City, WeightSetting } from "../types";

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Download a file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: Order[], filename: string = 'orders.csv') {
  const data = orders.map(order => ({
    'رقم الطلب': order._id,
    'اسم العميل': order.customerName,
    'رقم الهاتف': order.customerPhone1,
    'البريد الإلكتروني': order.customerEmail || '',
    'المحافظة': order.governorate,
    'المدينة': order.city,
    'الشارع': order.street,
    'نوع الطلب': order.orderType,
    'نوع الشحن': order.shippingType,
    'نوع الدفع': order.paymentType,
    'الوزن الكلي': order.totalWeight,
    'تكلفة الطلب': order.orderCost,
    'الحالة': order.status,
    'تاريخ الإنشاء': new Date(order.createdAt).toLocaleDateString('ar-EG'),
    'الفرع': order.branch || '',
    'توصيل قرية': order.isVillageDelivery ? 'نعم' : 'لا',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export orders to Excel-compatible format
 */
export function exportOrdersToExcel(orders: Order[], filename: string = 'orders.xlsx') {
  // For Excel, we use CSV with UTF-8 BOM for proper Arabic support
  const data = orders.map(order => ({
    'رقم الطلب': order._id,
    'اسم العميل': order.customerName,
    'رقم الهاتف': order.customerPhone1,
    'البريد الإلكتروني': order.customerEmail || '',
    'المحافظة': order.governorate,
    'المدينة': order.city,
    'الشارع': order.street,
    'نوع الطلب': order.orderType,
    'نوع الشحن': order.shippingType,
    'نوع الدفع': order.paymentType,
    'الوزن الكلي': order.totalWeight,
    'تكلفة الطلب': order.orderCost,
    'الحالة': order.status,
    'تاريخ الإنشاء': new Date(order.createdAt).toLocaleDateString('ar-EG'),
    'الفرع': order.branch || '',
    'توصيل قرية': order.isVillageDelivery ? 'نعم' : 'لا',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = '\uFEFF' + convertToCSV(data, headers); // Add BOM for Excel
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to CSV
 */
export function generateAdminReportCSV(data: {
  orders: Order[];
  users: User[];
  stats: any;
}) {
  const timestamp = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');

  // تصدير Orders
  const ordersData = data.orders.map(order => ({
    'رقم الطلب': order._id,
    'اسم العميل': order.customerName,
    'رقم الهاتف': order.customerPhone1,
    'البريد الإلكتروني': order.customerEmail || '',
    'المحافظة': order.governorate,
    'المدينة': order.city,
    'الشارع': order.street,
    'نوع الطلب': order.orderType,
    'نوع الشحن': order.shippingType,
    'نوع الدفع': order.paymentType,
    'الوزن الكلي': order.totalWeight,
    'تكلفة الطلب': order.orderCost,
    'الحالة': order.status,
    'تاريخ الإنشاء': new Date(order.createdAt).toLocaleDateString('ar-EG'),
    'الفرع': order.branch || '',
    'توصيل قرية': order.isVillageDelivery ? 'نعم' : 'لا',
  }));
  const ordersCSV = convertToCSV(ordersData, Object.keys(ordersData[0] || {}));
  downloadFile(ordersCSV, `Orders-${timestamp}.csv`, 'text/csv;charset=utf-8;');

  // تصدير Users
  const usersData = data.users.map(user => ({
    'رقم المستخدم': user._id,
    'الاسم الكامل': user.fullName,
    'البريد الإلكتروني': user.email,
    'رقم الهاتف': user.phone,
    'نوع المستخدم': user.userType,
    'العنوان': user.address || '',
    'المحافظة': user.governorate || '',
    'المدينة': user.city || '',
    'اسم المتجر': user.storeName || '',
  }));
  const usersCSV = convertToCSV(usersData, Object.keys(usersData[0] || {}));
  downloadFile(usersCSV, `Users-${timestamp}.csv`, 'text/csv;charset=utf-8;');

  // تصدير Stats
  const statsData = Object.entries(data.stats).map(([key, value]) => ({
    'الإحصائية': key,
    'القيمة': value
  }));
  const statsCSV = convertToCSV(statsData, ['الإحصائية', 'القيمة']);
  downloadFile(statsCSV, `Stats-${timestamp}.csv`, 'text/csv;charset=utf-8;');

  return {
    ordersCSV,
    usersCSV,
    statsCSV
  };
}

// ======================= Export all data to CSV in a single file =======================
export function generateAdminReportCSVSingleFile(data: {
  orders: Order[];
  users: User[];
  stats: any;
  shippingTypes?: any[];
  cities?: any[];
  weightSettings?: any[];
}) {
  const timestamp = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');

  let combinedCSV = '';

  // =======================
  // 1️⃣ Stats
  // =======================
  combinedCSV += 'ملخص النظام\n';
  const statsData = Object.entries(data.stats).map(([key, value]) => ({
    'الإحصائية': key,
    'القيمة': value
  }));
  combinedCSV += convertToCSV(statsData, ['الإحصائية', 'القيمة']);
  combinedCSV += '\n\n';

  // =======================
  // 2️⃣ Orders
  // =======================
  combinedCSV += 'بيانات الطلبات\n';
  const ordersData = data.orders.map(order => ({
    'رقم الطلب': order._id,
    'اسم العميل': order.customerName,
    'رقم الهاتف': order.customerPhone1,
    'البريد الإلكتروني': order.customerEmail || '',
    'المحافظة': order.governorate,
    'المدينة': order.city,
    'الشارع': order.street,
    'نوع الطلب': order.orderType,
    'نوع الشحن': order.shippingType,
    'نوع الدفع': order.paymentType,
    'الوزن الكلي': order.totalWeight,
    'تكلفة الطلب': order.orderCost,
    'الحالة': order.status,
    'تاريخ الإنشاء': new Date(order.createdAt).toLocaleDateString('ar-EG'),
    'الفرع': order.branch || '',
    'توصيل قرية': order.isVillageDelivery ? 'نعم' : 'لا',
  }));
  combinedCSV += convertToCSV(ordersData, Object.keys(ordersData[0] || {}));
  combinedCSV += '\n\n';

  // =======================
  // 3️⃣ Users
  // =======================
  combinedCSV += 'بيانات المستخدمين\n';
  const usersData = data.users.map(user => ({
    'رقم المستخدم': user._id,
    'الاسم الكامل': user.fullName,
    'البريد الإلكتروني': user.email,
    'رقم الهاتف': user.phone,
    'نوع المستخدم': user.userType,
    'العنوان': user.address || '',
    'المحافظة': user.governorate || '',
    'المدينة': user.city || '',
    'اسم المتجر': user.storeName || '',
  }));
  combinedCSV += convertToCSV(usersData, Object.keys(usersData[0] || {}));
  combinedCSV += '\n\n';

  // =======================
  // 4️⃣ Shipping Types
  // =======================
  if (data.shippingTypes && data.shippingTypes.length) {
    combinedCSV += 'أنواع الشحن\n';
    const shippingData = data.shippingTypes.map(st => ({
      'اسم نوع الشحن': st.name,
      'قيمة التعديل': st.adjustmentAmount,
      'الحد الأدنى لأيام التوصيل': st.minDeliveryDays,
      'الحد الأقصى لأيام التوصيل': st.maxDeliveryDays,
      'الوصف': st.description || '',
      'نشط': st.isActive ? 'نعم' : 'لا',
    }));
    combinedCSV += convertToCSV(shippingData, Object.keys(shippingData[0]));
    combinedCSV += '\n\n';
  }

  // =======================
  // 5️⃣ Cities / إدارة المناطق
  // =======================
  if (data.cities && data.cities.length) {
    combinedCSV += 'إدارة المناطق (المدن)\n';
    const citiesData = data.cities.map(c => ({
      'اسم المدينة': c.cityName,
      'المحافظة': c.governorate?.govName || '', // اسم المحافظة مباشرة
      'سعر الشحن': c.shippingCost,
      'نشط': c.isActive ? 'نعم' : 'لا',
    }));
    combinedCSV += convertToCSV(citiesData, Object.keys(citiesData[0]));
    combinedCSV += '\n\n';
  }

  // =======================
  // 6️⃣ Weight Settings / إعدادات الوزن والتكلفة
  // =======================
  if (data.weightSettings && data.weightSettings.length) {
    combinedCSV += 'إعدادات الوزن والتكلفة\n';
    const weightData = data.weightSettings.map(w => ({
      'الوزن الأقصى المشمول': w.defaultWeightLimit,
      'سعر الكيلو الإضافي': w.extraKgCost,
      'سعر التوصيل للقرى': w.villageDeliveryCost,
      'آخر تحديث': new Date(w.updatedAt).toLocaleString('ar-EG'),
    }));
    combinedCSV += convertToCSV(weightData, Object.keys(weightData[0]));
    combinedCSV += '\n\n';
  }

  // =======================
  // تنزيل الملف
  // =======================
  downloadFile(combinedCSV, `تقرير-شامل-${timestamp}.csv`, 'text/csv;charset=utf-8;');

  return combinedCSV;
}


// ======================= Export merchant data to CSV in a single file =======================
/**
 * Export merchant-specific report
 */
export function exportMerchantReport(data: {
  orders: any[];
  stats: Record<string, any>;
  shippingTypes?: any[];
  cities?: any[];
  weightSettings?: any[];
}) {
  const timestamp = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");
  let combinedCSV = "";

  // =======================
  // 1️⃣ إحصائيات التاجر
  // =======================
  combinedCSV += "إحصائيات التاجر\n";
  const statsData = Object.entries(data.stats).map(([key, value]) => ({
    "الإحصائية": key,
    "القيمة": value
  }));
  combinedCSV += convertToCSV(statsData, ["الإحصائية", "القيمة"]);
  combinedCSV += "\n\n";

  // =======================
  // 2️⃣ الطلبات الخاصة بالتاجر
  // =======================
  combinedCSV += "الطلبات الخاصة بالتاجر\n";
  const ordersData = data.orders.map(order => ({
    "رقم الطلب": order._id,
    "اسم العميل": order.customerName,
    "رقم الهاتف": order.customerPhone1,
    "البريد الإلكتروني": order.customerEmail || "",
    "المحافظة": order.governorate,
    "المدينة": order.city,
    "الشارع": order.street,
    "نوع الطلب": order.orderType,
    "نوع الشحن": order.shippingType,
    "نوع الدفع": order.paymentType,
    "الوزن الكلي": order.totalWeight,
    "تكلفة الطلب": order.orderCost,
    "الحالة": order.status,
    "تاريخ الإنشاء": new Date(order.createdAt).toLocaleDateString("ar-EG"),
    "الفرع": order.branch || "",
    "توصيل قرية": order.isVillageDelivery ? "نعم" : "لا",
  }));
  combinedCSV += convertToCSV(ordersData, Object.keys(ordersData[0] || {}));
  combinedCSV += "\n\n";

  // =======================
  // 3️⃣ أنواع الشحن
  // =======================
  if (data.shippingTypes && data.shippingTypes.length) {
    combinedCSV += "أنواع الشحن\n";
    const shippingData = data.shippingTypes.map(st => ({
      "اسم نوع الشحن": st.name,
      "قيمة التعديل": st.adjustmentAmount,
      "الحد الأدنى لأيام التوصيل": st.minDeliveryDays,
      "الحد الأقصى لأيام التوصيل": st.maxDeliveryDays,
      "الوصف": st.description || "",
      "نشط": st.isActive ? "نعم" : "لا",
    }));
    combinedCSV += convertToCSV(shippingData, Object.keys(shippingData[0]));
    combinedCSV += "\n\n";
  }

  // =======================
  // 4️⃣ المدن / إدارة المناطق
  // =======================
  if (data.cities && data.cities.length) {
    combinedCSV += "إدارة المناطق (المدن)\n";
    const citiesData = data.cities.map(c => ({
      "اسم المدينة": c.cityName,
      "المحافظة": c.governorate?.govName || "",
      "سعر الشحن": c.shippingCost,
      "نشط": c.isActive ? "نعم" : "لا",
    }));
    combinedCSV += convertToCSV(citiesData, Object.keys(citiesData[0]));
    combinedCSV += "\n\n";
  }

  // =======================
  // 5️⃣ إعدادات الوزن والتكلفة
  // =======================
  if (data.weightSettings && data.weightSettings.length) {
    combinedCSV += "إعدادات الوزن والتكلفة\n";
    const weightData = data.weightSettings.map(w => ({
      "الوزن الأقصى المشمول": w.defaultWeightLimit,
      "سعر الكيلو الإضافي": w.extraKgCost,
      "سعر التوصيل للقرى": w.villageDeliveryCost,
      "آخر تحديث": new Date(w.updatedAt).toLocaleString("ar-EG"),
    }));
    combinedCSV += convertToCSV(weightData, Object.keys(weightData[0]));
    combinedCSV += "\n\n";
  }

  // =======================
  // تنزيل الملف
  // =======================
  downloadFile(combinedCSV, `تقرير-التاجر-${timestamp}.csv`, "text/csv;charset=utf-8;");

  return combinedCSV;
}

/**
 * Export dashboard statistics to JSON
 */
export function exportDashboardStats(stats: any, filename: string = 'dashboard-stats.json') {
  const content = JSON.stringify(stats, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Generate comprehensive admin report with all statistics
 */
export function generateAdminReport(data: {
  orders: Order[];
  users: User[];
  stats: any;
}) {
  const timestamp = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
  
  // Create a comprehensive report object
  const report = {
    'تاريخ التقرير': new Date().toLocaleString('ar-EG'),
    'ملخص النظام': data.stats,
    'إحصائيات الطلبات': {
      'إجمالي الطلبات': data.orders.length,
      'طلبات اليوم': data.orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length,
      'حسب الحالة': {
        'قيد الانتظار': data.orders.filter(o => o.status === 'Pending').length,
        'قيد المعالجة': data.orders.filter(o => o.status === 'Processing').length,
        'في الطريق': data.orders.filter(o => o.status === 'Shipped').length,
        'تم التسليم': data.orders.filter(o => o.status === 'Delivered').length,
        'ملغي': data.orders.filter(o => o.status === 'Cancelled').length,
      },
      'إجمالي الإيرادات': data.orders.reduce((sum, o) => sum + (o.orderCost || 0), 0),
    },
    'إحصائيات المستخدمين': {
      'إجمالي المستخدمين': data.users.length,
      'حسب النوع': {
        'مديرين': data.users.filter(u => u.userType === 'admin').length,
        'موظفين': data.users.filter(u => u.userType === 'employee').length,
        'تجار': data.users.filter(u => u.userType === 'merchant').length,
        'سائقين': data.users.filter(u => u.userType === 'courier').length,
      },
    },
  };
  
  // Export as JSON
  const content = JSON.stringify(report, null, 2);
  downloadFile(content, `تقرير-شامل-${timestamp}.json`, 'application/json');
  
  return report;
}

/**
 * Generate PDF-ready HTML report (can be printed or saved as PDF)
 */
export function generatePDFReport(data: {
  orders: Order[];
  users: User[];
  stats: any;
}) {
  const timestamp = new Date().toLocaleString('ar-EG');
  
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير النظام الشامل</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      direction: rtl;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: right; 
    }
    th { 
      background-color: #2563eb; 
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) { background-color: #f9fafb; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      color: #6b7280;
      margin-top: 5px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>📊 تقرير النظام الشامل</h1>
  <p><strong>تاريخ التقرير:</strong> ${timestamp}</p>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data.orders.length}</div>
      <div class="stat-label">إجمالي الطلبات</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.users.length}</div>
      <div class="stat-label">إجمالي المستخدمين</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.orders.reduce((sum, o) => sum + (o.orderCost || 0), 0).toFixed(2)}</div>
      <div class="stat-label">إجمالي الإيرادات (جنيه)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.orders.filter(o => o.status === 'Delivered').length}</div>
      <div class="stat-label">الطلبات المكتملة</div>
    </div>
  </div>

  <h2>📦 إحصائيات الطلبات حسب الحالة</h2>
  <table>
    <thead>
      <tr>
        <th>الحالة</th>
        <th>العدد</th>
        <th>النسبة المئوية</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>قيد الانتظار</td>
        <td>${data.orders.filter(o => o.status === 'Pending').length}</td>
        <td>${((data.orders.filter(o => o.status === 'Pending').length / data.orders.length) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>قيد المعالجة</td>
        <td>${data.orders.filter(o => o.status === 'Processing').length}</td>
        <td>${((data.orders.filter(o => o.status === 'Processing').length / data.orders.length) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>في الطريق</td>
        <td>${data.orders.filter(o => o.status === 'Shipped').length}</td>
        <td>${((data.orders.filter(o => o.status === 'Shipped').length / data.orders.length) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>تم التسليم</td>
        <td>${data.orders.filter(o => o.status === 'Delivered').length}</td>
        <td>${((data.orders.filter(o => o.status === 'Delivered').length / data.orders.length) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>ملغي</td>
        <td>${data.orders.filter(o => o.status === 'Cancelled').length}</td>
        <td>${((data.orders.filter(o => o.status === 'Cancelled').length / data.orders.length) * 100).toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <h2>👥 إحصائيات المستخدمين حسب النوع</h2>
  <table>
    <thead>
      <tr>
        <th>نوع المستخدم</th>
        <th>العدد</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>مديرين</td>
        <td>${data.users.filter(u => u.userType === 'admin').length}</td>
      </tr>
      <tr>
        <td>موظفين</td>
        <td>${data.users.filter(u => u.userType === 'employee').length}</td>
      </tr>
      <tr>
        <td>تجار</td>
        <td>${data.users.filter(u => u.userType === 'merchant').length}</td>
      </tr>
      <tr>
        <td>سائقين</td>
        <td>${data.users.filter(u => u.userType === 'courier').length}</td>
      </tr>
    </tbody>
  </table>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
      🖨️ طباعة أو حفظ كـ PDF
    </button>
  </div>
</body>
</html>
  `;
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
