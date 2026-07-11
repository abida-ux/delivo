const foods = [
  {
    name: 'Ugali & Sukuma Wiki',
    price: 4.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Mama Oliech Kitchen',
  },
  {
    name: 'Nyama Choma',
    price: 8.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Carnivore Grill',
  },
  {
    name: 'Pilau',
    price: 5.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Swahili Delights',
  },
  {
    name: 'Chicken Biryani',
    price: 7.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Coastal Flavors',
  },
  {
    name: 'Mukimo',
    price: 5.49,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Central Kitchen',
  },
  {
    name: 'Githeri',
    price: 4.49,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Healthy Bowl',
  },
  {
    name: 'Fish Fry',
    price: 9.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Lake Victoria Grill',
  },
  {
    name: 'Matoke Stew',
    price: 5.99,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1604908176997-431f4c6d7f04?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Green Banana House',
  },
  {
    name: 'Chapati & Beef Stew',
    price: 6.49,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Nairobi Eats',
  },
  {
    name: 'Bean Stew',
    price: 4.99,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e1?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Mama’s Pot',
  },
  {
    name: 'Maharagwe',
    price: 4.49,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Beans & More',
  },
  {
    name: 'Omena Fry',
    price: 5.49,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Lakeside Dishes',
  },
  {
    name: 'Tilapia Wet Fry',
    price: 10.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Victoria Seafood',
  },
  {
    name: 'Kuku Kienyeji',
    price: 11.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Village Chicken',
  },
  {
    name: 'Mutura',
    price: 3.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Street Bites',
  },
  {
    name: 'Samosa',
    price: 1.99,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1601050690117-8b1aeff1f981?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Quick Snacks',
  },
  {
    name: 'Mandazi',
    price: 1.49,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Morning Bakery',
  },
  {
    name: 'Viazi Karai',
    price: 2.99,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Coast Snacks',
  },
  {
    name: 'Bhajia',
    price: 3.49,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Snack Hub',
  },
  {
    name: 'Mishkaki',
    price: 5.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Swahili Grill',
  },
  {
    name: 'Mokimo Beef',
    price: 7.49,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Nyeri Flavors',
  },
  {
    name: 'Arrow Roots',
    price: 3.49,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Organic Kitchen',
  },
  {
    name: 'Sweet Potatoes',
    price: 2.99,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1603048719539-9ecb7f84cb54?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Farm Fresh',
  },
  {
    name: 'Roasted Maize',
    price: 1.49,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Street Roasts',
  },
  {
    name: 'Boiled Maize & Beans',
    price: 3.99,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Healthy Meals',
  },
  {
    name: 'Ndengu Stew',
    price: 4.99,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e1?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Mama Kitchen',
  },
  {
    name: 'Rice & Beef',
    price: 6.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
    restaurant: 'City Diner',
  },
  {
    name: 'Rice & Chicken',
    price: 7.49,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Urban Kitchen',
  },
  {
    name: 'Pilau Beef',
    price: 6.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Swahili Palace',
  },
  {
    name: 'Pilau Chicken',
    price: 7.49,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Mombasa Bites',
  },
  {
    name: 'Coconut Fish Curry',
    price: 11.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Ocean Taste',
  },
  {
    name: 'Prawn Curry',
    price: 13.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Coastal Seafood',
  },
  {
    name: 'Chicken Curry',
    price: 8.49,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Spice Corner',
  },
  {
    name: 'Beef Curry',
    price: 8.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Curry House',
  },
  {
    name: 'Ugali & Fish',
    price: 8.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Lake View Grill',
  },
  {
    name: 'Ugali & Beef',
    price: 6.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Local Delights',
  },
  {
    name: 'Ugali & Chicken',
    price: 7.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Family Table',
  },
  {
    name: 'Chapati Beans',
    price: 4.99,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Daily Meals',
  },
  {
    name: 'Chapati Ndengu',
    price: 5.49,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Home Kitchen',
  },
  {
    name: 'Matumbo Fry',
    price: 5.99,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Traditional Foods',
  },
  {
    name: 'Goat Fry',
    price: 10.49,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Goat Grill',
  },
  {
    name: 'Goat Wet Fry',
    price: 10.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Savanna Grill',
  },
  {
    name: 'Roasted Goat',
    price: 11.99,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Choma Zone',
  },
  {
    name: 'Mbuzi Choma',
    price: 12.49,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Rift Valley Grill',
  },
  {
    name: 'Kaimati',
    price: 2.49,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Sweet Treats',
  },
  {
    name: 'Mahamri',
    price: 2.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Coastal Bakery',
  },
  {
    name: 'Cassava Chips',
    price: 3.49,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Coast Crunch',
  },
  {
    name: 'Cassava Boil',
    price: 2.99,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1603048719539-9ecb7f84cb54?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Farm House',
  },
  {
    name: 'Fruit Chaat',
    price: 3.99,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Fresh Bowl',
  },
  {
    name: 'Avocado Salad',
    price: 4.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Healthy Choice',
  },
  {
    name: 'Tropical Fruit Mix',
    price: 4.49,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?auto=format&fit=crop&w=500&q=80',
    restaurant: 'Fruit Paradise',
  }
];

