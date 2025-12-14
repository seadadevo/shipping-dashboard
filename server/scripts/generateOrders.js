const fs = require("fs");
const { ObjectId } = require("mongodb");

// Read existing data
const merchants = JSON.parse(fs.readFileSync("merchants.json", "utf8"));
const couriers = JSON.parse(fs.readFileSync("couriers.json", "utf8"));
const cities = JSON.parse(fs.readFileSync("cities.json", "utf8"));

// Sample data arrays
const customerNames = [
  "أحمد محمد",
  "محمد علي",
  "خالد حسن",
  "عمر يوسف",
  "ياسر محمود",
  "طارق سعيد",
  "وليد عادل",
  "كريم صلاح",
  "مصطفى جمال",
  "حسام فاروق",
  "إسلام رمضان",
  "عبدالرحمن خالد",
  "سامح عبدالعزيز",
  "أيمن طه",
  "هشام نبيل",
  "رامي وائل",
  "شريف ماجد",
  "باسم عماد",
  "معتز هاني",
  "تامر شادي",
  "فاطمة أحمد",
  "نور محمد",
  "سارة حسن",
  "مريم علي",
  "هدى يوسف",
  "ريم سعيد",
  "دينا عادل",
  "منى صلاح",
  "سلمى جمال",
  "ياسمين فاروق",
];

const productNames = [
  "جزم",
  "حقيبة",
  "ملابس",
  "إكسسوارات",
  "ساعة يد",
  "نظارة شمسية",
  "عطر",
  "محفظة",
  "حزام",
  "قميص",
  "بنطلون",
  "فستان",
  "جاكيت",
  "حذاء رياضي",
  "صندل",
  "شنطة ظهر",
  "كتاب",
  "لعبة أطفال",
  "أدوات مكتبية",
  "هاتف محمول",
];

const orderTypes = ["استلام من المتجر", "توصيل للعميل"];
const shippingTypes = ["شحن في 24 ساعة", "شحن عادي", "شحن سريع"];
const paymentTypes = ["واجبة التحصيل", "مدفوع مقدماً"];
const branches = ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "طنطا"];
const statuses = [
  "Pending",
  "Processing",
  "On the Way",
  "Delivered",
  "Cancelled",
  "Returned",
];

// Helper functions
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
  const prefixes = ["010", "011", "012", "015"];
  return (
    prefixes[Math.floor(Math.random() * prefixes.length)] +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")
  );
}

function generateEmail(name) {
  const cleanName = name.replace(/\s+/g, "").toLowerCase();
  return `${cleanName}${randomInt(1, 999)}@gmail.com`;
}

function getRandomDate(monthsAgo) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo + 1,
    0
  );

  const timestamp =
    startDate.getTime() +
    Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(timestamp);
}

function generateStateHistory(status, createdAt, createdBy, assignedDriver) {
  const history = [];
  const statusFlow = {
    Pending: [],
    Processing: ["Processing"],
    "On the Way": ["Processing", "On the Way"],
    Delivered: ["Processing", "On the Way", "Delivered"],
    Cancelled: ["Cancelled"],
    Returned: ["Processing", "On the Way", "Returned"],
  };

  const flow = statusFlow[status] || [];
  let currentDate = new Date(createdAt);

  flow.forEach((state, index) => {
    currentDate = new Date(
      currentDate.getTime() + randomInt(1, 24) * 60 * 60 * 1000
    );

    const changedBy =
      state === "Processing" && index === 0 ? createdBy : assignedDriver;
    const reason =
      state === "Processing" && index === 0
        ? "تعيين السائق وتحويل الطلب إلى قيد المعالجة"
        : "State changed by courier";

    history.push({
      previousState: index === 0 ? "Processing" : flow[index - 1],
      newState: state,
      changedBy: { $oid: changedBy },
      changeReason: reason,
      changedAt: { $date: currentDate.toISOString() },
      _id: { $oid: new ObjectId().toString() },
    });
  });

  return history;
}

// Generate 800 orders
const orders = [];
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 8);

for (let i = 0; i < 800; i++) {
  const monthsAgo = randomInt(0, 7);
  const createdAt = getRandomDate(monthsAgo);
  const updatedAt = new Date(
    createdAt.getTime() + randomInt(1, 72) * 60 * 60 * 1000
  );

  const customerName = randomItem(customerNames);
  const city = randomItem(cities);
  const merchant = randomItem(merchants);
  const courier = randomItem(couriers);
  const status = randomItem(statuses);

  // Generate products (1-3 products per order)
  const numProducts = randomInt(1, 3);
  const products = [];
  let totalWeight = 0;

  for (let j = 0; j < numProducts; j++) {
    const quantity = randomInt(1, 5);
    const weight = randomInt(50, 200);
    totalWeight += weight * quantity;

    products.push({
      productName: randomItem(productNames),
      quantity: quantity,
      weight: weight,
      _id: { $oid: new ObjectId().toString() },
    });
  }

  const orderCost = randomInt(50, 500);
  const orderNumber = `ORD-${createdAt.getTime()}-${String(i + 1).padStart(
    4,
    "0"
  )}`;

  const order = {
    _id: { $oid: new ObjectId().toString() },
    orderType: randomItem(orderTypes),
    customerName: customerName,
    customerPhone1: generatePhone(),
    customerPhone2: Math.random() > 0.7 ? generatePhone() : "",
    customerEmail: generateEmail(customerName),
    governorate:
      city.governorate.$oid === "693dab0aedef1d09a3d83e86"
        ? "القاهرة"
        : city.governorate.$oid === "693dab0aedef1d09a3d83e87"
        ? "الجيزة"
        : "الإسكندرية",
    city: city.cityName,
    village:
      Math.random() > 0.8
        ? "قرية " + randomItem(["الشهداء", "النصر", "السلام"])
        : "",
    street: `شارع ${randomInt(1, 100)}، ${city.cityName}`,
    isVillageDelivery: Math.random() > 0.7,
    shippingType: randomItem(shippingTypes),
    paymentType: randomItem(paymentTypes),
    branch: randomItem(branches),
    orderCost: orderCost,
    totalWeight: totalWeight,
    notes: Math.random() > 0.7 ? "ملاحظات خاصة بالطلب" : "",
    products: products,
    createdBy: {
      $oid: merchant._id ? merchant._id.$oid : new ObjectId().toString(),
    },
    status: status,
    createdAt: { $date: createdAt.toISOString() },
    updatedAt: { $date: updatedAt.toISOString() },
    __v: randomInt(0, 3),
    assignedDriver:
      status !== "Pending" ? { $oid: new ObjectId().toString() } : undefined,
    driverStatus:
      status !== "Pending"
        ? randomItem(["pending", "accepted", "completed"])
        : undefined,
    stateHistory:
      status !== "Pending"
        ? generateStateHistory(
            status,
            createdAt,
            merchant._id ? merchant._id.$oid : new ObjectId().toString(),
            new ObjectId().toString()
          )
        : [],
    orderNumber: orderNumber,
  };

  // Remove undefined fields
  Object.keys(order).forEach(
    (key) => order[key] === undefined && delete order[key]
  );

  orders.push(order);
}

// Sort orders by date (oldest first)
orders.sort(
  (a, b) => new Date(a.createdAt.$date) - new Date(b.createdAt.$date)
);

fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2), "utf8");
console.log(`✅ Generated ${orders.length} orders spread across 8 months`);
console.log(
  `📅 Date range: ${orders[0].createdAt.$date} to ${
    orders[orders.length - 1].createdAt.$date
  }`
);
