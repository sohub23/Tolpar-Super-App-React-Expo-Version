// Mock data for Tolpar SuperApp

export const mockUser = {
  id: "user_001",
  name: "Tolpar User",
  username: "@tolpar_user",
  initials: "TL",
  avatar: null,
  followers: 1248,
  following: 387,
  posts: 94,
  balance: "12,500.00",
  currency: "BDT",
};

export const quickActions = [
  { id: "qr", label: "Scan QR", icon: "scan-qr-code", color: "#07C160" },
  { id: "1", label: "Pay", icon: "credit-card", color: "#07C160" },
  { id: "2", label: "Transfer", icon: "arrow-right-left", color: "#07C160" },
  { id: "3", label: "Top Up", icon: "plus-circle", color: "#07C160" },
  { id: "4", label: "Bills", icon: "receipt", color: "#07C160" },
  { id: "5", label: "Travel", icon: "plane", color: "#07C160" },
  { id: "6", label: "Shopping", icon: "shopping-bag", color: "#07C160" },
  { id: "7", label: "Health", icon: "heart-pulse", color: "#07C160" },
  { id: "8", label: "More", icon: "grid-2x2", color: "#07C160" },
];

export const myServices = [
  { id: "omama", label: "O-MAMA", icon: "machine-image", color: "#3DB842", machineType: "omama", image: "omama" },
  { id: "vending", label: "Vending", icon: "machine-image", color: "#58D65D", machineType: "vending", image: "vending" },
  { id: "powerbank", label: "Powerbank", icon: "machine-image", color: "#4A90D9", machineType: "powerbank", image: "powerbank" },
  { id: "locker", label: "Locker", icon: "machine-image", color: "#F39C12", machineType: "locker", image: "locker" },
];

// Machine location data — ported from Flutter reference design
export type MachineType = "omama" | "vending" | "powerbank" | "locker";
export interface MachineLocation {
  id: string;
  type: MachineType;
  title: string;
  branch: string;
  address: string;
  status: "Online" | "Maintenance" | "Offline";
  lat: number;
  lng: number;
  photo: string;
}

