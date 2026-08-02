const Food = require('../models/Food');
const FoodCombination = require('../models/FoodCombination');
const MarketplaceProduct = require('../models/MarketplaceProduct');

async function buildPopulatedOrderItems(items = [], deps = {}, restaurantId = null) {
  const marketplaceLookup = deps.getMarketplaceProductById || ((id) => MarketplaceProduct.findById(id));
  const foodLookup = deps.getFoodById || ((id) => Food.findById(id));
  const restaurantFoodLookup = deps.getRestaurantFoodById || (async (foodId) => {
    if (!restaurantId) {
      return null;
    }
    const RestaurantFood = require('../models/RestaurantFood');
    return RestaurantFood.findOne({ restaurantId, foodId });
  });
  const comboLookup = deps.getCombinationById || ((id) => FoodCombination.findById(id));
  const restaurantCombinationLookup = deps.getRestaurantCombinationById || (async (combinationId) => {
    if (!restaurantId) {
      return null;
    }
    const RestaurantCombination = require('../models/RestaurantCombination');
    return RestaurantCombination.findOne({ restaurantId, combinationId });
  });

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

    if (item.isCombination) {
      const combo = await comboLookup(item.foodId);
      if (!combo) {
        throw new Error(`Combination meal with ID ${item.foodId} not found`);
      }

      let comboPrice = 0;
      for (const component of item.components || []) {
        const restaurantFood = await restaurantFoodLookup(component.foodId);
        const componentPrice = restaurantFood?.price || 0;
        comboPrice += componentPrice * (component.quantity || 1);
      }

      if (comboPrice === 0) {
        const restaurantCombination = await restaurantCombinationLookup(item.foodId);
        comboPrice = restaurantCombination?.price || 0;
      }

      populatedItems.push({
        productType: 'meal',
        foodId: item.foodId,
        quantity: item.quantity || 1,
        price: comboPrice || item.price || 0,
        name: combo.name,
        isCombination: true,
        combinationId: item.foodId,
        components: item.components || undefined,
        categoryType: item.categoryType || 'meal',
      });
      continue;
    }

    const food = await foodLookup(item.foodId);
    if (!food) {
      throw new Error(`Food item with ID ${item.foodId} not found`);
    }

    const restaurantFood = await restaurantFoodLookup(item.foodId);
    if (!restaurantFood) {
      throw new Error(`Food item '${food.name}' is not sold by this restaurant.`);
    }
    if (restaurantFood.availability === false) {
      throw new Error(`Food item '${food.name}' is currently sold out.`);
    }

    populatedItems.push({
      productType: 'meal',
      foodId: item.foodId,
      quantity: item.quantity || 1,
      price: restaurantFood.price || item.price || 0,
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
