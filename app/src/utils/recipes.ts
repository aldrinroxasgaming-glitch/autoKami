export interface Recipe {
  id: number;
  name: string;
  outputIndex: number;
  outputAmount: number;
  inputIndices: number[];
  inputAmounts: number[];
  staminaCost: number;
  xpOutput: number;
  minLevel: number;
}

export const RECIPE_LIST: Recipe[] = [
  { id: 1, name: "Brew XP Potion", outputIndex: 11401, outputAmount: 1, inputIndices: [1003,1104], inputAmounts: [1, 250], staminaCost: 20, xpOutput: 50, minLevel: 1 },
  { id: 2, name: "Brew Greater XP Potion", outputIndex: 11402, outputAmount: 1, inputIndices: [1006,1104], inputAmounts: [1, 2500], staminaCost: 50, xpOutput: 1000, minLevel: 1 },
  { id: 3, name: "Brew Respec Potion", outputIndex: 11403, outputAmount: 1, inputIndices: [1003,1112], inputAmounts: [1, 500], staminaCost: 50, xpOutput: 200, minLevel: 1 },
  { id: 4, name: "Brew Grace Potion", outputIndex: 11404, outputAmount: 1, inputIndices: [1003,1111,1110], inputAmounts: [1, 100, 50], staminaCost: 25, xpOutput: 150, minLevel: 1 },
  { id: 5, name: "Brew Bless Potion", outputIndex: 11405, outputAmount: 1, inputIndices: [1003,1111], inputAmounts: [1, 100], staminaCost: 15, xpOutput: 50, minLevel: 1 },
  { id: 6, name: "Extract Pine Pollen", outputIndex: 1104, outputAmount: 500, inputIndices: [1004], inputAmounts: [1], staminaCost: 10, xpOutput: 25, minLevel: 1 },
  { id: 7, name: "Extract Microplastics", outputIndex: 1103, outputAmount: 500, inputIndices: [1003], inputAmounts: [1], staminaCost: 30, xpOutput: 100, minLevel: 1 },
  { id: 8, name: "Extract Daffodil", outputIndex: 1111, outputAmount: 500, inputIndices: [1011], inputAmounts: [1], staminaCost: 10, xpOutput: 25, minLevel: 1 },
  { id: 9, name: "Extract Mint", outputIndex: 1112, outputAmount: 500, inputIndices: [1012], inputAmounts: [1], staminaCost: 20, xpOutput: 100, minLevel: 1 },
  { id: 10, name: "Extract Black Poppy", outputIndex: 1110, outputAmount: 500, inputIndices: [1010], inputAmounts: [1], staminaCost: 20, xpOutput: 250, minLevel: 1 },
  { id: 11, name: "Assemble Aetheric Sextant", outputIndex: 100004, outputAmount: 1, inputIndices: [100003,100001,100002], inputAmounts: [1, 1, 1], staminaCost: 100, xpOutput: 5000, minLevel: 1 },
  { id: 12, name: "Grind Berry Chalk", outputIndex: 1114, outputAmount: 500, inputIndices: [1014], inputAmounts: [1], staminaCost: 10, xpOutput: 50, minLevel: 1 },
  { id: 13, name: "Crush Red Amber", outputIndex: 1107, outputAmount: 500, inputIndices: [1007], inputAmounts: [1], staminaCost: 20, xpOutput: 250, minLevel: 1 },
  { id: 14, name: "Mix Holy Syrup", outputIndex: 1201, outputAmount: 500, inputIndices: [11011], inputAmounts: [1], staminaCost: 20, xpOutput: 100, minLevel: 1 },
  { id: 15, name: "Process Resin", outputIndex: 1202, outputAmount: 500, inputIndices: [11311], inputAmounts: [1], staminaCost: 10, xpOutput: 25, minLevel: 1 },
  { id: 16, name: "Extract Powder", outputIndex: 1113, outputAmount: 500, inputIndices: [1013], inputAmounts: [1], staminaCost: 10, xpOutput: 25, minLevel: 1 },
  { id: 17, name: "Chisel Cup", outputIndex: 1102, outputAmount: 1, inputIndices: [1002], inputAmounts: [1], staminaCost: 25, xpOutput: 30, minLevel: 1 },
  { id: 18, name: "Brew Hostility Potion", outputIndex: 11410, outputAmount: 1, inputIndices: [1102,1113,1104], inputAmounts: [1, 250, 250], staminaCost: 20, xpOutput: 75, minLevel: 1 },
  { id: 19, name: "Brew Energy Drink", outputIndex: 11409, outputAmount: 1, inputIndices: [1005,1114,1202], inputAmounts: [1, 250, 250], staminaCost: 20, xpOutput: 75, minLevel: 1 },
  { id: 20, name: "Write Apology Letter", outputIndex: 11406, outputAmount: 1, inputIndices: [1001,1113,1202], inputAmounts: [2, 125, 125], staminaCost: 20, xpOutput: 75, minLevel: 1 },
  { id: 21, name: "Craft Festival Chime", outputIndex: 11408, outputAmount: 1, inputIndices: [1005,1201], inputAmounts: [3, 250], staminaCost: 25, xpOutput: 100, minLevel: 1 },
  { id: 22, name: "Craft $MUSU Magnet", outputIndex: 11407, outputAmount: 1, inputIndices: [1002,1107,1201], inputAmounts: [1, 50, 100], staminaCost: 25, xpOutput: 100, minLevel: 1 },
  { id: 23, name: "Craft Spirit Glue", outputIndex: 19001, outputAmount: 1, inputIndices: [1003,1103,1114], inputAmounts: [1, 200, 200], staminaCost: 20, xpOutput: 75, minLevel: 1 },
  { id: 24, name: "Craft Animistic Poison", outputIndex: 19101, outputAmount: 1, inputIndices: [1202,11314,1113], inputAmounts: [150, 5, 150], staminaCost: 25, xpOutput: 200, minLevel: 15 },
  { id: 25, name: "Craft Cthonic Blight", outputIndex: 19201, outputAmount: 1, inputIndices: [1201,11312,11227], inputAmounts: [100, 1, 1], staminaCost: 25, xpOutput: 300, minLevel: 15 },
  { id: 26, name: "Craft Flash Talisman", outputIndex: 11412, outputAmount: 7, inputIndices: [1016,6005,1103], inputAmounts: [2, 1, 500], staminaCost: 50, xpOutput: 1500, minLevel: 20 },
  { id: 28, name: "Craft Toadstool Liquor", outputIndex: 11501, outputAmount: 1, inputIndices: [1113,1110,1114], inputAmounts: [5000, 250, 250], staminaCost: 50, xpOutput: 1000, minLevel: 15 },
  { id: 29, name: "Craft Fortified XP Potion", outputIndex: 11411, outputAmount: 1, inputIndices: [11402,1107,6006], inputAmounts: [1, 300, 1], staminaCost: 75, xpOutput: 7500, minLevel: 20 },
  { id: 30, name: "Craft Pure Essence", outputIndex: 6007, outputAmount: 1, inputIndices: [6001,6005,6003,6002,6004,6006], inputAmounts: [1,1,1,1,1,1], staminaCost: 75, xpOutput: 10000, minLevel: 20 },
  { id: 31, name: "Craft Timber with Stems", outputIndex: 1302, outputAmount: 1, inputIndices: [1016], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 32, name: "Craft Ingot with Pipes", outputIndex: 1303, outputAmount: 1, inputIndices: [1017], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 33, name: "Craft Ashlar with Bone", outputIndex: 1301, outputAmount: 1, inputIndices: [1020], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 34, name: "Craft Timber with Stick", outputIndex: 1302, outputAmount: 1, inputIndices: [1001], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 35, name: "Craft Ingot with Scrap", outputIndex: 1303, outputAmount: 1, inputIndices: [1005], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 36, name: "Craft Ashlar with Stone", outputIndex: 1301, outputAmount: 1, inputIndices: [1002], inputAmounts: [100], staminaCost: 50, xpOutput: 300, minLevel: 15 },
  { id: 10001, name: "Craft Wonder Egg", outputIndex: 21003, outputAmount: 1, inputIndices: [1015], inputAmounts: [5], staminaCost: 0, xpOutput: 0, minLevel: 1 }
];