export const machineLocations: MachineLocation[] = [
  // O-MAMA Smart Fridges
  { id: "MUID1234", type: "omama", title: "O-MAMA Fridge", branch: "SOHUB", address: "Solution Hub Technologies", status: "Online", lat: 23.7537633, lng: 90.3612483, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT49FgM4cEsOIdeCGZXtZPkqtJ3sVtKVVn67Q&s" },
  { id: "SHELL-M01", type: "omama", title: "O-MAMA Fridge", branch: "Ranks Petroleum Limited", address: "Shell Bangladesh", status: "Online", lat: 23.7596602, lng: 90.397372, photo: "https://media.licdn.com/dms/image/v2/D5622AQGXBU4iQnWRWg/feedshare-shrink_800/B56ZyzLwREHAAk-/0/1772532730178?e=2147483647&v=beta&t=pqq4WMw09sU9uq4ydsAEZMgvwblstd_qsV6y7Opw3Y4" },
  { id: "SAVOR-M02", type: "omama", title: "O-MAMA Fridge", branch: "Savor", address: "Savor Outlet", status: "Online", lat: 23.7505, lng: 90.3850, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiHWnjW8AZ9BJApqb00xeDs8CCZfOnLr_l8g&s" },
  { id: "ZANALA-M04", type: "omama", title: "O-MAMA Fridge", branch: "Zanala", address: "Zanala Bangladesh", status: "Maintenance", lat: 23.7621, lng: 90.3700, photo: "https://zanala.com/wp-content/uploads/2024/03/zanala.jpg" },
  { id: "PCB-M03", type: "omama", title: "O-MAMA Fridge", branch: "PC Builders Bangladesh", address: "Multiplan Center", status: "Online", lat: 23.7380, lng: 90.3945, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8vivPB68VDfLO7UNGYedtkL2z71lhoCR_8Q&s" },
  { id: "FoodPanda-M05", type: "omama", title: "O-MAMA Fridge", branch: "FoodPanda", address: "FoodPanda Distribution", status: "Online", lat: 23.7712, lng: 90.4048, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqALAeUUhaAYuNqNY47MuLk1JgwueLngsDLQ&s" },
  // Smart Vending
  { id: "svm_huawei_0001", type: "vending", title: "Smart Vending", branch: "Huawei", address: "Huawei Service Center", status: "Online", lat: 23.7658, lng: 90.4132, photo: "https://www.shutterstock.com/image-photo/huawei-head-office-gulshan-dhaka-260nw-2640534979.jpg" },
  { id: "svm_huawei_0002", type: "vending", title: "Smart Vending", branch: "Huawei", address: "Huawei Office", status: "Online", lat: 23.7656, lng: 90.4135, photo: "https://media.licdn.com/dms/image/v2/D5622AQE21k3r9ra3sQ/feedshare-shrink_800/feedshare-shrink_800/0/1733630814188?e=2147483647&v=beta&t=LC95AVbAz-0FEPRcFNZLvWqc2aJDBxwdKS5AqGtM4Bo" },
  // Powerbank
  { id: "GT082240110000", type: "powerbank", title: "Power Station", branch: "SOHUB", address: "Solution Hub Technologies", status: "Online", lat: 23.7537633, lng: 90.3612483, photo: "https://machines.sohub.com.bd/assets/hero-sohub-machine-2Lu90R9r.png" },
  // Locker
  { id: "SHB-LVM001", type: "locker", title: "Smart Locker", branch: "SOHUB", address: "Solution Hub Technologies", status: "Online", lat: 23.7537633, lng: 90.3612483, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQ-Ap-VOMHhLUooMz9R-RqfdX_zmWOCtvksw&s" },
];

// Dummy inventory products with high quality local Bangladeshi images
export const snackInventory = [
  { name: "Mojo Cola (250ml)", price: "৳ 25", image: require("@/assets/images/products/mojo.png") },
  { name: "Bombay Sweets Chanachur", price: "৳ 15", image: require("@/assets/images/products/chanachur.png") },
  { name: "Pran Mango Juice", price: "৳ 20", image: require("@/assets/images/products/mango_juice.png") },
  { name: "Dan Cake Swiss Roll", price: "৳ 10", image: require("@/assets/images/products/swiss_roll.png") },
  { name: "Mr. Noodles Instant", price: "৳ 18", image: require("@/assets/images/products/noodles.png") },
  { name: "Bisco Club Biscuit", price: "৳ 30", image: require("@/assets/images/products/bisco.png") },
  { name: "Coca Cola (250ml)", price: "৳ 25", image: require("@/assets/images/products/coke.png") },
  { name: "Potato Crackers Chips", price: "৳ 15", image: require("@/assets/images/products/chips.png") },
  { name: "Oreo Original", price: "৳ 40", image: require("@/assets/images/products/oreo.png") },
  { name: "Red Bull Energy Drink", price: "৳ 150", image: require("@/assets/images/products/redbull.png") },
  { name: "Snickers Chocolate", price: "৳ 60", image: require("@/assets/images/products/snickers.png") },
  { name: "Kinley Mineral Water", price: "৳ 20", image: require("@/assets/images/products/water.png") },
];

export const powerbankInventory = [
  { name: "5000mAh Fast Charge", price: "৳ 20 / hr", image: require("@/assets/images/powerbank.png") },
  { name: "10000mAh High Cap", price: "৳ 30 / hr", image: require("@/assets/images/powerbank.png") },
  { name: "5000mAh Wireless", price: "৳ 25 / hr", image: require("@/assets/images/powerbank.png") },
  { name: "Mini Powerbank", price: "৳ 15 / hr", image: require("@/assets/images/powerbank.png") },
];

export const lockerInventory = [
  { name: "Small Slot (Free)", price: "৳ 10 / hr", image: require("@/assets/images/locker.png") },
  { name: "Medium Slot (Free)", price: "৳ 20 / hr", image: require("@/assets/images/locker.png") },
  { name: "Large Slot (Free)", price: "৳ 30 / hr", image: require("@/assets/images/locker.png") },
  { name: "Jumbo Slot (Free)", price: "৳ 50 / hr", image: require("@/assets/images/locker.png") },
];

export const getInventoryForMachine = (type: string) => {
  if (type === "powerbank") return powerbankInventory;
  if (type === "locker") return lockerInventory;
  return snackInventory;
};

export const bannerSlides = [
  {
    id: "1",
    title: "Cashback 20%",
    subtitle: "On all food delivery orders this weekend",
    gradientColors: ["#07C160", "#1AAD6E"],
  },
  {
    id: "2",
    title: "Free Rides",
    subtitle: "Get 3 free rides when you top up ৳500",
    gradientColors: ["#4A90D9", "#357ABD"],
  },
  {
    id: "3",
    title: "Shop & Win",
    subtitle: "Spend ৳1000 and win exclusive prizes",
    gradientColors: ["#9B59B6", "#7D3C98"],
  },
];

export const nearbyBusinesses = [
  {
    id: "1",
    name: "Green Garden Restaurant",
    category: "Restaurant",
    rating: 4.8,
    distance: "0.2 km",
    color: "#07C160",
  },
  {
    id: "2",
    name: "Tech Hub Cafe",
    category: "Cafe",
    rating: 4.6,
    distance: "0.5 km",
    color: "#4A90D9",
  },
  {
    id: "3",
    name: "Fashion Square",
    category: "Shopping",
    rating: 4.5,
    distance: "0.8 km",
    color: "#E74C3C",
  },
  {
    id: "4",
    name: "Wellness Spa",
    category: "Health",
    rating: 4.9,
    distance: "1.1 km",
    color: "#9B59B6",
  },
  {
    id: "5",
    name: "Quick Mart",
    category: "Grocery",
    rating: 4.4,
    distance: "1.3 km",
    color: "#F39C12",
  },
];

export const recentActivity = [
  {
    id: "1",
    title: "Food Delivery",
    subtitle: "Green Garden Restaurant",
    amount: "-৳450",
    date: "Today, 1:30 PM",
    icon: "utensils",
    color: "#FF6B35",
    type: "debit",
  },
  {
    id: "2",
    title: "Money Received",
    subtitle: "From Ahmed Rahman",
    amount: "+৳2,000",
    date: "Today, 10:15 AM",
    icon: "arrow-down-left",
    color: "#07C160",
    type: "credit",
  },
  {
    id: "3",
    title: "Ride Hailing",
    subtitle: "Dhaka to Gulshan",
    amount: "-৳120",
    date: "Yesterday, 6:45 PM",
    icon: "car",
    color: "#4A90D9",
    type: "debit",
  },
  {
    id: "4",
    title: "Bill Payment",
    subtitle: "Electricity Bill",
    amount: "-৳850",
    date: "Yesterday, 3:00 PM",
    icon: "zap",
    color: "#F39C12",
    type: "debit",
  },
];

// Services Tab
export const serviceCategories = [
  "All",
  "Finance",
  "Transport",
  "Food",
  "Health",
  "Shopping",
  "Entertainment",
];

export const allServices = [
  { id: "1", name: "TolPay", icon: "wallet", color: "#07C160", category: "Finance" },
  { id: "2", name: "T-Bank", icon: "building-2", color: "#4A90D9", category: "Finance" },
  { id: "3", name: "Stocks", icon: "trending-up", color: "#1ABC9C", category: "Finance" },
  { id: "4", name: "RideGo", icon: "car", color: "#E74C3C", category: "Transport" },
  { id: "5", name: "TolBus", icon: "bus", color: "#F39C12", category: "Transport" },
  { id: "6", name: "Flights", icon: "plane", color: "#9B59B6", category: "Transport" },
  { id: "7", name: "FoodHub", icon: "utensils", color: "#FF6B35", category: "Food" },
  { id: "8", name: "Grocery", icon: "shopping-cart", color: "#27AE60", category: "Food" },
  { id: "9", name: "Pharmacy", icon: "pill", color: "#E91E63", category: "Health" },
  { id: "10", name: "HealthCare", icon: "heart-pulse", color: "#F44336", category: "Health" },
  { id: "11", name: "T-Shop", icon: "shopping-bag", color: "#2196F3", category: "Shopping" },
  { id: "12", name: "T-Fashion", icon: "shirt", color: "#9C27B0", category: "Shopping" },
  { id: "13", name: "Movies", icon: "film", color: "#FF5722", category: "Entertainment" },
  { id: "14", name: "Music", icon: "music", color: "#607D8B", category: "Entertainment" },
  { id: "15", name: "Games", icon: "gamepad-2", color: "#795548", category: "Entertainment" },
];

export const featuredBusinesses = [
  {
    id: "1",
    name: "Dhaka Food Court",
    description: "Top-rated restaurants all in one place",
    gradientColors: ["#FF6B35", "#FF8C55"],
    category: "Food",
  },
  {
    id: "2",
    name: "T-Fashion Mall",
    description: "Trending fashion at unbeatable prices",
    gradientColors: ["#9B59B6", "#8E44AD"],
    category: "Shopping",
  },
  {
    id: "3",
    name: "TolPay Finance",
    description: "Loans, savings, and investments",
    gradientColors: ["#07C160", "#1AAD6E"],
    category: "Finance",
  },
  {
    id: "4",
    name: "RideGo Premium",
    description: "Comfortable rides across the city",
    gradientColors: ["#4A90D9", "#357ABD"],
    category: "Transport",
  },
];

// Chat Tab
export const mockStories = [
  { id: "story_0", name: "Add Story", initials: "+", color: "#E0E0E0", isAdd: true },
  { id: "story_1", name: "Ahmed", initials: "AH", color: "#07C160", hasUnread: true },
  { id: "story_2", name: "Sara", initials: "SR", color: "#E74C3C", hasUnread: true },
  { id: "story_3", name: "Karim", initials: "KR", color: "#4A90D9", hasUnread: false },
  { id: "story_4", name: "Nadia", initials: "ND", color: "#9B59B6", hasUnread: true },
  { id: "story_5", name: "Rafiq", initials: "RF", color: "#F39C12", hasUnread: false },
  { id: "story_6", name: "Mim", initials: "MM", color: "#1ABC9C", hasUnread: true },
  { id: "story_7", name: "Tanvir", initials: "TV", color: "#E91E63", hasUnread: false },
];

export const mockConversations = [
  {
    id: "conv_1",
    name: "Ahmed Rahman",
    initials: "AH",
    color: "#07C160",
    lastMessage: "Thanks for the transfer! 👍",
    timestamp: "2m",
    unread: 2,
    online: true,
  },
  {
    id: "conv_2",
    name: "Sara Islam",
    initials: "SR",
    color: "#E74C3C",
    lastMessage: "Are you free for lunch tomorrow?",
    timestamp: "15m",
    unread: 0,
    online: true,
  },
  {
    id: "conv_3",
    name: "Karim Hossain",
    initials: "KR",
    color: "#4A90D9",
    lastMessage: "The meeting is at 3 PM",
    timestamp: "1h",
    unread: 1,
    online: false,
  },
  {
    id: "conv_4",
    name: "Nadia Begum",
    initials: "ND",
    color: "#9B59B6",
    lastMessage: "Sent you the documents 📎",
    timestamp: "2h",
    unread: 3,
    online: false,
  },
  {
    id: "conv_5",
    name: "Rafiq Ahmed",
    initials: "RF",
    color: "#F39C12",
    lastMessage: "Let me know when you arrive",
    timestamp: "4h",
    unread: 0,
    online: true,
  },
  {
    id: "conv_6",
    name: "Mim Akter",
    initials: "MM",
    color: "#1ABC9C",
    lastMessage: "Happy birthday! 🎂",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "conv_7",
    name: "Tanvir Khan",
    initials: "TV",
    color: "#E91E63",
    lastMessage: "Check out this deal on TolPay",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "conv_8",
    name: "Business Group",
    initials: "BG",
    color: "#607D8B",
    lastMessage: "Ahmed: Q3 report is ready",
    timestamp: "2 days",
    unread: 5,
    online: false,
  },
  {
    id: "conv_9",
    name: "Family Chat",
    initials: "FC",
    color: "#FF6B35",
    lastMessage: "Mom: Dinner at 7 tonight!",
    timestamp: "2 days",
    unread: 0,
    online: false,
  },
  {
    id: "conv_10",
    name: "Dilara Sultana",
    initials: "DS",
    color: "#795548",
    lastMessage: "See you at the event",
    timestamp: "3 days",
    unread: 0,
    online: false,
  },
];

export const mockMessages: Record<string, Array<{
  id: string;
  text: string;
  sent: boolean;
  time: string;
}>> = {
  conv_1: [
    { id: "m1", text: "Hey! Did you receive the payment?", sent: false, time: "10:00 AM" },
    { id: "m2", text: "Yes I got it, thank you so much!", sent: true, time: "10:02 AM" },
    { id: "m3", text: "No problem. Let me know if you need anything else.", sent: false, time: "10:03 AM" },
    { id: "m4", text: "Will do! By the way, are you free this weekend?", sent: true, time: "10:05 AM" },
    { id: "m5", text: "I think so, what's up?", sent: false, time: "10:06 AM" },
    { id: "m6", text: "Thinking of organizing a get-together at my place", sent: true, time: "10:08 AM" },
    { id: "m7", text: "That sounds great! Count me in 🎉", sent: false, time: "10:09 AM" },
    { id: "m8", text: "Awesome! I'll send you the details soon", sent: true, time: "10:10 AM" },
    { id: "m9", text: "Thanks for the transfer! 👍", sent: false, time: "10:12 AM" },
  ],
  default: [
    { id: "d1", text: "Hey there!", sent: false, time: "9:00 AM" },
    { id: "d2", text: "Hi! How are you?", sent: true, time: "9:01 AM" },
    { id: "d3", text: "I'm good, thanks! And you?", sent: false, time: "9:02 AM" },
    { id: "d4", text: "Doing great! Just checking in.", sent: true, time: "9:03 AM" },
    { id: "d5", text: "Nice to hear from you 😊", sent: false, time: "9:05 AM" },
    { id: "d6", text: "Same here! Let's catch up soon", sent: true, time: "9:06 AM" },
    { id: "d7", text: "Definitely! I'll reach out this week", sent: false, time: "9:07 AM" },
    { id: "d8", text: "Looking forward to it!", sent: true, time: "9:08 AM" },
  ],
};

// Discover Tab
export const trendingTopics = [
  { id: "1", title: "TolPay Goes International", gradient: ["#07C160", "#1AAD6E"] },
  { id: "2", title: "Dhaka Tech Summit 2025", gradient: ["#4A90D9", "#357ABD"] },
  { id: "3", title: "Ramadan Special Deals", gradient: ["#9B59B6", "#7D3C98"] },
  { id: "4", title: "New Ride Features", gradient: ["#FF6B35", "#E74C3C"] },
  { id: "5", title: "Health Week 2025", gradient: ["#1ABC9C", "#16A085"] },
];

export const nearbyPlaces = [
  { id: "1", name: "Bashundhara City", category: "Shopping Mall", distance: "1.2 km", rating: 4.7 },
  { id: "2", name: "Star Kabab & Restaurant", category: "Restaurant", distance: "0.4 km", rating: 4.8 },
  { id: "3", name: "Gulshan Lake Park", category: "Park", distance: "0.9 km", rating: 4.5 },
  { id: "4", name: "Square Hospital", category: "Hospital", distance: "2.1 km", rating: 4.9 },
];

export const forYouFeed = [
  {
    id: "1",
    title: "How TolPay is Revolutionizing Digital Payments in Bangladesh",
    source: "Tech Daily BD",
    time: "2 hours ago",
    color: "#07C160",
  },
  {
    id: "2",
    title: "Top 10 Restaurants to Try in Dhaka This Winter",
    source: "Food & Life",
    time: "5 hours ago",
    color: "#FF6B35",
  },
  {
    id: "3",
    title: "Smart Investment Tips for Young Professionals",
    source: "Finance Today",
    time: "1 day ago",
    color: "#4A90D9",
  },
  {
    id: "4",
    title: "New Transport Routes Added to TolBus Service",
    source: "Tolpar News",
    time: "1 day ago",
    color: "#9B59B6",
  },
  {
    id: "5",
    title: "Health & Wellness: Simple Morning Routines That Work",
    source: "Wellness BD",
    time: "2 days ago",
    color: "#E74C3C",
  },
];

// Profile Settings
export const profileSettings = [
  { id: "1", label: "Account Security", icon: "shield", group: "account" },
  { id: "2", label: "Notifications", icon: "bell", group: "account" },
  { id: "3", label: "Privacy", icon: "lock", group: "account" },
  { id: "4", label: "Appearance", icon: "sun", group: "preferences", hasToggle: true },
  { id: "5", label: "Language", icon: "globe", group: "preferences" },
  { id: "6", label: "Help & Support", icon: "life-buoy", group: "support" },
  { id: "7", label: "About Tolpar", icon: "info", group: "support" },
];

export const profileServices = [
  { id: "1", label: "My Wallet", icon: "wallet", color: "#07C160" },
  { id: "2", label: "My Orders", icon: "package", color: "#4A90D9" },
  { id: "3", label: "My Cards", icon: "credit-card", color: "#9B59B6" },
  { id: "4", label: "Favorites", icon: "heart", color: "#E74C3C" },
];