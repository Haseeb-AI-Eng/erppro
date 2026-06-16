import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, TrendingUp, TrendingDown, ArrowRight, Loader, ShoppingBag, Landmark } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const LOCATIONS = [
  { name: 'Karachi, Pakistan', currency: 'PKR', symbol: 'Rs.', flag: '🇵🇰' },
  { name: 'Lahore, Pakistan', currency: 'PKR', symbol: 'Rs.', flag: '🇵🇰' },
  { name: 'Islamabad, Pakistan', currency: 'PKR', symbol: 'Rs.', flag: '🇵🇰' },
  { name: 'Peshawar, Pakistan', currency: 'PKR', symbol: 'Rs.', flag: '🇵🇰' },
  { name: 'Quetta, Pakistan', currency: 'PKR', symbol: 'Rs.', flag: '🇵🇰' },
  { name: 'New York, USA', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { name: 'London, UK', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { name: 'Dubai, UAE', currency: 'AED', symbol: 'AED ', flag: '🇦🇪' },
]

// Mock data generator for market prices depending on location
const getMarketPrices = (currency) => {
  const isPKR = currency === 'PKR'
  const mult = isPKR ? 280 : 1.0 // Simple price scaling factor
  
  return [
    { 
      id: 'wheat', 
      name: 'Wheat Flour (Aata)', 
      category: 'Essentials',
      unit: '10 kg',
      currentPrice: isPKR ? 1250 : 12.5,
      change: isPKR ? -30 : -0.25,
      trend: isPKR ? 'down' : 'down',
      history: [
        { date: 'Mon', price: isPKR ? 1300 : 13.0 },
        { date: 'Tue', price: isPKR ? 1290 : 12.9 },
        { date: 'Wed', price: isPKR ? 1280 : 12.8 },
        { date: 'Thu', price: isPKR ? 1270 : 12.7 },
        { date: 'Fri', price: isPKR ? 1250 : 12.5 },
      ],
      markets: [
        { name: 'Local Mandi (Wholesale)', price: isPKR ? 1180 : 11.8 },
        { name: 'Super Store / Mart', price: isPKR ? 1320 : 13.2 },
        { name: 'Retail Shops', price: isPKR ? 1250 : 12.5 }
      ]
    },
    { 
      id: 'petrol', 
      name: 'Super Petrol', 
      category: 'Fuel',
      unit: '1 Liter',
      currentPrice: isPKR ? 268.5 : 2.45,
      change: isPKR ? 8.2 : 0.08,
      trend: 'up',
      history: [
        { date: 'Mon', price: isPKR ? 255.0 : 2.32 },
        { date: 'Tue', price: isPKR ? 260.0 : 2.37 },
        { date: 'Wed', price: isPKR ? 260.0 : 2.37 },
        { date: 'Thu', price: isPKR ? 268.5 : 2.45 },
        { date: 'Fri', price: isPKR ? 268.5 : 2.45 },
      ],
      markets: [
        { name: 'PSO / Shell Pump', price: isPKR ? 268.5 : 2.45 },
        { name: 'Total Parco', price: isPKR ? 268.2 : 2.44 },
        { name: 'Local Fuel Depot', price: isPKR ? 267.0 : 2.42 }
      ]
    },
    { 
      id: 'milk', 
      name: 'Fresh Milk', 
      category: 'Essentials',
      unit: '1 Liter',
      currentPrice: isPKR ? 220 : 1.95,
      change: isPKR ? 5 : 0.05,
      trend: 'up',
      history: [
        { date: 'Mon', price: isPKR ? 210 : 1.85 },
        { date: 'Tue', price: isPKR ? 215 : 1.90 },
        { date: 'Wed', price: isPKR ? 215 : 1.90 },
        { date: 'Thu', price: isPKR ? 220 : 1.95 },
        { date: 'Fri', price: isPKR ? 220 : 1.95 },
      ],
      markets: [
        { name: 'Local Dairy Farm', price: isPKR ? 200 : 1.80 },
        { name: 'Imtiaz / Packaged', price: isPKR ? 240 : 2.10 },
        { name: 'Subzi Mandi Shop', price: isPKR ? 220 : 1.95 }
      ]
    },
    { 
      id: 'sugar', 
      name: 'White Sugar', 
      category: 'Essentials',
      unit: '1 kg',
      currentPrice: isPKR ? 145 : 1.15,
      change: isPKR ? -2 : -0.02,
      trend: 'down',
      history: [
        { date: 'Mon', price: isPKR ? 148 : 1.18 },
        { date: 'Tue', price: isPKR ? 147 : 1.17 },
        { date: 'Wed', price: isPKR ? 146 : 1.16 },
        { date: 'Thu', price: isPKR ? 145 : 1.15 },
        { date: 'Fri', price: isPKR ? 145 : 1.15 },
      ],
      markets: [
        { name: 'Utility Stores', price: isPKR ? 135 : 1.05 },
        { name: 'Local Retailer', price: isPKR ? 145 : 1.15 },
        { name: 'Wholesale Market', price: isPKR ? 138 : 1.10 }
      ]
    },
    { 
      id: 'rice', 
      name: 'Basmati Rice (Premium)', 
      category: 'Essentials',
      unit: '1 kg',
      currentPrice: isPKR ? 340 : 2.90,
      change: isPKR ? 12 : 0.10,
      trend: 'up',
      history: [
        { date: 'Mon', price: isPKR ? 320 : 2.75 },
        { date: 'Tue', price: isPKR ? 325 : 2.80 },
        { date: 'Wed', price: isPKR ? 330 : 2.85 },
        { date: 'Thu', price: isPKR ? 340 : 2.90 },
        { date: 'Fri', price: isPKR ? 340 : 2.90 },
      ],
      markets: [
        { name: 'Grain Market', price: isPKR ? 310 : 2.65 },
        { name: 'Gourmet / Mart', price: isPKR ? 370 : 3.15 },
        { name: 'General Merchant', price: isPKR ? 340 : 2.90 }
      ]
    },
    { 
      id: 'eggs', 
      name: 'Farm Eggs', 
      category: 'Essentials',
      unit: '1 Dozen',
      currentPrice: isPKR ? 290 : 2.60,
      change: isPKR ? -10 : -0.10,
      trend: 'down',
      history: [
        { date: 'Mon', price: isPKR ? 305 : 2.75 },
        { date: 'Tue', price: isPKR ? 300 : 2.70 },
        { date: 'Wed', price: isPKR ? 295 : 2.65 },
        { date: 'Thu', price: isPKR ? 290 : 2.60 },
        { date: 'Fri', price: isPKR ? 290 : 2.60 },
      ],
      markets: [
        { name: 'Poultry Wholesaler', price: isPKR ? 270 : 2.40 },
        { name: 'Local Shop', price: isPKR ? 290 : 2.60 },
        { name: 'Organic Supermarket', price: isPKR ? 340 : 3.00 }
      ]
    },
    { 
      id: 'cement', 
      name: 'Cement (OPC)', 
      category: 'Construction',
      unit: '50 kg Bag',
      currentPrice: isPKR ? 1220 : 9.80,
      change: isPKR ? 15 : 0.15,
      trend: 'up',
      history: [
        { date: 'Mon', price: isPKR ? 1200 : 9.60 },
        { date: 'Tue', price: isPKR ? 1205 : 9.65 },
        { date: 'Wed', price: isPKR ? 1210 : 9.70 },
        { date: 'Thu', price: isPKR ? 1220 : 9.80 },
        { date: 'Fri', price: isPKR ? 1220 : 9.80 },
      ],
      markets: [
        { name: 'Authorized Dealer', price: isPKR ? 1200 : 9.60 },
        { name: 'Hardware Retailer', price: isPKR ? 1235 : 9.95 },
        { name: 'Bulk Order Depot', price: isPKR ? 1180 : 9.45 }
      ]
    }
  ]
}

export default function MarketPrices() {
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[1]) // Default to Lahore, Pakistan
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [detecting, setDetecting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Auto detect location based on user's environment/IP
  const autoDetectLocation = () => {
    setDetecting(true)
    // Fetch geo-IP information
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'PK') {
          // If in Pakistan, select matching Pakistani city or Lahore/Karachi/Islamabad
          const city = data.city || 'Karachi'
          const found = LOCATIONS.find(loc => loc.name.toLowerCase().includes(city.toLowerCase())) || LOCATIONS[0]
          setSelectedLoc(found)
          toast.success(`Location detected: ${found.name}`)
        } else {
          // Find if country matches
          const countryName = data.country_name || 'USA'
          const found = LOCATIONS.find(loc => loc.name.toLowerCase().includes(countryName.toLowerCase())) || LOCATIONS[5]
          setSelectedLoc(found)
          toast.success(`Location detected: ${found.name}`)
        }
      })
      .catch(() => {
        // Fallback default is Pakistan PKR
        setSelectedLoc(LOCATIONS[1])
        toast.success('Default location set: Lahore, Pakistan')
      })
      .finally(() => {
        setDetecting(false)
      })
  }

  // Detect once on load
  useEffect(() => {
    autoDetectLocation()
  }, [])

  const products = getMarketPrices(selectedLoc.currency)

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Set initial selected product
  useEffect(() => {
    if (filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0])
    } else {
      setSelectedProduct(null)
    }
  }, [selectedLoc, search, activeCategory])

  const categories = ['All', 'Essentials', 'Fuel', 'Construction']

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark size={24} className="text-primary-600" />
            Surrounding Market Prices
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time surrounding product rates based on your current location and currency.
          </p>
        </div>

        {/* Location selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={autoDetectLocation}
            disabled={detecting}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Auto-detect Location"
          >
            {detecting ? (
              <Loader size={14} className="animate-spin text-primary-500" />
            ) : (
              <MapPin size={14} className="text-primary-500" />
            )}
            Detect Location
          </button>
          
          <select
            className="input w-52 text-xs font-semibold py-2 bg-white border-slate-200"
            value={selectedLoc.name}
            onChange={(e) => {
              const loc = LOCATIONS.find(l => l.name === e.target.value)
              if (loc) setSelectedLoc(loc)
            }}
          >
            {LOCATIONS.map(loc => (
              <option key={loc.name} value={loc.name}>
                {loc.flag} {loc.name} ({loc.currency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Product List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-xs"
                placeholder="Search products (e.g. Flour, Petrol)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {/* Category tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeCategory === c
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id
              const changeColor = p.trend === 'up' ? 'text-red-500' : 'text-green-500'
              const TrendIcon = p.trend === 'up' ? TrendingUp : TrendingDown
              
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedProduct(p)}
                  className={`card cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50/10 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">per {p.unit}</span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{p.name}</h3>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Current Rate</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {selectedLoc.symbol}{p.currentPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1 text-xs font-semibold ${changeColor}`}>
                      <TrendIcon size={14} />
                      <span>{p.change > 0 ? '+' : ''}{p.change.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {!filteredProducts.length && (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                No products found in this category.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Product Details & Trend Analytics */}
        <div className="space-y-4">
          {selectedProduct ? (
            <motion.div
              layoutId="product-details"
              className="card space-y-5 bg-white border border-slate-200"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedProduct.name}</h2>
                <p className="text-xs text-slate-400">Trend & Surrounding Market Comparison</p>
              </div>

              {/* Price trend chart */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500">Price Trend (This Week)</h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedProduct.history}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}
                        formatter={(val) => [`${selectedLoc.symbol}${val.toLocaleString()}`, 'Price']}
                      />
                      <Area type="monotone" dataKey="price" stroke="#6366f1" fill="url(#priceGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Markets comparison */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500">Surrounding Markets Comparison</h3>
                <div className="space-y-2">
                  {selectedProduct.markets.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-primary-500 shrink-0" />
                        <span className="text-xs text-slate-700 font-medium">{m.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedLoc.symbol}{m.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation/Insight */}
              <div className="bg-primary-50/50 border border-primary-100 p-3 rounded-lg">
                <h4 className="text-xs font-bold text-primary-700">Procurement Tip:</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {selectedProduct.trend === 'down' 
                    ? 'Prices are currently on a downward trend. Purchase in batches to capitalize on expected lower rates next week.'
                    : 'Prices are rising. Consider locking in long-term wholesale rates from PSO/Mandi to hedge against inflating procurement costs.'
                  }
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="card text-center py-20 text-slate-400 text-xs">
              Select a product to view detailed trend analytics and market comparison.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
