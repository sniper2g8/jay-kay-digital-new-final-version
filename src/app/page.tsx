'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PrinterIcon, 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      title: "Business Cards",
      description: "Professional business cards with various paper stocks and finishes to make a lasting impression.",
      image: "/services/Business-card.jpg"
    },
    {
      title: "Digital Printing",
      description: "Fast turnaround for small to medium runs with exceptional quality and customization options.",
      image: "/services/Digital-Printing.jpg"
    },
    {
      title: "Brochures & Booklets",
      description: "Eye-catching brochures and booklets for marketing campaigns and product information.",
      image: "/services/brochures and booklets.png"
    },
    {
      title: "Signage & Banners",
      description: "Large format printing for indoor and outdoor signage, roll-up banners, and promotional displays.",
      image: "/services/signage-roll-up-banner-3.jpg"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "Freetown Marketing Co.",
      content: "Jay Kay Digital Press transformed our marketing materials. The quality is exceptional and delivery is always on time.",
      rating: 5
    },
    {
      name: "Michael Thompson",
      company: "SL Business Solutions",
      content: "Professional service from start to finish. Their attention to detail makes all the difference in our client presentations.",
      rating: 5
    },
    {
      name: "Amina Kamara",
      company: "Kamara & Associates",
      content: "Reliable, high-quality printing services at competitive prices. They've become our go-to printing partner.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-yellow-50">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/JK_Logo.jpg" alt="Jay Kay Digital Press Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-white">Jay Kay Digital Press</h1>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-300 hover:text-red-400 transition-colors">Services</a>
              <a href="#about" className="text-gray-300 hover:text-red-400 transition-colors">About</a>
              <a href="#testimonials" className="text-gray-300 hover:text-red-400 transition-colors">Testimonials</a>
              <a href="#contact" className="text-gray-300 hover:text-red-400 transition-colors">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link href="/dashboard">
                    My Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link href="/auth/login">
                    Login
                  </Link>
                </Button>
              )}
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-3">
                <a href="#services" className="text-gray-300 hover:text-red-400 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Services</a>
                <a href="#about" className="text-gray-300 hover:text-red-400 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>About</a>
                <a href="#testimonials" className="text-gray-300 hover:text-red-400 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
                <a href="#contact" className="text-gray-300 hover:text-red-400 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Contact</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg" 
            alt="Jay Kay Digital Press" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-yellow-500 text-black">
              <Shield className="h-3 w-3 mr-1" />
              Professional Printing Services
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Quality Printing Solutions for <span className="text-yellow-400">Your Business</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              From concept to delivery, we provide exceptional printing services with fast turnaround times and competitive pricing for businesses across Sierra Leone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="bg-red-600 hover:bg-red-700 text-lg py-6 px-8">
                <Link href="#services">
                  Explore Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 text-lg py-6 px-8 bg-transparent">
                <Link href="/track">
                  Track Order
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Our Printing Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional printing solutions tailored to meet your business needs with exceptional quality and fast delivery.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-red-200 hover:border-red-300 overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
                <span className="text-gray-500">Company Image</span>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Why Choose Jay Kay Digital Press?
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                With years of experience in the printing industry, we combine traditional craftsmanship with modern technology to deliver exceptional results.
              </p>
              
              <div className="space-y-4">
                {[
                  "State-of-the-art printing equipment for superior quality",
                  "Fast turnaround times without compromising quality",
                  "Competitive pricing for businesses of all sizes",
                  "Eco-friendly printing options available",
                  "Personalized customer service and support"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              
              <Button size="lg" asChild className="mt-8 bg-red-600 hover:bg-red-700">
                <Link href="/auth/login">
                  Get Started Today
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don&apos;t just take our word for it - hear from businesses we&apos;ve helped grow through quality printing services.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-red-200">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div>
                    <p className="font-semibold text-black">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-700 to-red-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Elevate Your Brand?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-red-100">
            Get started with Jay Kay Digital Press today and experience the difference that professional printing can make for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-red-700 hover:bg-gray-100">
              <Link href="/auth/login">
                Create Account
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 text-lg py-6 px-8 bg-transparent">
              <Link href="#contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Get In Touch
              </h2>
              <p className="text-xl text-gray-600">
                Have questions or ready to start your project? Reach out to our team.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Address</h4>
                      <p className="text-gray-600">Freetown, Sierra Leone</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <Users className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Phone</h4>
                      <p className="text-gray-600">+232 XXX XXX XXX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Email</h4>
                      <p className="text-gray-600">info@jaykaydigitalpress.com</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
                <form className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder="Your Email" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <div>
                    <textarea 
                      placeholder="Your Message" 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      suppressHydrationWarning={true}
                    ></textarea>
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" suppressHydrationWarning={true}>
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/JK_Logo.jpg" alt="Jay Kay Digital Press Logo" className="h-8 w-8 object-contain" />
                <div>
                  <p className="font-semibold">Jay Kay Digital Press</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Professional printing services for businesses across Sierra Leone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Offset Printing</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Digital Printing</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Large Format</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Binding Services</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">About Us</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Testimonials</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Careers</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-red-400 hover:text-red-300 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2025 Jay Kay Digital Press. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}