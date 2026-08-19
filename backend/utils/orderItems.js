const Food = require('../models/Food');
const FoodCombination = require('../models/FoodCombination');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const Restaurant = require('../models/Restaurant');
const RestaurantFood = require('../models/RestaurantFood');
const RestaurantCombination = require('../models/RestaurantCombination');
const FoodFlashSale = require('../models/FoodFlashSale');

async function buildPopulatedOrderItems(items = [], deps = {}, fallbackRestaurantId = null) {
  const mongoose = require('mongoose');
  const marketplaceLookup = deps.getMarketplaceProductById || ((id) => (mongoose.Types.ObjectId.isValid(id) ? MarketplaceProduct.findById(id) : null));
  const foodLookup = deps.getFoodById || ((id) => (mongoose.Types.ObjectId.isValid(id) ? Food.findById(id) : null));
  const comboLookup = deps.getCombinationById || ((id) => (mongoose.Types.ObjectId.isValid(id) ? FoodCombination.findById(id) : null));

  const populatedItems = [];

  for (const item of items) {
    if (item.productType === 'marketplace') {
      const product = await marketplaceLookup(item.marketplaceProductId);
      if (!product) {
        throw new Error(`Marketplace product with ID ${item.marketplaceProductId} not found`);
      }

      const effectivePrice = Math.max(0, (product.price || 0) - (product.discount || 0));

      populatedItems.push({
        productType: 'marketplace',
        marketplaceProductId: product._id,
        quantity: item.quantity || 1,
        price: effectivePrice,
        name: product.name,
        categoryType: item.categoryType || product.categoryType || 'marketplace',
      });
      continue;
    }

    const targetRestaurantId = item.restaurantId || fallbackRestaurantId;
    if (!targetRestaurantId || !mongoose.Types.ObjectId.isValid(targetRestaurantId)) {
      const foodName = item.name || 'food item';
      throw new Error(`Please select a restaurant for '${foodName}' in your cart.`);
    }

    // Lookup restaurant
    const restaurant = await Restaurant.findById(targetRestaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant for item '${item.name || 'food'}' was not found.`);
    }
    if (restaurant.isOpen === false) {
      throw new Error(`Restaurant '${restaurant.name}' is currently closed and cannot receive orders.`);
    }

    if (item.isCombination) {
      const combo = await comboLookup(item.foodId || item.combinationId);
      if (!combo) {
        throw new Error(`Combination meal with ID ${item.foodId || item.combinationId} not found`);
      }

      let comboPrice = 0;
      if (item.components && item.components.length > 0) {
        for (const component of item.components) {
          const restFood = await RestaurantFood.findOne({
            restaurantId: targetRestaurantId,
            foodId: component.foodId,
          });
          let componentPrice = (restFood?.price != null && restFood.price > 0) ? restFood.price : null;
          if (componentPrice == null) {
            const foodDoc = await foodLookup(component.foodId);
            componentPrice = (foodDoc?.price != null && foodDoc.price > 0) ? foodDoc.price : (Number(component.price) || 0);
          }
          comboPrice += componentPrice * (component.quantity != null ? component.quantity : 1);
        }
      }

      if (comboPrice === 0) {
        const restCombo = await RestaurantCombination.findOne({
          restaurantId: targetRestaurantId,
          combinationId: item.foodId || item.combinationId,
        });
        comboPrice = restCombo?.price || item.price || 0;
      }

      populatedItems.push({
        productType: 'meal',
        foodId: item.foodId || item.combinationId,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        quantity: item.quantity || 1,
        price: comboPrice || item.price || 0,
        name: combo.name,
        isCombination: true,
        combinationId: item.foodId || item.combinationId,
        components: item.components || undefined,
        categoryType: item.categoryType || 'meal',
      });
      continue;
    }

    const food = await foodLookup(item.foodId);
    if (!food) {
      throw new Error(`Food item with ID ${item.foodId} not found`);
    }

    const restaurantFood = await RestaurantFood.findOne({
      restaurantId: targetRestaurantId,
      foodId: item.foodId,
    });

    if (!restaurantFood) {
      throw new Error(`Food item '${food.name}' is not sold by ${restaurant.name}.`);
    }
    if (restaurantFood.availability === false) {
      throw new Error(`Food item '${food.name}' is currently sold out at ${restaurant.name}.`);
    }

    // Resolve flash sale price if active
    const now = new Date();
    const activeFlashSale = await FoodFlashSale.findOne({
      startAt: { $lte: now },
      endAt: { $gt: now },
      'items.foodId': item.foodId,
    });

    let finalPrice = (restaurantFood.price != null && restaurantFood.price > 0) ? restaurantFood.price : (food.price || 0);
    if (activeFlashSale) {
      const flashItem = activeFlashSale.items.find((i) => i.foodId.toString() === item.foodId.toString());
      if (flashItem) {
        finalPrice = flashItem.salePrice;
      }
    }

    populatedItems.push({
      productType: 'meal',
      foodId: item.foodId,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      quantity: item.quantity || 1,
      price: finalPrice,
      name: food.name,
      isCombination: false,
      combinationId: undefined,
      components: undefined,
      categoryType: item.categoryType || 'meal',
    });
  }

  return populatedItems;
}

module.exports = {
  buildPopulatedOrderItems,
};
