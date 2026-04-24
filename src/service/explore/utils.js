export const formatDistance = (distance) => {
  if (!distance && distance !== 0) return 'Unknown';
  
  const distanceInKm = typeof distance === 'number' ? distance : parseFloat(distance);
  
  if (isNaN(distanceInKm)) return 'Unknown';
  
  if (distanceInKm < 1) {
    const meters = Math.round(distanceInKm * 1000);
    return `${meters} m`;
  } else {
    return `${distanceInKm.toFixed(1)} km`;
  }
};

export const formatUserData = (user, PICT_URL) => ({
  id: user.user_id,
  profile_id: user.user_id,
  full_name: user.full_name,
  age: user.age,
  distance: formatDistance(user.distance),
  profile_picture: {
    file_path: user.profile_picture 
      ? `${PICT_URL}/profile/${user.profile_picture}`
      : 'https://via.placeholder.com/400x600?text=No+Image',
  },
  bio: user.bio,
  gender: user.gender,
  latitude: user.latitude,
  longitude: user.longitude,
  radius: user.radius,
  min_age: user.min_age,
  max_age: user.max_age,
  gender_target: user.gender_target,
  is_premium: user.is_premium,
});