// Load environment variables
require('dotenv').config();

// Import database models
const Food = require('./models/Food');
const Restaurant = require('./models/Restaurant');
const mongoose = require('mongoose');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/delivo';

// Define restaurants
const restaurants = [
  { name: 'Mama Oliech Kitchen', cuisine: ['African', 'Kenyan'] },
  { name: 'Carnivore Grill', cuisine: ['Meat', 'Grilled'] },
  { name: 'Swahili Delights', cuisine: ['Seafood', 'Coastal'] },
  { name: 'Coastal Flavors', cuisine: ['Indian', 'Seafood'] },
  { name: 'Central Kitchen', cuisine: ['Traditional', 'African'] },
  { name: 'Healthy Bowl', cuisine: ['Healthy', 'Vegetarian'] },
  { name: 'Lake Victoria Grill', cuisine: ['Seafood', 'Grilled'] },
  { name: 'Green Banana House', cuisine: ['African', 'Vegetarian'] },
  { name: 'Nairobi Eats', cuisine: ['Traditional', 'Kenyan'] },
  { name: 'Mama\'s Pot', cuisine: ['African', 'Comfort Food'] },
  { name: 'Beans & More', cuisine: ['Vegetarian', 'Traditional'] },
  { name: 'Lakeside Dishes', cuisine: ['Seafood', 'Traditional'] },
  { name: 'Victoria Seafood', cuisine: ['Seafood', 'Fish'] },
  { name: 'Village Chicken', cuisine: ['Chicken', 'Traditional'] },
  { name: 'Street Bites', cuisine: ['Street Food', 'Casual'] },
  { name: 'Quick Snacks', cuisine: ['Snacks', 'Fast Food'] },
  { name: 'Morning Bakery', cuisine: ['Bakery', 'Pastries'] },
  { name: 'Coast Snacks', cuisine: ['Snacks', 'Coastal'] },
  { name: 'Snack Hub', cuisine: ['Snacks', 'Indian'] },
  { name: 'Swahili Grill', cuisine: ['Grilled', 'Coastal'] },
  { name: 'Nyeri Flavors', cuisine: ['Traditional', 'Kenyan'] },
  { name: 'Organic Kitchen', cuisine: ['Healthy', 'Organic'] },
  { name: 'Farm Fresh', cuisine: ['Healthy', 'Organic'] },
  { name: 'Street Roasts', cuisine: ['Street Food', 'Roasted'] },
  { name: 'Healthy Meals', cuisine: ['Healthy', 'Vegetarian'] },
  { name: 'Mama Kitchen', cuisine: ['Traditional', 'African'] },
  { name: 'City Diner', cuisine: ['Asian', 'Traditional'] },
  { name: 'Urban Kitchen', cuisine: ['Asian', 'Modern'] },
  { name: 'Swahili Palace', cuisine: ['Coastal', 'Traditional'] },
  { name: 'Mombasa Bites', cuisine: ['Coastal', 'Seafood'] },
  { name: 'Ocean Taste', cuisine: ['Seafood', 'Curry'] },
  { name: 'Coastal Seafood', cuisine: ['Seafood', 'Curry'] },
  { name: 'Spice Corner', cuisine: ['Curry', 'Indian'] },
  { name: 'Curry House', cuisine: ['Curry', 'Indian'] },
  { name: 'Lake View Grill', cuisine: ['Seafood', 'Grilled'] },
  { name: 'Local Delights', cuisine: ['Traditional', 'Kenyan'] },
  { name: 'Family Table', cuisine: ['Traditional', 'Comfort Food'] },
  { name: 'Daily Meals', cuisine: ['Traditional', 'Kenyan'] },
  { name: 'Home Kitchen', cuisine: ['Traditional', 'Kenyan'] },
  { name: 'Traditional Foods', cuisine: ['Traditional', 'African'] },
  { name: 'Goat Grill', cuisine: ['Grilled', 'Meat'] },
  { name: 'Savanna Grill', cuisine: ['Grilled', 'Meat'] },
  { name: 'Choma Zone', cuisine: ['Grilled', 'Meat'] },
  { name: 'Rift Valley Grill', cuisine: ['Grilled', 'Meat'] },
  { name: 'Sweet Treats', cuisine: ['Desserts', 'Bakery'] },
  { name: 'Coastal Bakery', cuisine: ['Bakery', 'Desserts'] },
  { name: 'Coast Crunch', cuisine: ['Snacks', 'Fried'] },
  { name: 'Farm House', cuisine: ['Healthy', 'Organic'] },
  { name: 'Fresh Bowl', cuisine: ['Healthy', 'Salads'] },
  { name: 'Healthy Choice', cuisine: ['Healthy', 'Salads'] },
  { name: 'Fruit Paradise', cuisine: ['Healthy', 'Fruits'] },
];

