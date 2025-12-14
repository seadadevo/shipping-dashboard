const fs = require("fs");

const couriers = JSON.parse(fs.readFileSync("couriers.json", "utf8"));

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

const updatedCouriers = couriers.map((courier, index) => {
  const street = streets[index % streets.length];
  return {
    ...courier,
    address: `${street}، ${courier.city}`,
  };
});

fs.writeFileSync(
  "couriers.json",
  JSON.stringify(updatedCouriers, null, 2),
  "utf8"
);
console.log("✅ Added addresses to all couriers");
