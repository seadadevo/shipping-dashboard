const fs = require("fs");
const { ObjectId } = require("mongodb");

// Read merchants and cities data
const merchants = JSON.parse(fs.readFileSync("merchants.json", "utf8"));
const cities = JSON.parse(fs.readFileSync("cities.json", "utf8"));

// Governorate mapping
const governorateMap = {
  القاهرة: "693dab0aedef1d09a3d83e86",
  الجيزة: "693dab0aedef1d09a3d83e87",
  الإسكندرية: "693dab0aedef1d09a3d83e88",
  القليوبية: "693dab0aedef1d09a3d83e89",
  الدقهلية: "693dab0aedef1d09a3d83e8a",
  الشرقية: "693dab0aedef1d09a3d83e8b",
  الغربية: "693dab0aedef1d09a3d83e8c",
  المنوفية: "693dab0aedef1d09a3d83e8d",
  البحيرة: "693dab0aedef1d09a3d83e8e",
  "كفر الشيخ": "693dab0aedef1d09a3d83e8f",
  دمياط: "693dab0aedef1d09a3d83e90",
  بورسعيد: "693dab0aedef1d09a3d83e91",
  الإسماعيلية: "693dab0aedef1d09a3d83e92",
  السويس: "693dab0aedef1d09a3d83e93",
  أسيوط: "693dab0aedef1d09a3d83e94",
  سوهاج: "693dab0aedef1d09a3d83e95",
  قنا: "693dab0aedef1d09a3d83e96",
  الأقصر: "693dab0aedef1d09a3d83e97",
  أسوان: "693dab0aedef1d09a3d83e98",
  الفيوم: "693dab0aedef1d09a3d83e99",
  "بني سويف": "693dab0aedef1d09a3d83e9a",
  المنيا: "693dab0aedef1d09a3d83e9b",
  "البحر الأحمر": "693dab0aedef1d09a3d83e9c",
  "جنوب سيناء": "693dab0aedef1d09a3d83e9d",
  "شمال سيناء": "693dab0aedef1d09a3d83e9e",
  مطروح: "693dab0aedef1d09a3d83e9f",
  "الوادي الجديد": "693dab0aedef1d09a3d83ea0",
};

// Governorates and their cities
const governorates = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "البحر الأحمر",
  "جنوب سيناء",
  "شمال سيناء",
  "مطروح",
  "الوادي الجديد",
];

// Create a map of cities by governorate
const citiesByGovernorate = {};
cities.forEach((city) => {
  const govId = city.governorate.$oid;
  if (!citiesByGovernorate[govId]) {
    citiesByGovernorate[govId] = [];
  }
  citiesByGovernorate[govId].push({
    cityName: city.cityName,
    governorate: city.governorate,
  });
});

// Streets for addresses
const streets = [
  "شارع الجمهورية",
  "شارع النصر",
  "شارع الحرية",
  "شارع الثورة",
  "شارع الجلاء",
  "شارع المحطة",
  "شارع الجيش",
  "شارع البحر",
  "شارع النيل",
  "شارع سعد زغلول",
  "شارع الهرم",
  "شارع فيصل",
  "شارع الجامعة",
  "شارع التسعين",
  "كورنيش النيل",
];

// Function to generate ObjectId
function generateObjectId() {
  return new ObjectId().toString();
}

// Update merchants with location data
const updatedMerchants = merchants.map((merchant, index) => {
  // Assign governorate (cycling through all governorates)
  const governorate = governorates[index % governorates.length];
  const govId = governorateMap[governorate];
  const availableCities = citiesByGovernorate[govId] || [];

  // Pick a random city from this governorate
  const randomCity =
    availableCities[Math.floor(Math.random() * availableCities.length)];
  const city = randomCity ? randomCity.cityName : governorate;

  // Create address
  const street = streets[index % streets.length];
  const address = `${street}، ${city}`;

  // Assign 2-3 random cities from the same governorate
  const numCities = Math.floor(Math.random() * 2) + 2; // 2 or 3 cities
  const assignedCities = [];

  const shuffled = [...availableCities].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(
    0,
    Math.min(numCities, availableCities.length)
  );

  selected.forEach((cityData) => {
    assignedCities.push({
      governorate: governorate,
      city: cityData.cityName,
      _id: {
        $oid: generateObjectId(),
      },
    });
  });

  return {
    userType: merchant.userType,
    fullName: merchant.fullName,
    email: merchant.email,
    password: merchant.password,
    phone: merchant.phone,
    governorate: governorate,
    city: city,
    assignedCities: assignedCities,
    address: address,
  };
});

fs.writeFileSync(
  "merchants.json",
  JSON.stringify(updatedMerchants, null, 2),
  "utf8"
);
console.log("✅ Updated merchants with location data and assignedCities");
