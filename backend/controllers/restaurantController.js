import Restaurant from '../models/Restaurant.js';

// List all restaurants with basic info
export const listRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .select('name cuisine location menu rating')
      .sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

// Get details for a single restaurant, including full menu
export const getRestaurantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id)
      .populate('createdBy', 'name email');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (err) {
    console.error('Error fetching restaurant details:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
};

// Get restaurant menu only
export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).select('name menu rating');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({
      restaurantName: restaurant.name,
      menu: restaurant.menu
    });
  } catch (err) {
    console.error('Error fetching restaurant menu:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant menu' });
  }
};

// Find nearby restaurants based on customer's location
export const findNearbyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, city, maxDistance = 5000 } = req.query;

    if (!latitude && !longitude && !city) {
      return res.status(400).json({ error: 'Latitude/longitude or city are required' });
    }

    let nearbyRestaurants = [];
    const restaurantIds = new Set();

    // 1. Find by GPS coordinates if available
    if (latitude && longitude) {
      const restaurants = await Restaurant.find({
        'location.latitude': { $exists: true },
        'location.longitude': { $exists: true }
      }).select('name cuisine location menu rating');

      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
      };

      const gpsRestaurants = restaurants
        .map(restaurant => ({
          ...restaurant.toObject(),
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            restaurant.location.latitude,
            restaurant.location.longitude
          )
        }))
        .filter(restaurant => restaurant.distance <= parseInt(maxDistance));
      
      gpsRestaurants.forEach(r => {
        nearbyRestaurants.push(r);
        restaurantIds.add(r._id.toString());
      });
    }

    // 2. Find by city if provided
    if (city) {
      const cityRestaurants = await Restaurant.find({
        'location.city': { $regex: `^${city}$`, $options: 'i' },
        _id: { $nin: Array.from(restaurantIds) } // Exclude already found restaurants
      }).select('name cuisine location menu rating');

      cityRestaurants.forEach(r => {
        // For city-only matches, distance is null or a high value to sort them after GPS matches
        nearbyRestaurants.push({ ...r.toObject(), distance: null });
      });
    }

    // 3. Sort the combined list
    nearbyRestaurants.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance; // Both have distance, sort by it
      }
      if (a.distance !== null) {
        return -1; // a has distance, b doesn't, so a comes first
      }
      if (b.distance !== null) {
        return 1; // b has distance, a doesn't, so b comes first
      }
      return 0; // Neither has distance, keep original order
    });

    res.json(nearbyRestaurants);
  } catch (err) {
    console.error('Error finding nearby restaurants:', err);
    res.status(500).json({ error: 'Failed to find nearby restaurants' });
  }
};

// Search restaurants by name or cuisine
export const searchRestaurants = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { cuisine: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } }
      ]
    }).select('name cuisine location menu rating');

    res.json(restaurants);
  } catch (err) {
    console.error('Error searching restaurants:', err);
    res.status(500).json({ error: 'Failed to search restaurants' });
  }
};

// Filter restaurants by cuisine type
export const filterByCuisine = async (req, res) => {
  try {
    const { cuisine } = req.query;
    
    if (!cuisine) {
      return res.status(400).json({ error: 'Cuisine parameter is required' });
    }

    const restaurants = await Restaurant.find({
      cuisine: { $regex: cuisine, $options: 'i' }
    }).select('name cuisine location menu rating');

    res.json(restaurants);
  } catch (err) {
    console.error('Error filtering restaurants by cuisine:', err);
    res.status(500).json({ error: 'Failed to filter restaurants' });
  }
};

// Get popular/featured restaurants (you can customize the logic)
export const getPopularRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // For now, just return the most recently created restaurants
    // In production, you might want to sort by ratings, order count, etc.
    const restaurants = await Restaurant.find()
      .select('name cuisine location menu rating')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching popular restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch popular restaurants' });
  }
};
