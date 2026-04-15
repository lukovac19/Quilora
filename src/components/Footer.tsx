import { motion } from './ui/motion';
import { Brain, Twitter, Github, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Demo', 'Documentation', 'API'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
  Resources: ['Community', 'Support', 'Status', 'Security', 'Privacy'],
  Legal: ['Terms', 'Privacy', 'Cookies', 'Licenses', 'Contact'],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: '#', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#0A0A0A] to-[#001F54]/20 border-t border-white/[0.03]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <motion.div
              className="flex items-center gap-3 mb-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.12 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#0FB2FF] flex items-center justify-center">
                <Brain className="w-6 h-6 text-[#0A0A0A]" />
              </div>
              <span 
                className="text-[#E6F0FF] text-xl"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                AI<span className="text-[#00D1FF]">Flow</span>
              </span>
            </motion.div>
            
            <p className="text-[#E6F0FF]/60 mb-6 max-w-xs leading-relaxed">
              Empowering businesses with next-generation AI tools for modern enterprises.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-[#001F54]/40 border border-white/[0.03] flex items-center justify-center text-[#E6F0FF]/60 hover:text-[#00D1FF] hover:border-[#00D1FF]/30 transition-all duration-120"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 
                className="text-[#E6F0FF] mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-[#E6F0FF]/60 hover:text-[#00D1FF] transition-colors duration-120 inline-block"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.12 }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="py-8 border-t border-b border-white/[0.03] mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 
              className="text-[#E6F0FF] mb-3"
              style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.25rem' }}
            >
              Stay Updated
            </h3>
            <p className="text-[#E6F0FF]/60 mb-6">
              Get the latest AI insights, product updates, and exclusive offers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-[#001F54]/40 border border-white/[0.03] text-[#E6F0FF] placeholder:text-[#E6F0FF]/40 focus:outline-none focus:border-[#00D1FF]/50 transition-colors"
              />
              <motion.button
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] text-[#0A0A0A] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] transition-shadow duration-120"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[#E6F0FF]/50">
          <p>
            © 2025 AIFlow. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#00D1FF] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#00D1FF] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#00D1FF] transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}