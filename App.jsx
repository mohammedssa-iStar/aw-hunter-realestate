import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx'
import { 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  Share2, 
  Phone, 
  Mail, 
  Filter,
  Star,
  Menu,
  X,
  User,
  Settings,
  CreditCard,
  BarChart3,
  Plus,
  LogOut,
  Building2
} from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import SubscriptionModal from './components/SubscriptionModal'
import { propertiesAPI, utils } from './lib/api'
import './App.css'

// Import luxury property images
import heroBackground from './assets/hero-background.jpg'
import luxuryVilla1 from './assets/luxury-villa-1.jpg'
import luxuryPenthouse1 from './assets/luxury-penthouse-1.jpg'
import waterfrontMansion1 from './assets/waterfront-mansion-1.jpg'
import luxuryApartment1 from './assets/luxury-apartment-1.jpg'

function AppContent() {
  const { user, logout, isAuthenticated, canListProperties } = useAuth()
  const [activeFilters, setActiveFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [favorites, setFavorites] = useState(new Set())
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})

  // Load properties from API
  useEffect(() => {
    loadProperties()
  }, [activeFilters, searchQuery])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const filters = {
        ...activeFilters,
        ...(searchQuery && { search: searchQuery })
      }
      
      const response = await propertiesAPI.getProperties(filters)
      setProperties(response.properties || [])
      setPagination(response.pagination || {})
    } catch (error) {
      console.error('Failed to load properties:', error)
      // Fallback to sample data if API fails
      setProperties(sampleProperties)
    } finally {
      setLoading(false)
    }
  }

  // Sample properties as fallback
  const sampleProperties = [
    {
      id: 1,
      title: "Oceanfront Modern Villa",
      location: "Saadiyat Island, Abu Dhabi",
      price: 15500000,
      currency: "AED",
      bedrooms: 6,
      bathrooms: 8,
      area: 12500,
      property_type: "Villa",
      status: "For Sale",
      featured: true,
      main_image: luxuryVilla1,
      gallery_images: [luxuryVilla1, luxuryPenthouse1, waterfrontMansion1],
      description: "Stunning contemporary villa with panoramic ocean views, infinity pool, and private beach access.",
      features: ["Ocean View", "Private Beach", "Infinity Pool", "Smart Home", "Gym", "Wine Cellar"],
      agent: {
        name: "Sarah Al-Mansouri",
        phone: "+971 50 123 4567",
        email: "sarah@awhunter.ae"
      }
    },
    {
      id: 2,
      title: "Sky Penthouse with City Views",
      location: "Downtown Abu Dhabi",
      price: 8750000,
      currency: "AED",
      bedrooms: 4,
      bathrooms: 5,
      area: 4200,
      property_type: "Penthouse",
      status: "For Sale",
      featured: true,
      main_image: luxuryPenthouse1,
      gallery_images: [luxuryPenthouse1, luxuryVilla1, luxuryApartment1],
      description: "Luxurious penthouse offering 360-degree city and sea views with premium finishes throughout.",
      features: ["City View", "Sea View", "Terrace", "Jacuzzi", "Concierge", "Valet Parking"],
      agent: {
        name: "Ahmed Hassan",
        phone: "+971 50 234 5678",
        email: "ahmed@awhunter.ae"
      }
    },
    {
      id: 3,
      title: "Waterfront Mansion Estate",
      location: "Al Raha Beach, Abu Dhabi",
      price: 22000000,
      currency: "AED",
      bedrooms: 8,
      bathrooms: 10,
      area: 18000,
      property_type: "Mansion",
      status: "For Sale",
      featured: false,
      main_image: waterfrontMansion1,
      gallery_images: [waterfrontMansion1, luxuryVilla1, luxuryPenthouse1],
      description: "Magnificent waterfront estate with private yacht berth and extensive entertainment areas.",
      features: ["Waterfront", "Yacht Berth", "Tennis Court", "Guest House", "Staff Quarters", "Helipad"],
      agent: {
        name: "Maria Rodriguez",
        phone: "+971 50 345 6789",
        email: "maria@awhunter.ae"
      }
    },
    {
      id: 4,
      title: "Designer Luxury Apartment",
      location: "Corniche Area, Abu Dhabi",
      price: 3200000,
      currency: "AED",
      bedrooms: 3,
      bathrooms: 4,
      area: 2800,
      property_type: "Apartment",
      status: "For Sale",
      featured: false,
      main_image: luxuryApartment1,
      gallery_images: [luxuryApartment1, luxuryPenthouse1, luxuryVilla1],
      description: "Elegantly designed apartment with premium finishes and stunning corniche views.",
      features: ["Corniche View", "Balcony", "Parking", "Gym Access", "Pool Access", "24/7 Security"],
      agent: {
        name: "James Wilson",
        phone: "+971 50 456 7890",
        email: "james@awhunter.ae"
      }
    }
  ]

  const toggleFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      const newFavorites = new Set(favorites)
      if (newFavorites.has(propertyId)) {
        await propertiesAPI.removeFromFavorites(propertyId)
        newFavorites.delete(propertyId)
      } else {
        await propertiesAPI.addToFavorites(propertyId)
        newFavorites.add(propertyId)
      }
      setFavorites(newFavorites)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    setShowMobileMenu(false)
  }

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="hidden md:block font-medium">{user?.full_name || user?.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          {user?.subscription_status && (
            <Badge variant="outline" className="mt-1 text-xs">
              {user.subscription_status.type.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Building2 className="mr-2 h-4 w-4" />
          My Properties
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Heart className="mr-2 h-4 w-4" />
          Favorites
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AW</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  A W Hunter
                </span>
              </div>
              
              <div className="hidden md:flex space-x-6">
                <a href="#properties" className="text-slate-700 hover:text-amber-600 font-medium transition-colors">Properties</a>
                <a href="#about" className="text-slate-700 hover:text-amber-600 font-medium transition-colors">About</a>
                <a href="#services" className="text-slate-700 hover:text-amber-600 font-medium transition-colors">Services</a>
                <a href="#contact" className="text-slate-700 hover:text-amber-600 font-medium transition-colors">Contact</a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true)
                      } else if (canListProperties) {
                        // TODO: Open property listing modal
                        console.log('Open property listing modal')
                      } else {
                        setShowSubscriptionModal(true)
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    List Property
                  </Button>
                  <UserMenu />
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    List Property
                  </Button>
                </>
              )}
            </div>

            <Button 
              variant="ghost" 
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-2 space-y-2">
              <a href="#properties" className="block py-2 text-slate-700 hover:text-amber-600">Properties</a>
              <a href="#about" className="block py-2 text-slate-700 hover:text-amber-600">About</a>
              <a href="#services" className="block py-2 text-slate-700 hover:text-amber-600">Services</a>
              <a href="#contact" className="block py-2 text-slate-700 hover:text-amber-600">Contact</a>
              <div className="pt-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="font-medium">{user?.full_name || user?.username}</span>
                    </div>
                    <Button variant="outline" className="w-full">Dashboard</Button>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
                      onClick={() => {
                        setShowMobileMenu(false)
                        if (canListProperties) {
                          // TODO: Open property listing modal
                          console.log('Open property listing modal')
                        } else {
                          setShowSubscriptionModal(true)
                        }
                      }}
                    >List Property</Button>
                    <Button variant="ghost" className="w-full" onClick={handleLogout}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full border-amber-200 text-amber-700"
                      onClick={() => {
                        setShowAuthModal(true)
                        setShowMobileMenu(false)
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
                      onClick={() => {
                        setShowAuthModal(true)
                        setShowMobileMenu(false)
                      }}
                    >
                      List Property
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Discover Luxury
            <span className="block bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Real Estate
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Experience unparalleled luxury in Abu Dhabi's most prestigious properties with our exclusive collection
          </p>
          
          {/* Hero Search */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by location, property type, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-lg border-0 bg-transparent focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={(value) => setActiveFilters({...activeFilters, type: value})}>
                  <SelectTrigger className="w-40 h-12 border-slate-200">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                    <SelectItem value="Mansion">Mansion</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Featured Properties
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Discover our handpicked selection of the finest luxury properties in Abu Dhabi
            </p>
          </div>

          {/* Advanced Filters */}
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Filters:</span>
              </div>
              
              <Select onValueChange={(value) => setActiveFilters({...activeFilters, bedrooms: parseInt(value)})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Bedrooms</SelectItem>
                  <SelectItem value="2">2+ Bedrooms</SelectItem>
                  <SelectItem value="3">3+ Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Min Price (AED)"
                  type="number"
                  className="w-40"
                  onChange={(e) => setActiveFilters({...activeFilters, min_price: parseInt(e.target.value) || undefined})}
                />
                <span className="text-slate-400">-</span>
                <Input
                  placeholder="Max Price (AED)"
                  type="number"
                  className="w-40"
                  onChange={(e) => setActiveFilters({...activeFilters, max_price: parseInt(e.target.value) || undefined})}
                />
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveFilters({})
                  setSearchQuery('')
                }}
                className="ml-auto"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Card key={property.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl">
                  <div className="relative overflow-hidden">
                    <img
                      src={property.main_image || luxuryVilla1}
                      alt={property.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {property.featured && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-white/90 text-slate-700">
                        {property.status}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => toggleFavorite(property.id)}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-amber-600 transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-slate-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.location}</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600 mb-4">
                        {utils.formatPrice(property.price, property.currency)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1" />
                        <span>{property.area?.toLocaleString()} sq ft</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      {(property.features || []).slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold">{property.title}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <img
                              src={property.main_image || luxuryVilla1}
                              alt={property.title}
                              className="w-full h-64 object-cover rounded-lg mb-4"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              {(property.gallery_images || [luxuryVilla1, luxuryPenthouse1, waterfrontMansion1]).map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                                />
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-4">
                              <div className="text-3xl font-bold text-amber-600 mb-2">
                                {utils.formatPrice(property.price, property.currency)}
                              </div>
                              <div className="flex items-center text-slate-600 mb-4">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{property.location}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <Bed className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                                <div className="font-semibold">{property.bedrooms}</div>
                                <div className="text-xs text-slate-600">Bedrooms</div>
                              </div>
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <Bath className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                                <div className="font-semibold">{property.bathrooms}</div>
                                <div className="text-xs text-slate-600">Bathrooms</div>
                              </div>
                              <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <Square className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                                <div className="font-semibold">{property.area?.toLocaleString()}</div>
                                <div className="text-xs text-slate-600">Sq Ft</div>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-slate-600">{property.description}</p>
                            </div>

                            <div className="mb-6">
                              <h4 className="font-semibold mb-2">Features</h4>
                              <div className="flex flex-wrap gap-2">
                                {(property.features || []).map((feature, index) => (
                                  <Badge key={index} variant="outline">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-2">Contact Agent</h4>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{property.agent?.name || 'A W Hunter Team'}</div>
                                  <div className="text-sm text-slate-600">{property.agent?.phone || '+971 2 123 4567'}</div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Phone className="w-4 h-4 mr-1" />
                                    Call
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Mail className="w-4 h-4 mr-1" />
                                    Email
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {properties.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-semibold mb-2">No properties found</h3>
              <p className="text-slate-600">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AW</span>
                </div>
                <span className="text-xl font-bold">A W Hunter</span>
              </div>
              <p className="text-slate-400">
                Abu Dhabi's premier luxury real estate agency, specializing in exclusive properties and exceptional service.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Properties</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Luxury Villas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Penthouses</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Waterfront</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Commercial</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Property Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investment Advisory</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Market Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400">
                <li>+971 2 123 4567</li>
                <li>info@awhunter.ae</li>
                <li>Abu Dhabi, UAE</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 A W Hunter Real Estate. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Subscription Modal */}
      <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

