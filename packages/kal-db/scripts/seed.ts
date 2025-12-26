import "dotenv/config";
import { MongoClient } from "mongodb";

const {
  MONGODB_HOST = "localhost",
  MONGODB_PORT = "27017",
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
} = process.env;

// Support both individual env vars and a full DATABASE_URL
const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
};

const getDbName = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return url.pathname.slice(1).split("?")[0];
    } catch {
      return "kal";
    }
  }
  return MONGODB_DATABASE || "kal";
};

// ============================================================================
// NATURAL FOODS - Generic Malaysian dishes (street vendor, no formal halal cert)
// ============================================================================
const naturalFoods = [
  // === RICE DISHES ===
  { name: "Nasi Lemak", calories: 644, protein: 18, carbs: 80, fat: 28, serving: "1 plate", category: "Rice" },
  { name: "Nasi Lemak Ayam Goreng", calories: 850, protein: 32, carbs: 90, fat: 38, serving: "1 plate", category: "Rice" },
  { name: "Nasi Goreng", calories: 520, protein: 15, carbs: 65, fat: 22, serving: "1 plate", category: "Rice" },
  { name: "Nasi Goreng Kampung", calories: 480, protein: 14, carbs: 60, fat: 20, serving: "1 plate", category: "Rice" },
  { name: "Nasi Goreng Pattaya", calories: 650, protein: 20, carbs: 75, fat: 30, serving: "1 plate", category: "Rice" },
  { name: "Nasi Ayam", calories: 550, protein: 28, carbs: 65, fat: 18, serving: "1 plate", category: "Rice" },
  { name: "Nasi Ayam Hainan", calories: 580, protein: 30, carbs: 68, fat: 20, serving: "1 plate", category: "Rice" },
  { name: "Nasi Kandar", calories: 720, protein: 25, carbs: 85, fat: 32, serving: "1 plate", category: "Rice" },
  { name: "Nasi Kerabu", calories: 450, protein: 15, carbs: 55, fat: 18, serving: "1 plate", category: "Rice" },
  { name: "Nasi Dagang", calories: 520, protein: 18, carbs: 70, fat: 18, serving: "1 plate", category: "Rice" },
  { name: "Nasi Briyani", calories: 600, protein: 22, carbs: 75, fat: 24, serving: "1 plate", category: "Rice" },
  { name: "Nasi Tomato", calories: 380, protein: 8, carbs: 65, fat: 10, serving: "1 plate", category: "Rice" },
  
  // === NOODLE DISHES ===
  { name: "Mee Goreng", calories: 450, protein: 12, carbs: 55, fat: 20, serving: "1 plate", category: "Noodles" },
  { name: "Mee Goreng Mamak", calories: 520, protein: 15, carbs: 60, fat: 24, serving: "1 plate", category: "Noodles" },
  { name: "Char Kuey Teow", calories: 740, protein: 22, carbs: 76, fat: 38, serving: "1 plate", category: "Noodles" },
  { name: "Kuey Teow Goreng", calories: 580, protein: 18, carbs: 65, fat: 28, serving: "1 plate", category: "Noodles" },
  { name: "Laksa Penang", calories: 590, protein: 18, carbs: 58, fat: 32, serving: "1 bowl", category: "Noodles" },
  { name: "Laksa Sarawak", calories: 520, protein: 20, carbs: 52, fat: 26, serving: "1 bowl", category: "Noodles" },
  { name: "Curry Laksa", calories: 550, protein: 22, carbs: 50, fat: 30, serving: "1 bowl", category: "Noodles" },
  { name: "Mee Rebus", calories: 420, protein: 15, carbs: 55, fat: 16, serving: "1 bowl", category: "Noodles" },
  { name: "Mee Siam", calories: 380, protein: 12, carbs: 50, fat: 14, serving: "1 bowl", category: "Noodles" },
  { name: "Mee Curry", calories: 480, protein: 18, carbs: 48, fat: 24, serving: "1 bowl", category: "Noodles" },
  { name: "Mee Kari", calories: 480, protein: 18, carbs: 48, fat: 24, serving: "1 bowl", category: "Noodles" },
  { name: "Mee Hoon Goreng", calories: 380, protein: 10, carbs: 52, fat: 15, serving: "1 plate", category: "Noodles" },
  { name: "Mee Hoon Soup", calories: 280, protein: 12, carbs: 40, fat: 8, serving: "1 bowl", category: "Noodles" },
  { name: "Wantan Mee", calories: 420, protein: 18, carbs: 50, fat: 16, serving: "1 bowl", category: "Noodles" },
  { name: "Pan Mee", calories: 380, protein: 15, carbs: 48, fat: 14, serving: "1 bowl", category: "Noodles" },
  { name: "Loh Mee", calories: 450, protein: 16, carbs: 55, fat: 18, serving: "1 bowl", category: "Noodles" },
  
  // === ROTI & BREAD ===
  { name: "Roti Canai", calories: 320, protein: 6, carbs: 42, fat: 14, serving: "1 piece", category: "Roti" },
  { name: "Roti Canai Telur", calories: 380, protein: 12, carbs: 42, fat: 18, serving: "1 piece", category: "Roti" },
  { name: "Roti Tissue", calories: 450, protein: 8, carbs: 65, fat: 18, serving: "1 piece", category: "Roti" },
  { name: "Roti Bom", calories: 420, protein: 8, carbs: 55, fat: 20, serving: "1 piece", category: "Roti" },
  { name: "Roti Sardin", calories: 380, protein: 14, carbs: 40, fat: 18, serving: "1 piece", category: "Roti" },
  { name: "Roti Jala", calories: 180, protein: 5, carbs: 25, fat: 7, serving: "3 pieces", category: "Roti" },
  { name: "Tosai", calories: 120, protein: 3, carbs: 22, fat: 2, serving: "1 piece", category: "Roti" },
  { name: "Chapati", calories: 150, protein: 4, carbs: 28, fat: 3, serving: "1 piece", category: "Roti" },
  { name: "Naan", calories: 260, protein: 7, carbs: 45, fat: 6, serving: "1 piece", category: "Roti" },
  
  // === MEAT DISHES ===
  { name: "Satay Ayam", calories: 200, protein: 20, carbs: 5, fat: 12, serving: "5 sticks", category: "Meat" },
  { name: "Satay Daging", calories: 220, protein: 22, carbs: 5, fat: 14, serving: "5 sticks", category: "Meat" },
  { name: "Rendang Daging", calories: 480, protein: 32, carbs: 8, fat: 36, serving: "1 serving", category: "Meat" },
  { name: "Rendang Ayam", calories: 380, protein: 28, carbs: 8, fat: 26, serving: "1 serving", category: "Meat" },
  { name: "Ayam Goreng", calories: 320, protein: 28, carbs: 12, fat: 18, serving: "1 piece", category: "Meat" },
  { name: "Ayam Masak Merah", calories: 280, protein: 24, carbs: 10, fat: 16, serving: "1 serving", category: "Meat" },
  { name: "Ayam Percik", calories: 350, protein: 26, carbs: 12, fat: 22, serving: "1 serving", category: "Meat" },
  { name: "Ayam Kurma", calories: 320, protein: 25, carbs: 10, fat: 20, serving: "1 serving", category: "Meat" },
  { name: "Daging Masak Kicap", calories: 280, protein: 24, carbs: 8, fat: 18, serving: "1 serving", category: "Meat" },
  { name: "Kambing Masak Kurma", calories: 380, protein: 26, carbs: 12, fat: 26, serving: "1 serving", category: "Meat" },
  
  // === SEAFOOD ===
  { name: "Ikan Bakar", calories: 220, protein: 28, carbs: 4, fat: 10, serving: "1 piece", category: "Seafood" },
  { name: "Ikan Goreng", calories: 280, protein: 26, carbs: 8, fat: 16, serving: "1 piece", category: "Seafood" },
  { name: "Sambal Udang", calories: 180, protein: 18, carbs: 6, fat: 10, serving: "1 serving", category: "Seafood" },
  { name: "Sambal Sotong", calories: 200, protein: 20, carbs: 8, fat: 10, serving: "1 serving", category: "Seafood" },
  { name: "Ikan Asam Pedas", calories: 250, protein: 26, carbs: 10, fat: 12, serving: "1 serving", category: "Seafood" },
  { name: "Udang Masak Lemak", calories: 280, protein: 20, carbs: 8, fat: 20, serving: "1 serving", category: "Seafood" },
  { name: "Ketam Masak Cili", calories: 320, protein: 22, carbs: 12, fat: 22, serving: "1 serving", category: "Seafood" },
  
  // === VEGETABLES ===
  { name: "Kangkung Belacan", calories: 120, protein: 4, carbs: 8, fat: 8, serving: "1 serving", category: "Vegetables" },
  { name: "Sayur Lodeh", calories: 180, protein: 5, carbs: 15, fat: 12, serving: "1 serving", category: "Vegetables" },
  { name: "Sambal Terung", calories: 140, protein: 3, carbs: 12, fat: 10, serving: "1 serving", category: "Vegetables" },
  { name: "Pucuk Paku Goreng", calories: 100, protein: 3, carbs: 8, fat: 7, serving: "1 serving", category: "Vegetables" },
  { name: "Ulam", calories: 50, protein: 2, carbs: 8, fat: 1, serving: "1 serving", category: "Vegetables" },
  { name: "Kerabu Timun", calories: 80, protein: 2, carbs: 10, fat: 4, serving: "1 serving", category: "Vegetables" },
  
  // === SOUPS ===
  { name: "Sup Kambing", calories: 280, protein: 22, carbs: 12, fat: 16, serving: "1 bowl", category: "Soups" },
  { name: "Sup Tulang", calories: 320, protein: 24, carbs: 15, fat: 18, serving: "1 bowl", category: "Soups" },
  { name: "Sup Ayam", calories: 180, protein: 15, carbs: 10, fat: 8, serving: "1 bowl", category: "Soups" },
  { name: "Sup Ikan", calories: 150, protein: 16, carbs: 8, fat: 6, serving: "1 bowl", category: "Soups" },
  { name: "Tom Yam", calories: 220, protein: 18, carbs: 12, fat: 12, serving: "1 bowl", category: "Soups" },
  { name: "Bak Kut Teh", calories: 350, protein: 28, carbs: 10, fat: 22, serving: "1 bowl", category: "Soups" },
  
  // === SNACKS & APPETIZERS ===
  { name: "Curry Puff", calories: 220, protein: 5, carbs: 22, fat: 13, serving: "1 piece", category: "Snacks" },
  { name: "Karipap", calories: 180, protein: 4, carbs: 20, fat: 10, serving: "1 piece", category: "Snacks" },
  { name: "Popiah", calories: 150, protein: 5, carbs: 22, fat: 5, serving: "1 roll", category: "Snacks" },
  { name: "Rojak", calories: 280, protein: 6, carbs: 35, fat: 14, serving: "1 serving", category: "Snacks" },
  { name: "Pasembur", calories: 350, protein: 10, carbs: 40, fat: 18, serving: "1 serving", category: "Snacks" },
  { name: "Otak-Otak", calories: 120, protein: 10, carbs: 6, fat: 7, serving: "2 pieces", category: "Snacks" },
  { name: "Keropok Lekor", calories: 180, protein: 8, carbs: 25, fat: 6, serving: "5 pieces", category: "Snacks" },
  { name: "Pisang Goreng", calories: 150, protein: 2, carbs: 24, fat: 6, serving: "2 pieces", category: "Snacks" },
  { name: "Cekodok", calories: 120, protein: 2, carbs: 18, fat: 5, serving: "3 pieces", category: "Snacks" },
  { name: "Cucur Udang", calories: 180, protein: 6, carbs: 20, fat: 9, serving: "3 pieces", category: "Snacks" },
  { name: "Apam Balik", calories: 280, protein: 6, carbs: 45, fat: 10, serving: "1 piece", category: "Snacks" },
  
  // === DESSERTS ===
  { name: "Cendol", calories: 280, protein: 3, carbs: 55, fat: 8, serving: "1 bowl", category: "Desserts" },
  { name: "Ais Kacang", calories: 320, protein: 5, carbs: 65, fat: 6, serving: "1 bowl", category: "Desserts" },
  { name: "Bubur Cha Cha", calories: 250, protein: 4, carbs: 45, fat: 8, serving: "1 bowl", category: "Desserts" },
  { name: "Kuih Lapis", calories: 150, protein: 2, carbs: 25, fat: 6, serving: "2 pieces", category: "Desserts" },
  { name: "Kuih Seri Muka", calories: 180, protein: 3, carbs: 30, fat: 7, serving: "2 pieces", category: "Desserts" },
  { name: "Ondeh-Ondeh", calories: 120, protein: 2, carbs: 22, fat: 4, serving: "4 pieces", category: "Desserts" },
  
  // === DRINKS ===
  { name: "Teh Tarik", calories: 120, protein: 3, carbs: 18, fat: 4, serving: "1 glass", category: "Drinks" },
  { name: "Kopi O", calories: 45, protein: 0, carbs: 12, fat: 0, serving: "1 glass", category: "Drinks" },
  { name: "Milo Ais", calories: 180, protein: 5, carbs: 30, fat: 5, serving: "1 glass", category: "Drinks" },
  { name: "Bandung", calories: 150, protein: 3, carbs: 28, fat: 3, serving: "1 glass", category: "Drinks" },
  { name: "Air Kelapa", calories: 45, protein: 1, carbs: 9, fat: 0, serving: "1 glass", category: "Drinks" },
  { name: "Sirap Limau", calories: 100, protein: 0, carbs: 26, fat: 0, serving: "1 glass", category: "Drinks" },
  
  // === COMMON INGREDIENTS ===
  { name: "White Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g", category: "Basics" },
  { name: "Coconut Rice", calories: 180, protein: 3, carbs: 28, fat: 7, serving: "100g", category: "Basics" },
  { name: "Telur Dadar", calories: 150, protein: 10, carbs: 2, fat: 12, serving: "1 egg", category: "Basics" },
  { name: "Telur Rebus", calories: 78, protein: 6, carbs: 0.6, fat: 5, serving: "1 egg", category: "Basics" },
  { name: "Ikan Bilis", calories: 80, protein: 12, carbs: 0, fat: 3, serving: "30g", category: "Basics" },
  { name: "Sambal Belacan", calories: 50, protein: 1, carbs: 5, fat: 3, serving: "1 tbsp", category: "Basics" },
  { name: "Tempeh Goreng", calories: 200, protein: 15, carbs: 10, fat: 12, serving: "100g", category: "Basics" },
  { name: "Tahu Goreng", calories: 180, protein: 12, carbs: 8, fat: 12, serving: "100g", category: "Basics" },

  // === FRUITS (Local & Tropical) ===
  { name: "Pisang (Banana)", calories: 89, protein: 1, carbs: 23, fat: 0.3, serving: "1 medium", category: "Fruits" },
  { name: "Durian", calories: 147, protein: 1.5, carbs: 27, fat: 5, serving: "100g", category: "Fruits" },
  { name: "Mangga (Mango)", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, serving: "100g", category: "Fruits" },
  { name: "Papaya", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, serving: "100g", category: "Fruits" },
  { name: "Rambutan", calories: 68, protein: 0.9, carbs: 16, fat: 0.2, serving: "100g", category: "Fruits" },
  { name: "Langsat", calories: 60, protein: 1, carbs: 14, fat: 0.2, serving: "100g", category: "Fruits" },
  { name: "Manggis (Mangosteen)", calories: 73, protein: 0.4, carbs: 18, fat: 0.6, serving: "100g", category: "Fruits" },
  { name: "Nangka (Jackfruit)", calories: 95, protein: 1.7, carbs: 23, fat: 0.6, serving: "100g", category: "Fruits" },
  { name: "Betik (Papaya)", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, serving: "100g", category: "Fruits" },
  { name: "Tembikai (Watermelon)", calories: 30, protein: 0.6, carbs: 8, fat: 0.2, serving: "100g", category: "Fruits" },
  { name: "Limau Manis (Orange)", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, serving: "1 medium", category: "Fruits" },
  { name: "Epal (Apple)", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium", category: "Fruits" },
  { name: "Anggur (Grapes)", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, serving: "100g", category: "Fruits" },
  { name: "Jambu Batu (Guava)", calories: 68, protein: 2.6, carbs: 14, fat: 1, serving: "100g", category: "Fruits" },
  { name: "Ciku (Sapodilla)", calories: 83, protein: 0.4, carbs: 20, fat: 1, serving: "100g", category: "Fruits" },

  // === VEGETABLES ===
  { name: "Kangkung", calories: 19, protein: 2.6, carbs: 3, fat: 0.2, serving: "100g", category: "Vegetables" },
  { name: "Bayam (Spinach)", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: "100g", category: "Vegetables" },
  { name: "Sawi (Mustard Greens)", calories: 27, protein: 2.9, carbs: 4.7, fat: 0.4, serving: "100g", category: "Vegetables" },
  { name: "Kubis (Cabbage)", calories: 25, protein: 1.3, carbs: 6, fat: 0.1, serving: "100g", category: "Vegetables" },
  { name: "Timun (Cucumber)", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, serving: "100g", category: "Vegetables" },
  { name: "Tomato", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: "100g", category: "Vegetables" },
  { name: "Lobak Merah (Carrot)", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, serving: "100g", category: "Vegetables" },
  { name: "Brokoli (Broccoli)", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: "100g", category: "Vegetables" },
  { name: "Kacang Panjang (Long Bean)", calories: 47, protein: 2.8, carbs: 8, fat: 0.4, serving: "100g", category: "Vegetables" },
  { name: "Terung (Eggplant)", calories: 25, protein: 1, carbs: 6, fat: 0.2, serving: "100g", category: "Vegetables" },

  // === PROTEINS ===
  { name: "Dada Ayam (Chicken Breast)", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g", category: "Proteins" },
  { name: "Paha Ayam (Chicken Thigh)", calories: 209, protein: 26, carbs: 0, fat: 11, serving: "100g", category: "Proteins" },
  { name: "Daging Lembu (Beef)", calories: 250, protein: 26, carbs: 0, fat: 15, serving: "100g", category: "Proteins" },
  { name: "Ikan Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100g", category: "Proteins" },
  { name: "Ikan Kembung", calories: 139, protein: 21, carbs: 0, fat: 6, serving: "100g", category: "Proteins" },
  { name: "Ikan Tilapia", calories: 96, protein: 20, carbs: 0, fat: 1.7, serving: "100g", category: "Proteins" },
  { name: "Udang (Prawn)", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, serving: "100g", category: "Proteins" },
  { name: "Sotong (Squid)", calories: 92, protein: 18, carbs: 3, fat: 1.4, serving: "100g", category: "Proteins" },
  { name: "Telur Ayam (Chicken Egg)", calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: "2 eggs", category: "Proteins" },
  { name: "Tahu (Tofu)", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: "100g", category: "Proteins" },

  // === GRAINS & CARBS ===
  { name: "Nasi Putih (White Rice)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g", category: "Grains" },
  { name: "Nasi Perang (Brown Rice)", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, serving: "100g", category: "Grains" },
  { name: "Roti Putih (White Bread)", calories: 79, protein: 3, carbs: 15, fat: 1, serving: "1 slice", category: "Grains" },
  { name: "Roti Wholemeal", calories: 81, protein: 4, carbs: 13, fat: 1.3, serving: "1 slice", category: "Grains" },
  { name: "Oat", calories: 389, protein: 17, carbs: 66, fat: 7, serving: "100g", category: "Grains" },
  { name: "Mee Kuning (Yellow Noodles)", calories: 138, protein: 5, carbs: 25, fat: 2, serving: "100g", category: "Grains" },
  { name: "Bihun (Rice Vermicelli)", calories: 364, protein: 3.4, carbs: 83, fat: 0.6, serving: "100g dry", category: "Grains" },
  { name: "Kuey Teow", calories: 109, protein: 3, carbs: 24, fat: 0.2, serving: "100g", category: "Grains" },
  { name: "Ubi Keledek (Sweet Potato)", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: "100g", category: "Grains" },
  { name: "Kentang (Potato)", calories: 77, protein: 2, carbs: 17, fat: 0.1, serving: "100g", category: "Grains" },

  // === HEALTHY ADDITIONS ===
  { name: "Kacang Tanah (Peanuts)", calories: 567, protein: 26, carbs: 16, fat: 49, serving: "100g", category: "Nuts" },
  { name: "Kacang Badam (Almonds)", calories: 579, protein: 21, carbs: 22, fat: 50, serving: "100g", category: "Nuts" },
  { name: "Santan (Coconut Milk)", calories: 230, protein: 2.3, carbs: 6, fat: 24, serving: "100ml", category: "Basics" },
  { name: "Madu (Honey)", calories: 304, protein: 0.3, carbs: 82, fat: 0, serving: "100g", category: "Basics" },
  { name: "Gula Melaka (Palm Sugar)", calories: 375, protein: 0.4, carbs: 93, fat: 0.4, serving: "100g", category: "Basics" },
];

// ============================================================================
// HALAL FOODS - Branded foods with official halal certification
// ============================================================================
const halalFoods = [
  // === RAMLY (JAKIM Certified) ===
  { name: "Ramly Beef Burger", calories: 400, protein: 15, carbs: 35, fat: 20, serving: "1 burger (200g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Beef Special", calories: 600, protein: 25, carbs: 45, fat: 35, serving: "1 burger (250g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Beef Cheese", calories: 480, protein: 18, carbs: 38, fat: 28, serving: "1 burger (220g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Double Special", calories: 800, protein: 40, carbs: 50, fat: 45, serving: "1 burger (350g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Chicken Burger", calories: 480, protein: 20, carbs: 42, fat: 22, serving: "1 burger (250g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Chicken Special", calories: 550, protein: 24, carbs: 45, fat: 28, serving: "1 burger (250g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Chicken Cheese", calories: 530, protein: 22, carbs: 44, fat: 26, serving: "1 burger (250g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Lamb Burger", calories: 450, protein: 22, carbs: 35, fat: 25, serving: "1 burger (200g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Fish Burger", calories: 380, protein: 18, carbs: 38, fat: 18, serving: "1 burger (200g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Beef Sausage", calories: 280, protein: 12, carbs: 8, fat: 22, serving: "2 sausages", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Chicken Sausage", calories: 240, protein: 10, carbs: 10, fat: 18, serving: "2 sausages", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Oblong Beef", calories: 420, protein: 16, carbs: 36, fat: 22, serving: "1 burger (220g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ramly Oblong Chicken", calories: 400, protein: 18, carbs: 38, fat: 20, serving: "1 burger (220g)", category: "Fast Food", brand: "Ramly", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === AYAMAS (JAKIM Certified) ===
  { name: "Ayamas Crispy Nuggets", calories: 185, protein: 7, carbs: 15, fat: 9, serving: "100g", category: "Frozen", brand: "Ayamas", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ayamas Tempura Nuggets", calories: 164, protein: 9, carbs: 12, fat: 7, serving: "100g", category: "Frozen", brand: "Ayamas", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ayamas Chicken Sausage", calories: 128, protein: 6, carbs: 11, fat: 7, serving: "55g (3 pcs)", category: "Frozen", brand: "Ayamas", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ayamas Chicken Frankfurter", calories: 260, protein: 9, carbs: 6, fat: 22, serving: "100g", category: "Frozen", brand: "Ayamas", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Ayamas Chicken Karaage", calories: 220, protein: 14, carbs: 12, fat: 13, serving: "100g", category: "Frozen", brand: "Ayamas", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === ADABI (JAKIM Certified) ===
  { name: "Adabi Rendang Paste", calories: 231, protein: 2, carbs: 17, fat: 16, serving: "100g", category: "Condiments", brand: "Adabi", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Adabi Curry Paste", calories: 180, protein: 3, carbs: 15, fat: 12, serving: "100g", category: "Condiments", brand: "Adabi", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Adabi Sambal Tumis", calories: 150, protein: 2, carbs: 12, fat: 10, serving: "100g", category: "Condiments", brand: "Adabi", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Adabi Kari Daging Paste", calories: 190, protein: 3, carbs: 16, fat: 13, serving: "100g", category: "Condiments", brand: "Adabi", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Adabi Nasi Goreng Paste", calories: 160, protein: 2, carbs: 20, fat: 8, serving: "100g", category: "Condiments", brand: "Adabi", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === KAWAN (JAKIM Certified) ===
  { name: "Kawan Paratha Plain", calories: 180, protein: 3, carbs: 25, fat: 8, serving: "1 piece", category: "Frozen", brand: "Kawan", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Kawan Chapati", calories: 120, protein: 3, carbs: 22, fat: 3, serving: "1 piece", category: "Frozen", brand: "Kawan", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Kawan Spring Roll Pastry", calories: 90, protein: 2, carbs: 18, fat: 1, serving: "4 sheets", category: "Frozen", brand: "Kawan", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Kawan Roti Canai", calories: 320, protein: 6, carbs: 42, fat: 14, serving: "1 piece", category: "Frozen", brand: "Kawan", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Kawan Puff Pastry", calories: 200, protein: 3, carbs: 20, fat: 12, serving: "100g", category: "Frozen", brand: "Kawan", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === MUNCHY'S (JAKIM Certified) ===
  { name: "Munchy's Cream Crackers", calories: 440, protein: 8, carbs: 70, fat: 14, serving: "100g", category: "Snacks", brand: "Munchy's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Munchy's Lexus Cream", calories: 500, protein: 5, carbs: 65, fat: 25, serving: "100g", category: "Snacks", brand: "Munchy's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Munchy's Oat Krunch", calories: 450, protein: 7, carbs: 68, fat: 18, serving: "100g", category: "Snacks", brand: "Munchy's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Munchy's Captain Munch", calories: 480, protein: 6, carbs: 72, fat: 20, serving: "100g", category: "Snacks", brand: "Munchy's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Munchy's Choc-O", calories: 520, protein: 5, carbs: 60, fat: 28, serving: "100g", category: "Snacks", brand: "Munchy's", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === FARM FRESH (JAKIM Certified) ===
  { name: "Farm Fresh Greek Yogurt", calories: 128, protein: 7, carbs: 10, fat: 5, serving: "120g", category: "Dairy", brand: "Farm Fresh", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Farm Fresh Natural Yogurt", calories: 93, protein: 4, carbs: 12, fat: 3, serving: "120g", category: "Dairy", brand: "Farm Fresh", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Farm Fresh Fresh Milk", calories: 130, protein: 6, carbs: 10, fat: 7, serving: "200ml", category: "Dairy", brand: "Farm Fresh", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Farm Fresh Low Fat Milk", calories: 90, protein: 6, carbs: 10, fat: 2, serving: "200ml", category: "Dairy", brand: "Farm Fresh", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Farm Fresh Oat Milk", calories: 110, protein: 2, carbs: 18, fat: 3, serving: "200ml", category: "Dairy", brand: "Farm Fresh", halalCertifier: "JAKIM", halalCertYear: 2024 },
];

async function seed() {
  console.log("🌱 Starting seed (force mode)...");

  const uri = getDatabaseUri();
  const dbName = getDbName();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // ========================================
    // Seed foods collection
    // ========================================
    const oldFoodsCollection = db.collection("foods");
    const oldCount = await oldFoodsCollection.countDocuments();
    
    if (oldCount > 0) {
      console.log(`📦 Found ${oldCount} items in 'foods' collection - will be replaced`);
    }
    
    // Clear old 'foods' collection (if exists)
    await oldFoodsCollection.deleteMany({});
    console.log("🗑️  Cleared 'foods' collection");

    // ========================================
    // Seed foods collection
    // ========================================
    const foodsCollection = db.collection("foods");
    await foodsCollection.insertMany(naturalFoods);
    console.log(`✅ Inserted ${naturalFoods.length} items into 'foods' collection`);

    // Create indexes for foods
    await foodsCollection.createIndex({ name: "text" });
    await foodsCollection.createIndex({ category: 1 });
    console.log("✅ Created indexes on 'foods' collection");

    // ========================================
    // Seed halal_foods collection
    // ========================================
    const halalCollection = db.collection("halal_foods");
    await halalCollection.deleteMany({});
    await halalCollection.insertMany(halalFoods);
    console.log(`✅ Inserted ${halalFoods.length} items into 'halal_foods' collection`);

    // Create indexes for halal_foods
    await halalCollection.createIndex({ name: "text" });
    await halalCollection.createIndex({ category: 1 });
    await halalCollection.createIndex({ brand: 1 });
    await halalCollection.createIndex({ halalCertifier: 1 });
    console.log("✅ Created indexes on 'halal_foods' collection");

    console.log("🎉 Seeding completed successfully!");
    console.log(`   📊 Total: ${naturalFoods.length} foods + ${halalFoods.length} halal certified foods`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
