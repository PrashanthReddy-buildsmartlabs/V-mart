"use client";

import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const FAQS = [
  {
    question: "How do I track my order?",
    answer: "You can track your order by going to Profile > Orders and clicking on the specific order. Tracking details will be updated automatically."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 15-day return policy for unused products with original tags attached. Some categories like innerwear and accessories are non-returnable."
  },
  {
    question: "How long does delivery take?",
    answer: "Standard delivery takes 3-5 business days. Express delivery (available in select pincodes) takes 1-2 business days."
  },
  {
    question: "How do I use a discount coupon?",
    answer: "You can apply discount coupons at the cart page before proceeding to checkout. Only one coupon can be applied per order."
  }
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleSupportClick = () => {
    toast.info("Live Chat coming soon");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-10 gap-4">
        <Link href="/profile">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest flex-1">Help Center</h1>
      </div>

      <div className="p-4">
        <div className="bg-gray-900 text-white rounded-xl p-6 flex flex-col items-center text-center shadow-lg mb-6">
          <MessageCircle className="w-10 h-10 text-pink-400 mb-3" />
          <h2 className="text-xl font-black uppercase tracking-wide">Need Help?</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Our support team is always ready to assist you.</p>
          <button 
            onClick={handleSupportClick}
            className="w-full bg-pink-500 text-white py-3 rounded font-black text-sm uppercase tracking-widest hover:bg-pink-600 transition active:scale-[0.98]"
          >
            Contact Support
          </button>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Frequently Asked Questions</h3>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="border-b border-gray-100 last:border-b-0">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className={`text-sm font-bold ${isOpen ? 'text-pink-600' : 'text-gray-900'}`}>
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
