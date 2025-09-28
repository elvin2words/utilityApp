
// ufms/screens/Supervisor/HelpScreen.tsx
import React, { useState, useRef } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";
import HeaderBar from "@/src/components/HeaderBar";  
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from "@react-navigation/native";


if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function HelpSupportScreen() {
  const ref = useRef<ScrollView>(null);

  const supportEmail = 'support@iqal.co.zw';
  const supportWebsite = 'https://iqal.co.zw';
  const supportWhatsApp = '+263712104928';

  const openEmail = () => Linking.openURL(`mailto:${supportEmail}`);
  const openWebsite = () => Linking.openURL(supportWebsite);
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${supportWhatsApp.replace(/\D/g,'')}`);

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to Account > Change Password and follow the instructions."
    },
    {
      question: "How do I enable notifications?",
      answer: "Go to Preferences and toggle 'Enable Notifications'."
    },
    {
      question: "How can I report a bug?",
      answer: "Use Email, WhatsApp, or Website Support options above."
    },
    {
      question: "How do I view upcoming jobs?",
      answer: "Go to your Profile > Upcoming Jobs section."
    },
    {
      question: "How do I mark a job as completed?",
      answer: "Open the job details and tap 'Mark as Completed'."
    },
    {
      question: "How do I update my availability status?",
      answer: "Go to Profile > Availability and tap your current status to change it."
    },
    {
      question: "Can I access the system offline?",
      answer: "Yes, enable 'Offline Mode' in Settings to cache data for offline use."
    },
    {
      question: "How do I update safety documents?",
      answer: "Go to Documents & Safety > Upload or Cache Safety Docs."
    },
    {
      question: "How do I contact support via WhatsApp?",
      answer: `Click the 'WhatsApp Support' button above to chat with our support team.`
    },
    {
      question: "Where can I find system documentation?",
      answer: "Use the Documentation section under Help & Support."
    },
  ];

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  useScrollToTop(ref);

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar role="Supervisor Interface" />
      <ScrollView ref={ref} contentContainerStyle={styles.container}>

        {/* Page Title */}
        <Text style={styles.title}>Help & Support</Text>

        {/* Contact Options */}
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Need assistance or want to report an issue? Reach out to our support team:
          </Text>

          <TouchableOpacity style={styles.button} onPress={openEmail}>
            <Ionicons name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>WhatsApp Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonOutline} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.buttonOutlineText}>Visit iqal.co.zw</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFAQ === idx;
            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.faqItem} 
                onPress={() => toggleFAQ(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.question}>Q: {faq.question}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#3b82f6" 
                  />
                </View>
                {isExpanded && <Text style={styles.answer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  paragraph: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  faqItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  answer: {
    color: '#4b5563',
    marginTop: 6,
    lineHeight: 20,
  },
});
