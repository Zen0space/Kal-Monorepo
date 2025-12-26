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
  { name: "Nasi Lemak", calories: 494, protein: 13, carbs: 80, fat: 14, serving: "1 plate (350g)", category: "Rice" },
  { name: "Nasi Lemak Ayam Goreng", calories: 744, protein: 28, carbs: 85, fat: 32, serving: "1 plate (450g)", category: "Rice" },
  { name: "Nasi Goreng", calories: 472, protein: 12, carbs: 84, fat: 8, serving: "1 plate (350g)", category: "Rice" },
  { name: "Nasi Goreng Kampung", calories: 518, protein: 14, carbs: 81, fat: 15, serving: "1 plate (350g)", category: "Rice" },
  { name: "Nasi Goreng Pattaya", calories: 650, protein: 20, carbs: 75, fat: 30, serving: "1 plate (400g)", category: "Rice" },
  { name: "Nasi Ayam", calories: 400, protein: 20, carbs: 60, fat: 10, serving: "1 plate (380g)", category: "Rice" },
  { name: "Nasi Ayam Hainan", calories: 618, protein: 30, carbs: 75, fat: 22, serving: "1 plate (400g)", category: "Rice" },
  { name: "Nasi Kandar", calories: 800, protein: 35, carbs: 100, fat: 30, serving: "1 plate (500g)", category: "Rice" },
  { name: "Nasi Kerabu", calories: 450, protein: 15, carbs: 55, fat: 18, serving: "1 plate (380g)", category: "Rice" },
  { name: "Nasi Dagang", calories: 520, protein: 18, carbs: 70, fat: 18, serving: "1 plate (400g)", category: "Rice" },
  { name: "Nasi Briyani", calories: 600, protein: 22, carbs: 75, fat: 24, serving: "1 plate (450g)", category: "Rice" },
  { name: "Nasi Tomato", calories: 380, protein: 8, carbs: 65, fat: 10, serving: "1 plate (300g)", category: "Rice" },
  
  // === NOODLE DISHES ===
  { name: "Mee Goreng", calories: 450, protein: 12, carbs: 55, fat: 20, serving: "1 plate (300g)", category: "Noodles" },
  { name: "Mee Goreng Mamak", calories: 450, protein: 15, carbs: 60, fat: 16, serving: "1 plate (350g)", category: "Noodles" },
  { name: "Char Kuey Teow", calories: 700, protein: 24, carbs: 85, fat: 30, serving: "1 plate (400g)", category: "Noodles" },
  { name: "Kuey Teow Goreng", calories: 580, protein: 18, carbs: 65, fat: 28, serving: "1 plate (350g)", category: "Noodles" },
  { name: "Laksa Penang", calories: 436, protein: 18, carbs: 55, fat: 18, serving: "1 bowl (450ml)", category: "Noodles" },
  { name: "Laksa Sarawak", calories: 520, protein: 20, carbs: 52, fat: 26, serving: "1 bowl (450ml)", category: "Noodles" },
  { name: "Curry Laksa", calories: 600, protein: 22, carbs: 55, fat: 32, serving: "1 bowl (450ml)", category: "Noodles" },
  { name: "Mee Rebus", calories: 450, protein: 18, carbs: 60, fat: 15, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Mee Siam", calories: 380, protein: 12, carbs: 50, fat: 14, serving: "1 bowl (350ml)", category: "Noodles" },
  { name: "Mee Curry", calories: 480, protein: 18, carbs: 48, fat: 24, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Mee Kari", calories: 480, protein: 18, carbs: 48, fat: 24, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Mee Hoon Goreng", calories: 380, protein: 10, carbs: 52, fat: 15, serving: "1 plate (280g)", category: "Noodles" },
  { name: "Mee Hoon Soup", calories: 280, protein: 12, carbs: 40, fat: 8, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Wantan Mee", calories: 420, protein: 18, carbs: 50, fat: 16, serving: "1 bowl (350g)", category: "Noodles" },
  { name: "Pan Mee", calories: 380, protein: 15, carbs: 48, fat: 14, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Loh Mee", calories: 450, protein: 16, carbs: 55, fat: 18, serving: "1 bowl (400ml)", category: "Noodles" },
  
  // === ROTI & BREAD ===
  { name: "Roti Canai", calories: 250, protein: 5, carbs: 36, fat: 10, serving: "1 piece (100g)", category: "Roti" },
  { name: "Roti Canai Telur", calories: 356, protein: 12, carbs: 46, fat: 14, serving: "1 piece (130g)", category: "Roti" },
  { name: "Roti Tissue", calories: 450, protein: 8, carbs: 65, fat: 18, serving: "1 piece (150g)", category: "Roti" },
  { name: "Roti Bom", calories: 420, protein: 8, carbs: 55, fat: 20, serving: "1 piece (120g)", category: "Roti" },
  { name: "Roti Sardin", calories: 380, protein: 14, carbs: 40, fat: 18, serving: "1 piece (140g)", category: "Roti" },
  { name: "Roti Jala", calories: 180, protein: 5, carbs: 25, fat: 7, serving: "3 pieces (90g)", category: "Roti" },
  { name: "Tosai", calories: 120, protein: 3, carbs: 22, fat: 2, serving: "1 piece (80g)", category: "Roti" },
  { name: "Chapati", calories: 150, protein: 4, carbs: 28, fat: 3, serving: "1 piece (60g)", category: "Roti" },
  { name: "Naan", calories: 260, protein: 7, carbs: 45, fat: 6, serving: "1 piece (90g)", category: "Roti" },
  
  // === MEAT DISHES ===
  { name: "Satay Ayam", calories: 180, protein: 22, carbs: 3, fat: 10, serving: "5 sticks (100g)", category: "Meat" },
  { name: "Satay Daging", calories: 200, protein: 25, carbs: 3, fat: 11, serving: "5 sticks (110g)", category: "Meat" },
  { name: "Rendang Daging", calories: 350, protein: 29, carbs: 8, fat: 24, serving: "1 serving (120g)", category: "Meat" },
  { name: "Rendang Ayam", calories: 280, protein: 24, carbs: 6, fat: 18, serving: "1 serving (120g)", category: "Meat" },
  { name: "Ayam Goreng", calories: 320, protein: 28, carbs: 12, fat: 18, serving: "1 piece (120g)", category: "Meat" },
  { name: "Ayam Masak Merah", calories: 280, protein: 24, carbs: 10, fat: 16, serving: "1 serving (150g)", category: "Meat" },
  { name: "Ayam Percik", calories: 350, protein: 26, carbs: 12, fat: 22, serving: "1 serving (180g)", category: "Meat" },
  { name: "Ayam Kurma", calories: 320, protein: 25, carbs: 10, fat: 20, serving: "1 serving (150g)", category: "Meat" },
  { name: "Daging Masak Kicap", calories: 280, protein: 24, carbs: 8, fat: 18, serving: "1 serving (150g)", category: "Meat" },
  { name: "Kambing Masak Kurma", calories: 380, protein: 26, carbs: 12, fat: 26, serving: "1 serving (180g)", category: "Meat" },
  
  // === SEAFOOD ===
  { name: "Ikan Bakar", calories: 220, protein: 28, carbs: 4, fat: 10, serving: "1 piece (150g)", category: "Seafood" },
  { name: "Ikan Goreng", calories: 280, protein: 26, carbs: 8, fat: 16, serving: "1 piece (150g)", category: "Seafood" },
  { name: "Sambal Udang", calories: 180, protein: 18, carbs: 6, fat: 10, serving: "1 serving (120g)", category: "Seafood" },
  { name: "Sambal Sotong", calories: 200, protein: 20, carbs: 8, fat: 10, serving: "1 serving (130g)", category: "Seafood" },
  { name: "Ikan Asam Pedas", calories: 250, protein: 26, carbs: 10, fat: 12, serving: "1 serving (180g)", category: "Seafood" },
  { name: "Udang Masak Lemak", calories: 280, protein: 20, carbs: 8, fat: 20, serving: "1 serving (150g)", category: "Seafood" },
  { name: "Ketam Masak Cili", calories: 320, protein: 22, carbs: 12, fat: 22, serving: "1 serving (200g)", category: "Seafood" },
  
  // === VEGETABLES ===
  { name: "Kangkung Belacan", calories: 120, protein: 4, carbs: 8, fat: 8, serving: "1 serving (150g)", category: "Vegetables" },
  { name: "Sayur Lodeh", calories: 180, protein: 5, carbs: 15, fat: 12, serving: "1 serving (200g)", category: "Vegetables" },
  { name: "Sambal Terung", calories: 140, protein: 3, carbs: 12, fat: 10, serving: "1 serving (150g)", category: "Vegetables" },
  { name: "Pucuk Paku Goreng", calories: 100, protein: 3, carbs: 8, fat: 7, serving: "1 serving (120g)", category: "Vegetables" },
  { name: "Ulam", calories: 50, protein: 2, carbs: 8, fat: 1, serving: "1 serving (80g)", category: "Vegetables" },
  { name: "Kerabu Timun", calories: 80, protein: 2, carbs: 10, fat: 4, serving: "1 serving (100g)", category: "Vegetables" },
  
  // === SOUPS ===
  { name: "Sup Kambing", calories: 280, protein: 22, carbs: 12, fat: 16, serving: "1 bowl (350ml)", category: "Soups" },
  { name: "Sup Tulang", calories: 320, protein: 24, carbs: 15, fat: 18, serving: "1 bowl (400ml)", category: "Soups" },
  { name: "Sup Ayam", calories: 180, protein: 15, carbs: 10, fat: 8, serving: "1 bowl (300ml)", category: "Soups" },
  { name: "Sup Ikan", calories: 150, protein: 16, carbs: 8, fat: 6, serving: "1 bowl (300ml)", category: "Soups" },
  { name: "Tom Yam", calories: 220, protein: 18, carbs: 12, fat: 12, serving: "1 bowl (350ml)", category: "Soups" },
  { name: "Bak Kut Teh", calories: 350, protein: 28, carbs: 10, fat: 22, serving: "1 bowl (400ml)", category: "Soups" },
  
  // === SNACKS & APPETIZERS ===
  { name: "Curry Puff", calories: 220, protein: 5, carbs: 22, fat: 13, serving: "1 piece (60g)", category: "Snacks" },
  { name: "Karipap", calories: 180, protein: 4, carbs: 20, fat: 10, serving: "1 piece (50g)", category: "Snacks" },
  { name: "Popiah", calories: 150, protein: 5, carbs: 22, fat: 5, serving: "1 roll (80g)", category: "Snacks" },
  { name: "Rojak", calories: 280, protein: 6, carbs: 35, fat: 14, serving: "1 serving (200g)", category: "Snacks" },
  { name: "Pasembur", calories: 350, protein: 10, carbs: 40, fat: 18, serving: "1 serving (250g)", category: "Snacks" },
  { name: "Otak-Otak", calories: 120, protein: 10, carbs: 6, fat: 7, serving: "2 pieces (80g)", category: "Snacks" },
  { name: "Keropok Lekor", calories: 180, protein: 8, carbs: 25, fat: 6, serving: "5 pieces (100g)", category: "Snacks" },
  { name: "Pisang Goreng", calories: 150, protein: 2, carbs: 24, fat: 6, serving: "2 pieces (100g)", category: "Snacks" },
  { name: "Cekodok", calories: 120, protein: 2, carbs: 18, fat: 5, serving: "3 pieces (75g)", category: "Snacks" },
  { name: "Cucur Udang", calories: 180, protein: 6, carbs: 20, fat: 9, serving: "3 pieces (90g)", category: "Snacks" },
  { name: "Apam Balik", calories: 280, protein: 6, carbs: 45, fat: 10, serving: "1 piece (120g)", category: "Snacks" },
  
  // === DESSERTS ===
  { name: "Cendol", calories: 280, protein: 3, carbs: 55, fat: 8, serving: "1 bowl (250ml)", category: "Desserts" },
  { name: "Ais Kacang", calories: 320, protein: 5, carbs: 65, fat: 6, serving: "1 bowl (300ml)", category: "Desserts" },
  { name: "Bubur Cha Cha", calories: 250, protein: 4, carbs: 45, fat: 8, serving: "1 bowl (200ml)", category: "Desserts" },
  { name: "Kuih Lapis", calories: 150, protein: 2, carbs: 25, fat: 6, serving: "2 pieces (80g)", category: "Desserts" },
  { name: "Kuih Seri Muka", calories: 180, protein: 3, carbs: 30, fat: 7, serving: "2 pieces (100g)", category: "Desserts" },
  { name: "Ondeh-Ondeh", calories: 120, protein: 2, carbs: 22, fat: 4, serving: "4 pieces (60g)", category: "Desserts" },
  
  // === DRINKS ===
  { name: "Teh Tarik", calories: 170, protein: 2, carbs: 26, fat: 4, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Kopi O", calories: 50, protein: 0, carbs: 12, fat: 0, serving: "1 glass (200ml)", category: "Drinks" },
  { name: "Milo Ais", calories: 200, protein: 6, carbs: 32, fat: 5, serving: "1 glass (300ml)", category: "Drinks" },
  { name: "Bandung", calories: 150, protein: 3, carbs: 28, fat: 3, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Air Kelapa", calories: 45, protein: 1, carbs: 9, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Sirap Limau", calories: 100, protein: 0, carbs: 26, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  
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

  // === BREAKFAST ===
  { name: "Kaya Toast", calories: 180, protein: 4, carbs: 28, fat: 6, serving: "2 slices (80g)", category: "Breakfast" },
  { name: "Half-Boiled Eggs", calories: 140, protein: 12, carbs: 1, fat: 10, serving: "2 eggs (100g)", category: "Breakfast" },
  { name: "Dim Sum Siu Mai", calories: 160, protein: 10, carbs: 12, fat: 8, serving: "4 pcs (80g)", category: "Breakfast" },
  { name: "Bubur Nasi (Congee)", calories: 120, protein: 4, carbs: 22, fat: 2, serving: "1 bowl (300ml)", category: "Breakfast" },
  { name: "Lontong", calories: 350, protein: 12, carbs: 48, fat: 12, serving: "1 plate (350g)", category: "Breakfast" },
  { name: "Nasi Ulam", calories: 380, protein: 10, carbs: 55, fat: 14, serving: "1 plate (350g)", category: "Rice" },
  { name: "Roti Bakar", calories: 200, protein: 5, carbs: 30, fat: 7, serving: "2 slices (80g)", category: "Breakfast" },
  { name: "Bihun Sup", calories: 280, protein: 15, carbs: 40, fat: 6, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Nasi Lemak Rendang", calories: 750, protein: 28, carbs: 85, fat: 34, serving: "1 plate (500g)", category: "Rice" },
  { name: "Roti Telur Bawang", calories: 420, protein: 14, carbs: 45, fat: 20, serving: "1 piece (150g)", category: "Roti" },

  // === LUNCH/DINNER ===
  { name: "Kolo Mee", calories: 450, protein: 18, carbs: 55, fat: 18, serving: "1 bowl (350g)", category: "Noodles" },
  { name: "Sarawak Laksa", calories: 520, protein: 22, carbs: 55, fat: 24, serving: "1 bowl (450ml)", category: "Noodles" },
  { name: "Ikan Pari Bakar", calories: 280, protein: 32, carbs: 5, fat: 14, serving: "1 serving (200g)", category: "Seafood" },
  { name: "Sambal Petai Udang", calories: 220, protein: 18, carbs: 12, fat: 12, serving: "1 serving (150g)", category: "Seafood" },
  { name: "Gulai Kawah", calories: 350, protein: 22, carbs: 15, fat: 24, serving: "1 serving (180g)", category: "Meat" },
  { name: "Mee Bandung", calories: 420, protein: 18, carbs: 52, fat: 16, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Asam Pedas Ikan", calories: 260, protein: 28, carbs: 12, fat: 12, serving: "1 serving (200g)", category: "Seafood" },
  { name: "Daging Dendeng", calories: 200, protein: 28, carbs: 8, fat: 6, serving: "100g", category: "Meat" },
  { name: "Kerabu Mangga", calories: 120, protein: 2, carbs: 18, fat: 5, serving: "1 serving (120g)", category: "Vegetables" },
  { name: "Nasi Campur", calories: 650, protein: 25, carbs: 75, fat: 28, serving: "1 plate (450g)", category: "Rice" },
  { name: "Claypot Chicken Rice", calories: 580, protein: 28, carbs: 70, fat: 20, serving: "1 pot (450g)", category: "Rice" },
  { name: "Hokkien Mee", calories: 480, protein: 22, carbs: 55, fat: 20, serving: "1 plate (400g)", category: "Noodles" },
  { name: "Yong Tau Foo", calories: 320, protein: 18, carbs: 30, fat: 14, serving: "6 pcs (250g)", category: "Vegetables" },
  { name: "Ikan Tenggiri Goreng", calories: 180, protein: 24, carbs: 5, fat: 8, serving: "1 piece (120g)", category: "Seafood" },

  // === DRINKS ===
  { name: "Teh O Ais Limau", calories: 80, protein: 0, carbs: 20, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Kopi C", calories: 90, protein: 2, carbs: 14, fat: 3, serving: "1 glass (200ml)", category: "Drinks" },
  { name: "Teh C Peng", calories: 85, protein: 2, carbs: 14, fat: 2, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Barli Limau", calories: 120, protein: 1, carbs: 28, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Soya Bean", calories: 100, protein: 7, carbs: 12, fat: 4, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Air Mata Kucing", calories: 90, protein: 1, carbs: 22, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Cincau", calories: 60, protein: 1, carbs: 14, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Limau Suam", calories: 40, protein: 0, carbs: 10, fat: 0, serving: "1 glass (200ml)", category: "Drinks" },
  { name: "ABC Juice", calories: 120, protein: 2, carbs: 26, fat: 0, serving: "1 glass (300ml)", category: "Drinks" },
  { name: "Cham (Kopi Teh)", calories: 110, protein: 2, carbs: 18, fat: 3, serving: "1 glass (250ml)", category: "Drinks" },

  // === KUIH & DESSERTS ===
  { name: "Kuih Ketayap", calories: 120, protein: 2, carbs: 20, fat: 4, serving: "2 pcs (70g)", category: "Desserts" },
  { name: "Kuih Talam", calories: 150, protein: 2, carbs: 28, fat: 4, serving: "2 pcs (100g)", category: "Desserts" },
  { name: "Kuih Cara", calories: 100, protein: 3, carbs: 16, fat: 3, serving: "4 pcs (60g)", category: "Desserts" },
  { name: "Kuih Koci", calories: 130, protein: 2, carbs: 22, fat: 4, serving: "2 pcs (80g)", category: "Desserts" },
  { name: "Ang Ku Kueh", calories: 110, protein: 2, carbs: 22, fat: 2, serving: "2 pcs (80g)", category: "Desserts" },
  { name: "Tepung Pelita", calories: 140, protein: 2, carbs: 24, fat: 5, serving: "2 pcs (100g)", category: "Desserts" },
  { name: "Pulut Panggang", calories: 180, protein: 4, carbs: 32, fat: 5, serving: "2 pcs (120g)", category: "Desserts" },
  { name: "Kuih Kosui", calories: 100, protein: 1, carbs: 22, fat: 1, serving: "3 pcs (75g)", category: "Desserts" },
  { name: "Lepat Pisang", calories: 160, protein: 2, carbs: 32, fat: 4, serving: "2 pcs (100g)", category: "Desserts" },
  { name: "Sago Gula Melaka", calories: 220, protein: 1, carbs: 48, fat: 6, serving: "1 bowl (200ml)", category: "Desserts" },
  { name: "Pengat Pisang", calories: 200, protein: 2, carbs: 40, fat: 5, serving: "1 bowl (200ml)", category: "Desserts" },
  { name: "Kuih Bahulu", calories: 90, protein: 2, carbs: 16, fat: 2, serving: "5 pcs (50g)", category: "Desserts" },
  { name: "Kuih Bangkit", calories: 80, protein: 1, carbs: 14, fat: 3, serving: "5 pcs (40g)", category: "Desserts" },
  { name: "Dodol", calories: 150, protein: 1, carbs: 30, fat: 4, serving: "50g", category: "Desserts" },
  { name: "Wajik", calories: 170, protein: 2, carbs: 34, fat: 4, serving: "2 pcs (80g)", category: "Desserts" },

  // === ADDITIONAL KUIH ===
  { name: "Kuih Dadar", calories: 140, protein: 2, carbs: 24, fat: 5, serving: "2 pcs (70g)", category: "Desserts" },
  { name: "Pulut Inti", calories: 200, protein: 3, carbs: 38, fat: 5, serving: "2 pcs (120g)", category: "Desserts" },
  { name: "Pulut Tai Tai", calories: 190, protein: 3, carbs: 35, fat: 5, serving: "2 pcs (100g)", category: "Desserts" },
  { name: "Kuih Keria", calories: 150, protein: 1, carbs: 28, fat: 5, serving: "3 pcs (90g)", category: "Desserts" },
  { name: "Kuih Kodok", calories: 130, protein: 1, carbs: 24, fat: 4, serving: "3 pcs (75g)", category: "Desserts" },
  { name: "Kuih Putu Piring", calories: 160, protein: 2, carbs: 32, fat: 4, serving: "3 pcs (90g)", category: "Desserts" },
  { name: "Kuih Kapit", calories: 120, protein: 2, carbs: 20, fat: 4, serving: "5 pcs (50g)", category: "Desserts" },
  { name: "Kuih Ros", calories: 100, protein: 1, carbs: 18, fat: 3, serving: "5 pcs (45g)", category: "Desserts" },
  { name: "Rempeyek", calories: 180, protein: 6, carbs: 18, fat: 10, serving: "5 pcs (50g)", category: "Snacks" },

  // === REGIONAL DISHES ===
  { name: "Mee Jawa", calories: 420, protein: 15, carbs: 52, fat: 18, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Mee Udang", calories: 450, protein: 20, carbs: 48, fat: 20, serving: "1 bowl (400ml)", category: "Noodles" },
  { name: "Nasi Ambeng", calories: 680, protein: 25, carbs: 85, fat: 28, serving: "1 plate (550g)", category: "Rice" },
  { name: "Nasi Minyak", calories: 420, protein: 8, carbs: 70, fat: 12, serving: "1 plate (300g)", category: "Rice" },
  { name: "Bubur Lambuk", calories: 280, protein: 12, carbs: 40, fat: 8, serving: "1 bowl (350ml)", category: "Rice" },
  { name: "Ketupat Palas", calories: 180, protein: 4, carbs: 38, fat: 2, serving: "2 pcs (150g)", category: "Rice" },
  { name: "Lemang", calories: 250, protein: 5, carbs: 45, fat: 6, serving: "1 piece (150g)", category: "Rice" },
  { name: "Nasi Himpit", calories: 180, protein: 4, carbs: 40, fat: 0.5, serving: "1 piece (120g)", category: "Rice" },

  // === STREET FOOD ===
  { name: "Murtabak Daging", calories: 450, protein: 20, carbs: 45, fat: 22, serving: "1 piece (200g)", category: "Roti" },
  { name: "Murtabak Ayam", calories: 380, protein: 18, carbs: 42, fat: 16, serving: "1 piece (180g)", category: "Roti" },
  { name: "Roti John", calories: 380, protein: 15, carbs: 35, fat: 20, serving: "1 piece (150g)", category: "Roti" },
  { name: "Popiah Basah", calories: 180, protein: 6, carbs: 28, fat: 5, serving: "2 pcs (120g)", category: "Snacks" },
  { name: "Vadai", calories: 150, protein: 6, carbs: 18, fat: 7, serving: "3 pcs (75g)", category: "Snacks" },
  { name: "Putu Mayam", calories: 200, protein: 4, carbs: 40, fat: 3, serving: "1 serving (100g)", category: "Snacks" },
  { name: "Appam", calories: 120, protein: 3, carbs: 22, fat: 2, serving: "2 pcs (80g)", category: "Snacks" },

  // === MORE DRINKS ===
  { name: "Teh Halia", calories: 180, protein: 2, carbs: 28, fat: 4, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Kopi Tarik", calories: 190, protein: 2, carbs: 30, fat: 5, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Teh Ais", calories: 120, protein: 1, carbs: 26, fat: 2, serving: "1 glass (300ml)", category: "Drinks" },
  { name: "Kopi Ais", calories: 140, protein: 2, carbs: 24, fat: 4, serving: "1 glass (300ml)", category: "Drinks" },
  { name: "Sirap Bandung", calories: 140, protein: 2, carbs: 28, fat: 3, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Air Tebu", calories: 120, protein: 0, carbs: 30, fat: 0, serving: "1 glass (300ml)", category: "Drinks" },
  { name: "Limau Ais", calories: 60, protein: 0, carbs: 15, fat: 0, serving: "1 glass (250ml)", category: "Drinks" },
  { name: "Teh Tarik Halia", calories: 190, protein: 2, carbs: 30, fat: 4, serving: "1 glass (250ml)", category: "Drinks" },

  // === INTERNATIONAL - ASIAN ===
  { name: "Sushi Roll", calories: 200, protein: 8, carbs: 38, fat: 1, serving: "6 pcs (180g)", category: "Japanese" },
  { name: "Ramen", calories: 450, protein: 18, carbs: 55, fat: 18, serving: "1 bowl (500ml)", category: "Japanese" },
  { name: "Tempura", calories: 280, protein: 12, carbs: 25, fat: 16, serving: "5 pcs (150g)", category: "Japanese" },
  { name: "Teriyaki Chicken", calories: 320, protein: 28, carbs: 18, fat: 14, serving: "1 serving (200g)", category: "Japanese" },
  { name: "Miso Soup", calories: 60, protein: 4, carbs: 6, fat: 2, serving: "1 bowl (200ml)", category: "Japanese" },
  { name: "Pad Thai", calories: 380, protein: 12, carbs: 48, fat: 16, serving: "1 plate (350g)", category: "Thai" },
  { name: "Green Curry", calories: 420, protein: 20, carbs: 15, fat: 32, serving: "1 serving (300g)", category: "Thai" },
  { name: "Tom Yum Soup", calories: 180, protein: 15, carbs: 12, fat: 8, serving: "1 bowl (350ml)", category: "Thai" },
  { name: "Som Tam", calories: 120, protein: 4, carbs: 18, fat: 4, serving: "1 serving (150g)", category: "Thai" },
  { name: "Pho", calories: 380, protein: 22, carbs: 45, fat: 10, serving: "1 bowl (500ml)", category: "Vietnamese" },
  { name: "Banh Mi", calories: 350, protein: 18, carbs: 45, fat: 12, serving: "1 sandwich (250g)", category: "Vietnamese" },
  { name: "Spring Rolls", calories: 150, protein: 5, carbs: 20, fat: 6, serving: "3 pcs (90g)", category: "Vietnamese" },
  { name: "Bibimbap", calories: 550, protein: 25, carbs: 70, fat: 18, serving: "1 bowl (500g)", category: "Korean" },
  { name: "Korean Fried Chicken", calories: 380, protein: 25, carbs: 22, fat: 22, serving: "5 pcs (200g)", category: "Korean" },
  { name: "Kimchi Jjigae", calories: 280, protein: 18, carbs: 15, fat: 16, serving: "1 bowl (400ml)", category: "Korean" },
  { name: "Kung Pao Chicken", calories: 350, protein: 28, carbs: 18, fat: 20, serving: "1 serving (200g)", category: "Chinese" },
  { name: "Sweet and Sour Pork", calories: 380, protein: 20, carbs: 35, fat: 18, serving: "1 serving (200g)", category: "Chinese" },
  { name: "Mapo Tofu", calories: 220, protein: 14, carbs: 10, fat: 15, serving: "1 serving (200g)", category: "Chinese" },
  { name: "Dim Sum Har Gow", calories: 120, protein: 8, carbs: 12, fat: 4, serving: "4 pcs (80g)", category: "Chinese" },
  { name: "Fried Rice", calories: 450, protein: 12, carbs: 58, fat: 18, serving: "1 plate (350g)", category: "Chinese" },

  // === INTERNATIONAL - WESTERN ===
  { name: "Cheeseburger", calories: 550, protein: 28, carbs: 40, fat: 32, serving: "1 burger (200g)", category: "Western" },
  { name: "Caesar Salad", calories: 280, protein: 12, carbs: 15, fat: 20, serving: "1 bowl (250g)", category: "Western" },
  { name: "Grilled Steak", calories: 420, protein: 45, carbs: 0, fat: 26, serving: "200g", category: "Western" },
  { name: "Fish and Chips", calories: 600, protein: 25, carbs: 55, fat: 32, serving: "1 serving (350g)", category: "Western" },
  { name: "Spaghetti Bolognese", calories: 480, protein: 22, carbs: 55, fat: 18, serving: "1 plate (350g)", category: "Western" },
  { name: "Carbonara", calories: 550, protein: 20, carbs: 50, fat: 30, serving: "1 plate (350g)", category: "Western" },
  { name: "Margherita Pizza", calories: 250, protein: 12, carbs: 30, fat: 10, serving: "1 slice (100g)", category: "Western" },
  { name: "Pepperoni Pizza", calories: 300, protein: 14, carbs: 28, fat: 15, serving: "1 slice (110g)", category: "Western" },
  { name: "Club Sandwich", calories: 450, protein: 25, carbs: 35, fat: 25, serving: "1 sandwich (280g)", category: "Western" },
  { name: "Eggs Benedict", calories: 400, protein: 18, carbs: 22, fat: 28, serving: "1 serving (250g)", category: "Western" },
  { name: "French Fries", calories: 320, protein: 4, carbs: 42, fat: 15, serving: "1 serving (150g)", category: "Western" },
  { name: "Onion Rings", calories: 280, protein: 4, carbs: 35, fat: 14, serving: "8 pcs (120g)", category: "Western" },
  { name: "Chicken Wings", calories: 350, protein: 22, carbs: 8, fat: 26, serving: "6 pcs (180g)", category: "Western" },
  { name: "Mac and Cheese", calories: 400, protein: 15, carbs: 42, fat: 20, serving: "1 serving (250g)", category: "Western" },

  // === HEALTHY & FITNESS ===
  { name: "Grilled Salmon", calories: 280, protein: 35, carbs: 0, fat: 15, serving: "150g", category: "Healthy" },
  { name: "Chicken Breast Grilled", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g", category: "Healthy" },
  { name: "Quinoa Bowl", calories: 320, protein: 12, carbs: 52, fat: 8, serving: "1 bowl (300g)", category: "Healthy" },
  { name: "Acai Bowl", calories: 350, protein: 6, carbs: 60, fat: 10, serving: "1 bowl (300g)", category: "Healthy" },
  { name: "Green Smoothie", calories: 180, protein: 5, carbs: 35, fat: 3, serving: "1 glass (350ml)", category: "Healthy" },
  { name: "Protein Shake", calories: 200, protein: 25, carbs: 15, fat: 5, serving: "1 glass (400ml)", category: "Healthy" },
  { name: "Mixed Salad", calories: 120, protein: 4, carbs: 12, fat: 6, serving: "1 bowl (200g)", category: "Healthy" },
  { name: "Avocado Toast", calories: 280, protein: 8, carbs: 25, fat: 18, serving: "1 slice (120g)", category: "Healthy" },
  { name: "Overnight Oats", calories: 350, protein: 12, carbs: 55, fat: 10, serving: "1 bowl (300g)", category: "Healthy" },
  { name: "Steamed Vegetables", calories: 80, protein: 3, carbs: 15, fat: 1, serving: "1 serving (150g)", category: "Healthy" },

  // === SEEDS (USDA Data) ===
  // Nutrient-dense superfoods, great for adding to smoothies, salads, and bowls
  { name: "Chia Seeds", calories: 138, protein: 5, carbs: 12, fat: 9, serving: "1 oz (28g)", category: "Seeds" },
  { name: "Flax Seeds (Whole)", calories: 55, protein: 1.9, carbs: 3, fat: 4.3, serving: "1 tbsp (10g)", category: "Seeds" },
  { name: "Flax Seeds (Ground)", calories: 37, protein: 1.3, carbs: 2, fat: 3, serving: "1 tbsp (7g)", category: "Seeds" },
  { name: "Hemp Seeds (Hemp Hearts)", calories: 166, protein: 10, carbs: 2.6, fat: 14.6, serving: "3 tbsp (30g)", category: "Seeds" },
  { name: "Pumpkin Seeds (Pepitas)", calories: 180, protein: 9, carbs: 4, fat: 16, serving: "1 oz (28g)", category: "Seeds" },
  { name: "Sunflower Seeds (Kernels)", calories: 207, protein: 5.8, carbs: 7, fat: 19, serving: "1/4 cup (34g)", category: "Seeds" },
  { name: "Sesame Seeds", calories: 52, protein: 1.6, carbs: 2.1, fat: 4.5, serving: "1 tbsp (9g)", category: "Seeds" },
  { name: "Poppy Seeds", calories: 46, protein: 1.6, carbs: 2.5, fat: 3.7, serving: "1 tbsp (9g)", category: "Seeds" },
  { name: "Fennel Seeds", calories: 20, protein: 0.9, carbs: 3, fat: 0.9, serving: "1 tbsp (6g)", category: "Seeds" },
  { name: "Cumin Seeds", calories: 22, protein: 1.1, carbs: 2.6, fat: 1.3, serving: "1 tbsp (6g)", category: "Seeds" },
  { name: "Nigella Seeds (Black Seed)", calories: 52, protein: 2, carbs: 4.6, fat: 3.5, serving: "1 tbsp (9g)", category: "Seeds" },
  { name: "Basil Seeds (Sabja)", calories: 60, protein: 2, carbs: 7, fat: 2.5, serving: "1 tbsp (13g)", category: "Seeds" },
  { name: "Watermelon Seeds (Roasted)", calories: 158, protein: 8, carbs: 4, fat: 13.4, serving: "1 oz (28g)", category: "Seeds" },

  // === MORE VEGETABLES (USDA Data) ===
  // Fresh vegetables with accurate serving sizes
  { name: "Kale (Raw)", calories: 7, protein: 0.6, carbs: 0.9, fat: 0.3, serving: "1 cup (21g)", category: "Vegetables" },
  { name: "Kale (Cooked)", calories: 36, protein: 2.5, carbs: 7, fat: 0.5, serving: "1 cup (130g)", category: "Vegetables" },
  { name: "Spinach (Raw)", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, serving: "1 cup (30g)", category: "Vegetables" },
  { name: "Spinach (Cooked)", calories: 41, protein: 5.3, carbs: 6.8, fat: 0.5, serving: "1 cup (180g)", category: "Vegetables" },
  { name: "Broccoli (Raw)", calories: 31, protein: 2.5, carbs: 6, fat: 0.3, serving: "1 cup (91g)", category: "Vegetables" },
  { name: "Broccoli (Steamed)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: "1 cup (156g)", category: "Vegetables" },
  { name: "Cauliflower (Raw)", calories: 27, protein: 2.1, carbs: 5.3, fat: 0.3, serving: "1 cup (107g)", category: "Vegetables" },
  { name: "Cauliflower (Cooked)", calories: 29, protein: 2.3, carbs: 5.1, fat: 0.6, serving: "1 cup (124g)", category: "Vegetables" },
  { name: "Bell Pepper Red (Raw)", calories: 39, protein: 1.5, carbs: 9, fat: 0.5, serving: "1 cup (149g)", category: "Vegetables" },
  { name: "Bell Pepper Green (Raw)", calories: 30, protein: 1.3, carbs: 7, fat: 0.3, serving: "1 cup (149g)", category: "Vegetables" },
  { name: "Bell Pepper Yellow (Raw)", calories: 40, protein: 1.5, carbs: 9, fat: 0.4, serving: "1 cup (149g)", category: "Vegetables" },
  { name: "Asparagus (Raw)", calories: 27, protein: 3, carbs: 5.2, fat: 0.2, serving: "1 cup (134g)", category: "Vegetables" },
  { name: "Asparagus (Cooked)", calories: 20, protein: 2.2, carbs: 3.7, fat: 0.2, serving: "1/2 cup (90g)", category: "Vegetables" },
  { name: "Zucchini (Raw)", calories: 21, protein: 1.5, carbs: 3.9, fat: 0.4, serving: "1 cup (124g)", category: "Vegetables" },
  { name: "Zucchini (Cooked)", calories: 27, protein: 1.2, carbs: 4.9, fat: 0.6, serving: "1 cup (180g)", category: "Vegetables" },
  { name: "Sweet Potato (Baked)", calories: 100, protein: 2, carbs: 25, fat: 0.1, serving: "1 medium (130g)", category: "Vegetables" },
  { name: "Sweet Potato (Raw)", calories: 114, protein: 2.1, carbs: 27, fat: 0.1, serving: "1 medium (133g)", category: "Vegetables" },
  { name: "Carrot (Raw)", calories: 25, protein: 0.5, carbs: 6, fat: 0, serving: "1 medium (61g)", category: "Vegetables" },
  { name: "Carrot (Cooked)", calories: 54, protein: 1.2, carbs: 12.8, fat: 0.3, serving: "1 cup (156g)", category: "Vegetables" },
  { name: "Brussels Sprouts (Raw)", calories: 38, protein: 3, carbs: 8, fat: 0.3, serving: "1 cup (88g)", category: "Vegetables" },
  { name: "Brussels Sprouts (Cooked)", calories: 56, protein: 4, carbs: 11, fat: 0.8, serving: "1 cup (156g)", category: "Vegetables" },
  { name: "Green Beans (Raw)", calories: 31, protein: 1.8, carbs: 7, fat: 0.1, serving: "1 cup (100g)", category: "Vegetables" },
  { name: "Green Beans (Cooked)", calories: 44, protein: 2.4, carbs: 10, fat: 0.4, serving: "1 cup (125g)", category: "Vegetables" },
  { name: "Celery (Raw)", calories: 6, protein: 0.3, carbs: 1.2, fat: 0.1, serving: "1 stalk (40g)", category: "Vegetables" },
  { name: "Mushrooms (Raw)", calories: 15, protein: 2.2, carbs: 2.3, fat: 0.2, serving: "1 cup (70g)", category: "Vegetables" },
  { name: "Mushrooms (Cooked)", calories: 28, protein: 3.9, carbs: 4.5, fat: 0.4, serving: "1 cup (108g)", category: "Vegetables" },
  { name: "Onion (Raw)", calories: 44, protein: 1.2, carbs: 10, fat: 0.1, serving: "1 medium (110g)", category: "Vegetables" },
  { name: "Garlic (Raw)", calories: 4, protein: 0.2, carbs: 1, fat: 0, serving: "1 clove (3g)", category: "Vegetables" },
  { name: "Lettuce Romaine", calories: 8, protein: 0.6, carbs: 1.5, fat: 0.1, serving: "1 cup (47g)", category: "Vegetables" },
  { name: "Lettuce Iceberg", calories: 10, protein: 0.6, carbs: 2, fat: 0.1, serving: "1 cup (72g)", category: "Vegetables" },
  { name: "Arugula", calories: 5, protein: 0.5, carbs: 0.7, fat: 0.1, serving: "1 cup (20g)", category: "Vegetables" },
  { name: "Bok Choy (Raw)", calories: 9, protein: 1, carbs: 1.5, fat: 0.1, serving: "1 cup (70g)", category: "Vegetables" },
  { name: "Swiss Chard (Raw)", calories: 7, protein: 0.6, carbs: 1.4, fat: 0.1, serving: "1 cup (36g)", category: "Vegetables" },
  { name: "Collard Greens (Cooked)", calories: 49, protein: 4, carbs: 9, fat: 0.7, serving: "1 cup (190g)", category: "Vegetables" },
  { name: "Beetroot (Raw)", calories: 58, protein: 2.2, carbs: 13, fat: 0.2, serving: "1 cup (136g)", category: "Vegetables" },
  { name: "Radish (Raw)", calories: 19, protein: 0.8, carbs: 4, fat: 0.1, serving: "1 cup (116g)", category: "Vegetables" },
  { name: "Turnip (Raw)", calories: 36, protein: 1.2, carbs: 8, fat: 0.1, serving: "1 cup (130g)", category: "Vegetables" },
  { name: "Parsnip (Raw)", calories: 100, protein: 1.6, carbs: 24, fat: 0.4, serving: "1 cup (133g)", category: "Vegetables" },
  { name: "Artichoke (Cooked)", calories: 64, protein: 3.5, carbs: 14, fat: 0.4, serving: "1 medium (120g)", category: "Vegetables" },
  { name: "Leek (Raw)", calories: 54, protein: 1.3, carbs: 13, fat: 0.3, serving: "1 medium (89g)", category: "Vegetables" },
  { name: "Corn (Cooked)", calories: 143, protein: 5.4, carbs: 31, fat: 2.2, serving: "1 cup (164g)", category: "Vegetables" },
  { name: "Peas (Cooked)", calories: 134, protein: 8.6, carbs: 25, fat: 0.4, serving: "1 cup (160g)", category: "Vegetables" },
  { name: "Edamame (Shelled)", calories: 188, protein: 18.5, carbs: 14, fat: 8, serving: "1 cup (155g)", category: "Vegetables" },
  { name: "Okra (Cooked)", calories: 36, protein: 3, carbs: 7, fat: 0.3, serving: "1 cup (160g)", category: "Vegetables" },
  { name: "Butternut Squash (Cooked)", calories: 82, protein: 1.8, carbs: 22, fat: 0.2, serving: "1 cup (205g)", category: "Vegetables" },
  { name: "Acorn Squash (Cooked)", calories: 115, protein: 2.3, carbs: 30, fat: 0.3, serving: "1 cup (245g)", category: "Vegetables" },
  { name: "Spaghetti Squash (Cooked)", calories: 42, protein: 1, carbs: 10, fat: 0.4, serving: "1 cup (155g)", category: "Vegetables" },
  
  // === LEGUMES & BEANS (USDA Data) ===
  { name: "Black Beans (Cooked)", calories: 227, protein: 15, carbs: 41, fat: 0.9, serving: "1 cup (172g)", category: "Legumes" },
  { name: "Chickpeas (Cooked)", calories: 269, protein: 14.5, carbs: 45, fat: 4.2, serving: "1 cup (164g)", category: "Legumes" },
  { name: "Lentils (Cooked)", calories: 230, protein: 18, carbs: 39.9, fat: 0.8, serving: "1 cup (198g)", category: "Legumes" },
  { name: "Kidney Beans (Cooked)", calories: 225, protein: 15.3, carbs: 40, fat: 0.9, serving: "1 cup (177g)", category: "Legumes" },
  { name: "Navy Beans (Cooked)", calories: 255, protein: 15, carbs: 47, fat: 1.1, serving: "1 cup (182g)", category: "Legumes" },
  { name: "Pinto Beans (Cooked)", calories: 245, protein: 15.4, carbs: 45, fat: 1.1, serving: "1 cup (171g)", category: "Legumes" },
  { name: "Lima Beans (Cooked)", calories: 216, protein: 14.7, carbs: 39, fat: 0.7, serving: "1 cup (188g)", category: "Legumes" },
  { name: "Mung Beans (Cooked)", calories: 212, protein: 14.2, carbs: 39, fat: 0.8, serving: "1 cup (202g)", category: "Legumes" },
  { name: "Split Peas (Cooked)", calories: 231, protein: 16.3, carbs: 41, fat: 0.8, serving: "1 cup (196g)", category: "Legumes" },
  { name: "Soybeans (Cooked)", calories: 298, protein: 29, carbs: 17, fat: 15.4, serving: "1 cup (172g)", category: "Legumes" },
  
  // === WHOLE GRAINS (USDA Data) ===
  { name: "Quinoa (Cooked)", calories: 222, protein: 8, carbs: 39, fat: 3.6, serving: "1 cup (185g)", category: "Grains" },
  { name: "Brown Rice (Cooked)", calories: 216, protein: 5, carbs: 45, fat: 1.8, serving: "1 cup (195g)", category: "Grains" },
  { name: "Bulgur (Cooked)", calories: 151, protein: 5.6, carbs: 34, fat: 0.4, serving: "1 cup (182g)", category: "Grains" },
  { name: "Barley (Cooked)", calories: 193, protein: 3.5, carbs: 44, fat: 0.7, serving: "1 cup (157g)", category: "Grains" },
  { name: "Farro (Cooked)", calories: 170, protein: 6, carbs: 34, fat: 1, serving: "1/2 cup (100g)", category: "Grains" },
  { name: "Millet (Cooked)", calories: 207, protein: 6, carbs: 41, fat: 1.7, serving: "1 cup (174g)", category: "Grains" },
  { name: "Buckwheat (Cooked)", calories: 155, protein: 5.7, carbs: 33.5, fat: 1, serving: "1 cup (168g)", category: "Grains" },
  { name: "Wild Rice (Cooked)", calories: 166, protein: 6.5, carbs: 35, fat: 0.6, serving: "1 cup (164g)", category: "Grains" },
  { name: "Couscous (Cooked)", calories: 176, protein: 6, carbs: 36, fat: 0.3, serving: "1 cup (157g)", category: "Grains" },
  { name: "Amaranth (Cooked)", calories: 251, protein: 9.4, carbs: 46, fat: 3.9, serving: "1 cup (246g)", category: "Grains" },

  // === COMMON INGREDIENTS ===
  { name: "Pasta Plain", calories: 200, protein: 7, carbs: 42, fat: 1, serving: "1 cup cooked", category: "Basics" },
  { name: "Bread Slice", calories: 80, protein: 3, carbs: 15, fat: 1, serving: "1 slice", category: "Basics" },
  { name: "Egg Fried", calories: 92, protein: 6, carbs: 1, fat: 7, serving: "1 egg", category: "Basics" },
  { name: "Ground Beef", calories: 250, protein: 26, carbs: 0, fat: 15, serving: "100g", category: "Basics" },
  { name: "Milk Full Fat", calories: 150, protein: 8, carbs: 12, fat: 8, serving: "1 glass (250ml)", category: "Basics" },
  { name: "Orange Juice", calories: 110, protein: 2, carbs: 26, fat: 0, serving: "1 glass (250ml)", category: "Basics" },
  { name: "Coffee Black", calories: 5, protein: 0, carbs: 0, fat: 0, serving: "1 cup", category: "Basics" },
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

  // === NESTLE (JAKIM Certified) ===
  { name: "Milo 3-in-1", calories: 140, protein: 3, carbs: 24, fat: 4, serving: "1 sachet", category: "Beverages", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Nescafe Original", calories: 100, protein: 1, carbs: 18, fat: 3, serving: "1 sachet", category: "Beverages", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Maggi Mee Goreng", calories: 380, protein: 8, carbs: 52, fat: 16, serving: "1 pack", category: "Instant Noodles", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Maggi Kari", calories: 350, protein: 7, carbs: 48, fat: 14, serving: "1 pack", category: "Instant Noodles", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Kit Kat 4 Fingers", calories: 218, protein: 3, carbs: 27, fat: 11, serving: "1 bar", category: "Snacks", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Drumstick Ice Cream", calories: 320, protein: 5, carbs: 38, fat: 16, serving: "1 piece", category: "Ice Cream", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Koko Krunch Cereal", calories: 170, protein: 3, carbs: 34, fat: 3, serving: "40g", category: "Cereals", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Milo Ice", calories: 180, protein: 4, carbs: 30, fat: 5, serving: "1 bottle", category: "Beverages", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Nescafe Latte", calories: 120, protein: 2, carbs: 20, fat: 4, serving: "1 can", category: "Beverages", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Maggi Hot Cup", calories: 280, protein: 6, carbs: 40, fat: 10, serving: "1 cup", category: "Instant Noodles", brand: "Nestle", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === GARDENIA (JAKIM Certified) ===
  { name: "Gardenia White Bread", calories: 80, protein: 3, carbs: 15, fat: 1, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Wholemeal Bread", calories: 75, protein: 4, carbs: 12, fat: 1.5, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Butterscotch Bun", calories: 280, protein: 6, carbs: 42, fat: 10, serving: "1 bun", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Cream Roll", calories: 320, protein: 5, carbs: 45, fat: 14, serving: "1 piece", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Delicia Marble Cake", calories: 180, protein: 3, carbs: 28, fat: 7, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Twiggies", calories: 140, protein: 2, carbs: 22, fat: 5, serving: "1 piece", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Original Bun", calories: 250, protein: 7, carbs: 40, fat: 7, serving: "1 bun", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Raisin Loaf", calories: 90, protein: 3, carbs: 18, fat: 1, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Butter Sugar Bread", calories: 100, protein: 3, carbs: 16, fat: 3, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Gardenia Original Toast", calories: 85, protein: 3, carbs: 16, fat: 1, serving: "1 slice", category: "Bakery", brand: "Gardenia", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === JULIE'S (JAKIM Certified) ===
  { name: "Julie's Butter Crackers", calories: 120, protein: 2, carbs: 18, fat: 5, serving: "6 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Peanut Butter Sandwich", calories: 160, protein: 4, carbs: 20, fat: 8, serving: "4 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Cheese Crackers", calories: 130, protein: 3, carbs: 17, fat: 6, serving: "6 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Oat 25", calories: 110, protein: 2, carbs: 18, fat: 4, serving: "5 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Choco More", calories: 180, protein: 2, carbs: 25, fat: 8, serving: "3 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Lemon Cream", calories: 140, protein: 2, carbs: 21, fat: 6, serving: "4 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Le-mond", calories: 150, protein: 2, carbs: 22, fat: 6, serving: "4 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Convi", calories: 130, protein: 2, carbs: 19, fat: 5, serving: "5 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Golden Crackers", calories: 125, protein: 2, carbs: 18, fat: 5, serving: "6 pcs", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Julie's Biscuit Sticks", calories: 100, protein: 2, carbs: 15, fat: 4, serving: "1 pack", category: "Snacks", brand: "Julie's", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === DUTCH LADY (JAKIM Certified) ===
  { name: "Dutch Lady Full Cream Milk", calories: 130, protein: 6, carbs: 10, fat: 7, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Low Fat Milk", calories: 95, protein: 6, carbs: 10, fat: 3, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Chocolate Milk", calories: 160, protein: 6, carbs: 22, fat: 5, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Strawberry Milk", calories: 155, protein: 5, carbs: 24, fat: 4, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Yogurt Blueberry", calories: 120, protein: 4, carbs: 18, fat: 3, serving: "125g", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Yogurt Peach", calories: 115, protein: 4, carbs: 17, fat: 3, serving: "125g", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Kurma Milk", calories: 150, protein: 5, carbs: 22, fat: 5, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Sterilised Milk", calories: 140, protein: 6, carbs: 12, fat: 8, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady UHT Milk", calories: 125, protein: 6, carbs: 10, fat: 7, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Dutch Lady Kids Milk", calories: 140, protein: 5, carbs: 18, fat: 5, serving: "200ml", category: "Dairy", brand: "Dutch Lady", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === SPRITZER (JAKIM Certified) ===
  { name: "Spritzer Mineral Water 600ml", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "600ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Sparkling Water", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "325ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Tinge Lemon", calories: 45, protein: 0, carbs: 11, fat: 0, serving: "325ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Tinge Orange", calories: 50, protein: 0, carbs: 12, fat: 0, serving: "325ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Pop Mineral Water", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "250ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Fizz Up Apple", calories: 55, protein: 0, carbs: 14, fat: 0, serving: "325ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Mineral Water 1.5L", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "1.5L", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Natural Mineral Water", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "500ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Silica Water", calories: 0, protein: 0, carbs: 0, fat: 0, serving: "500ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },
  { name: "Spritzer Sparkling Lemon", calories: 40, protein: 0, carbs: 10, fat: 0, serving: "325ml", category: "Beverages", brand: "Spritzer", halalCertifier: "JAKIM", halalCertYear: 2024 },

  // === SAJI (JAKIM Certified 2025) ===
  { name: "Saji Mee Goreng", calories: 360, protein: 7, carbs: 50, fat: 15, serving: "1 pack", category: "Instant Noodles", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Saji Mee Kari", calories: 340, protein: 6, carbs: 48, fat: 14, serving: "1 pack", category: "Instant Noodles", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Saji Mee Sup", calories: 300, protein: 6, carbs: 45, fat: 10, serving: "1 pack", category: "Instant Noodles", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Saji Kicap Manis", calories: 80, protein: 2, carbs: 16, fat: 0, serving: "2 tbsp", category: "Condiments", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Saji Sos Tiram", calories: 50, protein: 1, carbs: 10, fat: 0, serving: "2 tbsp", category: "Condiments", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Saji Sos Cili", calories: 40, protein: 0, carbs: 8, fat: 0, serving: "2 tbsp", category: "Condiments", brand: "Saji", halalCertifier: "JAKIM", halalCertYear: 2025 },

  // === A&W MALAYSIA (JAKIM Certified 2025) ===
  { name: "A&W Coney Dog", calories: 350, protein: 12, carbs: 35, fat: 18, serving: "1 piece", category: "Fast Food", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "A&W Mozza Burger", calories: 520, protein: 25, carbs: 42, fat: 28, serving: "1 burger", category: "Fast Food", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "A&W Golden Aroma Chicken", calories: 280, protein: 22, carbs: 15, fat: 16, serving: "1 piece", category: "Fast Food", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "A&W Root Beer", calories: 160, protein: 0, carbs: 42, fat: 0, serving: "1 mug", category: "Beverages", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "A&W Curly Fries", calories: 320, protein: 4, carbs: 42, fat: 15, serving: "1 serving", category: "Fast Food", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "A&W Waffle Ice Cream", calories: 280, protein: 4, carbs: 38, fat: 12, serving: "1 serving", category: "Desserts", brand: "A&W", halalCertifier: "JAKIM", halalCertYear: 2025 },

  // === MARIGOLD (JAKIM Certified 2025) ===
  { name: "Marigold HL Milk", calories: 125, protein: 6, carbs: 10, fat: 7, serving: "200ml", category: "Dairy", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Marigold Low Fat Milk", calories: 90, protein: 6, carbs: 10, fat: 2, serving: "200ml", category: "Dairy", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Marigold Peel Fresh Orange", calories: 90, protein: 1, carbs: 20, fat: 0, serving: "250ml", category: "Beverages", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Marigold Peel Fresh Apple", calories: 95, protein: 0, carbs: 22, fat: 0, serving: "250ml", category: "Beverages", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Marigold Yogurt Drink Mango", calories: 110, protein: 3, carbs: 20, fat: 2, serving: "200ml", category: "Dairy", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Marigold Yogurt Drink Mixed Berry", calories: 115, protein: 3, carbs: 22, fat: 2, serving: "200ml", category: "Dairy", brand: "Marigold", halalCertifier: "JAKIM", halalCertYear: 2025 },

  // === YEO'S (JAKIM Certified 2025) ===
  { name: "Yeo's Soya Bean", calories: 120, protein: 5, carbs: 18, fat: 3, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Yeo's Chrysanthemum Tea", calories: 80, protein: 0, carbs: 20, fat: 0, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Yeo's Winter Melon Tea", calories: 70, protein: 0, carbs: 18, fat: 0, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Yeo's Lemon Barley", calories: 90, protein: 0, carbs: 22, fat: 0, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Yeo's Coconut Water", calories: 60, protein: 1, carbs: 14, fat: 0, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "Yeo's Grass Jelly Drink", calories: 75, protein: 0, carbs: 18, fat: 0, serving: "250ml", category: "Beverages", brand: "Yeo's", halalCertifier: "JAKIM", halalCertYear: 2025 },

  // === 100 PLUS (JAKIM Certified 2025) ===
  { name: "100 Plus Original", calories: 75, protein: 0, carbs: 18, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "100 Plus Active", calories: 50, protein: 0, carbs: 12, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "100 Plus Zero Sugar", calories: 5, protein: 0, carbs: 0, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "100 Plus Lemon Lime", calories: 80, protein: 0, carbs: 20, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "100 Plus Berry", calories: 78, protein: 0, carbs: 19, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
  { name: "100 Plus Tangy Tangerine", calories: 76, protein: 0, carbs: 18, fat: 0, serving: "325ml", category: "Beverages", brand: "100 Plus", halalCertifier: "JAKIM", halalCertYear: 2025 },
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
