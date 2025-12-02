// Backgrounds registry
// Uses Vite's import.meta.glob to load all background images from the copied rooms directory

export const backgroundImages = import.meta.glob('./rooms/**/backgrounds/*.{png,jpg,jpeg,gif}', { 
  eager: true,
  as: 'url'
});

export const getBackgroundList = () => {
  return Object.entries(backgroundImages).map(([path, url]) => {
    // Extract room name/id from path (e.g., "./rooms/10_forest-insect/backgrounds/original.png")
    const parts = path.split('/');
    const roomFolder = parts[2]; // "10_forest-insect"
    const fileName = parts[4]; // "original.png"
    
    // Format name
    const name = `${roomFolder.replace(/^\d+_/, '').replace(/-/g, ' ')} - ${fileName.replace(/\.\w+$/, '')}`;
    
    return {
      id: path,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url: url
    };
  });
};
