const fs = require("fs");
const { ObjectId } = require("mongodb");

// Read couriers and cities data
const couriers = JSON.parse(fs.readFileSync("couriers.json", "utf8"));
const cities = JSON.parse(fs.readFileSync("cities.json", "utf8"));

// Create a map of cities by governorate for easy lookup
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

// Function to generate ObjectId
function generateObjectId() {
  return new ObjectId().toString();
}

// Update couriers with assigned cities
const updatedCouriers = couriers.map((courier) => {
  const govId = governorateMap[courier.governorate];
  const availableCities = citiesByGovernorate[govId] || [];

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
      governorate: courier.governorate,
      city: cityData.cityName,
      _id: {
        $oid: generateObjectId(),
      },
    });
  });

  return {
    ...courier,
    assignedCities,
  };
});

fs.writeFileSync(
  "couriers.json",
  JSON.stringify(updatedCouriers, null, 2),
  "utf8"
);
console.log("✅ Updated assignedCities for all couriers");
