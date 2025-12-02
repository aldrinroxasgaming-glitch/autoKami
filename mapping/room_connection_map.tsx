import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const RoomConnectionMap = () => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Parse room data
  const rooms = [
    { id: 1, name: "Misty Riverside", exits: [20], z: 1, y: 1, x: 3 },
    { id: 2, name: "Tunnel of Trees", exits: [13], z: 1, y: 3, x: 3 },
    { id: 3, name: "Torii Gate", exits: [], z: 1, y: 4, x: 3 },
    { id: 4, name: "Vending Machine", exits: [], z: 1, y: 6, x: 3 },
    { id: 5, name: "Restricted Area", exits: [], z: 1, y: 9, x: 3 },
    { id: 6, name: "Labs Entrance", exits: [28], z: 1, y: 10, x: 4 },
    { id: 9, name: "Forest: Old Growth", exits: [], z: 1, y: 8, x: 5 },
    { id: 10, name: "Forest: Insect Node", exits: [], z: 1, y: 5, x: 5 },
    { id: 11, name: "Temple by the Waterfall", exits: [24, 15], z: 1, y: 11, x: 6 },
    { id: 12, name: "Scrap Confluence", exits: [], z: 1, y: 6, x: 1 },
    { id: 13, name: "Convenience Store", exits: [2], z: 2, y: 3, x: 4 },
    { id: 15, name: "Temple Cave", exits: [11], z: 3, y: 7, x: 5 },
    { id: 16, name: "Techno Temple", exits: [], z: 3, y: 7, x: 6 },
    { id: 18, name: "Cave Crossroads", exits: [67, 76], z: 3, y: 6, x: 5 },
    { id: 19, name: "Temple of the Wheel", exits: [74], z: 3, y: 4, x: 2 },
    { id: 25, name: "Lost Skeleton", exits: [], z: 1, y: 9, x: 6 },
    { id: 26, name: "Trash-Strewn Graves", exits: [], z: 1, y: 8, x: 2 },
    { id: 29, name: "Misty Forest Path", exits: [], z: 1, y: 2, x: 3 },
    { id: 30, name: "Scrapyard Entrance", exits: [], z: 1, y: 5, x: 3 },
    { id: 31, name: "Scrapyard Exit", exits: [], z: 1, y: 8, x: 3 },
    { id: 32, name: "Road To Labs", exits: [], z: 1, y: 10, x: 3 },
    { id: 33, name: "Forest Entrance", exits: [], z: 1, y: 8, x: 4 },
    { id: 34, name: "Deeper Into Scrap", exits: [], z: 1, y: 6, x: 2 },
    { id: 35, name: "Elder Path", exits: [], z: 1, y: 6, x: 5 },
    { id: 36, name: "Parting Path", exits: [], z: 1, y: 9, x: 5 },
    { id: 37, name: "Hollow Path", exits: [], z: 1, y: 10, x: 6 },
    { id: 47, name: "Scrap Paths", exits: [], z: 1, y: 7, x: 3 },
    { id: 48, name: "Murky Forest Path", exits: [], z: 1, y: 7, x: 5 },
    { id: 49, name: "Clearing", exits: [], z: 1, y: 9, x: 7 },
    { id: 50, name: "Ancient Forest Entrance", exits: [], z: 1, y: 5, x: 6 },
    { id: 51, name: "Scrap-Littered Undergrowth", exits: [], z: 1, y: 5, x: 7 },
    { id: 52, name: "Airplane Crash", exits: [54], z: 1, y: 5, x: 8 },
    { id: 53, name: "Blooming Tree", exits: [], z: 1, y: 4, x: 7 },
    { id: 54, name: "Plane Interior", exits: [52], z: 2, y: 5, x: 8 },
    { id: 55, name: "Shady Path", exits: [], z: 1, y: 3, x: 4 },
    { id: 56, name: "Butterfly Forest", exits: [], z: 1, y: 3, x: 5 },
    { id: 57, name: "River Crossing", exits: [], z: 1, y: 3, x: 6 },
    { id: 58, name: "Mouth of Scrap", exits: [], z: 1, y: 5, x: 1 },
    { id: 59, name: "Black Pool", exits: [], z: 1, y: 4, x: 1 },
    { id: 60, name: "Scrap Trees", exits: [], z: 1, y: 1, x: 5 },
    { id: 61, name: "Musty Forest Path", exits: [], z: 1, y: 1, x: 7 },
    { id: 62, name: "Centipedes", exits: [], z: 1, y: 1, x: 8 },
    { id: 63, name: "Deeper Forest Path", exits: [], z: 1, y: 2, x: 6 },
    { id: 64, name: "Burning Room", exits: [65], z: 2, y: 5, x: 5 },
    { id: 65, name: "Forest Hut", exits: [64], z: 1, y: 1, x: 6 },
    { id: 66, name: "Marketplace", exits: [], z: 1, y: 2, x: 2 },
    { id: 67, name: "Boulder Tunnel", exits: [18, 68], z: 3, y: 6, x: 4 },
    { id: 68, name: "Slippery Pit", exits: [67, 75, 69], z: 3, y: 6, x: 3 },
    { id: 69, name: "Lotus Pool", exits: [68, 70], z: 3, y: 7, x: 3 },
    { id: 70, name: "Still Stream", exits: [69, 71], z: 3, y: 7, x: 2 },
    { id: 71, name: "Shabby Deck", exits: [70, 72], z: 3, y: 7, x: 1 },
    { id: 72, name: "Hatch to Nowhere", exits: [71, 73, 88], z: 3, y: 6, x: 1 },
    { id: 73, name: "Broken Tube", exits: [72, 74], z: 3, y: 5, x: 1 },
    { id: 74, name: "Engraved Door", exits: [73, 75, 19], z: 3, y: 5, x: 2 },
    { id: 75, name: "Flood Mural", exits: [68, 74], z: 3, y: 5, x: 3 },
    { id: 76, name: "Fungus Garden", exits: [77, 18], z: 3, y: 5, x: 5 },
    { id: 77, name: "Thriving Mushrooms", exits: [76, 78, 84], z: 3, y: 4, x: 5 },
    { id: 78, name: "Toadstool Platforms", exits: [77, 79], z: 3, y: 3, x: 5 },
    { id: 79, name: "Abandoned Campsite", exits: [78, 80], z: 3, y: 2, x: 5 },
    { id: 80, name: "Radiant Crystal", exits: [79, 81], z: 3, y: 2, x: 6 },
    { id: 81, name: "Flower Mural", exits: [80, 82], z: 3, y: 2, x: 7 },
    { id: 82, name: "Geometric Cliffs", exits: [81, 83], z: 3, y: 3, x: 7 },
    { id: 83, name: "Canyon Bridge", exits: [82, 84, 85], z: 3, y: 4, x: 7 },
    { id: 84, name: "Reinforced Tunnel", exits: [77, 83], z: 3, y: 4, x: 6 },
    { id: 85, name: "Giant's Palm", exits: [83, 86], z: 3, y: 5, x: 7 },
    { id: 86, name: "Guardian Skull", exits: [85, 87], z: 3, y: 5, x: 8 },
    { id: 87, name: "Sacrarium", exits: [86], z: 3, y: 6, x: 8 },
    { id: 88, name: "Treasure Hoard", exits: [89, 72], z: 4, y: 1, x: 3 },
    { id: 89, name: "Trophies of the Hunt", exits: [88, 90], z: 4, y: 1, x: 2 },
    { id: 90, name: "Scenic View", exits: [89], z: 4, y: 1, x: 1 }
  ];

  // Create connections array
  const connections = [];
  rooms.forEach(room => {
    room.exits.forEach(exitId => {
      const targetRoom = rooms.find(r => r.id === exitId);
      if (targetRoom) {
        connections.push({ from: room.id, to: exitId });
      }
    });
  });

  // Calculate positions using force-directed layout simulation
  const calculatePositions = () => {
    const positions = {};
    const width = 1200;
    const height = 800;

    // Group by Z level
    const zLevels = [...new Set(rooms.map(r => r.z))].sort();
    
    rooms.forEach(room => {
      const zIndex = zLevels.indexOf(room.z);
      const yPos = (room.y * 60) + (zIndex * 200);
      const xPos = room.x * 120 + (zIndex * 50);
      
      positions[room.id] = {
        x: xPos,
        y: yPos
      };
    });

    return positions;
  };

  const positions = calculatePositions();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw connections
    connections.forEach(conn => {
      const fromPos = positions[conn.from];
      const toPos = positions[conn.to];
      
      if (fromPos && toPos) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // Draw rooms
    rooms.forEach(room => {
      const pos = positions[room.id];
      if (!pos) return;

      // Highlight selected room
      const isSelected = selectedRoom === room.id;
      
      ctx.fillStyle = isSelected ? '#3b82f6' : (room.z === 1 ? '#16a34a' : room.z === 2 ? '#ca8a04' : room.z === 3 ? '#9333ea' : '#dc2626');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();

      if (zoom > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(room.id.toString(), pos.x, pos.y - 15);
      }
    });

    ctx.restore();
  }, [zoom, pan, selectedRoom]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 3));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    let clicked = null;
    rooms.forEach(room => {
      const pos = positions[room.id];
      if (!pos) return;
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 10) {
        clicked = room.id;
      }
    });

    setSelectedRoom(clicked);
  };

  const selectedRoomData = selectedRoom ? rooms.find(r => r.id === selectedRoom) : null;

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-2">Game World Room Connections</h1>
        <p className="text-gray-400 text-sm mb-3">Click rooms to see details • Drag to pan • Scroll to zoom</p>
        
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span className="text-sm text-gray-300">Z-Level 1 (Surface)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
            <span className="text-sm text-gray-300">Z-Level 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
            <span className="text-sm text-gray-300">Z-Level 3 (Caves)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span className="text-sm text-gray-300">Z-Level 4 (Castle)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-1"
          >
            <ZoomIn size={16} /> Zoom In
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.1))}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-1"
          >
            <ZoomOut size={16} /> Zoom Out
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-1"
          >
            <Maximize2 size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="flex-1 cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        />

        {selectedRoomData && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-3">Room #{selectedRoomData.id}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-semibold">{selectedRoomData.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Coordinates</p>
                <p className="text-white">X: {selectedRoomData.x}, Y: {selectedRoomData.y}, Z: {selectedRoomData.z}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Exits ({selectedRoomData.exits.length})</p>
                {selectedRoomData.exits.length > 0 ? (
                  <ul className="text-white space-y-1">
                    {selectedRoomData.exits.map(exitId => {
                      const exitRoom = rooms.find(r => r.id === exitId);
                      return (
                        <li key={exitId} className="text-sm">
                          → #{exitId} {exitRoom ? exitRoom.name : 'Unknown'}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No exits</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomConnectionMap;