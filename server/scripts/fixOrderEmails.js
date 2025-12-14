const fs = require("fs");

const orders = JSON.parse(fs.readFileSync("orders.json", "utf8"));

// English transliterations for customer names
const nameTransliterations = {
  "أحمد محمد": "ahmed.mohamed",
  "محمد علي": "mohamed.ali",
  "خالد حسن": "khaled.hassan",
  "عمر يوسف": "omar.youssef",
  "ياسر محمود": "yasser.mahmoud",
  "طارق سعيد": "tarek.said",
  "وليد عادل": "walid.adel",
  "كريم صلاح": "karim.salah",
  "مصطفى جمال": "mostafa.gamal",
  "حسام فاروق": "hossam.farouk",
  "إسلام رمضان": "eslam.ramadan",
  "عبدالرحمن خالد": "abdelrahman.khaled",
  "سامح عبدالعزيز": "sameh.abdelaziz",
  "أيمن طه": "ayman.taha",
  "هشام نبيل": "hesham.nabil",
  "رامي وائل": "ramy.wael",
  "شريف ماجد": "sherif.maged",
  "باسم عماد": "bassem.emad",
  "معتز هاني": "moataz.hany",
  "تامر شادي": "tamer.shady",
  "فاطمة أحمد": "fatma.ahmed",
  "نور محمد": "nour.mohamed",
  "سارة حسن": "sara.hassan",
  "مريم علي": "mariam.ali",
  "هدى يوسف": "hoda.youssef",
  "ريم سعيد": "reem.said",
  "دينا عادل": "dina.adel",
  "منى صلاح": "mona.salah",
  "سلمى جمال": "salma.gamal",
  "ياسمين فاروق": "yasmin.farouk",
};

function generateEnglishEmail(arabicName) {
  // Check if we have a transliteration
  if (nameTransliterations[arabicName]) {
    return `${nameTransliterations[arabicName]}${
      Math.floor(Math.random() * 999) + 1
    }@gmail.com`;
  }

  // Fallback: generate generic email
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  return `customer${randomNum}@gmail.com`;
}

const updatedOrders = orders.map((order) => ({
  ...order,
  customerEmail: generateEnglishEmail(order.customerName),
}));

fs.writeFileSync("orders.json", JSON.stringify(updatedOrders, null, 2), "utf8");
console.log("✅ Updated all customer emails to English format");