// Update foods with descriptions and categories
foods.forEach(food => {
  if (!food.description) {
    food.description = `Delicious ${food.name} - a popular dish from ${food.restaurant}`;
  }
  if (!food.category) {
    food.category = 'Other';
  }
  // Remove restaurant string, will be replaced with ObjectId later
  delete food.restaurant;
});

// Seed function
const seedFoods = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Food.deleteMany({});
    await Restaurant.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create restaurants
    console.log('Creating restaurants...');
    const createdRestaurants = await Restaurant.insertMany(
      restaurants.map(r => ({
        name: r.name,
        bannerImage: 'https://placehold.co/600x400?text=' + encodeURIComponent(r.name),
        cuisine: r.cuisine,
        isOpen: true,
        deliveryTime: '30 mins',
      }))
    );
    console.log(`✓ Created ${createdRestaurants.length} restaurants`);

    // Create a mapping of restaurant names to ObjectIds
    const restaurantMap = {};
    createdRestaurants.forEach(r => {
      restaurantMap[r.name] = r._id;
    });

    // Assign random restaurants to foods (simple approach: distribute them)
    let foodsToInsert = foods.map((food, index) => ({
      ...food,
      restaurant: createdRestaurants[index % createdRestaurants.length]._id,
    }));

    // Insert foods
    console.log('Seeding foods...');
    const result = await Food.insertMany(foodsToInsert);
    console.log(`✓ Successfully seeded ${result.length} foods into the database`);

    // Update restaurants with food references
    console.log('Linking foods to restaurants...');
    for (let i = 0; i < result.length; i++) {
      const food = result[i];
      const restaurant = createdRestaurants[i % createdRestaurants.length];
      await Restaurant.findByIdAndUpdate(
        restaurant._id,
        { $push: { foods: food._id } }
      );
    }
    console.log('✓ Linked all foods to restaurants');

    // Close connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding foods:', error.message);
    process.exit(1);
  }
};

// Run seed function
seedFoods();