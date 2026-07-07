import { getDb } from "../api/queries/connection";
import { products, demandAggregates } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed products
  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length === 0) {
    console.log("Seeding products...");
    const productData = [
      { name: "Amul Gold Milk", category: "Dairy", subcategory: "Milk", barcode: "8901030633001", mrp: "72.00", gstRate: "0", unit: "1L" },
      { name: "Amul Butter", category: "Dairy", subcategory: "Butter", barcode: "8901030633018", mrp: "58.00", gstRate: "12", unit: "500g" },
      { name: "Britannia Marie Gold", category: "Biscuits", subcategory: "Marie", barcode: "8901063018708", mrp: "35.00", gstRate: "18", unit: "250g" },
      { name: "Parle-G", category: "Biscuits", subcategory: "Glucose", barcode: "8901719104045", mrp: "10.00", gstRate: "18", unit: "100g" },
      { name: "Maggi 2-Minute Noodles", category: "Noodles", subcategory: "Instant", barcode: "8901030742703", mrp: "14.00", gstRate: "18", unit: "70g" },
      { name: "Tata Salt", category: "Staples", subcategory: "Salt", barcode: "8901030834910", mrp: "28.00", gstRate: "0", unit: "1kg" },
      { name: "Aashirvaad Atta", category: "Staples", subcategory: "Flour", barcode: "8901030954014", mrp: "325.00", gstRate: "0", unit: "5kg" },
      { name: "Daawat Basmati Rice", category: "Staples", subcategory: "Rice", barcode: "8906026910220", mrp: "185.00", gstRate: "0", unit: "1kg" },
      { name: "Fortune Sunflower Oil", category: "Staples", subcategory: "Oil", barcode: "8906014830015", mrp: "165.00", gstRate: "5", unit: "1L" },
      { name: "Red Label Tea", category: "Beverages", subcategory: "Tea", barcode: "8901030633810", mrp: "285.00", gstRate: "5", unit: "500g" },
      { name: "Nescafe Classic", category: "Beverages", subcategory: "Coffee", barcode: "8901030615304", mrp: "195.00", gstRate: "18", unit: "50g" },
      { name: "Coca-Cola", category: "Beverages", subcategory: "Soft Drinks", barcode: "8901765112016", mrp: "40.00", gstRate: "28", unit: "750ml" },
      { name: "Dove Shampoo", category: "Personal Care", subcategory: "Shampoo", barcode: "8901030664845", mrp: "185.00", gstRate: "18", unit: "340ml" },
      { name: "Colgate Strong Teeth", category: "Personal Care", subcategory: "Toothpaste", barcode: "8901314516805", mrp: "112.00", gstRate: "18", unit: "200g" },
      { name: "Dettol Soap", category: "Personal Care", subcategory: "Soap", barcode: "8901030893718", mrp: "35.00", gstRate: "18", unit: "75g" },
      { name: "Almond Milk", category: "Dairy Alternatives", subcategory: "Plant Milk", barcode: "8908012234012", mrp: "299.00", gstRate: "12", unit: "1L" },
      { name: "Oat Flour", category: "Health Foods", subcategory: "Flour", barcode: "8908012234029", mrp: "245.00", gstRate: "5", unit: "500g" },
      { name: "Premium Pet Food", category: "Pet Supplies", subcategory: "Dog Food", barcode: "8908012234036", mrp: "450.00", gstRate: "18", unit: "2kg" },
      { name: "Organic Honey", category: "Health Foods", subcategory: "Honey", barcode: "8908012234043", mrp: "185.00", gstRate: "0", unit: "250g" },
      { name: "Quinoa Grains", category: "Health Foods", subcategory: "Grains", barcode: "8908012234050", mrp: "320.00", gstRate: "5", unit: "500g" },
      { name: "Kellogg's Corn Flakes", category: "Breakfast", subcategory: "Cereal", barcode: "8908003003201", mrp: "185.00", gstRate: "18", unit: "475g" },
      { name: "Lays Classic Salted", category: "Snacks", subcategory: "Chips", barcode: "8901491101844", mrp: "20.00", gstRate: "12", unit: "52g" },
      { name: "Haldiram's Bhujia", category: "Snacks", subcategory: "Namkeen", barcode: "8904063200123", mrp: "55.00", gstRate: "12", unit: "200g" },
      { name: "Cadbury Dairy Milk", category: "Confectionery", subcategory: "Chocolate", barcode: "8901233018709", mrp: "40.00", gstRate: "18", unit: "36g" },
      { name: "Tropicana Orange Juice", category: "Beverages", subcategory: "Juice", barcode: "8901765008012", mrp: "110.00", gstRate: "12", unit: "1L" },
      { name: "Surf Excel Matic", category: "Household", subcategory: "Detergent", barcode: "8901030742130", mrp: "385.00", gstRate: "18", unit: "2kg" },
      { name: "Vim Dishwash Bar", category: "Household", subcategory: "Dishwash", barcode: "8901030974210", mrp: "10.00", gstRate: "18", unit: "200g" },
      { name: "Harpic Toilet Cleaner", category: "Household", subcategory: "Toilet", barcode: "8901396723910", mrp: "95.00", gstRate: "18", unit: "500ml" },
      { name: "Good Day Cashew", category: "Biscuits", subcategory: "Cookies", barcode: "8901063018784", mrp: "30.00", gstRate: "18", unit: "72g" },
      { name: "Bournvita", category: "Health Drinks", subcategory: "Malt", barcode: "8901030615311", mrp: "220.00", gstRate: "18", unit: "500g" },
    ];

    for (const product of productData) {
      await db.insert(products).values(product);
    }
    console.log(`Seeded ${productData.length} products`);
  } else {
    console.log("Products already seeded");
  }

  // Seed demand aggregates for heatmap
  const existingAggregates = await db.select().from(demandAggregates).limit(1);
  if (existingAggregates.length === 0) {
    console.log("Seeding demand aggregates for heatmap...");

    // Create sample demand clusters around major Indian cities
    const demandData = [
      // Mumbai area
      { lat: 19.076, lng: 72.8777, category: "Dairy Alternatives", score: 85, pindrops: 18 },
      { lat: 19.08, lng: 72.885, category: "Pet Supplies", score: 72, pindrops: 15 },
      { lat: 19.07, lng: 72.87, category: "Health Foods", score: 68, pindrops: 14 },
      { lat: 19.09, lng: 72.89, category: "Organic Products", score: 91, pindrops: 22 },
      { lat: 19.065, lng: 72.88, category: "Dairy Alternatives", score: 55, pindrops: 11 },
      // Delhi area
      { lat: 28.6139, lng: 77.209, category: "Dairy Alternatives", score: 78, pindrops: 16 },
      { lat: 28.62, lng: 77.22, category: "Health Foods", score: 82, pindrops: 17 },
      { lat: 28.61, lng: 77.2, category: "Pet Supplies", score: 65, pindrops: 13 },
      { lat: 28.63, lng: 77.215, category: "Organic Products", score: 88, pindrops: 19 },
      { lat: 28.605, lng: 77.195, category: "Premium Snacks", score: 70, pindrops: 14 },
      // Bangalore area
      { lat: 12.9716, lng: 77.5946, category: "Dairy Alternatives", score: 92, pindrops: 23 },
      { lat: 12.98, lng: 77.6, category: "Organic Products", score: 87, pindrops: 20 },
      { lat: 12.965, lng: 77.59, category: "Health Foods", score: 75, pindrops: 15 },
      { lat: 12.975, lng: 77.585, category: "Pet Supplies", score: 80, pindrops: 18 },
      { lat: 12.985, lng: 77.61, category: "Plant Based", score: 95, pindrops: 25 },
      // Chennai area
      { lat: 13.0827, lng: 80.2707, category: "Dairy Alternatives", score: 62, pindrops: 12 },
      { lat: 13.09, lng: 80.28, category: "Health Foods", score: 58, pindrops: 11 },
      { lat: 13.075, lng: 80.26, category: "Organic Products", score: 71, pindrops: 15 },
      // Hyderabad area
      { lat: 17.385, lng: 78.4867, category: "Dairy Alternatives", score: 74, pindrops: 16 },
      { lat: 17.39, lng: 78.495, category: "Health Foods", score: 66, pindrops: 13 },
      { lat: 17.38, lng: 78.48, category: "Pet Supplies", score: 60, pindrops: 12 },
      // Kolkata area
      { lat: 22.5726, lng: 88.3639, category: "Dairy Alternatives", score: 56, pindrops: 11 },
      { lat: 22.58, lng: 88.37, category: "Health Foods", score: 48, pindrops: 9 },
      { lat: 22.565, lng: 88.355, category: "Organic Products", score: 63, pindrops: 13 },
      // Pune area
      { lat: 18.5204, lng: 73.8567, category: "Dairy Alternatives", score: 79, pindrops: 17 },
      { lat: 18.53, lng: 73.865, category: "Health Foods", score: 73, pindrops: 15 },
      { lat: 18.515, lng: 73.85, category: "Pet Supplies", score: 68, pindrops: 14 },
    ];

    for (const d of demandData) {
      const geohash = encodeGeohash(d.lat, d.lng, 7);
      const successProbability = d.score > 70 ? "high" : d.score > 40 ? "medium" : "low";

      await db.insert(demandAggregates).values({
        geohash,
        latitude: d.lat.toString(),
        longitude: d.lng.toString(),
        category: d.category,
        demandScore: d.score,
        pindropCount: d.pindrops,
        searchCount: d.pindrops * 2,
        successProbability,
      });
    }
    console.log(`Seeded ${demandData.length} demand aggregates`);
  } else {
    console.log("Demand aggregates already seeded");
  }

  console.log("Seed complete!");
}

function encodeGeohash(lat: number, lon: number, precision: number): string {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";
  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) { idx = idx * 2 + 1; lonRange[0] = mid; }
      else { idx = idx * 2; lonRange[1] = mid; }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latRange[0] = mid; }
      else { idx = idx * 2; latRange[1] = mid; }
    }
    evenBit = !evenBit;
    bit++;
    if (bit === 5) { geohash += base32[idx]; bit = 0; idx = 0; }
  }
  return geohash;
}

seed().catch(console.error);
